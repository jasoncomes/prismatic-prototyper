import type {
  Availability,
  PayloadDoc,
  PayloadNode,
  Presentation,
  RunOption,
  SourceDef,
  SourceKind,
  StepOption,
  Variant,
} from "./types"

export const VARIATIONS: Record<
  Presentation,
  { id: Variant; name: string }[]
> = {
  one: [
    { id: "one-cascade", name: "Cascading dropdown" },
    { id: "one-pill", name: "Readout pill" },
  ],
  easy: [
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

// The inline action is auto-run on open; there is only ever ONE step result,
// and it only surfaces when there are no execution (test-run) results.
export const STEP_RESULT: RunOption = {
  id: "step-result",
  label: "Step result · just now",
  status: "success",
}

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
  real: "No test runs have captured data for this step yet",
  test: "Run the step to fetch test data",
  example: "No output schema or example payload defined for this step",
}

const realSource = (a: Availability): SourceDef => ({
  kind: "real",
  label: "Test Runs",
  available: a.real,
  reason: REASON.real,
  runs: CAPTURED_RUNS,
})

const exampleSource = (a: Availability): SourceDef => ({
  kind: "example",
  label: "Example",
  available: a.schema || a.example,
  reason: REASON.example,
})

export const buildSources = (
  _presentation: Presentation,
  a: Availability
): SourceDef[] => [realSource(a), exampleSource(a)]

/* Auto-select the lowest-friction, highest-fidelity source.
   test run → step (auto-run) → output schema / example → nothing */
export const autoKind = (a: Availability): SourceKind | undefined =>
  a.real ? "real" : a.inline ? "test" : a.schema || a.example ? "example" : undefined
