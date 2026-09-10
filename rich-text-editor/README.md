# Lexical chip playground

A standalone harness for the open review comments on the rich-text editor epic
(Input Types tech doc). It pins **Lexical 0.32.1** and **React 17.0.2** – the same
versions `prismatic/frontend` runs – so anything it demonstrates is true of the
real editor.

```bash
npm install
npm run dev       # http://localhost:5199
npm run verify    # the same findings, headless
npm run build     # typecheck + bundle
```

Nothing here imports from the Prismatic repos. It is standalone on purpose, so it
can be deleted without consequence.

---

## One value, five representations

The centrepiece. A single value flows through five panes, and the epic turns on
them agreeing:

```
  INPUT    1  INITIAL MARKUP     what the author wrote, or what the database holds
                    |
                    |  import
                    v
  VIEWS    2  WYSIWYG      3  RAW              4  PREVIEW
              chips as        the source          tokens replaced with
              pills,          string, EDITABLE    values, HTML painted
              tokens not
              resolved
                    |
                    |  serialize
                    v
  OUTPUT   5  SAVED VALUE        must equal 1, or the editor destroys data
```

Raw and Preview are easy to conflate and are not the same thing. **Raw is an
editing surface** – the same string, exposed for typing. **Preview is read-only
and resolved.**

Pane 5 carries the verdict, in three states:

| badge | meaning |
|---|---|
| **byte-identical to 1** | the value came back exactly as it went in |
| **same content, whitespace canonicalized** | only the indentation moved |
| **content changed from 1** | something real was lost – the bug the epic must catch |

Two states would collapse the middle row into the bottom one, and losing your
indentation is a very different event from losing your `<div>`.

### Whitespace, and who owns it

Lexical has no node for the newline between `</li>` and `<li>`, so the tree
cannot remember it. That does not mean the editor gets to flatten your file.

A ref holds the **shape** – the whitespace arrangement to present – seeded from
pane 1's exact text. It survives for as long as it still *means* the value the
tree holds:

```
shape is kept  <=>  collapseHtml(shape) === serialize(tree)
```

Load an indented value and the indentation is preserved end to end. Press
**format** and the new indentation becomes the stored value. Change the *content*
anywhere and the shape is no longer an honest description of the value, so it is
dropped and the panes show what actually survived – which is also how you see
what the editor discarded.

That one comparison is why there is no dirty flag and no apply button: there is
never a pending state to apply, because the pane's text is either still valid or
it isn't. Formatting implies applying.

---

## The questions it answers

### The editor

> *"I think this might cause problems with selection, keyboard nav… You need it to
> be a decorator node to inject arbitrary components into the Lexical output"*

The chip is a `DecoratorNode` carrying its own format bitmask, so the pill is a
real React component **and** bold reaches it.

The deciding detail is not the node type – it is **whether the node owns its
`exportDOM`**. A decorator that delegates to `super` loses the token entirely,
because `super` calls `createDOM` and gets the pill back instead of the token.
Two decorators, same base class, opposite outcomes.

`npm run verify` runs all three candidate designs over eleven cases:

| | A: bare decorator | B: TextNode, token mode | C: decorator + bitmask |
|---|---|---|---|
| round trips | 5/11 | 11/11 | 11/11 |
| bold reaches the chip | no | yes | node alone no; with the plugin yes |
| chip can hold a caret | no, throws | yes | no, throws |
| pill can host React | yes | no, plain DOM | yes |

C is what ships here. Bold needs `DecoratorFormatPlugin` – about 50 lines that
intercept `FORMAT_TEXT_COMMAND`, set the bitmask on selected chips by hand, and
return `false` so Lexical still formats the surrounding text. That is a second
formatting implementation living beside Lexical's, and it has to be kept in sync
forever. It is the real cost of the decision.

The caret limitation has no fix. A decorator cannot be a `RangeSelection`
endpoint; that is a Lexical invariant, not something to patch around. The
Selection detail pane makes it observable rather than theoretical.

### Supporting `<div>`

> *"We can't support div? That seems strange."*

