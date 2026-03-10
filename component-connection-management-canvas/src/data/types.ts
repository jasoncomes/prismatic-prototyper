export type Tier = "required" | "recommended" | "optional"

export type Category = "app" | "logic" | "helper"

export type ConnectionType = "oauth2" | "api_key" | "basic" | "none"

export type ManagedBy = "customer" | "org-global" | "org-customer" | "build-only"

export type Capability = "trigger" | "step" | "data_source"

export interface ComponentDetailItem {
  name: string
  description: string
}

export interface ComponentConnection {
  key: string
  label: string
  type: ConnectionType
  isDefault: boolean
}

export interface Component {
  key: string
  label: string
  description: string
  category: Category
  iconColor: string
  iconInitials: string
  connectionType: ConnectionType
  connections: ComponentConnection[]
  capabilities: Capability[]
  version: string
  latestVersion: string
  isPrivate?: boolean
}

export interface ComponentTier {
  componentKey: string
  tier: Tier
  source?: "integration" | "org"
}

export interface ConnectionConfigVar {
  id: string
  componentKey: string
  connectionKey: string
  name: string
  type: ConnectionType
  managedBy: ManagedBy
  status: "connected" | "pending" | "disconnected"
  isRcv: boolean
  isScv: boolean
  template?: string
  lastConfigured?: string
  usedBy?: string[]
}

export interface ConnectionTemplate {
  id: string
  componentKey: string
  connectionKey: string
  name: string
}

export interface FlowStep {
  id: string
  componentKey: string
  actionName: string
  connectionConfigVarId?: string
}

export type InputFieldType = "text" | "password" | "url" | "textarea"
export type InputPermission = "customer" | "embedded" | "organization"

export interface ConnectionInputField {
  key: string
  label: string
  description: string
  fieldType: InputFieldType
  required: boolean
  defaultValue: string
  writeOnly: boolean
}

export interface InputSettings {
  permission: InputPermission
  visibleToOrg: boolean
  writeOnly: boolean
}

export const TIER_CONFIG = {
  required: {
    label: "Required",
    color: "#2ECE95",
    bgClass: "bg-brand-mint",
    textClass: "text-white",
    borderClass: "border-brand-mint",
    bgLightClass: "bg-brand-mint/10",
  },
  recommended: {
    label: "Recommended",
    color: "#F59E0B",
    bgClass: "bg-amber-500",
    textClass: "text-white",
    borderClass: "border-amber-500",
    bgLightClass: "bg-amber-500/10",
  },
  optional: {
    label: "Optional",
    color: "#9CA3AF",
    bgClass: "bg-gray-400",
    textClass: "text-white",
    borderClass: "border-gray-400",
    bgLightClass: "bg-gray-100",
  },
} as const
