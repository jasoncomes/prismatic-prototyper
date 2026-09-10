import { $isLinkNode } from "@lexical/link";
import { $isCodeNode } from "@lexical/code";
import { $isHorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { $isListItemNode, $isListNode } from "@lexical/list";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import {
  $getRoot,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  type EditorState,
  IS_BOLD,
  IS_CODE,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_UNDERLINE,
  type LexicalNode,
} from "lexical";
import { $isHtmlElementNode } from "./nodes/HtmlElementNode";
import { $isImageNode } from "./nodes/ImageNode";
import { $isRawHtmlNode } from "./nodes/RawHtmlNode";
import { $isFormatDecoratorNode } from "./nodes/FormatDecoratorNode";
import { $isImplicitParagraphNode } from "./nodes/ImplicitParagraphNode";

/**
 * The serializer the tech doc proposes, actually built.
 *
 * Lexical's `$generateHtmlFromNodes` cannot produce a stored value. It calls
 * createDOM, so whatever the editor renders lands in the saved string: theme
 * class names, `white-space: pre-wrap` on every text node, a `<strong>` inside
 * every `<b>`, and for a chip the pill's label instead of the token.
 *
 * This walks the tree and emits only what belongs in a value:
 *   - a chip becomes its TOKEN, rebuilt from its data, never its label
 *   - formatting becomes <b>/<i>/<s>/<u> from the bitmask, nothing else
 *   - **adjacent siblings sharing a bitmask are wrapped once**, so
 *     `<b>hi {{$ref}}</b>` comes back as itself rather than as two `<b>` runs
 *   - elements keep the attributes an HTML email needs, and no others
 */

/**
 * Innermost first. `wrapFormat` reduces over this list wrapping each flag
 * OUTSIDE the last, so the final entry ends up as the outermost tag.
 *
 * Bold last is deliberate: a bitmask carries no nesting order, so the
 * serializer has to pick one, and `<b><i>x</i></b>` is the order authors
 * write. `<i><b>x</b></i>` comes back re-nested, rendering identically.
 */
const FORMAT_TAGS: Array<[number, string]> = [
  [IS_CODE, "code"],
  [IS_UNDERLINE, "u"],
  [IS_STRIKETHROUGH, "s"],
  [IS_ITALIC, "i"],
  [IS_BOLD, "b"],
];
const escapeText = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const wrapFormat = (inner: string, format: number): string =>
  FORMAT_TAGS.reduce(
    (acc, [flag, tag]) => (format & flag ? `<${tag}>${acc}</${tag}>` : acc),
    inner,
  );

const attrs = (map: Record<string, string>): string =>
  Object.entries(map)
    .map(([k, v]) => ` ${k}="${v.replace(/"/g, "&quot;")}"`)
    .join("");

/**
 * The bitmask a node carries, or null if it is not a formattable inline.
 * Only nodes that return a number can join a run.
 */
const formatOf = (node: LexicalNode): number | null => {
  if ($isFormatDecoratorNode(node)) return node.getFormat();
  if ($isTextNode(node)) return node.getFormat();

  return null;
};

/** The node's content with NO format wrapping – the piece that goes in a run. */
const contentOf = (node: LexicalNode): string => {
  if ($isFormatDecoratorNode(node)) return node.getTextContent();
  if ($isTextNode(node)) return escapeText(node.getTextContent());

  return serializeNode(node);
};

/**
 * Walk a child list, grouping consecutive siblings that share a bitmask so the
 * wrapper is emitted once around the whole run.
 */
/**
 * Walk a child list, emitting shared formatting as ONE wrapper around the
 * whole run and nesting the rest inside it.
 *
 * Grouping by exact bitmask equality is not enough. `<b>hi <i>there</i></b>`
 * arrives as two nodes – "hi " bold, "there" bold+italic – and equality splits
 * them, giving `<b>hi </b><i><b>there</b></i>`. It renders the same and it is
 * not what the author wrote.
 *
 * So: take the bits every node in the run shares, emit those once, strip them,
 * and recurse on what is left. The shared `b` becomes the outer tag and the
 * italic falls inside it, which reproduces the original.
 */
const serializeRun = (
  nodes: LexicalNode[],
  formats: number[],
  applied: number,
): string => {
  const shared = formats.reduce((acc, format) => acc & format, ~0) & ~applied;

  if (shared === 0) {
    // Nothing more in common: emit each node under its own remaining bits.
    return nodes
      .map((node, index) =>
        wrapFormat(contentOf(node), formats[index] & ~applied),
      )
      .join("");
  }

  const inner = serializeRun(nodes, formats, applied | shared);

  return wrapFormat(inner, shared);
};

const serializeChildren = (children: LexicalNode[]): string => {
  const out: string[] = [];
  let i = 0;

  while (i < children.length) {
    const format = formatOf(children[i]);

    if (format === null || format === 0) {
      out.push(serializeNode(children[i]));
      i += 1;
      continue;
    }

    // A run is every adjacent formatted sibling, not only those whose bitmask
    // matches exactly — sharing any bit is enough to share a wrapper.
    const nodes: LexicalNode[] = [];
    const formats: number[] = [];
    while (i < children.length) {
      const next = formatOf(children[i]);
      if (next === null || next === 0) break;
      nodes.push(children[i]);
      formats.push(next);
      i += 1;
    }
    out.push(serializeRun(nodes, formats, 0));
  }

  return out.join("");
};

const serializeNode = (node: LexicalNode): string => {
  if ($isLineBreakNode(node)) return "<br>";
  if ($isHorizontalRuleNode(node)) return "<hr>";
  // A style block or a conditional comment goes back exactly as it arrived.
  if ($isRawHtmlNode(node)) return node.getRaw();
  if ($isImageNode(node)) return `<img${attrs(node.getAttributes())}>`;

  const format = formatOf(node);
  if (format !== null) return wrapFormat(contentOf(node), format);

  if (!$isElementNode(node)) return "";

  const inner = serializeChildren(node.getChildren());

  if ($isHeadingNode(node)) {
    const tag = node.getTag();
    return `<${tag}>${inner}</${tag}>`;
  }
  if ($isQuoteNode(node)) return `<blockquote>${inner}</blockquote>`;
  if ($isListNode(node)) {
    const tag = node.getListType() === "number" ? "ol" : "ul";
    return `<${tag}>${inner}</${tag}>`;
  }
  if ($isListItemNode(node)) return `<li>${inner}</li>`;
  if ($isLinkNode(node)) return `<a href="${node.getURL()}">${inner}</a>`;
  if ($isHtmlElementNode(node)) {
    const tag = node.getTag();

    return `<${tag}${attrs(node.getAttributes())}>${inner}</${tag}>`;
  }
  if ($isCodeNode(node)) return `<pre><code>${inner}</code></pre>`;

  // A block the editor invented to hold loose inline content contributes no tag
  // of its own; a paragraph the author wrote does.
  if ($isImplicitParagraphNode(node)) return inner;

  return `<p>${inner}</p>`;
};

/** The value that would be saved. */
export const serializeStoredValue = (state: EditorState): string =>
  state.read(() => serializeChildren($getRoot().getChildren()));
