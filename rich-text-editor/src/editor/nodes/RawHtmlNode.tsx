import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { ReactNode } from "react";

/**
 * Markup that has to survive the round trip untouched and must never be
 * rendered into the builder: a `<style>` block, and an Outlook conditional
 * comment.
 *
 * WHY THESE ARE NOT DROPPED
 * -------------------------
 * The tech doc is explicit about both. A style block is "the email's
 * stylesheet" and stays in the value, isolated in the preview rather than
 * removed. Conditional comments stay because "Outlook-targeted email depends on
 * them". They are the payload, so stripping them breaks the feature rather than
 * hardening it.
 *
 * WHY A DECORATOR AND NOT AN ELEMENT
 * ----------------------------------
 * The content is not rich text and must not be parsed as any. It is held as one
 * opaque string and written back byte-for-byte. Rendering it as an element
 * would apply the email's CSS to the builder UI, which is the exact leak the
 * preview panel exists to demonstrate.
 */

export type RawKind = "style" | "comment";

/** A tag Lexical will dispatch on, standing in for content it otherwise skips. */
const RAW_TAG = "lexical-raw";

/**
 * Rewrite style blocks and comments as elements the importer can reach.
 *
 * Neither is reachable otherwise, for two different reasons:
 *
 *   - `@lexical/html` hardcodes `IGNORE_TAGS = new Set(['STYLE', 'SCRIPT'])`
 *     and returns before looking up a conversion, so registering a node for
 *     `style` does nothing at all. That is also why `script` is dropped for
 *     free – the doc's one deliberate removal needs no code.
 *   - A comment is not an element, so the importer never dispatches on it.
 *     Outlook's conditional comments are the reason this matters.
 */
export const stashRaw = (doc: Document): void => {
  const swap = (target: ChildNode, kind: RawKind, content: string) => {
    const placeholder = doc.createElement(RAW_TAG);
    placeholder.setAttribute("data-kind", kind);
    placeholder.setAttribute("data-content", content);
    target.replaceWith(placeholder);
  };

  for (const style of Array.from(doc.querySelectorAll("style"))) {
    swap(style, "style", style.textContent ?? "");
  }

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT);
  const comments: Comment[] = [];
  while (walker.nextNode()) comments.push(walker.currentNode as Comment);
  for (const comment of comments) swap(comment, "comment", comment.data);
};

export type SerializedRawHtmlNode = Spread<
  { kind: RawKind; content: string },
  SerializedLexicalNode
>;

export class RawHtmlNode extends DecoratorNode<ReactNode> {
  __kind: RawKind;
  __content: string;

  static getType(): string {
    return "raw-html";
  }

  static clone(node: RawHtmlNode): RawHtmlNode {
    return new RawHtmlNode(node.__kind, node.__content, node.__key);
  }

  constructor(kind: RawKind, content: string, key?: NodeKey) {
    super(key);
    this.__kind = kind;
    this.__content = content;
  }

  getKind(): RawKind {
    return this.__kind;
  }

  /** The exact characters to write back out. */
  getRaw(): string {
    return this.__kind === "style"
      ? `<style>${this.__content}</style>`
      : `<!--${this.__content}-->`;
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): false {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      // Only the placeholder. A real `style` element is unreachable – see the
      // note on `stashRaw`.
      [RAW_TAG]: () => ({
        conversion: (element: HTMLElement): DOMConversionOutput => ({
          node: $createRawHtmlNode(
            (element.getAttribute("data-kind") as RawKind) ?? "comment",
            element.getAttribute("data-content") ?? "",
          ),
        }),
        priority: 3,
      }),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.textContent = this.getRaw();

    return { element };
  }

  static importJSON(serialized: SerializedRawHtmlNode): RawHtmlNode {
    return $createRawHtmlNode(serialized.kind, serialized.content);
  }

  exportJSON(): SerializedRawHtmlNode {
    return {
      ...super.exportJSON(),
      type: RawHtmlNode.getType(),
      kind: this.__kind,
      content: this.__content,
    };
  }

  isInline(): boolean {
    return false;
  }

  /** Shown as a collapsed marker. The CSS inside is never applied to the page. */
  decorate(): ReactNode {
    return (
      <div className="editor-raw" contentEditable={false}>
        <span className="editor-raw__tag">
          {this.__kind === "style" ? "style block" : "conditional comment"}
        </span>
        <code>{this.__content.trim().slice(0, 120)}</code>
      </div>
    );
  }
}

export const $createRawHtmlNode = (
  kind: RawKind,
  content: string,
): RawHtmlNode => $applyNodeReplacement(new RawHtmlNode(kind, content));

export const $isRawHtmlNode = (
  node: LexicalNode | null | undefined,
): node is RawHtmlNode => node instanceof RawHtmlNode;
