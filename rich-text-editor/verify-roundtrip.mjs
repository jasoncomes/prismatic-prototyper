/**
 * Headless verification of the round-trip table in the Input Types tech doc,
 * area 1. Every "Stored value" row is run through a real Lexical 0.32.1 import
 * and export, so the "Correct value on save" column can be checked rather than
 * asserted.
 *
 * Run:  node verify-roundtrip.mjs
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.MutationObserver = dom.window.MutationObserver;

const { $generateHtmlFromNodes, $generateNodesFromDOM } = await import(
  "@lexical/html"
);
const { HeadingNode, QuoteNode } = await import("@lexical/rich-text");
const { ListItemNode, ListNode } = await import("@lexical/list");
const { LinkNode } = await import("@lexical/link");
const { TableCellNode, TableNode, TableRowNode } = await import(
  "@lexical/table"
);
const {
  $applyNodeReplacement,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  createEditor,
  DecoratorNode,
  ElementNode,
  TextNode,
} = await import("lexical");

/* ------------------------------------------------------------------ nodes */

const KEPT = ["class", "style", "id", "align", "bgcolor", "width"];

class DivNode extends ElementNode {
  static getType() {
    return "div";
  }
  static clone(n) {
    return new DivNode({ ...n.__attributes }, n.__key);
  }
  constructor(attributes = {}, key) {
    super(key);
    this.__attributes = attributes;
  }
  createDOM() {
    const el = document.createElement("div");
    for (const [k, v] of Object.entries(this.__attributes))
      el.setAttribute(k, v);
    return el;
  }
  updateDOM() {
    return false;
  }
  static importDOM() {
    return {
      div: () => ({
        conversion: (element) => {
          const attributes = {};
          for (const name of KEPT) {
            const value = element.getAttribute(name);
            if (value !== null) attributes[name] = value;
          }
          return { node: $applyNodeReplacement(new DivNode(attributes)) };
        },
        priority: 1,
      }),
    };
  }
  exportDOM() {
    const element = document.createElement("div");
    for (const [k, v] of Object.entries(this.__attributes))
      element.setAttribute(k, v);
    return { element };
  }
  static importJSON(s) {
    return $applyNodeReplacement(new DivNode(s.attributes ?? {}));
  }
  exportJSON() {
    return { ...super.exportJSON(), type: "div", attributes: this.__attributes };
  }
  isInline() {
    return false;
  }
}

/** VARIANT A – today's shipping node. */
class DecoratorReferenceNode extends DecoratorNode {
  static getType() {
    return "decorator-reference";
  }
  static clone(n) {
    return new DecoratorReferenceNode(n.__reference, n.__key);
  }
  constructor(reference, key) {
    super(key);
    this.__reference = reference;
  }
  createDOM() {
    return document.createElement("span");
  }
  updateDOM() {
    return false;
  }
  getTextContent() {
    return `{{$${this.__reference}}}`;
  }
  isInline() {
    return true;
  }
  isIsolated() {
    return true;
  }
  static importJSON(s) {
    return new DecoratorReferenceNode(s.reference);
  }
  exportJSON() {
    return { ...super.exportJSON(), type: "decorator-reference", reference: this.__reference };
  }
  decorate() {
    return null;
  }
}

/** VARIANT B – the proposal: TextNode subclass held in token mode. */
class TokenReferenceNode extends TextNode {
  static getType() {
    return "token-reference";
  }
  static clone(n) {
    const c = new TokenReferenceNode(n.__reference, n.__key);
    c.__format = n.__format;
    c.__mode = n.__mode;
    c.__style = n.__style;
    c.__detail = n.__detail;
    return c;
  }
  constructor(reference, key) {
    super(`{{$${reference}}}`, key);
    this.__reference = reference;
  }
  createDOM(config) {
    const el = super.createDOM(config);
    el.setAttribute("data-reference", this.__reference);
    return el;
  }
  static importJSON(s) {
    return new TokenReferenceNode(s.reference);
  }
  exportJSON() {
    return { ...super.exportJSON(), type: "token-reference", reference: this.__reference };
  }
}

const BASE = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  DivNode,
];

/* ------------------------------------------------------- the round tripper */

const REF_SPLIT = /(\{\{\$[^}]+\}\})/;
const REF_ONE = /^\{\{\$([^}]+)\}\}$/;

/**
 * Turn literal {{$ref}} text into chip nodes, carrying the surrounding text
 * node's format onto the chip. Carrying the format is the whole experiment:
 * a TextNode subclass can hold it, a DecoratorNode has nowhere to put it.
 */
