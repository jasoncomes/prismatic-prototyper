/**
 * The formatter is load-bearing: pressing Format writes its output to the
 * stored value. So it has to satisfy two properties, and neither is obvious.
 *
 *   LOSSLESS    collapseHtml(formatHtml(x)) === collapseHtml(x)
 *               Indenting changes no content. Whitespace between BLOCK tags is
 *               free to move; whitespace between INLINE tags is a word gap and
 *               is not.
 *
 *   IDEMPOTENT  formatHtml(collapseHtml(formatHtml(x))) === formatHtml(x)
 *               Pressing Format twice does what pressing it once did.
 *
 * Run:  node verify-format.mjs
 */
import { execFileSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";

/**
 * Compiled with the esbuild that ships inside Vite. Importing the real module
 * is the point: a copy of the source here would pass forever while the module
 * it claims to test drifted away from it.
 */
const TEMP = new URL("./.verify-format.tmp.mjs", import.meta.url);
writeFileSync(
  TEMP,
  execFileSync("./node_modules/.bin/esbuild", ["src/editor/formatHtml.ts", "--format=esm"], {
    encoding: "utf8",
  }),
);
const { formatHtml, collapseHtml } = await import(TEMP.href);
unlinkSync(TEMP);

const CASES = [
  ["pre – whitespace IS the content", "<pre>line one\n  indented two\n    three</pre>"],
  ["table cells", "<table><tr><td>A</td><td>B</td></tr></table>"],
  ["space after br", "<p>Thanks, <br> {{#SIGNATURE}}</p>"],
  ["space between two inlines", "<p><b>bold</b> <i>ital</i></p>"],
  ["padding inside a block", "<p> padded </p>"],
  ["non-breaking spaces", "<p>a&nbsp;&nbsp;b</p>"],
  ["inline only, no block at all", "<b>hello</b> world"],
  ["nested divs with attributes", '<div class="a"><div class="b"><p>x</p></div></div>'],
  ["already indented", "<ul>\n  <li>one</li>\n</ul>"],
  ["a chip inside a bold run", "<h1>Hi <b>{{$sf.results.company.name}}</b></h1>"],
  [
    "every block element at once",
    "<h2>Q</h2><ul><li>Owner is <b>{{$lead.results.owner}}</b></li><li>Two</li></ul>" +
      "<blockquote>{{#GREETING}}</blockquote><p>a<br>b</p>",
  ],
];

let failed = 0;

for (const [name, input] of CASES) {
  const formatted = formatHtml(input);
  const lossless = collapseHtml(formatted) === collapseHtml(input);
  const idempotent = formatHtml(collapseHtml(formatted)) === formatted;
  const ok = lossless && idempotent;

  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);

  if (!ok) {
    console.log(`        input      ${JSON.stringify(input)}`);
    console.log(`        formatted  ${JSON.stringify(formatted)}`);
    if (!lossless) {
      console.log(`        collapsed  ${JSON.stringify(collapseHtml(formatted))}`);
      console.log(`        expected   ${JSON.stringify(collapseHtml(input))}`);
    }
    if (!idempotent) console.log("        NOT IDEMPOTENT");
  }
}

console.log(`\n${CASES.length - failed}/${CASES.length} pass`);
process.exit(failed === 0 ? 0 : 1);
