import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import {
  $getRoot,
  $isElementNode,
  createEditor,
  type EditorState,
  type LexicalEditor,
} from "lexical";
import { EDITOR_NODES } from "./editorNodes";
import { MARKDOWN_TRANSFORMERS } from "./markdownTransformers";
import type { InputExpression } from "./expression";
import { collapseHtml, formatHtml } from "./formatHtml";
import { $createImplicitParagraphNode } from "./nodes/ImplicitParagraphNode";
import { stashRaw } from "./nodes/RawHtmlNode";
import { resolveExpression } from "./tokens/resolve";
import { serializeStoredValue } from "./serialize";

/**
 * The two input types the epic adds, behind one interface.
 *
 * They differ in more than syntax. Markdown has several spellings for the same
 * thing – `# Title` and `Title\n=====` are one heading, `_em_` and `*em*` one
 * emphasis – and `$convertToMarkdownString` emits exactly one of each. Left
 * alone, that rewrites an author's file the first time they open it.
 *
 * It does not, because the shape rule in the panel covers markdown as well as
 * HTML: the author's own text is kept for as long as `canonical(theirs)` still
 * equals what the tree serializes to. Same mechanism, same guarantee, different
 * definition of "canonical" – which is the whole reason it lives behind this
 * interface rather than being written twice.
 */
export type DialectId = "html" | "markdown";

export interface PreviewResult {
  /** Rendered markup for the preview frame. */
  html: string;
  /** Set when glimmer threw, which the runner would swallow to `undefined`. */
  error?: string;
}

export interface Dialect {
  id: DialectId;
  label: string;
  /** Load a stored value into the editor. */
  load: (editor: LexicalEditor, value: string) => void;
  /** What would be saved. */
  save: (state: EditorState) => string;
  /**
   * The form two values must share to count as the same content. Used both for
   * the verdict badge and for deciding whether the panes may keep their current
   * whitespace shape.
   */
  canonical: (value: string) => string;
  /**
   * The stored expression run the way the runner would run it, then rendered.
   *
   * It takes the whole envelope rather than the string, because the `type` is
   * what decides whether substitution happens at all: a `value` expression
   * comes back with its braces intact.
   *
   * @param escape apply Option A to the substituted values. Never applies to
   *   the author's own markup, and never reaches the stored value.
   */
  preview: (expression: InputExpression, escape: boolean) => PreviewResult;
  /** Pretty-print the raw pane, where that means anything. */
  format?: (value: string) => string;
  /** Why some toolbar buttons cannot survive this format. */
  caveat?: string;
}

/** A detached editor, for normalizing a string without touching the live one. */
const scratch = (): LexicalEditor =>
  createEditor({
    namespace: "scratch",
    nodes: EDITOR_NODES,
    onError: (error) => {
      throw error;
    },
  });

const loadHtml = (editor: LexicalEditor, value: string) => {
  editor.update(
    () => {
      const dom = new DOMParser().parseFromString(
        collapseHtml(value),
        "text/html",
      );
      // The HTML parser routes a leading <style>, and any comment before the
      // first real content, into <head>. `$generateNodesFromDOM` only walks
      // <body>, so an email's own stylesheet would be gone before Lexical ever
      // saw it. Move the head back in front of the body first.
      // Insert before a fixed anchor, not before whatever is currently first,
      // or the head's children arrive in reverse.
      const bodyStart = dom.body.firstChild;
      while (dom.head.firstChild) {
        dom.body.insertBefore(dom.head.firstChild, bodyStart);
      }
      // The parser also INSERTS <tbody> around loose rows. There is no way to
      // tell an inserted one from an authored one in the DOM, so ask the source
      // string instead: if the author never typed <tbody>, take them back out.
      if (!/<tbody[\s>]/i.test(value)) {
        for (const tbody of Array.from(dom.querySelectorAll("tbody"))) {
          tbody.replaceWith(...Array.from(tbody.childNodes));
        }
      }
      stashRaw(dom);
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();

      // Lexical's root holds block nodes only, so loose inline content has to be
      // wrapped. Consecutive inline nodes share ONE wrapper; wrapping each
      // separately would split a single run into several blocks.
      //
      // The wrapper is marked implicit, so the serializer emits its children and
      // no tag. A stored value must never gain a `<p>` the author did not
      // write – it is a fragment, and a stray block tag breaks it wherever it is
      // embedded.
      let run: ReturnType<typeof $createImplicitParagraphNode> | null = null;
      for (const node of nodes) {
        if ($isElementNode(node) && !node.isInline()) {
          run = null;
          root.append(node);
        } else {
          if (run === null) {
            run = $createImplicitParagraphNode();
            root.append(run);
          }
          run.append(node);
        }
      }
    },
    { discrete: true },
  );
};

const loadMarkdown = (editor: LexicalEditor, value: string) => {
  editor.update(
    () => {
      $convertFromMarkdownString(value, MARKDOWN_TRANSFORMERS);
    },
    { discrete: true },
  );
};

/** Markdown in, markdown out, through a detached editor. */
const canonicalMarkdown = (value: string): string => {
  const editor = scratch();
  let out = "";
  loadMarkdown(editor, value);
  editor.getEditorState().read(() => {
    out = $convertToMarkdownString(MARKDOWN_TRANSFORMERS);
  });

  return out.trim();
};

/** Markdown to HTML, so the preview pane shows what a reader would see. */
const renderMarkdown = (value: string): string => {
  const editor = scratch();
  let out = "";
  loadMarkdown(editor, value);
  editor.getEditorState().read(() => {
    out = $generateHtmlFromNodes(editor);
  });

  return out;
};

export const DIALECTS: Record<DialectId, Dialect> = {
  html: {
    id: "html",
    label: "HTML",
    load: loadHtml,
    save: serializeStoredValue,
    canonical: (value) => collapseHtml(value).trim(),
    preview: (expression, escape) => {
      const { output, error } = resolveExpression(expression, { escape });

      return { html: output, error };
    },
    format: formatHtml,
  },
  markdown: {
    id: "markdown",
    label: "Markdown",
    load: loadMarkdown,
    save: (state) => state.read(() => $convertToMarkdownString(MARKDOWN_TRANSFORMERS)),
    canonical: canonicalMarkdown,
    /**
     * RENDER FIRST, then substitute – the reverse of the runner's own order,
     * and deliberate.
     *
     * Resolving first hands the substituted value to Lexical's markdown
     * transformers, which do not parse raw HTML, so every markup value came
     * back as literal tags. A spec-compliant markdown renderer passes raw HTML
     * through, so rendering first produces what a recipient would actually see
     * where the other order produces something no renderer would.
     *
     * The tokens survive the conversion untouched, because they are plain text
     * either way.
     *
     * What this ordering cannot show: the runner substitutes BEFORE anything
     * renders, so an unescaped `*` in a value would become emphasis there. Here
     * it lands in already-rendered HTML and stays a literal asterisk.
     */
    preview: (expression, escape) => {
      // Render first, then substitute. Handing a markup value to Lexical's
      // markdown transformers shows it as literal tags, because they do not
      // parse raw HTML; a spec-compliant renderer passes it through. The tokens
      // survive the conversion either way, being plain text.
      const { output, error } = resolveExpression(
        { ...expression, value: renderMarkdown(expression.value) },
        { escape },
      );

      return { html: output, error };
    },
    // No format button. `$convertToMarkdownString` already emits one canonical
    // spelling, so there is no second arrangement of the same value to offer.
    caveat:
      "Markdown has no underline. U is left enabled on purpose – press it and watch the format vanish from the saved value, because there is no syntax to write it in.",
  },
};
