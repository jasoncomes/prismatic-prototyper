export type SourceKind = "real" | "test" | "example"

export type Provenance = "real" | "test" | "example"

export type Presentation = "one" | "two" | "three" | "easy"

export type Variant =
  | "one-cascade"
  | "one-popover"
  | "one-pill"
  | "one-split"
  | "one-breadcrumb"
  | "two-seg-stacked"
  | "two-seg-subtabs"
  | "two-toggle"
  | "two-dropdown"
  | "three-segmented"
  | "easy-dot"
  | "easy-banner"
  | "easy-chip"

export type RunStatus = "success" | "error" | "running"

export interface RunOption {
  id: string
  label: string
  status: RunStatus
}

export interface SourceDef {
  kind: SourceKind
  label: string
  available: boolean
  reason?: string
  runs?: RunOption[]
}

export interface ActionInput {
  key: string
  label: string
  value: string
}

export type PayloadType =
  | "object"
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "date"

export interface PayloadNode {
  key: string
  path: string
  type: PayloadType
  value?: string
  children?: PayloadNode[]
}

export interface PayloadDoc {
  properties: PayloadNode[]
  body: PayloadNode[]
}

export interface StepOption {
  slug: string
  name: string
  component: string
  action: string
}

export interface Availability {
  real: boolean
  inline: boolean
  schema: boolean
  example: boolean
}
