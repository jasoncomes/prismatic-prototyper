# Reference Picker — Decisions & Plan of Action

_Story 37101 · synthesized from the 6/24 standup + 6/25 grooming. For the Marcus sync and the Gina handoff doc (Gina back 6/29)._

## The decision

**The user does not choose a data source.** When you reference an upstream step, the picker **automatically selects the lowest-friction, highest-fidelity data available** and just shows where it came from. This was the convergence point for Brian, Marcus, and Keith — the source-*selector* designs we'd been ranking are now only "the change experience," explicitly called non-consequential for v1.

### Fidelity cascade (auto, in order)
1. **Existing execution test run** that includes the step — best; it's all real data across every step.
2. **Auto-invoked inline action** — *only if runnable*: component author marked it safe, inputs are sufficient, and the connection is present.
3. **Output schema** (then **example payload** as its fallback).
4. **Nothing** — a quiet empty state.

### Behavior rules
- **Invocation is automatic, at reference-picker open time** — not at step-config time. Caching at step-config time is pointless (eviction, may never be referenced). Fetch on open; drop on close; refetch on reopen (so reconfiguring the step yields fresh data).
- **You cannot manually run a step.** The inline action is auto-run only — there is no "Run step" button anywhere. (Running a full **test execution** from the panel stays, as a separate, existing capability.)
- **There is only ever ONE step result.** It never *auto-surfaces* when a test run exists (auto prefers the test run — out of sight, out of mind), but the **Change menu always offers it** (ordered Test Runs › Step › Example) when the step is runnable — so once you've changed away you can change back to it.
- **No input-configuration UI.** If the step is runnable, we run it; if not, we fall back. You don't configure inline-action inputs in this flow.
- **Silent fallback.** When the step can't be auto-run, we quietly drop down the cascade — no error state, no "fix it" UI, no Run button in the primary flow.
- **Prefer an existing test run** over invoking the step.
- **Output schema ≈ example** to the user. The user should not have to know the difference; treat them as one fallback tier. (Union/array schemas render first-item-only — a frontend picker limitation, not a Spectral one; ship as-is, document "use branches for unions.")
- **Provenance indicator** shows the source (test run / step result / example) with an optional **Change** — low-code/designer only; **EWB likely shows no Change at all.**
- **Properties grouped above payload body** (SC-37101) — already reflected in the panel; the spec is still underspecified, get Gina's prototype clarified.
- **Code blocks are never auto-run** (unknown side effects, full-execution context). Component team must ensure the code block action has no test perform / is marked not-safe.

### Prototype scope note (6/25)
The prototype now ships only **Auto (recommended)** + a **1-option "Change"** experience. The 2- and 3-option selector presentations were removed — they contradicted "step is auto-only, single result" (they exposed step run buttons / multiple results / step as a co-equal peer).

## Work chunks
- **Chunk 1 — ship first, independent:** the new reference-panel UI from the demo videos + Steven's output-schema spectral release. This is current behavior; it works once the spectral MR lands.
- **Chunk 2 — this work (the bulk):** the auto-select cascade + provenance indicator in the reference picker, for EWB **and** designer. This is what the prototype now demonstrates.
- **Chunk 3 — deferred:** an "output" tab on the step config (Marcus sees strong correlation; treat separately).

## Can do now (no blockers)
- Implement the **auto cascade** + provenance indicator in the reference picker (the prototype shows the target behavior end-to-end).
- Merge schema/example into a single fallback tier (already true in product).
- Wire the picker to **fetch on open / drop on close**.

