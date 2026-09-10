import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
} from "lexical";
import { $createFormatDecoratorNode } from "../nodes/FormatDecoratorNode";
import { type ChipKind, tokenFor } from "../chip/chipLabel";
import { CONFIG_VAR_TOKENS, REFERENCE_TOKENS } from "../tokens/resolve";



/**
 * Both lists come from `resolve.ts`, which is the single record of what tokens
 * exist. Config variables are Designer-only in the real product; EWB has no
 * values for them.
 */
const REFERENCES = REFERENCE_TOKENS.map((spec) => spec.name);
const CONFIG_VARS = CONFIG_VAR_TOKENS.map((spec) => spec.name);

/**
 * `insertTokenIntoRaw` is supplied only while the raw pane was the last surface
 * touched. See the note on the chip group below for why the reference buttons
 * are the only ones that cross over.
 */
export const ToolbarPlugin = ({
  insertTokenIntoRaw,
}: {
  insertTokenIntoRaw?: (token: string) => void;
}) => {
  const [editor] = useLexicalComposerContext();

  /**
   * There is no node to insert in the raw pane – it holds text, and a chip
   * there is literally `{{$sf.results.company.name}}`. So the same button means
   * "insert a decorator" in the editor and "type the token for me" in raw.
   */
  const insertChip = (reference: string, kind: ChipKind = "reference") => {
    if (insertTokenIntoRaw) {
      insertTokenIntoRaw(tokenFor(kind, reference));

      return;
    }

    editor.update(() => {
      $insertNodes([$createFormatDecoratorNode(reference, kind)]);
    });
  };

  /** Turn the selected blocks into something else. */
  const setBlock = (make: () => Parameters<typeof $setBlocksType>[1] extends
    (...args: never) => infer R ? R : never) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $setBlocksType(selection, make);
    });
  };

  const format = (type: "bold" | "italic" | "underline" | "strikethrough") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  };

  /**
   * Select everything. Uses element points on the root rather than a text
   * offset – a text point with a huge offset throws, and a decorator cannot
   * take a text point at all.
   */
  const selectAll = () => {
    editor.focus();
    editor.update(() => {
      const root = $getRoot();
      root.select(0, root.getChildrenSize());
    });
  };

  const rawIsTarget = insertTokenIntoRaw !== undefined;

  return (
    <div className="toolbar">
      <span
        className={`toolbar__target ${rawIsTarget ? "raw" : ""}`}
        title="Whichever surface you touched last is the one a button acts on."
      >
        {rawIsTarget ? "raw" : "wysiwyg"}
      </span>

      {/*
        Formatting and block controls are editor-only. Someone hand-writing HTML
        types `<b>` faster than they can find a button, and a block button would
        have to guess whether it means the selection or the line. Leaving them
        live would also format a selection in a pane the user is not looking at.
      */}
      <div
        className="toolbar__group"
        title={rawIsTarget ? "Editor only – type the tag by hand in raw" : undefined}
      >
        <button type="button" disabled={rawIsTarget} onClick={() => format("bold")}>
          <b>B</b>
        </button>
        <button type="button" disabled={rawIsTarget} onClick={() => format("italic")}>
          <i>I</i>
        </button>
        <button type="button" disabled={rawIsTarget} onClick={() => format("underline")}>
          <u>U</u>
        </button>
        <button type="button" disabled={rawIsTarget} onClick={() => format("strikethrough")}>
          <s>S</s>
        </button>
      </div>

      <div className="toolbar__group" title={rawIsTarget ? "Editor only – type the tag by hand in raw" : undefined}>
        <button type="button" disabled={rawIsTarget} onClick={() => setBlock($createParagraphNode)}>
          ¶
        </button>
        {(["h1", "h2", "h3"] as HeadingTagType[]).map((tag) => (
          <button
            key={tag}
            type="button"
            disabled={rawIsTarget}
            onClick={() => setBlock(() => $createHeadingNode(tag))}
          >
            {tag.toUpperCase()}
          </button>
        ))}
        <button type="button" disabled={rawIsTarget} onClick={() => setBlock($createQuoteNode)}>
          ❝
        </button>
        <button
          type="button"
          disabled={rawIsTarget}
          onClick={() =>
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          }
        >
          • list
        </button>
        <button
          type="button"
          disabled={rawIsTarget}
          onClick={() =>
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
          }
        >
          1. list
        </button>
        <button
          type="button"
          disabled={rawIsTarget}
          onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}
        >
          un-list
        </button>
        <button
          type="button"
          disabled={rawIsTarget}
          onClick={() =>
            editor.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false)
          }
          title="a <br>, not a new paragraph"
        >
          ↵ br
        </button>
      </div>

      <div className="toolbar__group">
        <button type="button" disabled={rawIsTarget} onClick={selectAll}>
          select all
        </button>
      </div>


      <div className="toolbar__tokens">
        {/*
          Last, and the only groups that work in the raw pane. Nobody memorizes
          `{{$sf.results.company.name}}`, so reference and config-var insertion is
          not a convenience – it is the discovery mechanism, and a raw view without
          it cannot author a reference at all. The app draws the same line: its
          Monaco editor has no bold button, but it does offer `stepResults` and
          `configVars` completions.
        */}
        <div className="toolbar__group">
          {CONFIG_VARS.map((name) => (
            <button
              key={name}
              type="button"
              className="cfg"
              onClick={() => insertChip(name, "configVar")}
              title={`Insert {{#${name}}}`}
            >
              + #{name}
            </button>
          ))}
        </div>

        <div className="toolbar__group">
          {REFERENCES.map((reference) => (
            <button
              key={reference}
              type="button"
              className="ref"
              onClick={() => insertChip(reference)}
              title={`Insert {{$${reference}}}`}
            >
              + {reference.split(".")[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