We can. `src/nodes/DivNode.ts` is the whole answer, at about 70 lines. Nothing in
Lexical forbids a div – an element with no registered node is simply dropped to a
paragraph on import. The node also keeps `class`, `style`, `id`, `align`,
`bgcolor` and `width`, which is the attribute question made concrete: attributes
are lost because each node decides to lose them, not because Lexical takes them.

### The preview

> *"I kind of wonder if our preview needs to render these in an isolated shadow
> DOM that doesn't inherit any styles from the main page"*

There are **two** leaks and they are different problems. **In**: the app's CSS
styles the email, so the preview lies about what the recipient sees. **Out**: the
email's own `<style>` block escapes and restyles the builder UI.

| Mode | Leak in | Leak out |
|---|---|---|
| inline div | open | open |
| shadow DOM | selectors blocked, **inherited properties still cross** | closed |
| shadow + `all: initial` | closed | closed |
| sandboxed iframe | closed | closed, and gets its own document |

The app's stylesheet is always live in that panel. Verified while building this:
with inline mode selected, the
sample email's `body, p { background: #fffbe6 }` repaints the entire playground
page.

### The allowlist, and three places the tech doc is wrong about it

The doc's rule is that **the node registry IS the allowlist** – an element with
no node is dropped on import, rather than removed by a separate sanitizing pass.
`editorNodes.ts` is that registry. The **email** fixture puts every entry in one
value and round-trips it byte-for-byte.

| element | backing node | note |
|---|---|---|
| `p` | ParagraphNode | |
| `h1`–`h6` | HeadingNode | all six; the toolbar offers three |
| `ul` `ol` `li` | ListNode, ListItemNode | |
| `blockquote` | QuoteNode | |
| `pre` `code` | CodeNode, CodeHighlightNode | |
| `a` | LinkNode, AutoLinkNode | |
| `strong` `em` `u` `s` `code` | TextNode format flags | |
| `br` | LineBreakNode | |
| `hr` | HorizontalRuleNode | |
| `img` | `ImageNode` | any string source, URL or data URI |
| `div` `span` `section` `figure` … | `HtmlElementNode` | carries attributes |
| `table` `tr` `td` `th` `thead` `tbody` | `HtmlElementNode` | **not Lexical's TableNode – see below** |
| `style` block | `RawHtmlNode` | kept verbatim, never rendered into the page |
| conditional comment | `RawHtmlNode` | Outlook-targeted email needs them |
| `script` | none | the one deliberate removal |

Attributes kept on every element: `class`, `style`, `id`, `align`, `valign`,
`bgcolor`, `background`, `width`, `height`, `colspan`, `rowspan`, `border`,
`cellpadding`, `cellspacing`, `dir`, `lang`, `title` – in the order the author
wrote them, not the order the allowlist lists them.

**1 · Lexical's `TableNode` cannot back an email table.** The doc names
TableNode / TableRowNode / TableCellNode. `$convertTableCellNodeElement` reads
exactly `style.width`, `colSpan`, `rowSpan`, `style.backgroundColor` and
`style.verticalAlign`, so `<td align="center" bgcolor="#f4f4f4">` arrives with
both attributes already gone – the doc's own "must survive" list. Tables use the
generic attribute-carrying node instead.

**2 · A `style` block is unreachable through `importDOM`.** `@lexical/html`
hardcodes `IGNORE_TAGS = new Set(['STYLE', 'SCRIPT'])` and returns before
looking up a conversion, so registering a node for `style` does nothing. It has
to be rewritten into a different element before import. The same line is why
`script` is dropped for free – the one deliberate removal needs no code.

**3 · Three things vanish before Lexical is even involved**, all inside
`DOMParser`, all handled in the pre-pass in `dialects.ts`:

- a leading `<style>`, and any comment before the first real content, are routed
  into `<head>`, and `$generateNodesFromDOM` only walks `<body>`
- `<tbody>` is **inserted** around loose rows. The DOM cannot say whether the
  author wrote it, so the source string is asked instead
- comments are not elements, so the importer never dispatches on them

### Two input types, one pipeline

