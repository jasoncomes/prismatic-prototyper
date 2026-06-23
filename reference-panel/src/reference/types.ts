export type SourceKind = "test" | "inline" | "schema" | "example" | "live"

export type RunStatus = "success" | "error" | "running"

export interface RunOption {
  id: string
  label: string
  status: RunStatus
}

export interface RunGroup {
  label: string
  runs: RunOption[]
}

export interface SourceDef {
  kind: SourceKind
  label: string
  shortLabel: string
  available: boolean
  reason?: string
  runnable: boolean
  runVerb?: string
  runs?: RunOption[]
  groups?: RunGroup[]
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

export type VariantId =
  | "segmented"
  | "reflow"
  | "stacked"
  | "tabs"
  | "chips"
  | "disclosure"
  | "cards"
  | "pills"
  | "dropdown"
  | "header"
  | "mergedPill"
  | "accordionSrc"
  | "segmentedBadges"
  | "toolbar"
  | "radios"
  | "vtabs"
  | "popoverPicker"
  | "breadcrumb"

export type SourceModel = "peers" | "tiered"

export interface VariantMeta {
  id: VariantId
  rank: number
  name: string
  blurb: string
  subPlacement: "header" | "reflow-right" | "below" | "in-widget" | "nested"
}
