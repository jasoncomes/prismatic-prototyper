import type { DialectId } from "../editor";

/**
 * The values the panel starts from.
 *
 * Each one exists to make a specific claim checkable, and the note printed
 * under its button says which: `flat` and `preformatted` are the two whitespace
 * shapes, `no wrapper` and `authored <p>` are the paragraph pair, and `whole
 * allowlist` is every element the tech doc permits in one value.
 */

/** Text, formatting, a wrapper with attributes, a reference, two config vars. */
const FIXTURE =
  '<div class="wrap" bgcolor="#f4f4f4"><h1>Hi <b>{{$sf.results.company.name}}</b></h1>' +
  "<p>{{#GREETING}}, your report is ready.</p>" +
  "<p>Thanks,<br>{{#SIGNATURE}}</p></div>";

/** Every block element, so the block path is exercised as well as the inline one. */
const BLOCK_FIXTURE =
  "<h2>Quarterly summary</h2>" +
  "<ul><li>Owner is <b>{{$lead.results.owner}}</b></li><li>Second item</li></ul>" +
  "<ol><li>Step one</li><li>Step two</li></ol>" +
  "<blockquote>{{#GREETING}} \u2014 from the team</blockquote>" +
  "<p>Line one<br>line two<br>line three</p>";

/**
 * The two below arrive ALREADY INDENTED, which is what a value looks like once
 * somebody has pressed Format on it, or pasted one out of a template file.
 *
 * They are written as the formatter's own output, on purpose. Loading one shows
 * amber – the tree cannot hold the indentation, so the stored value comes back
 * flat – and pressing Format turns it green, because the indentation it puts
 * back is byte-for-byte the indentation the fixture arrived with. That is the
 * whole round-trip claim, visible in two clicks.
 */
const NESTED_FIXTURE =
  '<div class="outer" bgcolor="#f4f4f4">\n' +
  '  <div class="inner" align="center">\n' +
  "    <h2>Renewal for <b>{{$sf.results.company.name}}</b></h2>\n" +
  "    <p>Owner: {{$lead.results.owner}}</p>\n" +
  "  </div>\n" +
  '  <div class="footer">\n' +
  "    <p>{{#SIGNATURE}}</p>\n" +
  "  </div>\n" +
  "</div>";

const NEWSLETTER_FIXTURE =
  '<div class="wrap" bgcolor="#ffffff">\n' +
  "  <h1>{{#GREETING}}, <b>{{$sf.results.company.name}}</b></h1>\n" +
  "  <p>Here is what changed this month.</p>\n" +
  "  <ul>\n" +
  "    <li>Owner is now <b>{{$lead.results.owner}}</b></li>\n" +
  "    <li>Two new seats</li>\n" +
  "  </ul>\n" +
  "  <blockquote>\n" +
  "    <i>Thanks for sticking with us.</i>\n" +
  "  </blockquote>\n" +
  "  <p>Best,<br>{{#SIGNATURE}}</p>\n" +
  "</div>";

/**
 * The paragraph pair. Same content twice, differing only in whether the author
 * wrapped it – which is the one thing the serializer has to get right in both
 * directions, so they sit next to each other in the picker.
 *
 * Lexical's root refuses inline children, so the bare one HAS to be wrapped in a
 * block on import. `ImplicitParagraphNode` marks that wrapper as the editor's
 * own and the serializer emits its children with no tag, so the value comes back
 * with no `<p>` bolted onto it. The wrapped one imports as a plain
 * `ParagraphNode` – unmarked, authored – and keeps its tag.
 *
 * Get either one wrong and the value is corrupted in a way that only shows up
 * once it is embedded somewhere. Adding a `<p>` breaks the surrounding block;
 * dropping one merges two paragraphs the writer separated.
 */
const ROOT_INLINE_FIXTURE = "<b>Hi</b> {{$sf.results.company.name}}, welcome back.";

const WRAPPED_P_FIXTURE =
  "<p><b>Hi</b> {{$sf.results.company.name}}, welcome back.</p>";