A switch at the top of the panel flips the whole thing between **HTML** and
**Markdown** – the two input types the epic adds. Everything downstream follows:
the fixtures, what the editor imports, what gets saved, and what the preview
renders. `src/dialects.ts` holds both behind one interface, so the panel has no
idea which is running.

| | HTML | Markdown |
|---|---|---|
| load | `$generateNodesFromDOM` | `$convertFromMarkdownString` |
| save | our `serialize.ts` | `$convertToMarkdownString` |
| canonical | whitespace collapsed | round-tripped through a detached editor |
| format button | yes | **no** – the serializer already emits one spelling |

**The same bug appeared in the second format, for the same reason.** Markdown
export reads emphasis off TextNodes, and a chip is a decorator, so it was never
asked:

| input | before | after |
|---|---|---|
| `**plain bold text**` | `**plain bold text**` | unchanged |
| `**{{$sf...}}**` | `{{$sf...}}` – **bold gone** | `**{{$sf...}}**` |
| `*{{#GREETING}}* and *italic words*` | `{{#GREETING}} and *italic words*` | unchanged |
| `~~{{#GREETING}}~~` | `{{#GREETING}}` | unchanged |

Plain text beside the chip kept its markers, which is exactly what made the loss
easy to miss. The fix is the one `exportDOM` already applies on the HTML side –
**the node owns its export** – as a `TextMatchTransformer` in
`markdownTransformers.ts` that writes the markers from the chip's own bitmask.
That is the third time this playground has landed on the same rule.

**Markdown has no underline.** A chip or a run carrying `IS_UNDERLINE` exports
unmarked. That one cannot be fixed, only reported, so the U button is left
enabled and the panel says so.

**The author's spelling survives.** `Title\n=====`, `_em_` and `* bullet` are
none of them what Lexical emits, and all three come back untouched – the shape
rule that protects HTML indentation protects markdown spelling too, because
"canonical" is just another method on the dialect.

---

### Escaping: what the database does, and where the fix belongs

**The database does nothing to HTML.** Verified two ways — by running the real dumper, and by
reading every layer:

| layer | escaping? |
|---|---|
| YAML dump/load · `prismatic/backend/utils/yaml.py:4-31` | none. Double-quoted style escapes `\` and `"`, never `& < >` |
| import → DB · `prismatic/backend/models/integration/versions/importer.py:553-570` | none. `json.dumps` only for `complex` |
| DB column · `prismatic/backend/models/integration/__init__.py:1292` | plain `JSONField` |
| export → YAML · `prismatic/backend/models/integration/versions/exporter.py:222-235` | none |
| GraphQL · `prismatic/backend/api/expression.py:100,123` | none. Bare `graphene.String`, direct assignment |
| runner · `lambda/src/runner/inputs.ts:154` | none, before or after `evaluate()` |
| glimmer 0.2.3 `evaluateTemplate` | none. Raw `split`/`join` |

Every case round-trips byte-for-byte: a bare `&`, an existing `&amp;`, `<b>`, `&lt;script&gt;`,
quotes, unicode, backslashes, and tokens themselves.

> **Paths note.** `Desktop/Prismatic/backend` is a **2023 checkout**. The live backend is
> `prismatic/backend`, and the citations above point there.

**So nothing needs escaping on the way into the database.** It is not an HTML context; it holds a
string. Escaping is a render-time concern, and escaping on save would be a bug — it would
double-escape on the next open, which is a constraint the doc already names.

**Option A is built but switched off, and its control is hidden.** `escapeTokenValue` and
`verify-escaping.mjs` are complete and passing, but the preview runs unescaped, because the rule
cannot be carried out on the current platform path — see below. Showing a working toggle implied a
capability that does not exist. One constant in `harness/App.tsx` turns it back on when there is a
decision to demonstrate.

The rule it implements, for when that happens:
`escapeTokenValue` in `src/editor/tokens/escape.ts`:

| token | declared type | treatment |
|---|---|---|
| reference | none, by definition | escape — nothing declares what it points to, so it is data |
| config var | `CODE` + `codeLanguage: HTML` | **pass through** — `<em>The Acme team</em>` renders italic |
| config var | anything else, incl. `CODE`/`JSON` | escape |

