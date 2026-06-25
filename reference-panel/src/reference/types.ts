export type SourceKind = "real" | "test" | "example"

export type Provenance = "real" | "test" | "example"

export type Presentation = "one" | "easy"

export type Audience = "ewb" | "lowcode"

export type Variant =
  | "one-cascade"
  | "one-pill"
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
