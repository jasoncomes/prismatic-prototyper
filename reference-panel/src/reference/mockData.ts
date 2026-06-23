import type {
  NamingScheme,
  PayloadDoc,
  PayloadNode,
  RunOption,
  SourceDef,
  SourceKind,
  StepOption,
  VariantMeta,
} from "./types"

export const STEPS: StepOption[] = [
  {
    slug: "trigger",
    name: "Webhook Trigger",
    component: "Webhook",
    action: "Receive Request",
  },
  {
    slug: "get-records",
    name: "Get Records",
    component: "HTTP",
    action: "GET Request",
  },
  {
    slug: "map-records",
    name: "Map Records",
    component: "Code",
    action: "Run Code",
  },
  {
    slug: "create-contact",
    name: "Create Contact",
    component: "Salesforce",
    action: "Create Record",
  },
]

const EXECUTION_RUNS: RunOption[] = [
  { id: "run-1", label: "Jun 21, 2:14 PM", status: "success" },
  { id: "run-2", label: "Jun 21, 1:02 PM", status: "success" },
  { id: "run-3", label: "Jun 20, 4:48 PM", status: "error" },
]

const INLINE_RESULTS: RunOption[] = [
  { id: "inline-1", label: "Action result · just now", status: "success" },
  { id: "inline-2", label: "Action result · 3:40 PM", status: "success" },
]

const node = (
  key: string,
  path: string,
  type: PayloadNode["type"],
  value?: string,
  children?: PayloadNode[]
): PayloadNode => ({ key, path, type, value, children })

const recordBody = (flavor: "real" | "schema" | "example"): PayloadNode[] => {
  const id =
    flavor === "schema" ? "<string>" : flavor === "example" ? "abc-123" : "rec_8842"
  const name =
    flavor === "schema"
      ? "<string>"
      : flavor === "example"
        ? "Mickey Mouse"
        : "Ada Lovelace"
  const email =
    flavor === "schema"
      ? "<string>"
      : flavor === "example"
        ? "mickey@example.com"
        : "ada@analytical.dev"
  const score = flavor === "schema" ? "<number>" : "87"
  const created =
    flavor === "schema" ? "2026-01-01" : "2026-06-21T14:14:09Z"

  return [
    node("results", "results", "object", undefined, [
      node("records", "results.records", "array", undefined, [
        node("0", "results.records[0]", "object", undefined, [
          node("id", "results.records[0].id", "string", id),
          node("name", "results.records[0].name", "string", name),
          node("email", "results.records[0].email", "string", email),
          node(
            "leadScore",
            "results.records[0].leadScore",
            "number",
            score
          ),
          node(
            "createdAt",
            "results.records[0].createdAt",
            "date",
            created
          ),
          ...(flavor === "real"
            ? [
                node(
                  "custom_region__c",
                  "results.records[0].custom_region__c",
                  "string",
                  "EMEA"
                ),
              ]
            : []),
        ]),
      ]),
      node("count", "results.count", "number", flavor === "schema" ? "<number>" : "1"),
    ]),
  ]
}

const properties = (flavor: "real" | "schema" | "example"): PayloadNode[] => [
  node(
    "statusCode",
    "statusCode",
    "number",
    flavor === "schema" ? "<number>" : "200"
  ),
  node("headers", "headers", "object", undefined, [
    node(
      "contentType",
      "headers.contentType",
      "string",
      "application/json"
    ),
    node(
      "requestId",
      "headers.requestId",
      "string",
      flavor === "schema" ? "<string>" : "req_55f0"
    ),
  ]),
]

export const PAYLOAD_BY_SOURCE: Record<SourceKind, PayloadDoc> = {
  test: { properties: properties("real"), body: recordBody("real") },
  live: { properties: properties("real"), body: recordBody("real") },
  inline: { properties: properties("real"), body: recordBody("real") },
  schema: { properties: properties("schema"), body: recordBody("schema") },
  example: { properties: properties("example"), body: recordBody("example") },
  sample: { properties: properties("example"), body: recordBody("example") },
}

export interface Availability {
  test: boolean
  inline: boolean
  schema: boolean
  example: boolean
}

const DISABLED_REASON: Record<SourceKind, string> = {
  test: "No test run for this step yet — run a test to capture data",
  inline: "This step hasn't run the action inline yet",
  schema: "The component author didn't define an output schema",
  example: "The component author didn't provide an example payload",
  live: "No data captured for this connection yet",
  sample: "No output schema or example payload defined for this step",
}