Those field names are the platform's, not invented for this: `RequiredConfigVariableDataType` has
`CODE` among its values and `RequiredConfigVariableCodeLanguage` is `HTML | JSON | XML`, both in
`graphql-global-types.ts`. **That declaration is the entire basis for the exemption** — a config
variable can say at design time that its value is markup, and a reference has no such field to
read. It is also why the exemption is narrow: a `CODE` variable holding JSON is not HTML and gets
escaped like anything else.

The token table prints the declared type under each config variable, which is what the rule would
key on.

**Only substituted values are escaped. The author's own markup never is.** That distinction is the
whole of Option A, and it is what makes the **escaping on / off** toggle beside pane 4 safe to flip
while the preview keeps rendering. The toggle exists because the doc still lists this as open —
this is the one place A and F can be compared rather than argued about.

Position is not solved, and the doc says the same: inside a `<pre>` the author wants literal text,
in the heading above it they want it rendered. Substitution works on a string and has no idea where
in the document it is.

### The value is an envelope, and its `type` decides everything

An input is not stored as a string. It is stored as `{ type, value, meta? }`, and glimmer branches
on that `type` before anything else:

| `type` | `value` holds | at run time |
|---|---|---|
| `value` | a literal string | **returned verbatim — braces inside are inert** |
| `template` | text with `{{$…}}` / `{{#…}}` inline | each tag spliced |
| `reference` | a bare dotted path, no braces | path lookup; second segment must be one of seven words or it **throws** |
| `configVar` | a bare key, no braces | one literal key lookup; no drilling as of 0.2.3 |
| `complex` | a list | **throws** in glimmer by design |

**A code input is created as `type: "value"`** (`getInputExpression.ts:19`), and nothing infers
otherwise from its content. So an editor that writes tokens without also setting the type produces
markup that looks correct in every preview built from the stored string and fails on the first real
run.

**Decided: the new editor always writes `template`, and does not offer the choice.** An editor whose
whole affordance is inserting references cannot be allowed to write the one type that makes them
inert. Pane 5 shows the envelope so the type is visible, but there is no switch — it is not a
decision the author should be making.

Two things that follow, and both need saying in the doc:

- **This must not be extended to `code` generally.** `handlebars` and `liquid` are code languages
  whose block syntax starts with `{{#`, the same prefix glimmer uses for config variables. Verified
  against the real package: `{{#if user}}hi{{/if}}` as a template **throws**, and the runner
  swallows that to `undefined` — the whole input silently vanishes. Only `html` and `markdown` are
  safe to default this way; `json` is already excluded by EWB.
- **`template` contributes step dependencies and `value` does not** (`versions/utils.py:251-256`).
  Converting an existing input can therefore reorder a flow, or surface a cycle that was invisible
  while the edge did not exist. A one-word type change is not purely cosmetic.

The two builders also disagree about when `template` is even offered. EWB gates by language —
`doesCodeLanguageSupportTemplates = (language) => language !== "json"`, a **denylist**, so html and
markdown become template-capable silently. The Designer applies **no language gate at all**.

### glimmer is ported, not approximated

`src/editor/tokens/glimmer.ts` is transcribed from the published 0.2.3 `dist`. The package resolves
from a **private GitLab registry needing a token**, and this prototype is public and built by
Netlify without one, so depending on it would break the deploy.

`verify-glimmer.mjs` runs the port and the real package over the same 19 cases whenever the real
one is resolvable locally, comparing return values **and throw messages**, and reports the
comparison as skipped rather than passing when it is not. Currently **19/19**.

Escaping is applied to the **scope, before the call** — `configVars` and `results` are escaped and
then handed to the real `evaluate()`. That is the shape the tech doc gives Option A, and it means
the preview runs the real substitution rather than a version of it that happens to escape.

### The escaping rule cannot be implemented on the current path

`escapeTokenValue` exempts a config variable declared `dataType: CODE, codeLanguage: HTML`. **Neither
field survives to substitution.** `runner/configVariables.ts:69-74` collapses every
non-connection, non-schedule variable to its bare value and discards `data_type`; `codeLanguage` is
dropped earlier still and has **zero occurrences** anywhere in the runner. A CODE/HTML variable and
a STRING one are byte-identical by the time glimmer sees them.