const chipify = (makeChip) => {
  for (const node of $getRoot().getAllTextNodes()) {
    if (node.getType() !== "text") continue;
    const text = node.getTextContent();
    if (!REF_SPLIT.test(text)) continue;
    const format = node.getFormat();
    const parts = text.split(REF_SPLIT).filter(Boolean);
    let prev = node;
    for (const part of parts) {
      const match = part.match(REF_ONE);
      const created = match
        ? makeChip(match[1], format)
        : $createTextNode(part).setFormat(format);
      prev.insertAfter(created);
      prev = created;
    }
    node.remove();
  }
};

const MAKERS = {
  none: null,
  decorator: (reference) => new DecoratorReferenceNode(reference),
  token: (reference, format) => {
    const chip = new TokenReferenceNode(reference).setMode("token");
    chip.setFormat(format);
    return chip;
  },
};

const roundTrip = (input, mode) => {
  const nodes =
    mode === "decorator"
      ? [...BASE, DecoratorReferenceNode]
      : mode === "token"
        ? [...BASE, TokenReferenceNode]
        : BASE;

  const editor = createEditor({
    namespace: "verify",
    nodes,
    onError: (e) => {
      throw e;
    },
  });

  const parsed = new DOMParser().parseFromString(input, "text/html");

  editor.update(
    () => {
      const imported = $generateNodesFromDOM(editor, parsed);
      const root = $getRoot();
      root.clear();
      let run = null;
      for (const node of imported) {
        if ($isElementNode(node) && !node.isInline()) {
          run = null;
          root.append(node);
        } else {
          if (run === null) {
            run = $createParagraphNode();
            root.append(run);
          }
          run.append(node);
        }
      }
      if (MAKERS[mode]) chipify(MAKERS[mode]);
    },
    { discrete: true },
  );

  let out = "";
  editor.getEditorState().read(() => {
    out = $generateHtmlFromNodes(editor);
  });
  return out;
};

/* --------------------------------------------------------------- the table */

const clean = (s) =>
  s
    .replace(/ style="white-space: pre-wrap;"/g, "")
    .replace(/ class="[^"]*"/g, (m) => (m.includes("wrap") ? m : ""))
    .replace(/ data-reference="[^"]*"/g, "");

// Every "Stored value" row from the tech doc, with the column it claims.
const ROWS = [
  {
    stored: "<b>hello</b>",
    docCorrect: "<b>hello</b>",
    docToday: "<b>hello</b>  (doc says: correct)",
    chips: false,
  },
  {
    stored: "<b>hi <i>there</i></b>",
    docCorrect: "<b>hi <i>there</i></b>  (doc says nesting is canonical <b><i>x</i></b>)",
    docToday: "<b>hi </b><b><i>there</i></b>",
    chips: false,
  },
  {
    stored: '<div class="wrap">hi</div>',
    docCorrect: '<div class="wrap">hi</div>  (if we build it)',
    docToday: "<p>hi</p>",
    chips: false,
  },
  {
    stored: "<div><b>hi {{$ref}}</b></div>",
    docCorrect: "<div><b>hi {{$ref}}</b></div>",
    docToday: "<p><b>hi </b>{{$ref}}</p>",
    chips: true,
  },
  {
    stored: "<b>hi {{$ref}}</b>",
    docCorrect: "<b>hi {{$ref}}</b>",
    docToday: "<b>hi </b>{{$ref}}",
    chips: true,
  },
];

const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);

console.log("Lexical 0.32.1 · every stored value from the area 1 table\n");
console.log("  class= and white-space are stripped for readability, except class=\"wrap\"\n");

for (const row of ROWS) {
  console.log("─".repeat(96));
  console.log(`STORED            ${row.stored}`);
  console.log(`doc: correct      ${row.docCorrect}`);
  console.log(`doc: today        ${row.docToday}`);
  console.log("");

  if (row.chips) {
    const decorator = clean(roundTrip(row.stored, "decorator"));
    const token = clean(roundTrip(row.stored, "token"));
    console.log(`  ${pad("A decorator (today)", 22)}${decorator}`);
    console.log(`  ${pad("B token TextNode", 22)}${token}`);
    const chipInsideBold = /<b>[^<]*<[^>]*>?\{\{\$ref\}\}/.test(token) ||
      /<b>.*\{\{\$ref\}\}.*<\/b>/.test(token);
    console.log(
      `  ${pad("", 22)}chip inside the <b>?  ${chipInsideBold ? "YES" : "no"}`,
    );
  } else {
    console.log(`  ${pad("actual", 22)}${clean(roundTrip(row.stored, "none"))}`);
  }
  console.log("");
}
console.log("─".repeat(96));