const MARKDOWN_FIXTURE =
  "# Hi {{$sf.results.company.name}}\n\n" +
  "{{#GREETING}}, your report is **ready**.\n\n" +
  "Thanks,\n{{#SIGNATURE}}\n";

const MARKDOWN_BLOCK_FIXTURE =
  "## Quarterly summary\n\n" +
  "- Owner is **{{$lead.results.owner}}**\n" +
  "- Second item\n\n" +
  "1. Step one\n" +
  "2. Step two\n\n" +
  "> {{#GREETING}} from the team\n\n" +
  "A [link](https://example.com) and `some code`.\n";

/**
 * Deliberately written in markdown's OTHER spellings – setext heading, `_` for
 * emphasis, `*` for bullets. Lexical's serializer emits none of these; left to
 * itself it would rewrite all three the moment the value was opened.
 *
 * It comes back untouched, because the shape rule treats markdown the same way
 * it treats HTML indentation: the author's spelling is kept for as long as it
 * still means what the tree holds. Edit the content and it snaps to Lexical's
 * canonical form, which is the honest moment for that to happen.
 */
const MARKDOWN_ALT_FIXTURE =
  "Release notes\n" +
  "=============\n\n" +
  "_Emphasis_ written with underscores, and a bullet list:\n\n" +
  "* First\n" +
  "* Second\n";

/**
 * Everything the tech doc's allowlist names, in one value: a style block, an
 * Outlook conditional comment, a table laid out with bgcolor and align, a span
 * carrying a class, an image, a horizontal rule, a link, and both chip kinds.
 *
 * It is the case the harness was quietly failing before the allowlist was
 * filled in – table, style and span all had no node, so they were dropped on
 * import and the saved value came back as a bare div with the text in it.
 */
const EMAIL_FIXTURE =
  "<style>body { background: #fdecec; } .cta { background: #1f7a4d; color: #fff; padding: 8px 14px; }</style>" +
  "<!--[if mso]><table role=\"presentation\"><![endif]-->" +
  '<div class="wrap" bgcolor="#f4f4f4">' +
  "<h1>Quarterly update</h1>" +
  "<p>Hi <b>{{$sf.results.company.name}}</b>, your report is ready.</p>" +
  // A reference whose test-run value is a block element. The preview shows
  // an <h3> spliced into the middle of a <p>, which the parser then closes
  // early – the escaping question, visible rather than argued about.
  "<p>{{$report.results.headline}}</p>" +
  '<table width="100%" bgcolor="#f4f4f4"><tr><td align="center">' +
  '<span class="cta">View report</span>' +
  "</td></tr></table>" +
  "<hr>" +
  '<p><img src="https://prismatic.io/prismatic-logo.svg" alt="Prismatic" width="120">' +
  // No space before the link: Lexical's `isInlineDomNode` regex omits `img`, so
  // whitespace touching an image is not seen as sitting between two inline
  // nodes and is trimmed on import. See the rough edges in the README.
  '<a href="https://example.com">Manage preferences</a></p>' +
  "<p>Thanks,<br>{{#SIGNATURE}}</p></div>" +
  "<!--[if mso]></table><![endif]-->";

export interface Fixture {
  label: string;
  note: string;
  value: string;
}

export const FIXTURES: Record<DialectId, Fixture[]> = {
  html: [
    { label: "inline + chips", note: "flat", value: FIXTURE },
    { label: "block elements", note: "flat", value: BLOCK_FIXTURE },
    { label: "nested divs", note: "preformatted", value: NESTED_FIXTURE },
    { label: "newsletter", note: "preformatted", value: NEWSLETTER_FIXTURE },
    { label: "root inline", note: "no wrapper", value: ROOT_INLINE_FIXTURE },
    { label: "wrapped in p", note: "authored <p>", value: WRAPPED_P_FIXTURE },
    { label: "email", note: "whole allowlist", value: EMAIL_FIXTURE },
  ],
  markdown: [
    { label: "inline + chips", note: "markdown", value: MARKDOWN_FIXTURE },
    { label: "block elements", note: "markdown", value: MARKDOWN_BLOCK_FIXTURE },
    { label: "other spellings", note: "kept as written", value: MARKDOWN_ALT_FIXTURE },
  ],
};