So the doc's "configuration variables are already handled, they resolve by declared type at deploy"
holds for connection, credential, schedule and the JSON trio, and is **false for every scalar
type**. Adopting Option A means carrying the declared type through to substitution, or moving the
decision to a hop that still has it.

Worth knowing before designing around it: **no config variable with `codeLanguage: html` exists** in
any fixture, test, example or shipped integration across the four repos.

### There are three substitution sites, not one

None of them escapes anything today, and they are independent reimplementations that can drift:

| # | path | file | calls glimmer? |
|---|---|---|---|
| 1 | execution | `lambda/src/runner/inputs.ts:154` | yes |
| 2 | EWB builder preview | `useInputExpressionPreview.ts:150` | **no** — its own TS reimplementation |
| 3 | reference selection | `actionPerform/resolveReference.ts:59` | yes, **client-side, and the result is persisted** |

The third is the surprising one. It resolves references in the browser and **writes the resolved
string back into the input before the mutation**, so third-party payload bytes become
indistinguishable from author-typed text in the saved definition. That makes it a storage-path
concern, not just a rendering one.

Worth correcting in the discovery doc
(`jethflow-null/planning/new-input-types-rich-text/docs/discovery/2026-07-17-across-the-stack.md`):
it lists the runner as out-of-repo. **The runner is in this workspace**; only glimmer's source is
external (compiled `dist/` only, from a GitLab project). A wrapper around `evaluate()` at
`inputs.ts:154` would therefore need no glimmer release at all.

### Two unsanitized render surfaces already ship

Not this epic's problem, but they are the existing precedent for how HTML gets rendered:

- `ui/Markdown/MarkdownText.tsx:71-83` — when `isLikelyHtml(children)` it **bypasses react-markdown
  entirely** and uses `dangerouslySetInnerHTML`. The `ALLOWED_ELEMENTS` allowlist applies only to
  the *other* branch. The gate is one regex, `/<[^>]+>/`.
- The two config-page HTML elements do the same, and `ConfigPageHTMLElement/utils.ts` has an
  accidental asymmetric entity round-trip: typing `Procter & Gamble` comes back as
  `Procter &amp; Gamble` in the form field on the next parse.

## What mirrors the app, and what is only proposed

This harness is evidence for a tech doc, so it matters which parts describe the
editor that exists and which are arguments for one that does not. Anything
invented here and left unlabelled would be a fabricated premise.

| file | status |
|---|---|
| `FormatDecoratorNode.tsx` | **extends what ships.** `ReferenceNode` is already a `DecoratorNode` with an empty-span `createDOM` and no `exportDOM`. The format bitmask and the real `exportDOM` are the proposal |
| `ChipPill.tsx`, `ChipPanel.tsx` | **mirrors the app.** `ReferenceNode` renders `@/ui/Chip/Chip` in a `Popover` and opens the panel by calling the `useDesignerReferencePanelActions` context hook from its own onClick |
| `chipLabel.ts` | **mirrors the app.** Same `previewSplitEnd` / `previewSplitMiddle` shortening from `@/utils/valuePreviews` |
| `dialects.ts` (markdown half) | **mirrors the app.** `MarkdownEditor.tsx` loads with `$convertFromMarkdownString` and saves with `$convertToMarkdownString`, over stock `TRANSFORMERS` |
| `markdownTransformers.ts` | **proposed.** The app's `PLAYGROUND_TRANSFORMERS` is `[...TRANSFORMERS]` with nothing added – its Markdown editor has no chips at all |
| `TokenizePlugin.tsx` | **mirrors the app.** Plays the role of `Template/transformers.ts` `convertStringToNodes` |
| `serialize.ts` | **proposed, but with precedent.** The app already hand-writes `convertNodesToString` rather than using Lexical's export – for template strings. An HTML serializer does not exist |
| `ImplicitParagraphNode.ts` | **proposed.** The app has no equivalent because its Template editor never allows a second block |
| `DivNode.ts` | **proposed.** No div node exists today; this is the answer to "we can't support div?" |
| `DecoratorFormatPlugin.tsx` | **proposed.** The Template editor has no text formatting at all |
| `formatHtml.ts` | **proposed.** Nothing in the stack formats HTML; the app's Format button drives Biome, registered for `typescript` and `javascript` only |
| `tokens/resolve.ts` | **stand-in** for glimmer, with fake test-run data |
| `tokens/escape.ts` | **proposed.** No HTML escaper exists anywhere in the platform — the only entity function is a module-private `escapeXml` in the AI copilot |

