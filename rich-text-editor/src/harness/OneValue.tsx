import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useState } from "react";
import {
  ChipPanelProvider,
  type InputExpression,
  RICH_TEXT_TYPES,
  type SimpleInputType,
  toStoredYaml,
  type Dialect,
  DIALECTS,
  type DialectId,
  DecoratorFormatPlugin,
  EDITOR_NODES,
  TokenizePlugin,
  ToolbarPlugin,
} from "../editor";
import { SelectionInspector } from "./SelectionInspector";
import { FIXTURES } from "./fixtures";
import { theme } from "./theme";
import { useRawPane } from "./useRawPane";
import { useStoredValue } from "./useStoredValue";

/**
 * One value, five representations.
 *
 *   INPUT   1 initial markup
 *   VIEWS   2 WYSIWYG   3 raw (editable)   4 preview
 *   OUTPUT  5 saved value – must equal 1
 *
 * Raw and preview are not the same thing. Raw is an editing surface holding the
 * source string; preview is read-only with the tokens resolved.
 */
const Panes = ({
  dialect,
  expressionType,
  onExpressionTypeChange,
  escaping,
  initial,
  onInitialChange,
  onReimport,
  loadNonce,
}: {
  dialect: Dialect;
  expressionType: SimpleInputType;
  onExpressionTypeChange: (type: SimpleInputType) => void;
  /**
   * Option A on or off, owned by the token table so the control sits with the
   * values it acts on. It changes pane 4 and nothing else – the stored value
   * keeps its tokens unresolved, and nothing escapes on save.
   */
  escaping: boolean;
  initial: string;
  onInitialChange: (value: string) => void;
  onReimport: () => void;
  loadNonce: number;
}) => {
  const [editor] = useLexicalComposerContext();
  const { saved, rawDraft, setRawDraft, commit } = useStoredValue({
    editor,
    dialect,
    initial,
    loadNonce,
  });
  const raw = useRawPane();

  /** In raw the chip buttons type the token; there is no node to insert. */
  const insertTokenIntoRaw = (token: string) => {
    const next = raw.spliceAtCaret(rawDraft, token);
    if (next !== null) commit(next);
  };

  /**
   * Formatting implies applying: it commits whatever the pane holds, and the
   * indented string becomes the stored value. Only HTML offers it – markdown's
   * serializer already emits one canonical spelling, so there is no second
   * arrangement of the same value to switch to.
   */
  const formatRaw = () => {
    if (dialect.format) commit(dialect.format(rawDraft));
  };

  /**
   * The envelope the editor would write. `value` is the default a code input is
   * created with, and it is what makes the tokens inert — the switch beside
   * pane 5 is the whole point.
   */
  const expression: InputExpression = { type: expressionType, value: saved };
  const rendered = dialect.preview(expression, escaping);



  // Three states, because two would hide the distinction that matters.
  // Losing indentation is expected and harmless; losing a <div> is the bug the
  // epic has to catch. A single pass/fail badge reports them the same way.
  const verdict: "identical" | "whitespace" | "changed" =
    saved.trim() === initial.trim()
      ? "identical"
      : dialect.canonical(saved) === dialect.canonical(initial)
        ? "whitespace"
        : "changed";

  return (
    <div className="ov">
      <div className="ov__row">
        <div className="ov__pane ov__pane--input">
          <div className="ov__hd">
            <span className="ov__n">1</span> Initial markup
            <button type="button" className="ov__apply" onClick={onReimport}>
              re-import
            </button>
            <span className="ov__who">the author · the database</span>
          </div>
          <textarea
            className="ov__code ov__code--in"
            value={initial}
            onChange={(event) => onInitialChange(event.target.value)}
            spellCheck={false}
          />
        </div>
      </div>

      <div className="ov__toolbar">
        <ToolbarPlugin
          insertTokenIntoRaw={raw.isTarget ? insertTokenIntoRaw : undefined}
        />
      </div>

      <div className="ov__row ov__row--views">
        <div className="ov__pane">
          <div className="ov__hd">
            <span className="ov__n">2</span> WYSIWYG
            <span className="ov__who">the person editing</span>
          </div>
          <div className="ov__body">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="ov__editable"
                  onFocus={raw.releaseTarget}
                />
              }
              placeholder={<div className="ov__ph">empty</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
        </div>

        <div className="ov__pane">
          <div className="ov__hd">
            <span className="ov__n">3</span> Raw
            <span className="ov__who">editable source</span>
            {dialect.format ? (
              <button
                type="button"
                className="ov__apply"
                onClick={formatRaw}
                title="indent, and commit – never a re-serialize"
              >
                format
              </button>
            ) : null}
          </div>
          <textarea
            ref={raw.ref}
            className="ov__code ov__code--tall"
            value={rawDraft}
            onFocus={raw.onFocus}
            onChange={(event) => setRawDraft(event.target.value)}
            // Commit on the way out, but only for a real edit. Re-importing on
            // every blur would rebuild the tree – and drop the caret – each
            // time somebody clicked from this pane into the editor.
            // Commit on the way out, but only for a real edit. Re-importing on
            // every blur would rebuild the tree – and drop the caret – each
            // time somebody clicked from this pane into the editor.
            onBlur={() => {
              if (dialect.canonical(rawDraft) !== dialect.canonical(saved)) {
                commit(rawDraft);
              }
            }}
            spellCheck={false}
          />
        </div>

        <div className="ov__pane">
          <div className="ov__hd">
            <span className="ov__n">4</span> Preview
            <span className="ov__who">
              read-only, resolved{escaping ? ", escaped" : ""}, sandboxed
            </span>
          </div>
          {/*
            A sandboxed iframe, not a div. Rendered inline, the email's own
            <style> block becomes a live stylesheet in the playground's document
            – a `.cta` element anywhere on the page picks it up. That is the
            leak section 2 exists to demonstrate, and pane 4 was running it.

            The iframe is the mode section 2 lands on for exactly this surface:
            it is the only one that gets its own document, so a <style> block
            and a conditional comment behave the way an email client treats
            them rather than the way the builder page does.
          */}
          {/*
            Keyed on the content, so every value gets a FRESH frame that takes
            its srcDoc at creation.

            Two other arrangements do not work here. Re-assigning `srcdoc` on a
            living frame drops the second of two rapid writes – which is exactly
            what mount and a dialect switch do, going empty then filled within a
            tick – and the pane stays blank. Navigating to a blob URL is worse:
            `sandbox=""` gives the frame an opaque origin, so it cannot load a
            blob minted by ours at all.
          */}
          <iframe
            key={rendered.html}
            className="ov__preview"
            title="preview"
            sandbox=""
            srcDoc={rendered.html}
          />
          {rendered.error ? (
            <p className="ov__note ov__note--error">
              glimmer threw: <code>{rendered.error}</code>. The runner swallows
              this and the input silently becomes <code>undefined</code>.
            </p>
          ) : null}
        </div>
      </div>

      <div className="ov__row">
        <div className={`ov__pane ov__pane--output is-${verdict}`}>
          <div className="ov__hd">
            <span className="ov__n">5</span> Saved value
            <div className="seg seg--tiny">
              {RICH_TEXT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={expressionType === type ? "on" : ""}
                  onClick={() => onExpressionTypeChange(type)}
                  title={
                    type === "value"
                      ? "The default for a code input. Tokens are delivered as literal characters."
                      : "The only type that substitutes."
                  }
                >
                  {type}
                </button>
              ))}
            </div>
            <span className={`ov__verdict ${verdict}`}>
              {verdict === "identical"
                ? "byte-identical to 1"
                : verdict === "whitespace"
                  ? "same content · whitespace canonicalized"
                  : "content changed from 1"}
            </span>
            <span className="ov__who">the runner</span>
          </div>
          <pre className="ov__code ov__code--out">
            {saved ? toStoredYaml("body", expression) : "(empty)"}
          </pre>
          {verdict === "whitespace" && (
            <p className="ov__note">
              Same content, indentation removed. Lexical has no node for
              whitespace between block tags, so there is nowhere in the tree to
              remember it. Press <b>format</b> in pane 3 to put it back and
              store it that way.
            </p>
          )}
        </div>
      </div>

      <details className="ov__more">
        <summary>Selection detail – arrow through a chip and watch these</summary>
        <SelectionInspector />
      </details>

      <DecoratorFormatPlugin />
      <TokenizePlugin />
      <ListPlugin />
      <HistoryPlugin />
    </div>
  );
};

