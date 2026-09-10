/**
 * The three chip designs, same cases, same serializer. Which values survive?
 *
 * Run:  node verify-variants.mjs
 */
import { JSDOM } from "jsdom";

const d = new JSDOM("<!doctype html><html><body><div id=r contenteditable></div></body></html>", {
  pretendToBeVisual: true,
});
globalThis.window = d.window;
globalThis.document = d.window.document;
globalThis.DOMParser = d.window.DOMParser;
globalThis.HTMLElement = d.window.HTMLElement;
globalThis.Node = d.window.Node;
Object.defineProperty(globalThis, "navigator", { value: d.window.navigator, configurable: true });
globalThis.getComputedStyle = d.window.getComputedStyle;
globalThis.MutationObserver = d.window.MutationObserver;
globalThis.requestAnimationFrame = (cb) => { cb(0); return 0; };

const { $generateNodesFromDOM } = await import("@lexical/html");
const { HeadingNode, $isHeadingNode, QuoteNode, $isQuoteNode } = await import("@lexical/rich-text");
const { ListNode, ListItemNode, $isListNode, $isListItemNode } = await import("@lexical/list");
const {
  $applyNodeReplacement, $createParagraphNode, $createRangeSelection, $createTextNode,
  $getRoot, $isElementNode, $isLineBreakNode, $isTextNode, $setSelection,
  createEditor, DecoratorNode, ElementNode, TextNode,
  IS_BOLD, IS_ITALIC, IS_STRIKETHROUGH, IS_UNDERLINE,
} = await import("lexical");

/* ───────────────────────────── nodes ───────────────────────────── */

const KEPT = ["class", "style", "id", "align", "bgcolor", "width"];
class DivNode extends ElementNode {
  static getType() { return "div"; }
  static clone(n) { return new DivNode({ ...n.__a }, n.__key); }
  constructor(a = {}, key) { super(key); this.__a = a; }
  getAttributes() { return this.__a; }
  createDOM() { const e = document.createElement("div"); for (const [k, v] of Object.entries(this.__a)) e.setAttribute(k, v); return e; }
  updateDOM() { return false; }
  static importDOM() {
    return { div: () => ({ conversion: (el) => {
      const a = {}; for (const n of KEPT) { const v = el.getAttribute(n); if (v !== null) a[n] = v; }
      return { node: $applyNodeReplacement(new DivNode(a)) };
    }, priority: 1 }) };
  }
  static importJSON(s) { return $applyNodeReplacement(new DivNode(s.a ?? {})); }
  exportJSON() { return { ...super.exportJSON(), type: "div", a: this.__a }; }
  isInline() { return false; }
}

class SynP extends (await import("lexical")).ParagraphNode {
  static getType() { return "syn-p"; }
  static clone(n) { return new SynP(n.__key); }
  static importJSON() { return new SynP(); }
  exportJSON() { return { ...super.exportJSON(), type: "syn-p" }; }
}

const label = (kind, name) => {
  if (kind === "configVar") return name;
  const [step, ...rest] = name.split(".");
  const tail = rest[0] === "results" ? rest.slice(1) : rest;
  return `${step} | ${tail.join(".")}`;
};
const tokenFor = (kind, name) => (kind === "configVar" ? `{{#${name}}}` : `{{$${name}}}`);

/** A – DecoratorNode. No format field anywhere on it. */
class ChipA extends DecoratorNode {
  static getType() { return "chip-a"; }
  static clone(n) { return new ChipA(n.__ref, n.__kind, n.__key); }
  constructor(ref, kind, key) { super(key); this.__ref = ref; this.__kind = kind; }
  getToken() { return tokenFor(this.__kind, this.__ref); }
  createDOM() { return document.createElement("span"); }
  updateDOM() { return false; }
  getTextContent() { return this.getToken(); }
  isInline() { return true; }
  isIsolated() { return true; }
  static importJSON(s) { return new ChipA(s.ref, s.kind); }
  exportJSON() { return { ...super.exportJSON(), type: "chip-a", ref: this.__ref, kind: this.__kind }; }
  decorate() { return null; }
}