### Which toolbar buttons the raw view gets, and why not all of them

There is no node to insert in the raw pane – it holds text, and a chip there is
literally `{{$sf.results.company.name}}`. So the question is not "can decorators
go in raw" but "which buttons should type something for you there".

A badge in the toolbar shows which surface a button will act on: whichever was
touched last, not whichever has focus right now, because clicking a button blurs
the textarea before the click lands.

| buttons | in raw | why |
|---|---|---|
| `+ sf`, `+ #GREETING`, … | **live** – insert the token at the caret | nobody memorizes `{{$sf.results.company.name}}`; this is discovery, not convenience |
| B / I / U / S, headings, lists, quote, br, select all | **disabled** | someone hand-writing HTML types `<b>` faster than they find a button, and a block button would have to guess whether it means the selection or the line |

Leaving the formatting buttons live would also format a selection in a pane the
author is not looking at, which is worse than not offering them.

**The app draws the same line.** Its Monaco code editor has no bold button, but
`useStepCompletions` feeds it `stepResults` and `configVars` completions, so
references and config variables are discoverable in the source surface and
formatting is not. Completions are the better shape for this and are what the
real editor should use; the toolbar buttons here are the playground's stand-in.

### The stored value never gains a block tag it did not arrive with

Lexical's root refuses inline children outright:

```
rootNode.splice: Only element or decorator nodes can be inserted to the root node
```

So importing `<b>Hi</b> there` has to wrap it in a block. The wrapper must not
reach the saved value. **A stored value is a fragment** – it has no idea what it
will be interpolated into, and a `<p>` it never had breaks it:

- `<p>` nested inside a `<p>` is auto-closed by the parser, splitting the
  surrounding block in half
- `<p>` inside a `<span>` or an `<a>` is invalid nesting
- `<p>` in an email carries default margins nobody asked for

`ImplicitParagraphNode` marks the wrappers the importer creates, and
`serialize.ts` emits their children with no tag of its own.

**The mark goes on the invented block, not the authored one.** Pressing Enter in
the editor creates a plain `ParagraphNode`, and that one is a real authored block
that should export as `<p>`. Marking the other direction would silently eat every
paragraph a writer added while editing. Verified both ways:

The **root inline** and **wrapped in p** fixtures sit next to each other in the
picker for exactly this reason: same content twice, differing only in whether the
author wrapped it, both byte-identical on the way back out.

| input | saved |
|---|---|
| `<b>Hi</b> {{$sf...}}, welcome back.` | unchanged – no wrapper added |
| `<p><b>Hi</b> {{$sf...}}, welcome back.</p>` | unchanged – authored tag kept |
| `<p>Hi there</p>` | `<p>Hi there</p>` |
| `<p>One</p><p>Two</p>` | unchanged |
| `<h1>Title</h1>tail text` | unchanged – one authored block, one bare run |
| `Hello {{#GREETING}}` | unchanged |

**The app sidesteps the question rather than solving it.** Its Template editor
never allows a second block: `UseLineBreakInsteadOfParagraphPlugin` intercepts
`KEY_ENTER_COMMAND` and dispatches `INSERT_LINE_BREAK_COMMAND`, so a template is
one paragraph plus `<br>`s. An HTML editor that wants real paragraphs cannot make
that trade, which is why it needs the marker instead.

---

## Layout

The split is the point: **`src/editor/` is everything the product would need, `src/harness/` is
everything that only exists to demonstrate it.** Nothing in `editor/` imports from `harness/`, and
`editor/index.ts` is its single public entry.

