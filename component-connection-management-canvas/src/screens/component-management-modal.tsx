import { useState, useMemo } from "react"
import UilArrowLeft from "@iconscout/react-unicons/icons/uil-arrow-left"
import UilCheck from "@iconscout/react-unicons/icons/uil-check"
import UilExclamationTriangle from "@iconscout/react-unicons/icons/uil-exclamation-triangle"
import UilLink from "@iconscout/react-unicons/icons/uil-link"
import UilInfoCircle from "@iconscout/react-unicons/icons/uil-info-circle"
import UilAngleDown from "@iconscout/react-unicons/icons/uil-angle-down"
import UilBoltAlt from "@iconscout/react-unicons/icons/uil-bolt-alt"
import UilPlay from "@iconscout/react-unicons/icons/uil-play"
import UilDatabase from "@iconscout/react-unicons/icons/uil-database"
import UilPlus from "@iconscout/react-unicons/icons/uil-plus"
import UilRefresh from "@iconscout/react-unicons/icons/uil-refresh"
import UilPuzzlePiece from "@iconscout/react-unicons/icons/uil-puzzle-piece"
import UilShieldCheck from "@iconscout/react-unicons/icons/uil-shield-check"
import UilStar from "@iconscout/react-unicons/icons/uil-star"
import UilTimes from "@iconscout/react-unicons/icons/uil-times"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SearchInput } from "@/components/search-input"
import { ComponentIcon } from "@/components/component-icon"
import { TierDecorator } from "@/components/tier-decorator"
import { TierSelector } from "@/components/tier-selector"
import { CapabilityBadges } from "@/components/capability-badge"
import { ConnectionListItem } from "@/components/connection-list-item"
import { ConnectionToggleRow } from "@/components/connection-toggle-row"
import { AddConnectionModal, ConnectionFormView } from "@/components/add-connection-modal"
import { useStore } from "@/data/store"
import { COMPONENTS, CATEGORY_LABELS, MOCK_ACTIONS, DEFAULT_ACTIONS, MOCK_TRIGGERS, MOCK_DATA_SOURCES } from "@/data/components"
import { CONNECTION_TYPE_LABELS } from "@/data/constants"
import type { Category, Component, ComponentDetailItem, Tier, FlowStep, ConnectionTemplate } from "@/data/types"
import { cn } from "@/lib/utils"

const categories = ["all", "app", "logic", "helper"] as const

// ─── Browse Card ─────────────────────────────────────────────────────

interface BrowseCardProps {
  component: Component
  tier: Tier
  source: "org" | "integration" | null
  onTierChange: (tier: Tier) => void
  onConnectionsClick?: () => void
  connectionVarCount: number
  showClassifications: boolean
}

const BrowseCard = ({ component, tier, source, onTierChange, onConnectionsClick, connectionVarCount, showClassifications }: BrowseCardProps) => {
  const hasConnections = component.connections.length > 0

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-gray-04 bg-white px-3 py-3 transition-all hover:border-gray-06 hover:shadow-sm",
        hasConnections && onConnectionsClick && "cursor-pointer"
      )}
      onClick={hasConnections ? onConnectionsClick : undefined}
    >
      <ComponentIcon color={component.iconColor} initials={component.iconInitials} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-foreground/85">{component.label}</span>
          {component.isPrivate && (
            <span className="shrink-0 rounded bg-gray-04 px-1.5 py-0.5 text-[10px] font-medium text-foreground/50">
              Private
            </span>
          )}
          <CapabilityBadges capabilities={component.capabilities} />
          <span className="text-[10px] text-foreground/35">v{component.version}</span>
        </div>
        <p className="mt-0.5 text-xs text-foreground/55 truncate">{component.description}</p>
        {hasConnections && (
          <span className="mt-1 flex items-center gap-1.5 text-[11px] text-foreground/45">
            <UilLink className="size-3" />
            <span>{component.connections.length} connection{component.connections.length !== 1 ? "s" : ""}</span>
            {connectionVarCount > 0 && (
              <span className="flex items-center gap-0.5 text-brand-mint">
                <UilCheck className="size-3" />
                {connectionVarCount} configured
              </span>
            )}
          </span>
        )}
      </div>
      {showClassifications && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div onClick={(e) => e.stopPropagation()}>
          <TierSelector value={tier} onChange={onTierChange} disabled={source === "org"} />
        </div>
      )}
    </div>
  )
}

