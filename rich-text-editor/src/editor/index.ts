/**
 * The reusable half of this repository.
 *
 * Everything under `editor/` is what a real rich-text input would need. Nothing
 * in here imports from `harness/`, and nothing in here knows that a five-pane
 * demonstration exists — the harness is one consumer of this module, and the
 * product would be another.
 *
 * The pieces, and the finding behind each:
 *
 *   dialects        HTML and Markdown behind one interface. Load, save,
 *                   canonicalize, preview. The panel never branches on format.
 *   serialize       The stored value. Lexical's own HTML export cannot produce
 *                   one: it calls createDOM, so theme classes, `pre-wrap` and
 *                   the chip's pill all land in the saved string.
 *   editorNodes     The node registry, which IS the allowlist. An element with
 *                   no node here is dropped on import, by construction rather
 *                   than by a separate sanitizing pass.
 *   tokens/escape   Option A. A substituted value is data and gets escaped; the
 *                   author's own markup never does.
 *   formatHtml      Indent and un-indent, deciding per gap whether whitespace
 *                   may move.
 *   plugins         The behaviour Lexical does not give you: bold that reaches
 *                   a decorator, and literal `{{...}}` text becoming a chip.
 */

export {
  DIALECTS,
  type Dialect,
  type DialectId,
  type PreviewResult,
} from "./dialects";
export {
  type InputExpression,
  RICH_TEXT_TYPES,
  type SimpleInputType,
  toStoredYaml,
} from "./expression";
export { EDITOR_NODES } from "./editorNodes";
export { collapseHtml, formatHtml } from "./formatHtml";
export { MARKDOWN_TRANSFORMERS } from "./markdownTransformers";
export { serializeStoredValue } from "./serialize";

export { ChipPanelProvider, useChipPanel } from "./chip/ChipPanel";
export { ChipPill } from "./chip/ChipPill";
export { type ChipKind, chipLabelFor, isChipValid, tokenFor } from "./chip/chipLabel";

export { evaluate, type Expression, isValidReference } from "./tokens/glimmer";
export {
  type ConfigVarCodeLanguage,
  type ConfigVarDataType,
  escapeHtml,
  escapeTokenValue,
  isDeclaredHtml,
  type TokenKind,
} from "./tokens/escape";
export {
  CONFIG_VAR_TOKENS,
  KNOWN_CONFIG_VARS,
  KNOWN_STEPS,
  REFERENCE_TOKENS,
  type Resolved,
  resolveExpression,
  type TokenSpec,
} from "./tokens/resolve";

export { DecoratorFormatPlugin } from "./plugins/DecoratorFormatPlugin";
export { TokenizePlugin } from "./plugins/TokenizePlugin";
export { ToolbarPlugin } from "./plugins/ToolbarPlugin";

export {
  $createFormatDecoratorNode,
  $isFormatDecoratorNode,
  FormatDecoratorNode,
} from "./nodes/FormatDecoratorNode";
export { $isHtmlElementNode, HtmlElementNode } from "./nodes/HtmlElementNode";
export { $isImageNode, ImageNode } from "./nodes/ImageNode";
export {
  $createImplicitParagraphNode,
  $isImplicitParagraphNode,
  ImplicitParagraphNode,
} from "./nodes/ImplicitParagraphNode";
export { $isRawHtmlNode, RawHtmlNode, stashRaw } from "./nodes/RawHtmlNode";