```
src/
  editor/                     the reusable core
    index.ts                  one public entry point
    dialects.ts               HTML and Markdown behind one interface
    serialize.ts              the stored value: tokens not pills, format tags not theme classes
    editorNodes.ts            the node registry, which IS the allowlist
    formatHtml.ts             indent and un-indent, structurally
    markdownTransformers.ts   markdown export for the chip, including its emphasis
    expression.ts             the stored envelope, and its YAML form
    tokens/
      glimmer.ts              a port of the real substitution engine
      resolve.ts              the token list and the evaluation scope
      escape.ts               Option A: escape a value by its declared type
    nodes/                    FormatDecorator, HtmlElement, Image, RawHtml, ImplicitParagraph
    plugins/                  DecoratorFormat, Tokenize, Toolbar
    chip/                     ChipPill, ChipPanel, chipLabel
  harness/                    the playground
    App.tsx                   the question index
    OneValue.tsx              the five panes, composed
    fixtures.ts               ten values, each making one claim checkable
    theme.ts                  editor-only class names
    useStoredValue.ts         the shape rule, in one place
    useRawPane.ts             caret parking and toolbar targeting
    PreviewIsolation.tsx      four isolation modes
    SelectionInspector.tsx    live anchor/focus/mode/format readout
  main.tsx  styles.css
```

### Four files worth reading first

**`editor/serialize.ts`** is the file the playground was missing for most of its life. Lexical's
`$generateHtmlFromNodes` cannot produce a stored value: it calls `createDOM`, so theme class names,
`white-space: pre-wrap`, a `<strong>` inside every `<b>`, and the pill's own markup all land in the
saved string. This walks the tree and emits only what belongs in a value, merging adjacent siblings
that share a bitmask so `<b>hi {{$ref}}</b>` comes back as one run.

**`editor/formatHtml.ts`** decides per gap whether whitespace may move, from the tags on either
side. Whitespace between block tags is free; between inline tags it is a word gap, and
`<b>bold</b> <i>ital</i>` becomes "boldital" if you strip it.

**`harness/useStoredValue.ts`** holds the one rule the whole panel turns on — a whitespace shape
survives while `dialect.canonical(shape) === dialect.save(tree)`. That single comparison is why
there is no dirty flag and no apply button.

**`harness/useRawPane.ts`** parks the caret rather than setting it, because React rewrites the
textarea's value on commit and Lexical takes focus during import. Setting it directly left the
caret at 0 every time.

## Headless checks

`npm run verify` runs five scripts. Each prints a table and exits non-zero on
failure.

| script | what it establishes |
|---|---|
| `verify-glimmer.mjs` | the port matches the real package, values and throws — 19 cases |
| `verify-escaping.mjs` | Option A, against the doc's own table — 10 cases |
| `verify-format.mjs` | the indenter is lossless and idempotent, over 11 whitespace cases |
| `verify-roundtrip.mjs` | the tech doc's stored-value table, run rather than asserted |
| `verify-variants.mjs` | why the chip is this node and not another |

`verify-variants.mjs` defines its own A, B and C classes inline rather than
importing from `src/`. That is deliberate: A and B no longer exist in the app, and
this script is the surviving record of why.

## Known rough edges

- **After editing a node file, hard-refresh the page.** Hot module replacement can
  leave a stale editor that looks fine but will not accept typing. A refresh always
  fixes it; nothing is wrong with the editor itself.
- **Whitespace touching an `<img>` is dropped on import.** Lexical's
  `isInlineDomNode` regex lists the inline tags it knows and `img` is not among
  them, so a space between an image and a link is not seen as sitting between two
  inline nodes and gets trimmed. Verified: the same space between `<b>` and `<i>`
  survives. Fixing it means patching Lexical's importer.
- **Formatting puts whitespace between `<td>` elements.** Browsers drop it during
  table parsing, but Outlook's Word-based renderer is not a compliant HTML parser
  and this is a known source of phantom gaps in email. Untested here. Pulling the
  table tags out of the formatter's `BLOCK` set is the mitigation if it bites.