/** B – TextNode in token mode. __text is the label; the token is data. */
class ChipB extends TextNode {
  static getType() { return "chip-b"; }
  static clone(n) { const c = new ChipB(n.__ref, n.__kind, n.__key); c.__format = n.__format; c.__mode = n.__mode; return c; }
  constructor(ref, kind, key) { super(label(kind, ref), key); this.__ref = ref; this.__kind = kind; }
  getToken() { return tokenFor(this.__kind, this.__ref); }
  static importJSON(s) { return new ChipB(s.ref, s.kind); }
  exportJSON() { return { ...super.exportJSON(), type: "chip-b", ref: this.__ref, kind: this.__kind }; }
}

/** C – DecoratorNode carrying its own bitmask. */
class ChipC extends DecoratorNode {
  static getType() { return "chip-c"; }
  static clone(n) { return new ChipC(n.__ref, n.__kind, n.__format, n.__key); }
  constructor(ref, kind, format = 0, key) { super(key); this.__ref = ref; this.__kind = kind; this.__format = format; }
  getToken() { return tokenFor(this.__kind, this.__ref); }
  getFormat() { return this.__format; }
  setFormat(f) { this.getWritable().__format = f; }
  createDOM() { return document.createElement("span"); }
  updateDOM() { return false; }
  getTextContent() { return this.getToken(); }
  isInline() { return true; }
  isIsolated() { return true; }
  static importJSON(s) { return new ChipC(s.ref, s.kind, s.format); }
  exportJSON() { return { ...super.exportJSON(), type: "chip-c", ref: this.__ref, kind: this.__kind, format: this.__format }; }
  decorate() { return null; }
}

const CHIP = { A: ChipA, B: ChipB, C: ChipC };
const makeChip = (v, ref, kind, format) => {
  if (v === "A") return new ChipA(ref, kind);
  if (v === "B") { const c = new ChipB(ref, kind).setMode("token"); c.setFormat(format); return c; }
  return new ChipC(ref, kind, format);
};

/* ─────────────────────────── serializer ────────────────────────── */

const TAGS = [[IS_BOLD, "b"], [IS_ITALIC, "i"], [IS_STRIKETHROUGH, "s"], [IS_UNDERLINE, "u"]];
const wrap = (inner, f) => TAGS.reduce((a, [flag, t]) => (f & flag ? `<${t}>${a}</${t}>` : a), inner);
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const formatOf = (n) => {
  if (n instanceof ChipA) return 0;                  // nowhere to keep one; 0 = unwrapped
  if (n instanceof ChipB || n instanceof ChipC) return n.getFormat();
  if ($isTextNode(n)) return n.getFormat();
  return null;
};
const contentOf = (n) => {
  if (n instanceof ChipA || n instanceof ChipB || n instanceof ChipC) return n.getToken();
  if ($isTextNode(n)) return esc(n.getTextContent());
  return ser(n);
};

/** Consecutive siblings sharing a bitmask get ONE wrapper, not one each. */
const serChildren = (kids) => {
  const out = []; let i = 0;
  while (i < kids.length) {
    const f = formatOf(kids[i]);
    if (f === null || f === 0) { out.push(ser(kids[i])); i++; continue; }
    const run = [];
    while (i < kids.length && formatOf(kids[i]) === f) { run.push(contentOf(kids[i])); i++; }
    out.push(wrap(run.join(""), f));
  }
  return out.join("");
};

