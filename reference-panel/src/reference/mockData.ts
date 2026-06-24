import type {
  ActionInput,
  Availability,
  PayloadDoc,
  PayloadNode,
  Presentation,
  RunOption,
  SourceDef,
  StepOption,
  Variant,
} from "./types"

export const VARIATIONS: Record<
  Presentation,
  { id: Variant; name: string }[]
> = {
  one: [
    { id: "one-cascade", name: "Cascading dropdown" },
    { id: "one-popover", name: "Popover panel" },
    { id: "one-pill", name: "Readout pill" },
    { id: "one-split", name: "Split button" },
    { id: "one-breadcrumb", name: "Breadcrumb path" },
  ],
  two: [
    { id: "two-seg-stacked", name: "Segmented · stacked" },
    { id: "two-seg-subtabs", name: "Segmented · sub-tabs" },
    { id: "two-toggle", name: "Toggle switch" },
    { id: "two-dropdown", name: "Dropdown top" },
  ],
  three: [{ id: "three-segmented", name: "Segmented" }],
  easy: [
    { id: "easy-dot", name: "Dot + text" },
    { id: "easy-banner", name: "Banner" },
    { id: "easy-chip", name: "Chip" },
  ],
}

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
    slug: "create-contact",
    name: "Create Contact",
    component: "Salesforce",
    action: "Create Record",
  },
]

export const CAPTURED_RUNS: RunOption[] = [
  { id: "run-1", label: "Jun 21, 2:14 PM", status: "success" },
  { id: "run-2", label: "Jun 21, 1:02 PM", status: "success" },
  { id: "run-3", label: "Jun 20, 4:48 PM", status: "error" },
]

// Pre-existing fake inline action results (the action has been run before).
export const TEST_RESULTS: RunOption[] = [
  { id: "act-1", label: "Action result · 3:40 PM", status: "success" },
  { id: "act-2", label: "Action result · 11:02 AM", status: "success" },
]

// A fresh result produced by running the action now.
export const NEW_ACTION_RESULT: RunOption = {
  id: "act-new",
  label: "Action result · just now",
  status: "success",
}

export const ACTION_INPUTS: ActionInput[] = [
  { key: "recordId", label: "Record ID", value: "rec_8842" },
  { key: "limit", label: "Limit", value: "10" },
  { key: "includeArchived", label: "Include archived", value: "false" },
]

const node = (
  key: string,
  path: string,
  type: PayloadNode["type"],
  value?: string,
  children?: PayloadNode[]
): PayloadNode => ({ key, path, type, value, children })

type Flavor = "real" | "test" | "schema" | "example"

const recordBody = (flavor: Flavor): PayloadNode[] => {
  const id =
    flavor === "schema"
      ? "<string>"
      : flavor === "example"
        ? "abc-123"
        : flavor === "test"
          ? "rec_test_01"
          : "rec_8842"
  const name =
    flavor === "schema"
      ? "<string>"
      : flavor === "example"
        ? "Mickey Mouse"
        : flavor === "test"
          ? "Test Contact"
          : "Ada Lovelace"
  const email =
    flavor === "schema"
      ? "<string>"
      : flavor === "example"
        ? "mickey@example.com"
        : flavor === "test"
          ? "test@example.com"
          : "ada@analytical.dev"
  const score = flavor === "schema" ? "<number>" : flavor === "test" ? "0" : "87"
  const created = flavor === "schema" ? "2026-01-01" : "2026-06-21T14:14:09Z"

  return [
    node("results", "results", "object", undefined, [
      node("records", "results.records", "array", undefined, [
        node("0", "results.records[0]", "object", undefined, [
          node("id", "results.records[0].id", "string", id),
          node("name", "results.records[0].name", "string", name),
          node("email", "results.records[0].email", "string", email),
          node("leadScore", "results.records[0].leadScore", "number", score),
          node("createdAt", "results.records[0].createdAt", "date", created),
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
      node(
        "count",
        "results.count",
        "number",
        flavor === "schema" ? "<number>" : "1"
      ),
    ]),
  ]
}

const properties = (flavor: Flavor): PayloadNode[] => [
  node(
    "statusCode",
    "statusCode",
    "number",
    flavor === "schema" ? "<number>" : "200"
  ),
  node("headers", "headers", "object", undefined, [
    node("contentType", "headers.contentType", "string", "application/json"),
    node(
      "requestId",
      "headers.requestId",
      "string",
      flavor === "schema" ? "<string>" : "req_55f0"
    ),
  ]),
]

export const PAYLOAD: Record<Flavor, PayloadDoc> = {
  real: { properties: properties("real"), body: recordBody("real") },
  test: { properties: properties("test"), body: recordBody("test") },
  schema: { properties: properties("schema"), body: recordBody("schema") },
  example: { properties: properties("example"), body: recordBody("example") },
}

const REASON = {
  real: "No execution has captured data for this step yet",
  test: "Run the action to fetch test data",
  example: "No output schema or example payload defined for this step",
}

const realSource = (a: Availability): SourceDef => ({
  kind: "real",
  label: "Real data",
  available: a.real,
  reason: REASON.real,
  runs: CAPTURED_RUNS,
})

const testSource = (a: Availability): SourceDef => ({
  kind: "test",
  label: "Test data",
  available: a.inline,
  reason: REASON.test,
})

const exampleSource = (a: Availability): SourceDef => ({
  kind: "example",
  label: "Example",
  available: a.schema || a.example,
  reason: REASON.example,
})

export const buildSources = (
  presentation: Presentation,
  a: Availability
): SourceDef[] =>
  presentation === "three"
    ? [realSource(a), testSource(a), exampleSource(a)]
    : [realSource(a), exampleSource(a)]
