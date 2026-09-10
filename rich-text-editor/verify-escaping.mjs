/**
 * Option A, checked against the table in the tech doc rather than against my
 * memory of it.
 *
 * The doc's own rows, area 5:
 *
 *   reference resolves to    escaped                        not escaped
 *   ----------------------------------------------------------------------
 *   John                     <h1>Hello John</h1>            identical
 *   Procter & Gamble         ...Procter &amp; Gamble        bare &, invalid
 *   <h2>Jack</h2>            tags visible as text           renders, nested
 *                                                           invalidly
 *
 * Plus the rules the table does not state. A configuration variable declared
 * `dataType: CODE, codeLanguage: HTML` passes through — those are real fields,
 * `RequiredConfigVariableDataType` and `RequiredConfigVariableCodeLanguage` —
 * and that declaration is the whole basis for the exemption. CODE/JSON is not
 * HTML and is escaped like anything else. The author's own markup is never
 * touched by any of this.
 *
 * Run:  node verify-escaping.mjs
 */
import { execFileSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";

/**
 * Compiled with the esbuild that ships inside Vite, rather than by stripping
 * types with a regex. The regex version broke on a multi-line signature, and a
 * test that cannot load the module it is testing is worse than no test.
 */
const TEMP = new URL("./.verify-escaping.tmp.mjs", import.meta.url);
writeFileSync(
  TEMP,
  execFileSync("./node_modules/.bin/esbuild", ["src/editor/tokens/escape.ts", "--format=esm"], {
    encoding: "utf8",
  }),
);
const { escapeTokenValue } = await import(TEMP.href);
unlinkSync(TEMP);

const CASES = [
  {
    name: "reference · plain text is unchanged either way",
    value: "John",
    opts: { kind: "reference" },
    expect: "John",
  },
  {
    name: "reference · a bare ampersand becomes an entity",
    value: "Procter & Gamble",
    opts: { kind: "reference" },
    expect: "Procter &amp; Gamble",
  },
  {
    name: "reference · markup shows as text, it is not trusted",
    value: "<h2>Jack</h2>",
    opts: { kind: "reference" },
    expect: "&lt;h2&gt;Jack&lt;/h2&gt;",
  },
  {
    name: "reference · a block element is no different",
    value: "<h3>Q3 performance</h3>",
    opts: { kind: "reference" },
    expect: "&lt;h3&gt;Q3 performance&lt;/h3&gt;",
  },
  {
    name: "config var · declared text is escaped",
    value: "Acme & Co",
    opts: { kind: "configVar", dataType: "STRING" },
    expect: "Acme &amp; Co",
  },
  {
    name: "config var · CODE/HTML passes through, the declaration says markup",
    value: "<em>The Acme team</em>",
    opts: { kind: "configVar", dataType: "CODE", codeLanguage: "HTML" },
    expect: "<em>The Acme team</em>",
  },
  {
    name: "config var · CODE/JSON is not HTML, so it is escaped",
    value: "<em>x</em>",
    opts: { kind: "configVar", dataType: "CODE", codeLanguage: "JSON" },
    expect: "&lt;em&gt;x&lt;/em&gt;",
  },
  {
    name: "config var · no declared type falls back to escaping",
    value: "<em>x</em>",
    opts: { kind: "configVar" },
    expect: "&lt;em&gt;x&lt;/em&gt;",
  },
  {
    name: "the ampersand is escaped first, so entities are not doubled",
    value: "a & b < c",
    opts: { kind: "reference" },
    expect: "a &amp; b &lt; c",
  },
  {
    name: "escaping twice is not idempotent — which is why it happens once",
    value: escapeTokenValue("Procter & Gamble", { kind: "reference" }),
    opts: { kind: "reference" },
    expect: "Procter &amp;amp; Gamble",
  },
];

let failed = 0;

for (const { name, value, opts, expect } of CASES) {
  const got = escapeTokenValue(value, opts);
  const ok = got === expect;
  if (!ok) failed += 1;

  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) {
    console.log(`        in       ${JSON.stringify(value)}`);
    console.log(`        got      ${JSON.stringify(got)}`);
    console.log(`        expected ${JSON.stringify(expect)}`);
  }
}

console.log(`\n${CASES.length - failed}/${CASES.length} pass`);
process.exit(failed === 0 ? 0 : 1);