type Naming = { label: string; shortLabel: string }

export const SOURCE_LABELS: Record<
  NamingScheme,
  Record<SourceKind, Naming>
> = {
  descriptive: {
    test: { label: "Execution Results", shortLabel: "Test Runs" },
    inline: { label: "Inline Action Response", shortLabel: "Inline" },
    schema: { label: "Output Schema", shortLabel: "Schema" },
    example: { label: "Example Payload", shortLabel: "Example" },
    live: { label: "Live Data", shortLabel: "Live Data" },
    sample: { label: "Example", shortLabel: "Example" },
  },
  friendly: {
    test: { label: "Real Data", shortLabel: "Real Data" },
    inline: { label: "Test Data", shortLabel: "Test Data" },
    schema: { label: "Output Schema", shortLabel: "Schema" },
    example: { label: "Example Payload", shortLabel: "Example" },
    live: { label: "Live Data", shortLabel: "Live Data" },
    sample: { label: "Example", shortLabel: "Example" },
  },
}

export const buildPeerSources = (
  a: Availability,
  naming: NamingScheme = "descriptive"
): SourceDef[] => {
  const L = SOURCE_LABELS[naming]
  return [
    {
      kind: "test",
      ...L.test,
      available: a.test,
      reason: DISABLED_REASON.test,
      runnable: true,
      runVerb: "Run new test execution",
      runs: EXECUTION_RUNS,
    },
    {
      kind: "inline",
      ...L.inline,
      available: a.inline,
      reason: DISABLED_REASON.inline,
      runnable: true,
      runVerb: "Run new action",
      runs: INLINE_RESULTS,
    },
    {
      kind: "schema",
      ...L.schema,
      available: a.schema,
      reason: DISABLED_REASON.schema,
      runnable: false,
    },
    {
      kind: "example",
      ...L.example,
      available: a.example,
      reason: DISABLED_REASON.example,
      runnable: false,
    },
  ]
}

export const buildTieredSources = (
  a: Availability,
  naming: NamingScheme = "descriptive"
): SourceDef[] => {
  const L = SOURCE_LABELS[naming]
  return [
    {
      kind: "live",
      ...L.live,
      available: a.test || a.inline,
      reason: DISABLED_REASON.live,
      runnable: true,
      runVerb: "Run new test execution",
      groups: [
        { label: L.test.label, runs: EXECUTION_RUNS },
        { label: L.inline.label, runs: INLINE_RESULTS },
      ],
    },
    {
      kind: "schema",
      ...L.schema,
      available: a.schema,
      reason: DISABLED_REASON.schema,
      runnable: false,
    },
    {
      kind: "example",
      ...L.example,
      available: a.example,
      reason: DISABLED_REASON.example,
      runnable: false,
    },
  ]
}

export const buildSampleSources = (
  a: Availability,
  naming: NamingScheme = "descriptive"
): SourceDef[] => {
  const L = SOURCE_LABELS[naming]
  const [execution, inline] = buildPeerSources(a, naming)
  return [
    execution,
    inline,
    {
      kind: "sample",
      ...L.sample,
      available: a.schema || a.example,
      reason: DISABLED_REASON.sample,
      runnable: false,
    },
  ]
}

export const buildBucketsSources = (
  a: Availability,
  naming: NamingScheme = "descriptive"
): SourceDef[] => {
  const L = SOURCE_LABELS[naming]
  return [
    {
      kind: "live",
      label: "Real Data",
      shortLabel: "Real Data",
      available: a.test || a.inline,
      reason: "No real data captured for this step yet — run a test or action",
      runnable: true,
      runVerb: "Run new test execution",
      groups: [
        { label: L.test.label, runs: EXECUTION_RUNS },
        { label: L.inline.label, runs: INLINE_RESULTS },
      ],
    },
    {
      kind: "sample",
      label: "Example",
      shortLabel: "Example",
      available: a.schema || a.example,
      reason: DISABLED_REASON.sample,
      runnable: false,
    },
  ]
}

