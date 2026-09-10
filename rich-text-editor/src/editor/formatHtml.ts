/**
 * Indent and un-indent the raw view.
 *
 * WHY THIS IS TEXT-LEVEL AND NOT A PARSE-AND-REPRINT
 * --------------------------------------------------
 * The obvious implementation parses the string and prints the tree back out.
 * That turns Format into a data-loss button: anything the parser cannot
 * represent is silently dropped, and the author pressed something labelled
 * "tidy up". These two functions only ever move whitespace between BLOCK tags.
 *
 * Nothing in the stack does this for us. Lexical ships no HTML formatter, and
 * the app's Format button drives Biome through a worker registered only for
 * `typescript` and `javascript` – see `CodeEditorImplementation.tsx`.
 *
 * WHY WHITESPACE HANDLING HAS TO BE STRUCTURAL
 * --------------------------------------------
 * Whitespace in HTML is significant between inline elements and insignificant
 * between block ones. `<b>bold</b> <i>ital</i>` renders "bold ital"; delete
 * that space and it renders "boldital". A blanket `/>\s+</g` strip cannot tell
 * the two apart, so both functions below decide per gap, from the tags on
 * either side of it.
 */

const BLOCK = new Set([
  "div", "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
  "blockquote", "table", "thead", "tbody", "tfoot", "tr", "td", "th",
  "section", "article", "header", "footer", "figure", "form",
]);

// `<br>` and friends stay inline; see the note in the loop below.

const tagName = (token: string): string =>
  token.match(/^<\/?([a-zA-Z0-9]+)/)?.[1]?.toLowerCase() ?? "";

/** True for a tag that opens or closes a block – the only gaps we may touch. */
const isBlockBoundary = (token: string | undefined): boolean =>
  token === undefined || (token.startsWith("<") && BLOCK.has(tagName(token)));

/**
 * `<pre>` is excluded from BLOCK above and stashed whole here. Its whitespace
 * IS its content, so indenting inside it is not formatting, it is corruption.
 */
const stashPre = (html: string): [string, string[]] => {
  const stashed: string[] = [];
  const masked = html.replace(/<pre\b[\s\S]*?<\/pre>/gi, (match) => {
    stashed.push(match);

    return ` PRE${stashed.length - 1} `;
  });

  return [masked, stashed];
};

const unstashPre = (html: string, stashed: string[]): string =>
  html.replace(/ PRE(\d+) /g, (_, index) => stashed[Number(index)]);

export const formatHtml = (input: string): string => {
  const [masked, stashed] = stashPre(input);
  const tokens = masked.split(/(<[^>]+>)/).filter((token) => token !== "");
  const lines: string[] = [];
  let current = "";
  let depth = 0;

  const flush = () => {
    if (current.trim()) {
      lines.push("  ".repeat(Math.max(0, depth)) + current.trim());
    }
    current = "";
  };

  for (const token of tokens) {
    const name = token.startsWith("<") ? tagName(token) : "";
    const closing = token.startsWith("</");

    if (name && BLOCK.has(name)) {
      flush();
      if (closing) depth -= 1;
      lines.push("  ".repeat(Math.max(0, depth)) + token);
      if (!closing) depth += 1;
      continue;
    }

    // Note what is NOT here: a line break after `<br>`. It reads better, and it
    // is not safe. `<br>` is inline, so a newline after it is indistinguishable
    // from a space the author typed, and collapse would have to guess. Keeping
    // `a<br>b` on one line is the difference between a formatter that is pretty
    // and one that is lossless.
    current += token;
  }
  flush();

  // Pull a block back onto one line when it holds no other block, or every
  // heading becomes three lines and the result is harder to read, not easier.
  // The content group must not start with whitespace: letting it do so lets
  // the preceding `\s*` backtrack and hand the line a spurious leading space.
  let out = lines.join("\n");
  for (let pass = 0; pass < 3; pass += 1) {
    out = out.replace(
      /<([a-zA-Z0-9]+)([^>]*)>\n[ \t]*([^\s<][^\n]*)\n[ \t]*<\/\1>/g,
      "<$1$2>$3</$1>",
    );
  }

  return unstashPre(out, stashed);
};

/**
 * The canonical, storable form: no whitespace between block tags, every
 * significant inline space kept.
 */
export const collapseHtml = (input: string): string => {
  const [masked, stashed] = stashPre(input);
  const tokens = masked.split(/(<[^>]+>)/).filter((token) => token !== "");
  const out: string[] = [];

  tokens.forEach((token, index) => {
    if (token.startsWith("<")) {
      out.push(token);

      return;
    }

    const afterBlock = isBlockBoundary(tokens[index - 1]);
    const beforeBlock = isBlockBoundary(tokens[index + 1]);

    // A whitespace-only run survives only when both neighbors are inline,
    // where it is the space between two words.
    if (token.trim() === "") {
      if (!afterBlock && !beforeBlock) out.push(" ");

      return;
    }

    let text = token.replace(/\s*\n\s*/g, " ");
    if (afterBlock) text = text.replace(/^ +/, "");
    if (beforeBlock) text = text.replace(/ +$/, "");
    out.push(text);
  });

  return unstashPre(out.join(""), stashed);
};
