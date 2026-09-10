import {
  $applyNodeReplacement,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  ElementNode,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from "lexical";

/**
 * One node for every allowed element Lexical has no attribute-carrying node
 * for. It keeps the tag and the attributes and nothing else.
 *
 * WHY THIS IS ONE NODE AND NOT TEN
 * --------------------------------
 * `DivNode` used to answer "we can't support div?" in ~70 lines. Every other
 * missing element wanted the same 70 lines with a different tag, so this is
 * that node with the tag as data. Adding `figure` is now one string.
 *
 * WHY TABLES ARE HERE AND NOT ON LEXICAL'S TableNode
 * --------------------------------------------------
 * The tech doc lists TableNode / TableRowNode / TableCellNode as the backing
 * nodes. They cannot carry what an HTML email table is made of. Lexical's
 * `$convertTableCellNodeElement` reads exactly `style.width`, `colSpan`,
 * `rowSpan`, `style.backgroundColor` and `style.verticalAlign` – so
 * `<td align="center" bgcolor="#f4f4f4">` arrives with the align and bgcolor
 * already gone, and the doc's own "must survive" list is `class`, `style`,
 * `bgcolor`, `width`.
 *
 * Lexical's table nodes also bring grid selection and keyboard navigation,
 * which is a real feature for authored tables and the wrong trade for tables
 * used as email layout. Nothing stops a later editor registering them for the
 * authoring case; this node is what keeps the VALUE intact.
 */

/** Attributes an HTML email is built from. Everything else is dropped. */
const KEPT_ATTRIBUTES = [
  "class", "style", "id", "align", "valign", "dir", "lang", "title",
  "bgcolor", "background", "width", "height",
  "colspan", "rowspan", "border", "cellpadding", "cellspacing",
];
const ALLOWED = new Set(KEPT_ATTRIBUTES);

/** Tag to whether it lays out as a block. Inline tags may sit inside a line. */
const TAGS: Record<string, { inline: boolean }> = {
  div: { inline: false },
  section: { inline: false },
  article: { inline: false },
  header: { inline: false },
  footer: { inline: false },
  main: { inline: false },
  aside: { inline: false },
  figure: { inline: false },
  figcaption: { inline: false },
  table: { inline: false },
  thead: { inline: false },
  tbody: { inline: false },
  tfoot: { inline: false },
  tr: { inline: false },
  td: { inline: false },
  th: { inline: false },
  span: { inline: true },
  small: { inline: true },
  sub: { inline: true },
  sup: { inline: true },
};

export const HTML_ELEMENT_TAGS = Object.keys(TAGS);

export type SerializedHtmlElementNode = Spread<
  { tag: string; attributes: Record<string, string> },
  SerializedElementNode
>;

export class HtmlElementNode extends ElementNode {
  __tag: string;
  __attributes: Record<string, string>;

  static getType(): string {
    return "html-element";
  }

  static clone(node: HtmlElementNode): HtmlElementNode {
    return new HtmlElementNode(node.__tag, { ...node.__attributes }, node.__key);
  }

  constructor(
    tag: string,
    attributes: Record<string, string> = {},
    key?: NodeKey,
  ) {
    super(key);
    this.__tag = tag;
    this.__attributes = attributes;
  }

  getTag(): string {
    return this.__tag;
  }

  getAttributes(): Record<string, string> {
    return this.__attributes;
  }

  createDOM(): HTMLElement {
    const element = document.createElement(this.__tag);
    for (const [name, value] of Object.entries(this.__attributes)) {
      element.setAttribute(name, value);
    }
    // A visible outline in the editor only, so the wrapper can be seen. Never
    // part of the exported markup – that comes from serialize.ts.
    element.classList.add("editor-html-element");

    return element;
  }

  updateDOM(): false {
    return false;
  }

  /**
   * The conversion function is handed the whole element, so every attribute is
   * reachable. Attributes are lost because a node decides to lose them, never
   * because Lexical takes them away.
   */
  static importDOM(): DOMConversionMap | null {
    const map: DOMConversionMap = {};
    for (const tag of HTML_ELEMENT_TAGS) {
      map[tag] = () => ({
        conversion: (element: HTMLElement): DOMConversionOutput => {
          // Walk the element's OWN attribute order, not the allowlist's, so
          // the saved value keeps the order the author wrote. Imposing a fixed
          // order made every reordered value report "content changed".
          const attributes: Record<string, string> = {};
          for (const { name, value } of Array.from(element.attributes)) {
            if (ALLOWED.has(name.toLowerCase())) attributes[name] = value;
          }

          return { node: $createHtmlElementNode(tag, attributes) };
        },
        // Above Lexical's own table conversions, which would strip the
        // attributes before this node ever saw the element.
        priority: 2,
      });
    }

    return map;
  }

  exportDOM(): DOMExportOutput {
    return { element: this.createDOM() };
  }

  static importJSON(serialized: SerializedHtmlElementNode): HtmlElementNode {
    return $createHtmlElementNode(
      serialized.tag,
      serialized.attributes ?? {},
    );
  }

  exportJSON(): SerializedHtmlElementNode {
    return {
      ...super.exportJSON(),
      type: HtmlElementNode.getType(),
      tag: this.__tag,
      attributes: this.__attributes,
    };
  }

  isInline(): boolean {
    return TAGS[this.__tag]?.inline ?? false;
  }

  canBeEmpty(): boolean {
    return true;
  }
}

export const $createHtmlElementNode = (
  tag: string,
  attributes: Record<string, string> = {},
): HtmlElementNode =>
  $applyNodeReplacement(new HtmlElementNode(tag, attributes));

export const $isHtmlElementNode = (
  node: LexicalNode | null | undefined,
): node is HtmlElementNode => node instanceof HtmlElementNode;