## Needs decisions (carry to the conversations — not blocking the prototype)
- **Change-UI form factor** — which "Change" affordance, if any. Non-consequential for v1; pick later.
- **Does EWB allow Change at all?** (Leaning no.)
- **Structured / dynamic-object input serialization** — the inline-action mutation reused the inline-data-source `inputExpression` array, which never supported structured or dynamic objects. Now that we invoke step actions, those input types are broken over the API. **Gates auto-run for any step with those inputs.** (Steven is drafting the serialization fix.) Tactical out: the origami case only has 2 dropdown inputs, so it may not hit this.
- **Embedded / origami prismatic connection** — embedded users shouldn't supply prismatic creds to invoke a cross-integration action. Joel's lean: origami stands up their own API; their component talks to it with their connection; that API calls our API as the org; their component **signs a JWT with the signing key** (no prism access token needed). Origami meeting Mon/Tue.
- **Output-schema spectral release gating** — Steven's MR has been ready ~1.5 weeks; confirm it's clear to fully release (it's the Chunk-1 enabler).
- **Deprecate inline data sources in the designer** for everyone except the tactical origami case? Designer's inline-data-source implementation diverges from EWB (only the mutation is shared); narrowing scope avoids a fork.

### Grooming landmines (6/25) — engineering/backend, NOT prototype work
These don't change the prototype, but they gate the real implementation and several are silent-failure traps. Listed so they land in the eng channels / Monday.
- **`mode = example | live` + `examplePerform` + `performSafety` is a 4-repo chain, not "one flag."** spectral (declare) → Action model migration → runner (dispatch example vs live) → mutation (`mode` arg + validator). Most of it doesn't exist yet. *Decision: is "done tomorrow" the mutation arg, or the whole chain?* Decided contract: default `example`; `mode=example` with no `examplePerform` is a **validation error**, not a silent fallback; safety enum is a client hint, not a server gate; live-without-attestation defaults `NOT_ALLOWED`.
- **Glimmer reference serialization (real blocker).** Computing a `reference` input by reading the **rendered preview string** loses the string-vs-object distinction (glimmer strips outer quotes) → component silently gets the wrong input. Safe path: evaluate the **bare reference** and serialize against the target input's declared type (same problem `adaptConfigVarValue` already solves). *Decision before the spike hardens: raw evaluate vs. preview string.*
- **Inline path has no size guard / drops `contentType`.** `fetchActionContent` rides `invokeAction.ts`, not the `synchronousResponse` pipeline — no 5MB→S3 offload, no 500MB cap; a Buffer JSON-serializes to `{"type":"Buffer",…}` (corrupt) and MIME is dropped. *Decision: reuse the sync-response size/offload machinery, or declare large/binary "unsupported, run a test"? Today it neither — it corrupts silently.*
- **No subflow/cross-flow cycle guard.** Lineage is tracked but there's no "already on the stack → abort" check; recursion is bounded only by timeout. Relevant only if subflows/cross-integration ship.
- **Origami: authenticate as-org vs. per-customer.** Customer isolation is **application-layer**, not RLS (RLS scopes to org/tenant). "As org" bypasses customer conditions → an Origami filter bug is a cross-customer leak Prismatic can't catch. Prefer per-customer JWT claims (broker mints org+customer+email) so Prismatic enforces. Also: external JWTs don't enforce `exp`; keep the signing key server-side, not in component code.
- **Right-to-be-forgotten sweeps 3 of 8 S3 buckets** (payload / trigger-payload / trigger-response / org-key survive). Completeness-contract decision for Robbie/compliance, separate workstream.

## Conversations to have
- **Marcus** — change-UI form factor, EWB-allows-change, sign-off on the chunking; review this prototype.
- **Keith / Joel** — mutation + flags (`example perform` safety), and the fetch-on-open / drop-on-close / refetch behavior + LRU.
- **Steven** — the structured/dynamic-object serialization shape (what we stringify, how the platform parses it).
- **Origami (Mon/Tue)** — the connection approach above.
- **Gina handoff** — fold this doc into Marcus's "where we are / open items / next" doc.

## What the prototype demonstrates (this repo)
- **Auto (recommended)** is the default presentation: it auto-picks the highest-fidelity source and shows a provenance line.
- The **Availability (per step)** pills (Test run exists / Step is runnable / Output schema / Example payload) toggle live so you can watch the cascade fall back. With "Step is runnable" as the top available tier, the picker shows a brief "Fetching this step's data…" then the result — the auto-invoke on open.
- The **Audience** toggle compares **EWB (no change)** vs **Low-code / Designer (Change allowed)**.
- The step auto-runs to a **single result**, and only appears when there are **no test runs** (turn off "Test run exists" to see it; turn it back on and Step disappears from the Change menu).
- The **Change · 1 option** presentation is the secondary change experience, kept for review only.
