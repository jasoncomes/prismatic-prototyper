import type { InputExpression } from "../expression";
import {
  type ConfigVarCodeLanguage,
  type ConfigVarDataType,
  escapeTokenValue,
  type TokenKind,
} from "./escape";
import { evaluate, type EvaluationScope } from "./glimmer";

/**
 * A stand-in for glimmer's template substitution, with fake test-run data.
 *
 * Deliberately the same shape as the real thing: find every token, look it up,
 * and splice the value back in with plain string replacement. No escaping,
 * exactly like the real one – which is why "Procter & Gamble" below produces
 * invalid HTML.
 *
 * This file is also the single list of what tokens exist. The toolbar's
 * buttons, the validity check behind the red "Invalid Reference" chip, and the
 * table in the masthead all read it. They used to keep their own copies and had
 * already drifted: `SUPPORT_URL` resolved fine while its chip rendered as
 * invalid, because only one of the three lists knew about it.
 */

export interface TokenSpec {
  /** The name inside the braces. */
  name: string;
  /** The whole token, as it appears in a value. */
  token: string;
  /** What a test run resolves it to. */
  value: string;
  /**
   * Only a configuration variable has these, because only it resolves by a
   * DECLARED type at deploy. A reference has none by definition, which is why
   * its value is always escaped.
   */
  dataType?: ConfigVarDataType;
  codeLanguage?: ConfigVarCodeLanguage;
  /** Why this one is in the list, where that is not obvious. */
  note?: string;
}

export const REFERENCE_TOKENS: TokenSpec[] = [
  {
    name: "sf.results.company.name",
    token: "{{$sf.results.company.name}}",
    value: "Procter & Gamble",
    note: "a bare ampersand, which is invalid HTML unescaped – the escaping question in one value",
  },
  {
    name: "trigger.body.data.email",
    token: "{{$trigger.body.data.email}}",
    value: "dana@example.com",
  },
  {
    name: "lead.results.owner",
    token: "{{$lead.results.owner}}",
    value: "Dana Whitfield",
  },
  {
    name: "report.results.headline",
    token: "{{$report.results.headline}}",
    value: "<h3>Q3 performance</h3>",
    note: "a reference whose value is a BLOCK element – escape it and the tags show, do not and a heading is spliced into whatever surrounds it",
  },
];

export const CONFIG_VAR_TOKENS: TokenSpec[] = [
  { name: "GREETING", token: "{{#GREETING}}", value: "Hello there" },
  { name: "BRAND", token: "{{#BRAND}}", value: "Acme" },
  {
    name: "SUPPORT_URL",
    token: "{{#SUPPORT_URL}}",
    value: "https://support.example.com",
  },
  {
    name: "SIGNATURE",
    token: "{{#SIGNATURE}}",
    value: "<em>The Acme team</em>",
    dataType: "CODE",
    codeLanguage: "HTML",
    note: "a config variable whose value is markup – escaping it unconditionally would show the tags",
  },
];

/** Step names that exist, for the validity check behind a reference chip. */
export const KNOWN_STEPS = [
  ...new Set(REFERENCE_TOKENS.map((spec) => spec.name.split(".")[0] ?? "")),
];

export const KNOWN_CONFIG_VARS = CONFIG_VAR_TOKENS.map((spec) => spec.name);

/**
 * The scope glimmer resolves against, built from the token list above.
 *
 * A reference's path is rewritten by glimmer before lookup —
 * `['sf','results','company','name']` becomes `['sf','company','name']` — so
 * `sf.results.company.name` reads out of `results.sf.company.name`.
 */
const nest = (target: Record<string, unknown>, path: string[], value: unknown) => {
  let node = target;
  path.slice(0, -1).forEach((segment) => {
    node[segment] = node[segment] ?? {};
    node = node[segment] as Record<string, unknown>;
  });
  node[path[path.length - 1]] = value;
};

const buildResults = (transform: (spec: TokenSpec) => string) => {
  const results: Record<string, unknown> = {};
  for (const spec of REFERENCE_TOKENS) {
    const parts = spec.name.split(".");
    // drop the "results" segment, exactly as glimmer's path rewrite does
    nest(results, [parts[0], ...parts.slice(2)], transform(spec));
  }

  return results;
};

const buildConfigVars = (transform: (spec: TokenSpec) => string) =>
  Object.fromEntries(CONFIG_VAR_TOKENS.map((spec) => [spec.name, transform(spec)]));

const raw = (spec: TokenSpec) => spec.value;

const escaped = (kind: TokenKind) => (spec: TokenSpec) =>
  escapeTokenValue(spec.value, {
    kind,
    dataType: spec.dataType,
    codeLanguage: spec.codeLanguage,
  });

/**
 * Escaping is applied to the SCOPE, before the call — not to the output after
 * it.
 *
 * That is the shape the tech doc gives Option A: substitution happens inside
 * glimmer, which is an external package, so you cannot escape during it, but
 * `evaluate()` takes `configVars` and `results` as arguments and escaping those
 * beforehand gives the same result from the call site. Doing it this way means
 * the harness runs the real substitution rather than a version of it that
 * happens to escape.
 */
const scopeFor = (escape: boolean): EvaluationScope => ({
  configVars: buildConfigVars(escape ? escaped("configVar") : raw),
  results: buildResults(escape ? escaped("reference") : raw),
});

export interface Resolved {
  /** What the component would receive. */
  output: string;
  /**
   * Why nothing came back. The runner swallows any throw from glimmer and the
   * input silently becomes `undefined`, with no log outside debug mode — so a
   * failure here is a failure a builder would never be told about.
   */
  error?: string;
}

export const resolveExpression = (
  expression: InputExpression,
  { escape = true }: { escape?: boolean } = {},
): Resolved => {
  try {
    const result = evaluate(expression, scopeFor(escape));

    return { output: typeof result === "string" ? result : String(result ?? "") };
  } catch (error) {
    return {
      output: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