const ser = (n) => {
  if ($isLineBreakNode(n)) return "<br>";
  const f = formatOf(n);
  if (f !== null) return wrap(contentOf(n), f);
  if (!$isElementNode(n)) return "";
  const inner = serChildren(n.getChildren());
  if ($isHeadingNode(n)) return `<${n.getTag()}>${inner}</${n.getTag()}>`;
  if ($isQuoteNode(n)) return `<blockquote>${inner}</blockquote>`;
  if ($isListNode(n)) { const t = n.getListType() === "number" ? "ol" : "ul"; return `<${t}>${inner}</${t}>`; }
  if ($isListItemNode(n)) return `<li>${inner}</li>`;
  if (n instanceof DivNode) {
    const a = Object.entries(n.getAttributes()).map(([k, v]) => ` ${k}="${v}"`).join("");
    return `<div${a}>${inner}</div>`;
  }
  if (n instanceof SynP) return inner;
  return `<p>${inner}</p>`;
};

const serializeRoot = () => serChildren($getRoot().getChildren());

/* ──────────────────────── import + tokenize ────────────────────── */

const SPLIT = /(\{\{[$#][^}]+\}\})/;
const ONE = /^\{\{([$#])([^}]+)\}\}$/;

const roundTrip = (variant, html) => {
  const editor = createEditor({ namespace: "v", nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, DivNode, SynP, CHIP[variant]], onError: (e) => { throw e; } });
  editor.update(() => {
    const dom = new DOMParser().parseFromString(html, "text/html");
    const nodes = $generateNodesFromDOM(editor, dom);
    const root = $getRoot(); root.clear();
    let run = null;
    for (const node of nodes) {
      if ($isElementNode(node) && !node.isInline()) { run = null; root.append(node); }
      else { if (!run) { run = new SynP(); root.append(run); } run.append(node); }
    }
    // tokenize: literal tokens become chips, inheriting the surrounding format
    for (const t of $getRoot().getAllTextNodes()) {
      if (t.getType() !== "text") continue;
      const text = t.getTextContent();
      if (!SPLIT.test(text)) continue;
      const f = t.getFormat();
      let prev = t;
      for (const part of text.split(SPLIT).filter(Boolean)) {
        const m = part.match(ONE);
        const made = m
          ? makeChip(variant, m[2], m[1] === "#" ? "configVar" : "reference", f)
          : $createTextNode(part).setFormat(f);
        prev.insertAfter(made); prev = made;
      }
      t.remove();
    }
  }, { discrete: true });

  let out = "";
  editor.getEditorState().read(() => { out = serializeRoot(); });
  return out;
};

/* ───────────────────── behavioural probes ──────────────────────── */

const probe = (variant) => {
  const editor = createEditor({ namespace: "p", nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, DivNode, SynP, CHIP[variant]], onError: (e) => { throw e; } });
  let caretOk = true, boldReached = false;

  editor.update(() => {
    const root = $getRoot(); root.clear();
    const p = $createParagraphNode();
    const t = $createTextNode("hi ");
    const c = makeChip(variant, "sf.results.company.name", "reference", 0);
    p.append(t, c); root.append(p);

    try { const s = $createRangeSelection(); s.anchor.set(c.getKey(), 0, "text"); s.focus.set(c.getKey(), 0, "text"); $setSelection(s); }
    catch { caretOk = false; }

    // select the whole line and press bold, the ordinary gesture
    const s = $createRangeSelection();
    s.anchor.set(t.getKey(), 0, "text");
    if (variant === "B") s.focus.set(c.getKey(), c.getTextContentSize(), "text");
    else s.focus.set(p.getKey(), p.getChildrenSize(), "element");
    $setSelection(s); s.formatText("bold");
  }, { discrete: true });

  editor.getEditorState().read(() => {
    const c = $getRoot().getLastDescendant();
    boldReached = typeof c.getFormat === "function" && (c.getFormat() & IS_BOLD) !== 0;
  });
  return { caretOk, boldReached };
};

/* ──────────────────────────── report ───────────────────────────── */

const CASES = [
  ["bold spans text and chip", "<b>hi {{$sf.results.company.name}}</b>"],
  ["bold on the chip alone", "<h1>Hi <b>{{$sf.results.company.name}}</b></h1>"],
  ["no formatting", "<p>Hi {{$sf.results.company.name}}</p>"],
  ["nested formats", "<p><i><b>{{$sf.results.company.name}}</b></i></p>"],
  ["config var, bolded", "<p><b>{{#GREETING}}</b> hello</p>"],
  ["heading", "<h2>Quarterly summary</h2>"],
  ["bullet list + chip", "<ul><li>Owner is <b>{{$lead.results.owner}}</b></li><li>Second item</li></ul>"],
  ["numbered list", "<ol><li>Step one</li><li>Step two</li></ol>"],
  ["blockquote + chip", "<blockquote>{{#GREETING}} from the team</blockquote>"],
  ["line breaks", "<p>Line one<br>line two<br>line three</p>"],
  ["the full fixture", '<div class="wrap" bgcolor="#f4f4f4"><h1>Hi <b>{{$sf.results.company.name}}</b></h1><p>{{#GREETING}}, your report is ready.</p><p>Thanks,<br>{{#SIGNATURE}}</p></div>'],
];

const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
let score = { A: 0, B: 0, C: 0 };

console.log("ROUND TRIP – does the saved value equal the initial markup?\n");
console.log(`${pad("case", 28)}${pad("A decorator", 14)}${pad("B token text", 14)}C decorator+bits`);
console.log("─".repeat(84));
for (const [name, html] of CASES) {
  const row = ["A", "B", "C"].map((v) => {
    const out = roundTrip(v, html);
    const ok = out.trim() === html.trim();
    if (ok) score[v]++;
    return ok;
  });
  console.log(`${pad(name, 28)}${pad(row[0] ? "✓" : "✗ changed", 14)}${pad(row[1] ? "✓" : "✗ changed", 14)}${row[2] ? "✓" : "✗ changed"}`);
}
console.log("─".repeat(84));
console.log(`${pad("passed", 28)}${pad(`${score.A}/${CASES.length}`, 14)}${pad(`${score.B}/${CASES.length}`, 14)}${score.C}/${CASES.length}`);

console.log("\n\nWHAT ACTUALLY DIFFERS – the first failing case, side by side\n");
const [, firstHtml] = CASES[0];
console.log("  initial   ", firstHtml);
for (const v of ["A", "B", "C"]) console.log(`  ${v}         `, roundTrip(v, firstHtml));

console.log("\n\nBEHAVIOUR\n");
console.log(`${pad("", 28)}${pad("A decorator", 14)}${pad("B token text", 14)}C decorator+bits`);
console.log("─".repeat(84));
const probes = { A: probe("A"), B: probe("B"), C: probe("C") };
console.log(`${pad("bold reaches the chip", 28)}${pad(probes.A.boldReached ? "✓" : "✗", 14)}${pad(probes.B.boldReached ? "✓" : "✗", 14)}${probes.C.boldReached ? "✓" : "✗ node alone"}`);
console.log(`${pad("chip can hold a caret", 28)}${pad(probes.A.caretOk ? "✓" : "✗ throws", 14)}${pad(probes.B.caretOk ? "✓" : "✗ throws", 14)}${probes.C.caretOk ? "✓" : "✗ throws"}`);
console.log(`${pad("pill can host React", 28)}${pad("✓", 14)}${pad("✗ plain DOM", 14)}✓`);
console.log(`${pad("label may differ from token", 28)}${pad("✓", 14)}${pad("✓ label is the text", 14)}✓`);

console.log(`
These probe the NODES on their own, which is why C cannot take a bold here.
Lexical's own formatText walks a RangeSelection and skips anything that is not
a TextNode, so no decorator is ever handed the format. The app closes that gap
with DecoratorFormatPlugin: ~50 lines that intercept FORMAT_TEXT_COMMAND, set
the bitmask on the selected chips by hand, and return false so Lexical still
formats the surrounding text. With the plugin, bold reaches a C chip and the
saved value keeps one continuous <b> run across it.

The caret row has no such fix. A decorator cannot be a RangeSelection endpoint,
and that is a Lexical invariant rather than something to patch around.`);

process.exit(0);
