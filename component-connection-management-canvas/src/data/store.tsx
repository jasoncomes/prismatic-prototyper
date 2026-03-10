import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"
import type { Tier, ComponentTier, FlowStep, ConnectionConfigVar, ConnectionTemplate, Component } from "./types"
import { COMPONENTS, INITIAL_CONNECTION_CONFIG_VARS } from "./components"

type PreSelectedTier = "required" | "recommended"

type Screen =
  | "new-integration"
  | "designer"
  | "add-step"
  | "connection-setup"

type ModalView = "overview" | "browse" | "connections" | "edit-connection"

type AddStepView = "search" | "category" | "actions" | "my-components"

type NewIntegrationStep = "name" | "trigger" | "components" | "done"

interface StoreState {
  screen: Screen
  setScreen: (screen: Screen) => void

  // Feature flags
  showClassifications: boolean
  setShowClassifications: (show: boolean) => void

  // Component tiers
  componentTiers: ComponentTier[]
  setTier: (componentKey: string, tier: Tier) => void
  getTier: (componentKey: string) => Tier
  getSource: (componentKey: string) => "org" | "integration" | null

  // Modal
  showModal: boolean
  setShowModal: (show: boolean) => void
  modalView: ModalView
  setModalView: (view: ModalView) => void

  // Flow
  flowSteps: FlowStep[]
  addFlowStep: (step: FlowStep) => void
  linkStepConnection: (stepId: string, connectionConfigVarId: string | undefined) => void
  isComponentInFlow: (componentKey: string) => boolean

  // Selection
  selectedComponentKey: string | null
  setSelectedComponentKey: (key: string | null) => void

  // Counts
  requiredCount: number
  recommendedCount: number

  // Connection config vars
  connectionConfigVars: ConnectionConfigVar[]
  toggleRcv: (id: string) => void
  toggleScv: (id: string) => void
  addConnectionConfigVar: (ccv: ConnectionConfigVar) => void
  removeConnectionConfigVar: (id: string) => void
  activateConnection: (sourceId: string) => string | null
  getAvailableConnections: (componentKey: string) => ConnectionConfigVar[]
  getComponentConnectionVars: (componentKey: string) => ConnectionConfigVar[]
  getComponentConnectionHealth: (componentKey: string) => "connected" | "partial" | "disconnected" | "none"

  // Connection templates
  connectionTemplates: ConnectionTemplate[]
  addConnectionTemplate: (template: ConnectionTemplate) => void

  // Computed
  getMissingRequiredComponents: () => Component[]
  canPublish: boolean
  configuredConnectionCount: number
  totalConnectionCount: number

  // Add Step
  addStepView: AddStepView
  setAddStepView: (view: AddStepView) => void

  // New Integration
  newIntegrationStep: NewIntegrationStep
  setNewIntegrationStep: (step: NewIntegrationStep) => void
  preSelectedComponents: string[]
  togglePreSelectedComponent: (key: string) => void
  preSelectedTiers: Record<string, PreSelectedTier>
  setPreSelectedTier: (key: string, tier: PreSelectedTier) => void
  getPreSelectedTier: (key: string) => PreSelectedTier
  integrationName: string
  setIntegrationName: (name: string) => void
  triggerType: string
  setTriggerType: (type: string) => void
}

