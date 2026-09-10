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
 * `<img>`, with any string source.
 *
 * The tech doc calls this net-new and says the source may be an external URL or
 * a data URI, because nothing is uploaded and there is no web server in front
 * of an integration's attachments. Both are just characters in the value, so
 * this node does not care which it holds.
 *
 * The deliverability caveat is not the editor's business: Gmail refuses
 * base64-embedded images, so a hosted URL is the only reliable path for email.
 * That belongs in the docs, not in a validation rule here.
 */

const KEPT_ATTRIBUTES = ["src", "alt", "width", "height", "style", "class", "align", "title"];
const ALLOWED = new Set(KEPT_ATTRIBUTES);

export type SerializedImageNode = Spread<
  { attributes: Record<string, string> },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<ReactNode> {
  __attributes: Record<string, string>;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode({ ...node.__attributes }, node.__key);
  }

  constructor(attributes: Record<string, string>, key?: NodeKey) {
    super(key);
    this.__attributes = attributes;
  }

  getAttributes(): Record<string, string> {
    return this.__attributes;
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline-block";

    return span;
  }

  updateDOM(): false {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (element: HTMLElement): DOMConversionOutput => {
          // Walk the element's OWN attribute order, not the allowlist's, so
          // the saved value keeps the order the author wrote. Imposing a fixed
          // order made every reordered value report "content changed".
          const attributes: Record<string, string> = {};
          for (const { name, value } of Array.from(element.attributes)) {
            if (ALLOWED.has(name.toLowerCase())) attributes[name] = value;
          }

          return { node: $createImageNode(attributes) };
        },
        priority: 1,
      }),
    };
  }

  /** The node owns its export, which is the rule the whole harness keeps hitting. */
  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    for (const [name, value] of Object.entries(this.__attributes)) {
      element.setAttribute(name, value);
    }

    return { element };
  }

  static importJSON(serialized: SerializedImageNode): ImageNode {
    return $createImageNode(serialized.attributes ?? {});
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      type: ImageNode.getType(),
      attributes: this.__attributes,
    };
  }

  isInline(): boolean {
    return true;
  }

  decorate(): ReactNode {
    const { src = "", alt = "" } = this.__attributes;

    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        className="editor-image"
        src={src}
        alt={alt}
        title={src}
        width={this.__attributes.width}
        height={this.__attributes.height}
      />
    );
  }
}

export const $createImageNode = (
  attributes: Record<string, string>,
): ImageNode => $applyNodeReplacement(new ImageNode(attributes));

export const $isImageNode = (
  node: LexicalNode | null | undefined,
): node is ImageNode => node instanceof ImageNode;