// ─── Modal Root ──────────────────────────────────────────────────────

export const ComponentManagementModal = () => {
  const {
    showModal,
    setShowModal,
    modalView,
    setModalView,
    getTier,
    getSource,
    setTier,
    requiredCount,
    recommendedCount,
    isComponentInFlow,
    selectedComponentKey,
    setSelectedComponentKey,
    getComponentConnectionVars,
    activateConnection,
    removeConnectionConfigVar,
    getMissingRequiredComponents,
    componentTiers,
    flowSteps,
    connectionTemplates,
    showClassifications,
    connectionConfigVars,
  } = useStore()

  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null)
  const [editReturnView, setEditReturnView] = useState<"overview" | "connections">("connections")

  const handleClose = (open: boolean) => {
    if (!open) {
      setShowModal(false)
      setModalView("overview")
      setEditingConnectionId(null)
    }
  }

  const handleConnectionsClick = (key: string) => {
    setSelectedComponentKey(key)
    setModalView("connections")
  }

  const handleEditConnection = (ccvId: string, componentKey: string, from: "overview" | "connections" = "connections") => {
    setSelectedComponentKey(componentKey)
    setEditingConnectionId(ccvId)
    setEditReturnView(from)
    setModalView("edit-connection")
  }

  const selectedComponent = (modalView === "connections" || modalView === "edit-connection")
    ? COMPONENTS.find((c) => c.key === selectedComponentKey) ?? null
    : null

  const editingConnection = editingConnectionId
    ? connectionConfigVars.find((c) => c.id === editingConnectionId)
    : undefined

  return (
    <Dialog open={showModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[88vh]">
        {modalView === "edit-connection" && selectedComponent ? (
          <ConnectionFormView
            component={selectedComponent}
            existingConnection={editingConnection}
            onBack={() => {
              setEditingConnectionId(null)
              setModalView(editReturnView)
            }}
            onDelete={editingConnectionId ? () => {
              removeConnectionConfigVar(editingConnectionId)
              setEditingConnectionId(null)
              setModalView(editReturnView)
            } : undefined}
          />
        ) : modalView === "connections" && selectedComponent ? (
          <ConnectionsView
            component={selectedComponent}
            inFlow={isComponentInFlow(selectedComponent.key)}
            getComponentConnectionVars={getComponentConnectionVars}
            onBack={() => setModalView("overview")}
            onEditConnection={(ccvId) => handleEditConnection(ccvId, selectedComponent.key)}
            activateConnection={activateConnection}
            removeConnectionConfigVar={removeConnectionConfigVar}
            connectionTemplates={connectionTemplates.filter((t) => t.componentKey === selectedComponent.key)}
            tier={getTier(selectedComponent.key)}
            source={getSource(selectedComponent.key)}
            onTierChange={(t) => setTier(selectedComponent.key, t)}
            showClassifications={showClassifications}
          />
        ) : modalView === "browse" ? (
          <BrowseView
            getTier={getTier}
            getSource={getSource}
            setTier={setTier}
            requiredCount={requiredCount}
            recommendedCount={recommendedCount}
            onBack={() => setModalView("overview")}
            onConnectionsClick={handleConnectionsClick}
            isComponentInFlow={isComponentInFlow}
            getComponentConnectionVars={getComponentConnectionVars}
            componentTiers={componentTiers}
            showClassifications={showClassifications}
          />
        ) : (
          <OverviewView
            setTier={setTier}
            requiredCount={requiredCount}
            recommendedCount={recommendedCount}
            onManageComponents={() => setModalView("browse")}
            getMissingRequiredComponents={getMissingRequiredComponents}
            componentTiers={componentTiers}
            onConnectionsClick={handleConnectionsClick}
            onEditConnection={handleEditConnection}
            flowSteps={flowSteps}
            showClassifications={showClassifications}
            connectionConfigVars={connectionConfigVars}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Overview View ───────────────────────────────────────────────────

interface OverviewViewProps {
  setTier: (key: string, tier: Tier) => void
  requiredCount: number
  recommendedCount: number
  onManageComponents: () => void
  getMissingRequiredComponents: () => Component[]
  componentTiers: { componentKey: string; tier: Tier }[]
  onConnectionsClick: (key: string) => void
  onEditConnection: (ccvId: string, componentKey: string, from?: "overview" | "connections") => void
  flowSteps: FlowStep[]
  showClassifications: boolean
  connectionConfigVars: import("@/data/types").ConnectionConfigVar[]
}

const OverviewView = ({
  setTier,
  requiredCount,
  recommendedCount,
  onManageComponents,
  getMissingRequiredComponents,
  componentTiers,
  onConnectionsClick,
  onEditConnection,
  flowSteps,
  showClassifications,
  connectionConfigVars,
}: OverviewViewProps) => {
  const required = useMemo(
    () => componentTiers
      .filter((ct) => ct.tier === "required")
      .map((ct) => COMPONENTS.find((c) => c.key === ct.componentKey)!)
      .filter(Boolean),
    [componentTiers]
  )

  const recommended = useMemo(
    () => componentTiers
      .filter((ct) => ct.tier === "recommended")
      .map((ct) => COMPONENTS.find((c) => c.key === ct.componentKey)!)
      .filter(Boolean),
    [componentTiers]
  )

  const inUse = useMemo(() => {
    const keys = [...new Set(flowSteps.map((s) => s.componentKey))]
    return keys.map((k) => COMPONENTS.find((c) => c.key === k)!).filter(Boolean)
  }, [flowSteps])

  const [overviewTab, setOverviewTab] = useState<"components" | "connections">("components")
  const [addConnectionComponent, setAddConnectionComponent] = useState<Component | null>(null)
  const hasOutdated = inUse.some((c) => c.version !== c.latestVersion)
  const activeConnections = connectionConfigVars.filter((v) => v.isRcv)
  const componentsWithConnections = useMemo(
    () => inUse.filter((c) => c.connections.length > 0),
    [inUse]
  )

  const missingRequired = getMissingRequiredComponents()
  const hasContent = required.length > 0 || recommended.length > 0 || inUse.length > 0
  const hasClassified = required.length > 0 || recommended.length > 0

  const getTierForComponent = (key: string): Tier => {
    const ct = componentTiers.find((t) => t.componentKey === key)
    return ct?.tier ?? "optional"
  }

  return (
    <>
      <DialogHeader>
        <div>
          <DialogTitle>Component & Connection Management</DialogTitle>
          <DialogDescription className="max-w-xl">Components and connections currently in use by this integration. Manage versions, configure connections, and review status.</DialogDescription>
        </div>
      </DialogHeader>

      <div className="px-10 pt-6 pb-0">
        <Tabs value={overviewTab} onValueChange={(v) => setOverviewTab(v as "components" | "connections")}>
          <TabsList variant="underline">
            <TabsTrigger value="components" variant="underline">
              Components ({inUse.length})
            </TabsTrigger>
            <TabsTrigger value="connections" variant="underline">
              Connections ({activeConnections.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <DialogBody className="px-10 py-6">
        {hasContent ? (
          <>
            {showClassifications && missingRequired.length > 0 && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <UilExclamationTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <p className="text-sm text-amber-800">
                  {missingRequired.length} required component{missingRequired.length !== 1 ? "s" : ""} not used in any flow.
                  Publishing will be blocked.
                </p>
              </div>
            )}

            {overviewTab === "components" ? (
              <ScrollArea className="h-[460px] pr-2">
                <div className="grid grid-cols-1 gap-2">
                  {inUse.map((comp) => {
                    const tier = getTierForComponent(comp.key)
                    const compVars = connectionConfigVars.filter((v) => v.componentKey === comp.key && v.isRcv)
                    const compConnected = compVars.filter((v) => v.status === "connected").length
                    return (
                      <button
                        key={comp.key}
                        onClick={() => onConnectionsClick(comp.key)}
                        className="flex items-center gap-2.5 rounded-lg border border-gray-04 p-2.5 text-left transition-all cursor-pointer hover:border-gray-06"
                      >
                        <div className="relative shrink-0">
                          <ComponentIcon color={comp.iconColor} initials={comp.iconInitials} size="sm" />
                          {showClassifications && tier !== "optional" && (
                            <TierDecorator tier={tier} className="absolute -top-1 -right-1" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="truncate text-sm font-medium text-foreground/85 block">
                            {comp.label}
                          </span>
                          {compVars.length > 0 && (
                            <span className="flex items-center gap-1.5 text-[11px] mt-0.5">
                              <div className={cn(
                                "size-1.5 rounded-full shrink-0",
                                compConnected === compVars.length ? "bg-brand-mint" : compConnected > 0 ? "bg-amber-500" : "bg-gray-05"
                              )} />
                              <span className={compConnected === compVars.length ? "text-brand-mint" : compConnected > 0 ? "text-amber-500" : "text-foreground/40"}>
                                {compConnected === compVars.length
                                  ? `${compVars.length} connection${compVars.length !== 1 ? "s" : ""}`
                                  : `${compConnected}/${compVars.length} connections`}
                              </span>
                            </span>
                          )}
                        </div>
                        {comp.isPrivate && (
                          <span className="shrink-0 rounded bg-gray-04 px-1.5 py-0.5 text-[10px] font-medium text-foreground/50">
                            Private
                          </span>
                        )}
                        {comp.version !== comp.latestVersion ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 shrink-0">
                            <UilRefresh className="size-2.5" />
                            v{comp.version}
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] text-foreground/35">v{comp.version}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <ScrollArea className="h-[460px] pr-2">
                <div className="space-y-1">
                  {activeConnections.map((ccv) => (
                    <ConnectionListItem
                      key={ccv.id}
                      connection={ccv}
                      onClick={() => onEditConnection(ccv.id, ccv.componentKey, "overview")}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-gray-03">
              <UilPuzzlePiece className="size-7 text-foreground/35" />
            </div>
            <p className="text-base font-semibold text-foreground/70">No Components Configured Yet</p>
            <p className="mt-1 max-w-[300px] text-sm text-foreground/45">
              Classify components as Required or Recommended to guide integration builders.
            </p>
            <Button className="mt-6" onClick={onManageComponents}>Browse Components</Button>
          </div>
        )}
      </DialogBody>

      <DialogFooter className="!flex-row justify-end">
        <div className="flex items-center gap-2">
          {hasOutdated && overviewTab === "components" && (
            <Button variant="tertiary" className="gap-2">
              <UilRefresh className="size-4" />
              Update All Versions
            </Button>
          )}
          {overviewTab === "connections" && componentsWithConnections.length > 0 && (
            <Button
              variant="tertiary"
              className="gap-2"
              onClick={() => setAddConnectionComponent(componentsWithConnections[0])}
            >
              <UilPlus className="size-4" />
              Add Connection
            </Button>
          )}
        </div>
      </DialogFooter>

      {addConnectionComponent && (
        <AddConnectionModal
          open={!!addConnectionComponent}
          onOpenChange={(open) => { if (!open) setAddConnectionComponent(null) }}
          component={addConnectionComponent}
        />
      )}
    </>
  )
}

// ─── Overview Selection Row ──────────────────────────────────────────

interface OverviewSelectionRowProps {
  comp: { key: string; label: string; iconColor: string; iconInitials: string }
  tier: "required" | "recommended"
  onPromote: () => void
  onDemote: () => void
  onRemove: () => void
}

const OverviewSelectionRow = ({ comp, tier, onPromote, onDemote, onRemove }: OverviewSelectionRowProps) => (
  <div className="group flex items-center gap-2 rounded px-1.5 py-1 hover:bg-white">
    <ComponentIcon color={comp.iconColor} initials={comp.iconInitials} size="sm" className="!size-7 !rounded-md !text-[10px]" />
    <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground/70">
      {comp.label}
    </span>
    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      {tier === "recommended" ? (
        <button
          onClick={(e) => { e.stopPropagation(); onPromote() }}
          className="flex size-5 items-center justify-center rounded cursor-pointer text-brand-mint/60 hover:text-brand-mint"
          title="Promote to Required"
        >
          <UilShieldCheck className="size-3.5" />
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onDemote() }}
          className="flex size-5 items-center justify-center rounded cursor-pointer text-amber-400 hover:text-amber-500"
          title="Demote to Recommended"
        >
          <UilStar className="size-3.5" />
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        className="flex size-5 items-center justify-center rounded cursor-pointer text-foreground/30 hover:text-foreground/55"
        title="Remove"
      >
        <UilTimes className="size-3.5" />
      </button>
    </div>
  </div>
)

// ─── Detail Helpers ──────────────────────────────────────────────────

interface CollapsibleDividerProps {
  icon: React.ReactNode
  label: string
  count: number
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

const CollapsibleDivider = ({ icon, label, count, expanded, onToggle, children }: CollapsibleDividerProps) => (
  <div className="mb-3">
    <button
      onClick={onToggle}
      className="mb-2 flex w-full cursor-pointer items-center gap-1.5 py-1"
    >
      <span className="text-foreground/35">{icon}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/45">
        {label}
      </span>
      <span className="text-[11px] text-foreground/40">({count})</span>
      <UilAngleDown className={cn("size-3 text-foreground/35 transition-transform", expanded && "rotate-180")} />
    </button>
    {expanded && children}
  </div>
)

const DetailItemList = ({ items }: { items: ComponentDetailItem[] }) => (
  <div className="space-y-1">
    {items.map((item) => (
      <div
        key={item.name}
        className="flex items-center gap-3 rounded-lg border border-gray-04 bg-white px-4 py-2.5"
      >
        <span className="text-sm font-semibold text-foreground/80">{item.name}</span>
        <span className="text-xs text-foreground/45">{item.description}</span>
      </div>
    ))}
  </div>
)

// ─── Connections View ────────────────────────────────────────────────

interface ConnectionsViewProps {
  component: Component
  inFlow: boolean
  getComponentConnectionVars: (key: string) => import("@/data/types").ConnectionConfigVar[]
  onBack: () => void
  onEditConnection: (ccvId: string) => void
  activateConnection: (sourceId: string) => string | null
  removeConnectionConfigVar: (id: string) => void
  connectionTemplates: ConnectionTemplate[]
  tier: Tier
  source: "org" | "integration" | null
  onTierChange: (tier: Tier) => void
  showClassifications: boolean
}

const ConnectionsView = ({
  component,
  inFlow,
  getComponentConnectionVars,
  onBack,
  onEditConnection,
  activateConnection,
  removeConnectionConfigVar,
  connectionTemplates,
  tier,
  source,
  onTierChange,
  showClassifications,
}: ConnectionsViewProps) => {
  const { flowSteps, getAvailableConnections } = useStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [preselectedConnectionId, setPreselectedConnectionId] = useState<string | null>(null)
  const hasConnections = component.connections.length > 0
  const connectionVars = getComponentConnectionVars(component.key)

  const triggers = MOCK_TRIGGERS[component.key] ?? []
  const actions = MOCK_ACTIONS[component.key] ?? DEFAULT_ACTIONS
  const dataSources = MOCK_DATA_SOURCES[component.key] ?? []
  const totalDetailCount = triggers.length + actions.length + dataSources.length

  const [detailsExpanded, setDetailsExpanded] = useState(!hasConnections)
  const [triggersExpanded, setTriggersExpanded] = useState(true)
  const [actionsExpanded, setActionsExpanded] = useState(true)
  const [dataSourcesExpanded, setDataSourcesExpanded] = useState(true)

  const configuredConnections = connectionVars.filter((v) => v.isRcv)
  const availableConnections = getAvailableConnections(component.key)

  const getStepsForConnection = (ccvId: string) =>
    flowSteps.filter((s) => s.connectionConfigVarId === ccvId).map((s) => s.actionName)


  const detailsSection = (
    <div className="mb-6">
      <button
        onClick={() => setDetailsExpanded((prev) => !prev)}
        className="mb-4 flex w-full cursor-pointer items-center gap-2"
      >
        <div className="h-px flex-1 bg-gray-04" />
        <UilInfoCircle className="size-3 text-foreground/35" />
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
          Details
        </span>
        <span className="text-xs text-foreground/45">({totalDetailCount})</span>
        <UilAngleDown className={cn("size-3.5 text-foreground/35 transition-transform", detailsExpanded && "rotate-180")} />
        <div className="h-px flex-1 bg-gray-04" />
      </button>

      {detailsExpanded && (
        <div className="pl-2">
          {triggers.length > 0 && (
            <CollapsibleDivider
              icon={<UilPlay className="size-3" />}
              label="Triggers"
              count={triggers.length}
              expanded={triggersExpanded}
              onToggle={() => setTriggersExpanded((prev) => !prev)}
            >
              <DetailItemList items={triggers} />
            </CollapsibleDivider>
          )}

          {actions.length > 0 && (
            <CollapsibleDivider
              icon={<UilBoltAlt className="size-3" />}
              label="Actions"
              count={actions.length}
              expanded={actionsExpanded}
              onToggle={() => setActionsExpanded((prev) => !prev)}
            >
              <DetailItemList items={actions} />
            </CollapsibleDivider>
          )}

          {dataSources.length > 0 && (
            <CollapsibleDivider
              icon={<UilDatabase className="size-3" />}
              label="Data Sources"
              count={dataSources.length}
              expanded={dataSourcesExpanded}
              onToggle={() => setDataSourcesExpanded((prev) => !prev)}
            >
              <DetailItemList items={dataSources} />
            </CollapsibleDivider>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      <DialogHeader className="!items-start">
        <div className="flex items-center gap-3 w-full">
          <ComponentIcon color={component.iconColor} initials={component.iconInitials} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <DialogTitle className="text-lg">{component.label}</DialogTitle>
              <span className="rounded bg-brand-mint px-2 py-0.5 text-xs font-medium text-white">
                v{component.version}
              </span>
              {component.version !== component.latestVersion && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                  <UilInfoCircle className="size-3" />
                  Update available: v{component.version} → v{component.latestVersion}
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogDescription className="mt-3">{component.description}</DialogDescription>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <CapabilityBadges capabilities={component.capabilities} />
          {component.connections.map((conn) => (
            <span
              key={conn.key}
              className="inline-flex items-center rounded-full bg-gray-04 px-2.5 py-0.5 text-xs text-foreground/70"
            >
              {CONNECTION_TYPE_LABELS[conn.type] ?? conn.type}
            </span>
          ))}
        </div>
      </DialogHeader>

      <DialogBody className="px-10 py-6">
        <ScrollArea className="h-[460px] pr-3">
          {showClassifications && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-04" />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
                  Configuration
                </span>
                <div className="h-px flex-1 bg-gray-04" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-04 bg-white px-4 py-3">
                <span className="text-sm font-medium text-foreground/70">Tier Classification</span>
                <TierSelector value={tier} onChange={onTierChange} disabled={source === "org"} />
              </div>
            </div>
          )}

          {hasConnections ? (
            <>
              {/* Configured Connections */}
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-04" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
                    Configured Connections
                  </span>
                  <span className="text-xs text-foreground/45">({configuredConnections.length})</span>
                  <div className="h-px flex-1 bg-gray-04" />
                </div>

                {configuredConnections.length > 0 ? (
                  <div className="space-y-2">
                    {configuredConnections.map((ccv) => (
                      <ConnectionToggleRow
                        key={ccv.id}
                        connectionVar={ccv}
                        usedBySteps={getStepsForConnection(ccv.id)}
                        onClick={() => onEditConnection(ccv.id)}
                        onDelete={() => removeConnectionConfigVar(ccv.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-06 bg-white p-8 text-center">
                    <p className="text-sm text-foreground/45">No configured connections</p>
                  </div>
                )}
              </div>

              {/* Available Connections */}
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-04" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
                    Available Connections
                  </span>
                  <span className="text-xs text-foreground/45">({availableConnections.length})</span>
                  <div className="h-px flex-1 bg-gray-04" />
                </div>

                <div className="space-y-2">
                  {availableConnections.map((ccv) => (
                    <ConnectionToggleRow
                      key={ccv.id}
                      connectionVar={ccv}
                      onClick={() => {
                        setPreselectedConnectionId(ccv.id)
                        setShowAddModal(true)
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setPreselectedConnectionId(null)
                      setShowAddModal(true)
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-06 bg-white p-3 text-sm font-medium text-foreground/45 transition-all hover:border-gray-08 hover:text-foreground/65 cursor-pointer"
                  >
                    <UilPlus className="size-4" />
                    Create Connection
                  </button>
                </div>
              </div>

              {/* Connection Templates */}
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-04" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
                    Connection Templates
                  </span>
                  <span className="text-xs text-foreground/45">({connectionTemplates.length})</span>
                  <div className="h-px flex-1 bg-gray-04" />
                </div>

                {connectionTemplates.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {connectionTemplates.map((tpl) => {
                      const conn = component.connections.find((c) => c.key === tpl.connectionKey)
                      return (
                        <div
                          key={tpl.id}
                          className="flex items-center gap-2.5 rounded-lg border border-gray-04 bg-white p-3 hover:border-gray-06 hover:shadow-sm transition-all cursor-pointer"
                        >
                          <ComponentIcon color={component.iconColor} initials={component.iconInitials} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground/85 truncate">{tpl.name}</p>
                            {conn && (
                              <p className="text-xs text-foreground/45 truncate">
                                {CONNECTION_TYPE_LABELS[conn.type] ?? conn.type}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-06 bg-white p-6 text-center">
                    <p className="text-sm text-foreground/45">No connection templates</p>
                  </div>
                )}
              </div>

              {detailsSection}
            </>
          ) : (
            <>
              {detailsSection}

              {/* No connections callout */}
              <div className="flex items-center gap-2 rounded-lg bg-gray-02 px-4 py-3">
                <UilInfoCircle className="size-4 shrink-0 text-foreground/35" />
                <p className="text-xs text-foreground/45">This component does not use connections.</p>
              </div>
            </>
          )}
        </ScrollArea>
      </DialogBody>

      <DialogFooter className="!flex-row justify-between">
        <Button variant="tertiary" onClick={onBack} className="gap-2">
          <UilArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {component.version !== component.latestVersion && (
            <Button variant="tertiary">
              Update Version
            </Button>
          )}
          {hasConnections && inFlow && (
            <Button variant="tertiary" onClick={() => setShowAddModal(true)} className="gap-2">
              <UilPlus className="size-4" />
              Add Connection
            </Button>
          )}
        </div>
      </DialogFooter>

      <AddConnectionModal
        key={preselectedConnectionId ?? "new"}
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open)
          if (!open) setPreselectedConnectionId(null)
        }}
        component={component}
        preselectedConnectionId={preselectedConnectionId}
      />
    </>
  )
}

// ─── Browse View ─────────────────────────────────────────────────────

interface BrowseViewProps {
  getTier: (key: string) => Tier
  getSource: (key: string) => "org" | "integration" | null
  setTier: (key: string, tier: Tier) => void
  requiredCount: number
  recommendedCount: number
  onBack: () => void
  onConnectionsClick: (key: string) => void
  isComponentInFlow: (key: string) => boolean
  getComponentConnectionVars: (key: string) => unknown[]
  componentTiers: { componentKey: string; tier: Tier }[]
  showClassifications: boolean
}

const BrowseView = ({
  getTier,
  getSource,
  setTier,
  requiredCount,
  recommendedCount,
  onBack,
  onConnectionsClick,
  isComponentInFlow,
  getComponentConnectionVars,
  componentTiers,
  showClassifications,
}: BrowseViewProps) => {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("all")

  const filtered = useMemo(() => {
    let list = COMPONENTS
    if (category !== "all") {
      list = list.filter((c) => c.category === (category as Category))
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
    }
    return list
  }, [search, category])

  const required = useMemo(
    () => componentTiers
      .filter((ct) => ct.tier === "required")
      .map((ct) => COMPONENTS.find((c) => c.key === ct.componentKey)!)
      .filter(Boolean),
    [componentTiers]
  )

  const recommended = useMemo(
    () => componentTiers
      .filter((ct) => ct.tier === "recommended")
      .map((ct) => COMPONENTS.find((c) => c.key === ct.componentKey)!)
      .filter(Boolean),
    [componentTiers]
  )

  const hasClassified = required.length > 0 || recommended.length > 0

  return (
    <>
      <DialogHeader>
        <div>
          <DialogTitle>Browse Components</DialogTitle>
          <DialogDescription>
            Classify components as Required, Recommended, or Optional for this integration.
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className="px-10 pt-2 pb-0">
        <SearchInput
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
        />
      </div>

      <div className="px-10 pt-3 pb-0">
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList variant="underline">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} variant="underline">
                {CATEGORY_LABELS[cat] ?? cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <DialogBody className="px-10 py-6">
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <ScrollArea className="h-[460px] pr-2">
              <div className="grid grid-cols-1 gap-2">
                {filtered.map((c) => (
                  <BrowseCard
                    key={c.key}
                    component={c}
                    tier={getTier(c.key)}
                    source={getSource(c.key)}
                    onTierChange={(t) => setTier(c.key, t)}
                    onConnectionsClick={isComponentInFlow(c.key) ? () => onConnectionsClick(c.key) : undefined}
                    connectionVarCount={getComponentConnectionVars(c.key).length}
                    showClassifications={showClassifications}
                  />
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-foreground/55">
                  No components match your search.
                </div>
              )}
            </ScrollArea>
          </div>

          {showClassifications && (
            <div className={cn(
              "shrink-0 overflow-hidden transition-all duration-200",
              hasClassified ? "w-56 opacity-100" : "w-0 opacity-0"
            )}>
              <div className="h-full w-56 rounded-lg border border-gray-04 bg-gray-02 p-3">
                <ScrollArea className="h-[450px]">
                  <div className="space-y-3">
                    {required.length > 0 && (
                      <div>
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <div className="size-2 rounded-full bg-brand-mint" />
                          <span className="text-[11px] font-semibold text-foreground/55">
                            REQUIRED ({required.length})
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {required.map((comp) => (
                            <OverviewSelectionRow
                              key={comp.key}
                              comp={comp}
                              tier="required"
                              onPromote={() => {}}
                              onDemote={() => setTier(comp.key, "recommended")}
                              onRemove={() => setTier(comp.key, "optional")}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {recommended.length > 0 && (
                      <div>
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <div className="size-2 rounded-full bg-amber-500" />
                          <span className="text-[11px] font-semibold text-foreground/55">
                            RECOMMENDED ({recommended.length})
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {recommended.map((comp) => (
                            <OverviewSelectionRow
                              key={comp.key}
                              comp={comp}
                              tier="recommended"
                              onPromote={() => setTier(comp.key, "required")}
                              onDemote={() => {}}
                              onRemove={() => setTier(comp.key, "optional")}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </DialogBody>

      <DialogFooter className="!flex-row justify-between">
        <Button variant="tertiary" onClick={onBack} className="gap-2">
          <UilArrowLeft className="size-4" />
          Back
        </Button>
      </DialogFooter>
    </>
  )
}