const StoreContext = createContext<StoreState | null>(null)

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [showClassifications, setShowClassifications] = useState(false)
  const [screen, setScreen] = useState<Screen>("new-integration")
  const [componentTiers, setComponentTiers] = useState<ComponentTier[]>([
    { componentKey: "salesforce", tier: "required", source: "org" },
    { componentKey: "slack", tier: "recommended", source: "org" },
    { componentKey: "sftp", tier: "required", source: "integration" },
    { componentKey: "hubspot", tier: "recommended", source: "integration" },
  ])
  const [showModal, setShowModal] = useState(false)
  const [modalView, setModalView] = useState<ModalView>("overview")
  const [selectedComponentKey, setSelectedComponentKey] = useState<string | null>(null)
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([])
  const [connectionConfigVars, setConnectionConfigVars] = useState<ConnectionConfigVar[]>([])
  const [connectionTemplates, setConnectionTemplates] = useState<ConnectionTemplate[]>([
    { id: "tpl-1", componentKey: "salesforce", connectionKey: "oauth2", name: "Salesforce OAuth (Production)" },
    { id: "tpl-2", componentKey: "salesforce", connectionKey: "api-key", name: "Salesforce API Key (Prod)" },
    { id: "tpl-3", componentKey: "slack", connectionKey: "oauth2", name: "Slack Bot Token" },
    { id: "tpl-4", componentKey: "salesforce", connectionKey: "oauth2", name: "Salesforce OAuth (Sandbox)" },
    { id: "tpl-5", componentKey: "salesforce", connectionKey: "service-account", name: "Salesforce Service Account" },
  ])
  const [addStepView, setAddStepView] = useState<AddStepView>("search")
  const [newIntegrationStep, setNewIntegrationStep] = useState<NewIntegrationStep>("name")
  const [preSelectedComponents, setPreSelectedComponents] = useState<string[]>([])
  const [preSelectedTiers, setPreSelectedTiers] = useState<Record<string, PreSelectedTier>>({})
  const [integrationName, setIntegrationName] = useState("")
  const [triggerType, setTriggerType] = useState("universal-webhook")

  const setTier = useCallback((componentKey: string, tier: Tier) => {
    setComponentTiers((prev) => {
      const existing = prev.find((ct) => ct.componentKey === componentKey)
      if (existing?.source === "org") return prev
      if (tier === "optional") {
        return prev.filter((ct) => ct.componentKey !== componentKey)
      }
      if (existing) {
        return prev.map((ct) =>
          ct.componentKey === componentKey ? { ...ct, tier } : ct
        )
      }
      return [...prev, { componentKey, tier, source: "integration" }]
    })
  }, [])

  const getTier = useCallback(
    (componentKey: string): Tier =>
      componentTiers.find((ct) => ct.componentKey === componentKey)?.tier ?? "optional",
    [componentTiers]
  )

  const getSource = useCallback(
    (componentKey: string): "org" | "integration" | null =>
      componentTiers.find((ct) => ct.componentKey === componentKey)?.source ?? null,
    [componentTiers]
  )

  const addFlowStep = useCallback((step: FlowStep) => {
    setFlowSteps((prev) => [...prev, step])
  }, [])

  const linkStepConnection = useCallback((stepId: string, connectionConfigVarId: string | undefined) => {
    setFlowSteps((prev) => prev.map((s) =>
      s.id === stepId ? { ...s, connectionConfigVarId } : s
    ))
  }, [])

  const isComponentInFlow = useCallback(
    (componentKey: string) => flowSteps.some((s) => s.componentKey === componentKey),
    [flowSteps]
  )

  const toggleRcv = useCallback((id: string) => {
    setConnectionConfigVars((prev) =>
      prev.map((ccv) => ccv.id === id ? { ...ccv, isRcv: !ccv.isRcv } : ccv)
    )
  }, [])

  const toggleScv = useCallback((id: string) => {
    setConnectionConfigVars((prev) =>
      prev.map((ccv) => ccv.id === id ? { ...ccv, isScv: !ccv.isScv } : ccv)
    )
  }, [])

  const addConnectionConfigVar = useCallback((ccv: ConnectionConfigVar) => {
    setConnectionConfigVars((prev) => [...prev, ccv])
  }, [])

  const removeConnectionConfigVar = useCallback((id: string) => {
    setConnectionConfigVars((prev) => prev.filter((ccv) => ccv.id !== id))
    setFlowSteps((prev) => prev.map((s) =>
      s.connectionConfigVarId === id ? { ...s, connectionConfigVarId: undefined } : s
    ))
  }, [])

  const activateConnection = useCallback((sourceId: string): string | null => {
    const source = connectionConfigVars.find((ccv) => ccv.id === sourceId) ?? INITIAL_CONNECTION_CONFIG_VARS.find((ccv) => ccv.id === sourceId)
    if (!source) return null
    const newId = `ccv-${Date.now()}`
    setConnectionConfigVars((prev) => [
      ...prev,
      {
        ...source,
        id: newId,
        isRcv: true,
        lastConfigured: undefined,
        usedBy: undefined,
      },
    ])
    return newId
  }, [connectionConfigVars])

  const getAvailableConnections = useCallback(
    (componentKey: string): ConnectionConfigVar[] => [
      ...INITIAL_CONNECTION_CONFIG_VARS.filter((v) => v.componentKey === componentKey),
      ...connectionConfigVars.filter((v) => !v.isRcv && v.componentKey === componentKey),
    ],
    [connectionConfigVars]
  )

  const getComponentConnectionVars = useCallback(
    (componentKey: string) => connectionConfigVars.filter((ccv) => ccv.componentKey === componentKey && ccv.isRcv),
    [connectionConfigVars]
  )

  const getComponentConnectionHealth = useCallback(
    (componentKey: string): "connected" | "partial" | "disconnected" | "none" => {
      const comp = COMPONENTS.find((c) => c.key === componentKey)
      if (!comp || comp.connections.length === 0) return "none"
      const vars = connectionConfigVars.filter((ccv) => ccv.componentKey === componentKey && ccv.isRcv)
      if (vars.length === 0) return "disconnected"
      const connectedCount = vars.filter((v) => v.status === "connected").length
      if (connectedCount === vars.length) return "connected"
      if (connectedCount > 0) return "partial"
      return "disconnected"
    },
    [connectionConfigVars]
  )

  const addConnectionTemplate = useCallback((template: ConnectionTemplate) => {
    setConnectionTemplates((prev) => [...prev, template])
  }, [])

  const requiredCount = componentTiers.filter((ct) => ct.tier === "required").length
  const recommendedCount = componentTiers.filter((ct) => ct.tier === "recommended").length

  const getMissingRequiredComponents = useCallback(() => {
    const requiredKeys = componentTiers
      .filter((ct) => ct.tier === "required")
      .map((ct) => ct.componentKey)
    return requiredKeys
      .filter((key) => !flowSteps.some((s) => s.componentKey === key))
      .map((key) => COMPONENTS.find((c) => c.key === key)!)
      .filter(Boolean)
  }, [componentTiers, flowSteps])

  const canPublish = useMemo(
    () => getMissingRequiredComponents().length === 0,
    [getMissingRequiredComponents]
  )

  const configuredConnectionCount = useMemo(
    () => connectionConfigVars.filter((ccv) => ccv.status === "connected").length,
    [connectionConfigVars]
  )

  const totalConnectionCount = connectionConfigVars.length

  const togglePreSelectedComponent = useCallback((key: string) => {
    setPreSelectedComponents((prev) => {
      if (prev.includes(key)) {
        setPreSelectedTiers((t) => {
          const { [key]: _, ...rest } = t
          return rest
        })
        return prev.filter((k) => k !== key)
      }
      setPreSelectedTiers((t) => ({ ...t, [key]: "recommended" }))
      return [...prev, key]
    })
  }, [])

  const setPreSelectedTier = useCallback((key: string, tier: PreSelectedTier) => {
    setPreSelectedTiers((prev) => ({ ...prev, [key]: tier }))
  }, [])

  const getPreSelectedTier = useCallback(
    (key: string): PreSelectedTier => preSelectedTiers[key] ?? "recommended",
    [preSelectedTiers]
  )

  return (
    <StoreContext.Provider
      value={{
        showClassifications,
        setShowClassifications,
        screen,
        setScreen,
        componentTiers,
        setTier,
        getTier,
        getSource,
        showModal,
        setShowModal,
        modalView,
        setModalView,
        flowSteps,
        addFlowStep,
        linkStepConnection,
        isComponentInFlow,
        selectedComponentKey,
        setSelectedComponentKey,
        requiredCount,
        recommendedCount,
        connectionConfigVars,
        toggleRcv,
        toggleScv,
        addConnectionConfigVar,
        removeConnectionConfigVar,
        activateConnection,
        getAvailableConnections,
        getComponentConnectionVars,
        getComponentConnectionHealth,
        connectionTemplates,
        addConnectionTemplate,
        getMissingRequiredComponents,
        canPublish,
        configuredConnectionCount,
        totalConnectionCount,
        addStepView,
        setAddStepView,
        newIntegrationStep,
        setNewIntegrationStep,
        preSelectedComponents,
        togglePreSelectedComponent,
        preSelectedTiers,
        setPreSelectedTier,
        getPreSelectedTier,
        integrationName,
        setIntegrationName,
        triggerType,
        setTriggerType,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}