export const VARIANTS: VariantMeta[] = [
  {
    id: "segmented",
    rank: 1,
    name: "Segmented Up Top",
    blurb:
      "ToggleGroup under the step selector; run/result picker opens from the active source. Cleanest dependency reading.",
    subPlacement: "in-widget",
  },
  {
    id: "reflow",
    rank: 2,
    name: "Source Row, reflows right",
    blurb:
      "Toggle collapses to icons; the active source's sub-dropdown slides in to its right (literal story spec).",
    subPlacement: "reflow-right",
  },
  {
    id: "stacked",
    rank: 3,
    name: "Stacked Labeled Fields",
    blurb:
      "Source is a labeled field; the run/result selector is its own labeled field below. Most accessible.",
    subPlacement: "below",
  },
  {
    id: "tabs",
    rank: 4,
    name: "Underlined Tabs",
    blurb:
      "Sources as tabs over the tree; the sub-dropdown lives inside the active tab body.",
    subPlacement: "in-widget",
  },
  {
    id: "chips",
    rank: 5,
    name: "Chip Trio+1",
    blurb:
      "Interactive chips; the run/result picker nests into the runnable chip via a caret.",
    subPlacement: "nested",
  },
  {
    id: "disclosure",
    rank: 6,
    name: "Smart Default + Disclosure",
    blurb:
      "Auto-picks the best source; a status line + 'Change source' expands the full control.",
    subPlacement: "in-widget",
  },
  {
    id: "cards",
    rank: 7,
    name: "Card Radio Stack",
    blurb:
      "Vertical source rows with availability + run state inline; best for explaining disabled sources.",
    subPlacement: "nested",
  },
  {
    id: "pills",
    rank: 8,
    name: "Pill Tabs",
    blurb: "Lightweight rounded segmented variant; sub-dropdown opens from the active pill.",
    subPlacement: "in-widget",
  },
  {
    id: "dropdown",
    rank: 9,
    name: "Source Dropdown + dependent",
    blurb:
      "Two combos mirroring the step picker; consistent but hides the choices behind a click.",
    subPlacement: "below",
  },
  {
    id: "header",
    rank: 10,
    name: "Header Switch (icon-only)",
    blurb:
      "Source + sub-dropdown both in the panel header; max tree space, crowds the header.",
    subPlacement: "header",
  },
  {
    id: "mergedPill",
    rank: 11,
    name: "Merged Source + Run Pill",
    blurb:
      "One continuous control: source dropdown joined to the run/result picker as a single pill.",
    subPlacement: "in-widget",
  },
  {
    id: "accordionSrc",
    rank: 12,
    name: "Accordion Sources",
    blurb:
      "Each source is an accordion row; expanding the active one reveals its runs inline.",
    subPlacement: "nested",
  },
  {
    id: "segmentedBadges",
    rank: 13,
    name: "Segmented + Status Badges",
    blurb:
      "Segmented control where each source carries a status dot / availability badge.",
    subPlacement: "in-widget",
  },
  {
    id: "toolbar",
    rank: 14,
    name: "Icon Toolbar + Readout",
    blurb:
      "Compact icon toolbar of sources with a current-source readout label, run picker to the right.",
    subPlacement: "reflow-right",
  },
  {
    id: "radios",
    rank: 15,
    name: "Inline Radio Group",
    blurb:
      "Lightweight horizontal radios — minimal chrome alternative to the card stack.",
    subPlacement: "below",
  },
  {
    id: "vtabs",
    rank: 16,
    name: "Vertical Tabs (left)",
    blurb:
      "Sources as a left vertical tab rail; the active source's content + run picker sit on the right.",
    subPlacement: "in-widget",
  },
  {
    id: "popoverPicker",
    rank: 17,
    name: "Consolidated Picker",
    blurb:
      "A single 'Source ▾' control; each runnable source cascades to its runs in one menu.",
    subPlacement: "in-widget",
  },
  {
    id: "breadcrumb",
    rank: 18,
    name: "Dependency Breadcrumb",
    blurb:
      "Source ▸ Run shown as a breadcrumb of dropdowns, making the dependency chain explicit.",
    subPlacement: "in-widget",
  },
  {
    id: "easyPath",
    rank: 19,
    name: "Easy Path (disclosure)",
    blurb:
      "Opens to fields with a quiet provenance line; 'Change' reveals the source control. Recommended default.",
    subPlacement: "in-widget",
  },
  {
    id: "zeroChoice",
    rank: 20,
    name: "Zero-choice",
    blurb:
      "No source control — just a provenance indicator. The minimal extreme (shown for comparison).",
    subPlacement: "in-widget",
  },
]
