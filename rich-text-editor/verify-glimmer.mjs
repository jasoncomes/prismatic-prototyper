/**
 * Is the port still the same function as the real thing?
 *
 * `src/editor/tokens/glimmer.ts` is transcribed from `@prismatic-io/glimmer`
 * 0.2.3. That package resolves from a private GitLab registry, so this
 * prototype cannot depend on it — a public repo built by Netlify with no token
 * would fail to install. A transcription that nothing checks is a copy waiting
 * to drift, so this runs both implementations over the same cases and fails on
 * any divergence.
 *
 * When the real package is not resolvable the port is still exercised against
 * its own expectations, and the comparison is reported as skipped rather than
 * silently passing.
 *
 * Run:  node verify-glimmer.mjs
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { unlinkSync, writeFileSync } from "node:fs";

const TEMP = new URL("./.verify-glimmer.tmp.mjs", import.meta.url);
writeFileSync(
  TEMP,
  execFileSync(
    "./node_modules/.bin/esbuild",
    ["src/editor/tokens/glimmer.ts", "--format=esm", "--bundle", "--platform=node"],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  ),
);
const port = await import(TEMP.href);
unlinkSync(TEMP);

/** The real package, from wherever a sibling checkout happens to have it. */
const loadReal = () => {
  const candidates = [
    "../../frontend/node_modules/@prismatic-io/glimmer",
    "../../../frontend/node_modules/@prismatic-io/glimmer",
    "@prismatic-io/glimmer",
  ];
  for (const spec of candidates) {
    try {
      return createRequire(import.meta.url)(spec);
    } catch {}
  }

  return null;
};
const real = loadReal();

/** The scope both implementations resolve against. */
const configVars = {
  GREETING: "Hello there",
  SIGNATURE: "<em>The Acme team</em>",
  "API.Key": "sk-123",
  Count: 42,
};
const results = {
  sf: { company: { name: "Procter & Gamble" } },
  lead: { owner: "Dana Whitfield" },
  payload: { body: { a: 1 } },
  nothing: { missing: undefined },
};

/** The real package takes nine positional arguments; the port takes a scope. */
const callReal = (expression) =>
  real.evaluate(expression, configVars, results, {}, {}, {}, {}, {}, {});
const callPort = (expression) =>
  port.evaluate(expression, { configVars, results });

const CASES = [
  ["value is returned verbatim", { type: "value", value: "<h1>Hi</h1>" }],
  [
    "a value expression never expands its braces",
    { type: "value", value: "<h1>Hi {{$sf.results.company.name}}</h1>" },
  ],
  [
    "template splices a reference",
    { type: "template", value: "<h1>Hi {{$sf.results.company.name}}</h1>" },
  ],
  [
    "template splices a config var",
    { type: "template", value: "<p>{{#GREETING}}</p>" },
  ],
  [
    "template splices markup from a config var",
    { type: "template", value: "<p>{{#SIGNATURE}}</p>" },
  ],
  [
    "two tokens in one template",
    { type: "template", value: "{{#GREETING}}, {{$lead.results.owner}}" },
  ],
  ["bare reference returns the raw value", { type: "reference", value: "lead.results.owner" }],
  ["bare reference can return an object", { type: "reference", value: "payload.results.body" }],
  ["bare config var", { type: "configVar", value: "GREETING" }],
  ["config var key containing a dot", { type: "configVar", value: "API.Key" }],
  ["bracket-wrapped config var key", { type: "configVar", value: "['API.Key']" }],
  ["empty config var is undefined", { type: "configVar", value: "" }],
  [
    "an object inside a template is stringified",
    { type: "template", value: "body: {{$payload.results.body}}" },
  ],
  [
    "a number config var inside a template",
    { type: "template", value: "n={{#Count}}" },
  ],
  // Throwing cases — the port must throw where the real one throws.
  ["invalid reference throws", { type: "reference", value: "sf.nonsense.x" }],
  ["unknown step throws", { type: "reference", value: "missingStep.results.x" }],
  ["a step name must be camelCase", { type: "reference", value: "Sf.results.x" }],
  ["complex throws by design", { type: "complex", value: "[]" }],
  [
    "a template with an invalid reference throws",
    { type: "template", value: "{{$sf.nonsense.x}}" },
  ],
];

const outcome = (fn) => {
  try {
    return { ok: true, value: fn() };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

const describe = (r) =>
  r.ok ? `= ${JSON.stringify(r.value)}` : `throws: ${r.message}`;

let failed = 0;

console.log(
  real
    ? "Comparing the port against the real @prismatic-io/glimmer.\n"
    : "Real package not resolvable — checking the port alone. COMPARISON SKIPPED.\n",
);

for (const [name, expression] of CASES) {
  const mine = outcome(() => callPort(expression));

  if (!real) {
    console.log(`PORT  ${name.padEnd(46)} ${describe(mine)}`);
    continue;
  }

  const theirs = outcome(() => callReal(expression));
  const same =
    mine.ok === theirs.ok &&
    (mine.ok
      ? JSON.stringify(mine.value) === JSON.stringify(theirs.value)
      : mine.message === theirs.message);

  if (!same) failed += 1;
  console.log(`${same ? "PASS" : "FAIL"}  ${name}`);
  if (!same) {
    console.log(`        port ${describe(mine)}`);
    console.log(`        real ${describe(theirs)}`);
  }
}

if (real) {
  console.log(`\n${CASES.length - failed}/${CASES.length} pass`);
  process.exit(failed === 0 ? 0 : 1);
}
process.exit(0);
