import type { ReactNode } from "react";
import { OneValue } from "./OneValue";
import { PreviewIsolation } from "./PreviewIsolation";
import {
  CONFIG_VAR_TOKENS,
  escapeTokenValue,
  REFERENCE_TOKENS,
} from "../editor";

/** Two sections, matching the two surfaces this work actually touches. */
const Section = ({
  n,
  question,
  asked,
  answer,
  children,
}: {
  n: string;
  question: string;
  asked?: string;
  answer: ReactNode;
  children: ReactNode;
}) => (
  <section className="sec">
    <div className="sec__hd">
      <span className="sec__n">{n}</span>
      <div>
        <h2>{question}</h2>
        {asked ? (
          <p className="sec__asked">Raised in review: “{asked}”</p>
        ) : null}
      </div>
    </div>
    <div className="sec__answer">
      <span className="sec__answer-tag">Answer</span>
      {answer}
    </div>
    {children}
  </section>
);

export const App = () => {
  /**
   * Option A, parked.
   *
   * The mechanism is built and tested — `editor/tokens/escape.ts` and
   * `verify-escaping.mjs` — but it is switched off and its control is hidden,
   * because the rule it implements cannot be carried out on the current
   * platform path: the declared type it keys on is discarded two hops before
   * substitution. Showing a working toggle implied a capability that does not
   * exist.
   *
   * Flip this to `true` and set ESCAPING_CONTROL_VISIBLE to bring it back when
   * there is a decision to demonstrate.
   */
  const escaping = false;

  return (
    <div className="page">
      <header className="masthead">
        <h1>Lexical chip playground</h1>
        <p>
          Lexical <code>0.32.1</code> and React <code>17.0.2</code> – the same
          versions the Prismatic frontend runs, so anything shown here is true of
          the real editor. Every answer was produced by running the code on this
          page rather than reasoning about it.
        </p>
        <p className="masthead__runs">
          The same checks run headlessly with <code>npm run verify</code>:{" "}
          <code>verify-format</code> (the indenter is lossless and idempotent) ·{" "}
          <code>verify-roundtrip</code> (the tech doc's stored-value table) ·{" "}
          <code>verify-variants</code> (why the chip is this node and not another)
        </p>
        {/*
          Where the chain actually starts. Everything downstream is a
          consequence of this declaration, and two of its properties are the
          ones people get wrong.
        */}
        <div className="sdk">
          <span className="sdk__lbl">the component author declares</span>
          <pre className="sdk__code">{`input({
  label: "HTML",
  type: "code",        // there is no type: "html" in spectral
  language: "html",    // a highlighting hint — it never reaches the runner
  clean: util.types.toString,   // the only coercion in the whole chain
})`}</pre>
          <p className="sdk__note">
            Real usage across the components repo: <b>7</b> inputs declare{" "}
            <code>language: "html"</code> and <b>0</b> declare{" "}
            <code>markdown</code>; <code>json</code> accounts for <b>788</b>.
            <code>clean</code> is opt-in and the author's to pull —{" "}
            <code>util.types.toString</code> is <code>{"`${value ?? \"\"}`"}</code>,
            so an object-valued reference arrives as{" "}
            <code>"[object Object]"</code>.
          </p>
        </div>

        <div className="tokenbar">
          <span className="tokenbar__lbl">
            every token, and what a test run substitutes for it
          </span>
          <table className="tokens">
            <tbody>
              {[
                ...REFERENCE_TOKENS.map((spec) => ({
                  spec,
                  kind: "reference" as const,
                })),
                ...CONFIG_VAR_TOKENS.map((spec) => ({
                  spec,
                  kind: "configVar" as const,
                })),
              ].map(({ spec, kind }) => {
                const substituted = escaping
                  ? escapeTokenValue(spec.value, {
                      kind,
                      dataType: spec.dataType,
                      codeLanguage: spec.codeLanguage,
                    })
                  : spec.value;
                const declared = spec.dataType
                  ? `${spec.dataType}${spec.codeLanguage ? `/${spec.codeLanguage}` : ""}`
                  : null;

                return (
                  <tr key={spec.token}>
                    <td>
                      <code>{spec.token}</code>
                    </td>
                    <td className="tokens__kind">
                      {kind === "configVar" ? "config var" : "reference"}
                      {declared ? (
                        <span className="tokens__declared">{declared}</span>
                      ) : null}
                    </td>
                    <td>
                      <code
                        className={`tokens__value ${
                          substituted === spec.value ? "" : "changed"
                        }`}
                      >
                        {substituted}
                      </code>
                      {substituted === spec.value ? null : (
                        <span className="tokens__was">
                          was <code>{spec.value}</code>
                        </span>
                      )}
                      {spec.note ? (
                        <span className="tokens__note">{spec.note}</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </header>

      <Section
        n="1"
        question="The editor"
        asked="I think this might cause problems with selection, keyboard nav… You need it to be a decorator node to inject arbitrary components into the Lexical output"
        answer={
          <>
            <p>
              The chip is a <code>DecoratorNode</code> – a real React component –
              that carries a format bitmask and writes its own{" "}
              <code>exportDOM</code>. The panel below runs one value through five
              representations and reports whether the value that comes out
              matches the one that went in.
            </p>
            <p>
              Unresolved: a decorator cannot be a selection endpoint, so a chip
              cannot hold a caret. Markdown has no underline syntax, so that one
              format is dropped on save.
            </p>
          </>
        }
      >
        <OneValue escaping={escaping} />
      </Section>

      <Section
        n="2"
        question="The preview"
        asked="I kind of wonder if our preview needs to render these in an isolated shadow DOM that doesn't inherit any styles from the main page, so they see the unstyled preview"
        answer={
          <>
            <p>
              Both directions leak. The panel renders one sample email in four
              isolation modes against a live app stylesheet, so each leak is
              visible rather than described. Only <code>all: initial</code> on a
              shadow host, or a sandboxed iframe, closes both.
            </p>
          </>
        }
      >
        <p className="blurb">
          Kept separate from the editor because it is a separate surface – the
          same renderer is used elsewhere in the product, so whatever is decided
          here lands in more than one place.
        </p>
        <PreviewIsolation />
      </Section>
    </div>
  );
};
