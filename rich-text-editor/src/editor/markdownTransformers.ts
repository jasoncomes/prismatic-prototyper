import type { TextMatchTransformer, Transformer } from "@lexical/markdown";
import { TRANSFORMERS } from "@lexical/markdown";
import { IS_BOLD, IS_ITALIC, IS_STRIKETHROUGH, type LexicalNode } from "lexical";
import { $isFormatDecoratorNode } from "./nodes/FormatDecoratorNode";

/**
 * Markdown export for the chip, and the same lesson the HTML side taught.
 *
 * `$convertToMarkdownString` reads emphasis off TextNodes – it walks the text
 * format bitmask and writes the markers. A DecoratorNode is not a TextNode, so
 * it is never asked, and `**{{$ref}}**` came back as a bare `{{$ref}}` with the
 * bold silently gone. Plain text beside it kept its markers, which is what made
 * the loss easy to miss.
 *
 * The fix is the one `exportDOM` already applies in HTML: THE NODE OWNS ITS
 * EXPORT. It writes its own markers from its own bitmask.
 *
 * Import needs nothing here – `TokenizePlugin` already turns literal `{{...}}`
 * text into chips whatever put the text there, so the fields below exist only
 * to satisfy the TextMatchTransformer shape.
 */

/**
 * Applied innermost first, so bold+italic composes to `***text***` the way
 * Lexical's own exporter writes it.
 *
 * Underline is deliberately missing. Markdown has no syntax for it, so a chip
 * carrying IS_UNDERLINE exports unmarked – the same silent loss this file fixes
 * for the other three, and one that cannot be fixed, only reported.
 */
const MARKDOWN_MARKS: Array<[number, string]> = [
  [IS_ITALIC, "*"],
  [IS_BOLD, "**"],
  [IS_STRIKETHROUGH, "~~"],
];

const wrapMarkdown = (text: string, format: number): string =>
  MARKDOWN_MARKS.reduce(
    (acc, [flag, mark]) => (format & flag ? `${mark}${acc}${mark}` : acc),
    text,
  );

const CHIP_TRANSFORMER: TextMatchTransformer = {
  dependencies: [],
  export: (node: LexicalNode) => {
    if (!$isFormatDecoratorNode(node)) return null;

    return wrapMarkdown(node.getToken(), node.getFormat());
  },
  importRegExp: /\{\{[#$][^}]+\}\}/,
  regExp: /\{\{[#$][^}]+\}\}$/,
  replace: () => undefined,
  trigger: "}",
  type: "text-match",
};

/** Chip first, so it is offered the node before the stock rules are. */
export const MARKDOWN_TRANSFORMERS: Array<Transformer> = [
  CHIP_TRANSFORMER,
  ...TRANSFORMERS,
];
