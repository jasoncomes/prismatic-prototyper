import type { ReactNode } from "react";
import { OneValue } from "./OneValue";
import { TypeFinding } from "./TypeFinding";
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
  answer,
  children,
}: {
  n: string;
  question: string;
  answer: ReactNode;
  children: ReactNode;
}) => (
  <section className="sec">
    <div className="sec__hd">
      <span className="sec__n">{n}</span>
      <div>
        <h2>{question}</h2>
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
        answer={
          <>
            <p>
              The chip is a <code>DecoratorNode</code> – a real React component –
              that carries a format bitmask and writes its own{" "}
              <code>exportDOM</code>. The panel below runs one value through five
              representations and reports whether the value that comes out
              matches the one that went in.
            </p>
          </>
        }
      >
        <OneValue escaping={escaping} />
        <TypeFinding />
      </Section>

      <Section
        n="2"
        question="The preview"
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
        <PreviewIsolation />
      </Section>
    </div>
  );
};