export const OneValue = ({ escaping }: { escaping: boolean }) => {
  /**
   * A code input is created as `value` — see `getInputExpression.ts`, where the
   * whole field-type map defaults to it. Starting the harness on `template`
   * would hide the failure this switch exists to show, so it starts where the
   * platform starts.
   */
  const [expressionType, setExpressionType] = useState<SimpleInputType>("template");
  const [dialectId, setDialectId] = useState<DialectId>("html");
  const dialect = DIALECTS[dialectId];
  const fixtures = FIXTURES[dialectId];
  const [initial, setInitial] = useState(fixtures[0].value);
  const [loadNonce, setLoadNonce] = useState(0);

  const pick = (value: string) => {
    setInitial(value);
    setLoadNonce((n) => n + 1);
  };

  const switchDialect = (next: DialectId) => {
    if (next === dialectId) return;
    setDialectId(next);
    pick(FIXTURES[next][0].value);
  };

  return (
    <>
      <div className="controls">
        <div className="fixtures">
          <div className="fixtures__row">
            <span className="row__label">input type</span>
            <div className="seg">
              {(Object.keys(DIALECTS) as DialectId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  className={dialectId === id ? "on" : ""}
                  onClick={() => switchDialect(id)}
                >
                  {DIALECTS[id].label}
                </button>
              ))}
            </div>
          </div>

          <div className="fixtures__row">
            <span className="row__label">start from</span>
            <div className="seg">
              {fixtures.map((fixture) => (
                <button
                  key={fixture.label}
                  type="button"
                  className={initial === fixture.value ? "on" : ""}
                  onClick={() => pick(fixture.value)}
                >
                  {fixture.label}
                  <span className="seg__note">{fixture.note}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {dialect.caveat ? (
          <p className="controls__caveat">{dialect.caveat}</p>
        ) : null}
      </div>

      <LexicalComposer
        // Remounting on a dialect change is deliberate: the two formats build
        // different trees from the same string, and reusing the old state would
        // show a value neither dialect produced.
        key={dialectId}
        initialConfig={{
          namespace: `one-value-${dialectId}`,
          theme,
          onError: (error) => {
            throw error;
          },
          nodes: EDITOR_NODES,
        }}
      >
        <ChipPanelProvider>
          <Panes
            dialect={dialect}
            expressionType={expressionType}
            onExpressionTypeChange={setExpressionType}
            escaping={escaping}
            initial={initial}
            onInitialChange={setInitial}
            onReimport={() => setLoadNonce((n) => n + 1)}
            loadNonce={loadNonce}
          />
        </ChipPanelProvider>
      </LexicalComposer>
    </>
  );
};
