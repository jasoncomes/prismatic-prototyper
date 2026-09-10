import {
  DecoratorNode,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { ReactNode } from "react";
import { type ChipKind, tokenFor } from "../chip/chipLabel";
import { ChipPill } from "../chip/ChipPill";

type SerializedFormatDecoratorNode = Spread<
  { reference: string; kind: ChipKind; format: number },
  SerializedLexicalNode
>;

/**
 * VARIANT C – a DecoratorNode that owns its own formatting.
 *
 * Keeps everything a decorator gives you: the pill is a React component, so
 * hooks, context, a popover and a live-fetched icon all work inside it.
 *
 * Adds the one thing a decorator lacks – a format bitmask – plus an exportDOM
 * that wraps from it. Storage and export were already proven to work; the
 * missing piece was that nothing ever SET the bitmask, because
 * `RangeSelection.formatText` filters the selection down to text nodes before
 * a decorator is ever reached.
 *
 * `DecoratorFormatPlugin` closes that: it intercepts FORMAT_TEXT_COMMAND and
 * toggles these nodes by hand, alongside Lexical's own handling of the text.
 */
export class FormatDecoratorNode extends DecoratorNode<ReactNode> {
  __reference: string;
  __kind: ChipKind;
  __format: number;

  static getType(): string {
    return "format-decorator";
  }

  static clone(node: FormatDecoratorNode): FormatDecoratorNode {
    return new FormatDecoratorNode(
      node.__reference,
      node.__kind,
      node.__format,
      node.__key,
    );
  }

  constructor(
    reference: string,
    kind: ChipKind = "reference",
    format = 0,
    key?: NodeKey,
  ) {
    super(key);
    this.__reference = reference;
    this.__kind = kind;
    this.__format = format;
  }

  getToken(): string {
    return tokenFor(this.__kind, this.__reference);
  }

  getFormat(): number {
    return this.__format;
  }

  setFormat(format: number): void {
    this.getWritable().__format = format;
  }

  hasFormat(flag: number): boolean {
    return (this.__format & flag) !== 0;
  }

  createDOM(): HTMLElement {
    const el = document.createElement("span");
    el.setAttribute("data-reference", this.__reference);
    el.setAttribute("data-kind", this.__kind);
    el.setAttribute("data-token", this.getToken());
    return el;
  }

  updateDOM(): false {
    return false;
  }

  /**
   * The token, wrapped from the bitmask. The serializer does the same thing,
   * and this is here so a stock export is not silently wrong either.
   */
  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement("span");
    element.textContent = this.getToken();
    return { element };
  }

  getTextContent(): string {
    return this.getToken();
  }

  isIsolated(): boolean {
    return true;
  }

  isInline(): boolean {
    return true;
  }

  static importJSON(
    serialized: SerializedFormatDecoratorNode,
  ): FormatDecoratorNode {
    return new FormatDecoratorNode(
      serialized.reference,
      serialized.kind,
      serialized.format,
    );
  }

  exportJSON(): SerializedFormatDecoratorNode {
    return {
      ...super.exportJSON(),
      type: FormatDecoratorNode.getType(),
      reference: this.__reference,
      kind: this.__kind,
      format: this.__format,
    };
  }

  decorate(): ReactNode {
    return (
      <ChipPill
        reference={this.__reference}
        kind={this.__kind}
        format={this.__format}
      />
    );
  }
}

export const $createFormatDecoratorNode = (
  reference: string,
  kind: ChipKind = "reference",
  format = 0,
): FormatDecoratorNode => new FormatDecoratorNode(reference, kind, format);

export const $isFormatDecoratorNode = (
  node: LexicalNode | null | undefined,
): node is FormatDecoratorNode => node instanceof FormatDecoratorNode;
