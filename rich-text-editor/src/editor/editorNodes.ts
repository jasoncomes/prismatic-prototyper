import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import type { Klass, LexicalNode } from "lexical";
import { HtmlElementNode } from "./nodes/HtmlElementNode";
import { ImageNode } from "./nodes/ImageNode";
import { RawHtmlNode } from "./nodes/RawHtmlNode";
import { FormatDecoratorNode } from "./nodes/FormatDecoratorNode";
import { ImplicitParagraphNode } from "./nodes/ImplicitParagraphNode";

/**
 * One node list, used by the live editor and by the throwaway editors the
 * markdown dialect spins up to canonicalize and preview. They have to match, or
 * a value would normalize differently depending on which one saw it.
 *
 * `CodeNode` and `CodeHighlightNode` are here for markdown's fenced code
 * blocks – the stock `TRANSFORMERS` list needs them, and the app's own
 * MarkdownEditor registers them for the same reason.
 *
 * This list IS the allowlist. An element with no node here is dropped on
 * import, which is how the tech doc decided sanitizing happens: by construction
 * rather than as a separate stripping pass. `script` is the one deliberate
 * omission.
 */
export const EDITOR_NODES: Array<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  HorizontalRuleNode,
  HtmlElementNode,
  ImageNode,
  RawHtmlNode,
  ImplicitParagraphNode,
  FormatDecoratorNode,
];
