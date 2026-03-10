import { useMemo, useState } from "react"
import UilTimes from "@iconscout/react-unicons/icons/uil-times"
import UilAngleDown from "@iconscout/react-unicons/icons/uil-angle-down"
import UilShieldCheck from "@iconscout/react-unicons/icons/uil-shield-check"
import UilStar from "@iconscout/react-unicons/icons/uil-star"
import UilSearch from "@iconscout/react-unicons/icons/uil-search"
import UilAngleRight from "@iconscout/react-unicons/icons/uil-angle-right"
import UilAngleLeft from "@iconscout/react-unicons/icons/uil-angle-left"
import UilPlus from "@iconscout/react-unicons/icons/uil-plus"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SearchInput } from "@/components/search-input"
import { ComponentIcon } from "@/components/component-icon"
import { ConnectionListItem } from "@/components/connection-list-item"
import { TierDecorator } from "@/components/tier-decorator"
import { AddConnectionModal } from "@/components/add-connection-modal"
import { useStore } from "@/data/store"
import { COMPONENTS, MOCK_TRIGGERS } from "@/data/components"
import type { Category, Component } from "@/data/types"
import { cn } from "@/lib/utils"

const TRIGGER_TYPES = [
  { key: "app", label: "App", description: "Trigger from an application event such as a webhook or polling." },
  { key: "universal-webhook", label: "Universal Webhook", description: "Accept any incoming HTTP request as a trigger. Supports GET, POST, PUT, PATCH, and DELETE methods." },
  { key: "schedule", label: "Schedule", description: "Run your integration on a recurring schedule (e.g., every hour, daily)." },
  { key: "management", label: "Management", description: "Trigger from Prismatic management events such as instance deployment or customer creation." },
  { key: "cross-flow", label: "Cross Flow", description: "Trigger this flow from another flow within the same integration." },
]

const RESPONSE_TYPE_OPTIONS = ["Synchronous", "Asynchronous"]
const RESPONSE_STATUS_OPTIONS = ["200 - OK", "201 - Created", "204 - No Content"]
const RESPONSE_CONTENT_OPTIONS = ["application/json", "text/plain", "text/html"]

const CATEGORY_FILTERS: { key: "all" | Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "app", label: "App" },
  { key: "logic", label: "Logic" },
  { key: "helper", label: "Helpers" },
]

export const NewIntegrationScreen = () => {
  const {
    setScreen,
    newIntegrationStep,
    setNewIntegrationStep,
    integrationName,
    setIntegrationName,
    triggerType,
    setTriggerType,
    preSelectedComponents,
    togglePreSelectedComponent,
    preSelectedTiers,
    setPreSelectedTier,
    getPreSelectedTier,
    setTier,
    showClassifications,
    getComponentConnectionVars,
    getAvailableConnections,
    activateConnection,
    addFlowStep,
  } = useStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all")
  const [triggerAppSearch, setTriggerAppSearch] = useState("")
  const [selectedTriggerApp, setSelectedTriggerApp] = useState<Component | null>(null)
  const [addConnectionComponent, setAddConnectionComponent] = useState<Component | null>(null)
  const [preselectedConnectionId, setPreselectedConnectionId] = useState<string | null>(null)
  const [triggerAppView, setTriggerAppView] = useState<"list" | "triggers" | "connections">("list")
  const [triggerActionSearch, setTriggerActionSearch] = useState("")
  const [selectedTriggerAction, setSelectedTriggerAction] = useState<string | null>(null)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)

  const triggerAppComponents = useMemo(() => {
    const apps = COMPONENTS.filter((c) => c.category === "app" && MOCK_TRIGGERS[c.key])
    if (!triggerAppSearch) return apps
    const q = triggerAppSearch.toLowerCase()
    return apps.filter((c) => c.label.toLowerCase().includes(q))
  }, [triggerAppSearch])

  const filteredTriggerActions = useMemo(() => {
    if (!selectedTriggerApp) return []
    const triggers = MOCK_TRIGGERS[selectedTriggerApp.key] ?? []
    if (!triggerActionSearch) return triggers
    const q = triggerActionSearch.toLowerCase()
    return triggers.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
  }, [selectedTriggerApp, triggerActionSearch])

  const triggerConfiguredConnections = useMemo(() => {
    if (!selectedTriggerApp) return []
    return getComponentConnectionVars(selectedTriggerApp.key)
  }, [selectedTriggerApp, getComponentConnectionVars])

  const triggerAvailableConnections = useMemo(() => {
    if (!selectedTriggerApp) return []
    return getAvailableConnections(selectedTriggerApp.key)
  }, [selectedTriggerApp, getAvailableConnections])

  const filteredComponents = useMemo(() => {
    let filtered = COMPONENTS
    if (categoryFilter !== "all") {
      filtered = filtered.filter((c) => c.category === categoryFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((c) => c.label.toLowerCase().includes(q))
    }
    return filtered
  }, [categoryFilter, searchQuery])

  const selectedComponents = useMemo(
    () => preSelectedComponents
      .map((key) => COMPONENTS.find((c) => c.key === key)!)
      .filter(Boolean),
    [preSelectedComponents]
  )

  const requiredSelections = useMemo(
    () => selectedComponents.filter((c) => getPreSelectedTier(c.key) === "required"),
    [selectedComponents, getPreSelectedTier]
  )

  const recommendedSelections = useMemo(
    () => selectedComponents.filter((c) => getPreSelectedTier(c.key) === "recommended"),
    [selectedComponents, getPreSelectedTier]
  )

  const hasSelections = preSelectedComponents.length > 0

  const handleCreate = (connectionId?: string) => {
    if (triggerType === "app" && selectedTriggerApp && selectedTriggerAction) {
      addFlowStep({
        id: "trigger-1",
        componentKey: selectedTriggerApp.key,
        actionName: selectedTriggerAction,
        connectionConfigVarId: connectionId ?? selectedConnectionId ?? undefined,
      })
    } else if (triggerType && triggerType !== "app") {
      addFlowStep({
        id: "trigger-1",
        componentKey: triggerType === "universal-webhook" ? "webhook" : triggerType,
        actionName: triggerType === "universal-webhook" ? "Webhook" : triggerType === "schedule" ? "Schedule" : "Trigger",
      })
    }
    preSelectedComponents.forEach((key) => {
      setTier(key, preSelectedTiers[key] ?? "recommended")
    })
    setNewIntegrationStep("done")
    setScreen("designer")
  }

  const canProceedFromName = integrationName.trim().length > 0
  const canProceedFromTrigger = triggerType !== "" && (triggerType !== "app" || selectedTriggerAction !== null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-02">
      <div className={cn(
        "w-full transition-all duration-200",
        newIntegrationStep === "components" && showClassifications ? "max-w-4xl" : "max-w-xl"
      )}>
        {/* Dialog card */}
        <div className="rounded-lg border border-gray-04 bg-white shadow-alt">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-04 px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground/85">Create a new integration</h2>
            <button className="flex size-8 items-center justify-center rounded cursor-pointer text-foreground/35 hover:bg-gray-03 hover:text-foreground/55">
              <UilTimes className="size-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {/* Step 1: Name */}
            {newIntegrationStep === "name" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground/85">
                    Name your integration <span className="text-interactive-error">*</span>
                  </label>
                  <Input
                    value={integrationName}
                    onChange={(e) => setIntegrationName(e.target.value)}
                    placeholder="My Integration"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Step 2: Trigger */}
            {newIntegrationStep === "trigger" && (
              <div className="space-y-4">
                {triggerAppView === "list" && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-foreground/85">
                    Select your trigger
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TRIGGER_TYPES.map((tt) => (
                      <button
                        key={tt.key}
                        onClick={() => {
                          setTriggerType(tt.key)
                          setTriggerAppView("list")
                          setSelectedTriggerApp(null)
                          setSelectedTriggerAction(null)
                          setTriggerActionSearch("")
                          setTriggerAppSearch("")
                        }}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-sm font-medium cursor-pointer transition-all",
                          triggerType === tt.key
                            ? "bg-brand-deep-purple text-white"
                            : "bg-gray-03 text-foreground/55 hover:bg-gray-04 hover:text-foreground/70"
                        )}
                      >
                        {tt.label}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {triggerAppView === "list" && triggerType && triggerType !== "app" && (
                  <p className="text-sm text-foreground/55">
                    {TRIGGER_TYPES.find((t) => t.key === triggerType)?.description}
                  </p>
                )}

                {triggerType === "app" && triggerAppView === "list" && (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground/55">
                      {TRIGGER_TYPES.find((t) => t.key === "app")?.description}
                    </p>

                    <SearchInput
                      placeholder="Search app connectors"
                      value={triggerAppSearch}
                      onChange={(e) => setTriggerAppSearch(e.target.value)}
                      onClear={() => setTriggerAppSearch("")}
                      className="h-11"
                    />

                    <ScrollArea className="h-[220px]">
                      <div className="space-y-0.5">
                        {triggerAppComponents.map((comp) => {
                          const triggerCount = MOCK_TRIGGERS[comp.key]?.length ?? 0
                          return (
                            <button
                              key={comp.key}
                              onClick={() => {
                                setSelectedTriggerApp(comp)
                                setTriggerAppView("triggers")
                                setTriggerAppSearch("")
                                setTriggerActionSearch("")
                              }}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left cursor-pointer transition-colors hover:bg-gray-02"
                            >
                              <ComponentIcon color={comp.iconColor} initials={comp.iconInitials} size="sm" />
                              <span className="min-w-0 flex-1 text-sm font-medium text-foreground/85 truncate">
                                {comp.label}
                              </span>
                              <span className="shrink-0 text-xs text-foreground/45">
                                {triggerCount} trigger{triggerCount !== 1 ? "s" : ""}
                              </span>
                              <UilAngleRight className="size-4 shrink-0 text-foreground/35" />
                            </button>
                          )
                        })}
                        {triggerAppComponents.length === 0 && (
                          <div className="py-6 text-center text-sm text-foreground/45">
                            No app connectors found.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {triggerType === "app" && triggerAppView === "triggers" && selectedTriggerApp && (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setTriggerAppView("list")
                        setSelectedTriggerApp(null)
                        setSelectedTriggerAction(null)
                        setTriggerActionSearch("")
                      }}
                      className="flex items-center gap-0.5 text-sm text-foreground/55 hover:text-foreground/85 cursor-pointer"
                    >
                      <UilAngleLeft className="size-5" />
                      Back
                    </button>

                    <div className="flex items-center gap-3">
                      <ComponentIcon color={selectedTriggerApp.iconColor} initials={selectedTriggerApp.iconInitials} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-foreground/85">{selectedTriggerApp.label}</span>
                        <div className="text-xs text-foreground/50">{selectedTriggerApp.description}</div>
                      </div>
                    </div>

                    <SearchInput
                      placeholder="Search triggers"
                      value={triggerActionSearch}
                      onChange={(e) => setTriggerActionSearch(e.target.value)}
                      onClear={() => setTriggerActionSearch("")}
                    />

                    <ScrollArea className="h-[160px]">
                      <div className="space-y-2">
                        {filteredTriggerActions.map((trigger) => (
                          <button
                            key={trigger.name}
                            onClick={() => {
                              setSelectedTriggerAction(trigger.name)
                              const hasConnections = selectedTriggerApp.connectionType !== "none" && selectedTriggerApp.connections.length > 0
                              if (hasConnections) {
                                setTriggerAppView("connections")
                              }
                            }}
                            className={cn(
                              "flex w-full flex-col rounded-lg border bg-white px-4 py-3 text-left cursor-pointer transition-all",
                              selectedTriggerAction === trigger.name
                                ? "border-brand-mint shadow-sm"
                                : "border-gray-04 hover:border-gray-06 hover:shadow-sm"
                            )}
                          >
                            <span className="text-sm font-semibold text-foreground/85">{trigger.name}</span>
                            <span className="mt-0.5 text-xs text-foreground/50 line-clamp-2">{trigger.description}</span>
                          </button>
                        ))}
                        {filteredTriggerActions.length === 0 && (
                          <div className="py-6 text-center text-sm text-foreground/45">No triggers found.</div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {triggerType === "app" && triggerAppView === "connections" && selectedTriggerApp && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <ComponentIcon color={selectedTriggerApp.iconColor} initials={selectedTriggerApp.iconInitials} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-foreground/85">{selectedTriggerApp.label}</span>
                        <div className="text-xs text-foreground/50">{selectedTriggerApp.description}</div>
                      </div>
                    </div>

                    {/* Configured Connections (build-only) */}
                    {triggerConfiguredConnections.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
                            Configured Connections
                          </span>
                          <span className="text-xs text-foreground/35">({triggerConfiguredConnections.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {triggerConfiguredConnections.map((ccv) => (
                            <ConnectionListItem
                              key={ccv.id}
                              connection={ccv}
                              onClick={() => handleCreate(ccv.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Available Connections */}
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
                          Available Connections
                        </span>
                        <span className="text-xs text-foreground/35">({triggerAvailableConnections.length})</span>
                      </div>
                      {triggerAvailableConnections.length > 0 ? (
                        <div className="space-y-1.5">
                          {triggerAvailableConnections.map((ccv) => (
                            <ConnectionListItem
                              key={ccv.id}
                              connection={ccv}
                              onClick={() => {
                                if (ccv.managedBy === "build-only") {
                                  const newId = activateConnection(ccv.id)
                                  handleCreate(newId ?? ccv.id)
                                } else {
                                  setPreselectedConnectionId(ccv.id)
                                  setAddConnectionComponent(selectedTriggerApp)
                                }
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-06 bg-white px-4 py-3 text-center">
                          <p className="text-xs text-foreground/45">No available connections</p>
                        </div>
                      )}
                    </div>

                    {/* Create Connection */}
                    <button
                      onClick={() => setAddConnectionComponent(selectedTriggerApp)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-06 bg-white px-4 py-3 cursor-pointer text-sm font-medium text-foreground/55 transition-all hover:border-brand-mint hover:text-brand-mint hover:shadow-sm"
                    >
                      <UilPlus className="size-4" />
                      Create Connection
                    </button>
                  </div>
                )}

                {triggerType === "universal-webhook" && (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-foreground/55">
                        Response Type
                      </label>
                      <div className="flex items-center justify-between rounded border border-gray-04 bg-white px-3 py-2 text-sm text-foreground/85">
                        <span>{RESPONSE_TYPE_OPTIONS[0]}</span>
                        <UilAngleDown className="size-4 text-foreground/35" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-foreground/55">
                        Response Status Code
                      </label>
                      <div className="flex items-center justify-between rounded border border-gray-04 bg-white px-3 py-2 text-sm text-foreground/85">
                        <span>{RESPONSE_STATUS_OPTIONS[0]}</span>
                        <UilAngleDown className="size-4 text-foreground/35" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-foreground/55">
                        Response Content Type
                      </label>
                      <div className="flex items-center justify-between rounded border border-gray-04 bg-white px-3 py-2 text-sm text-foreground/85">
                        <span>{RESPONSE_CONTENT_OPTIONS[0]}</span>
                        <UilAngleDown className="size-4 text-foreground/35" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Components with tier classification */}
            {newIntegrationStep === "components" && (
              <div className="flex gap-4">
                {/* Left: Search + Grid */}
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground/85">
                      Quick start components
                    </label>
                    <p className="mb-3 text-xs text-foreground/55">
                      Select components and classify them as Required or Recommended.
                    </p>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <UilSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground/35" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search components..."
                      className="h-9 pl-8 text-sm"
                      autoFocus
                    />
                  </div>

                  {/* Category pills */}
                  <div className="flex gap-1.5">
                    {CATEGORY_FILTERS.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setCategoryFilter(cat.key)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-all",
                          categoryFilter === cat.key
                            ? "bg-brand-deep-purple text-white"
                            : "bg-gray-03 text-foreground/55 hover:bg-gray-04"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Grid */}
                  <ScrollArea className="h-[280px] pr-2">
                    <div className="grid grid-cols-2 gap-2">
                      {filteredComponents.map((comp) => {
                        const selected = preSelectedComponents.includes(comp.key)
                        const tier = selected ? getPreSelectedTier(comp.key) : null
                        return (
                          <button
                            key={comp.key}
                            onClick={() => togglePreSelectedComponent(comp.key)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg border p-2.5 text-left cursor-pointer transition-all",
                              selected && showClassifications && tier === "required"
                                ? "border-brand-mint bg-brand-mint/5"
                                : selected && showClassifications && tier === "recommended"
                                  ? "border-amber-500/50 bg-amber-50/50"
                                  : selected && !showClassifications
                                    ? "border-brand-deep-purple bg-brand-deep-purple/5"
                                    : "border-gray-04 hover:border-gray-06"
                            )}
                          >
                            <div className="relative shrink-0">
                              <ComponentIcon color={comp.iconColor} initials={comp.iconInitials} size="sm" />
                              {showClassifications && selected && tier && (
                                <TierDecorator
                                  tier={tier}
                                  className="absolute -top-1 -right-1"
                                />
                              )}
                            </div>
                            <span className="truncate text-sm font-medium text-foreground/85">
                              {comp.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {showClassifications && (
                  <div className="shrink-0 w-56">
                    <div className="h-full w-56 rounded-lg border border-gray-04 bg-gray-02 p-3">
                      <ScrollArea className="h-[370px]">
                        <div className="space-y-3">
                          {!hasSelections && (
                            <div className="flex flex-col items-center justify-center py-8 px-3 text-center">
                              <UilStar className="mb-2 size-6 text-foreground/20" />
                              <p className="text-xs font-medium text-foreground/50">Classify Components</p>
                              <p className="mt-1 text-[11px] text-foreground/35">
                                Click components on the left, then set them as Required or Recommended to guide integration builders.
                              </p>
                            </div>
                          )}

                          {requiredSelections.length > 0 && (
                            <div>
                              <div className="mb-1.5 flex items-center gap-1.5">
                                <div className="size-2 rounded-full bg-brand-mint" />
                                <span className="text-[11px] font-semibold text-foreground/55">
                                  REQUIRED ({requiredSelections.length})
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                {requiredSelections.map((comp) => (
                                  <SelectionRow
                                    key={comp.key}
                                    comp={comp}
                                    tier="required"
                                    onPromote={() => {}}
                                    onDemote={() => setPreSelectedTier(comp.key, "recommended")}
                                    onRemove={() => togglePreSelectedComponent(comp.key)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {recommendedSelections.length > 0 && (
                            <div>
                              <div className="mb-1.5 flex items-center gap-1.5">
                                <div className="size-2 rounded-full bg-amber-500" />
                                <span className="text-[11px] font-semibold text-foreground/55">
                                  RECOMMENDED ({recommendedSelections.length})
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                {recommendedSelections.map((comp) => (
                                  <SelectionRow
                                    key={comp.key}
                                    comp={comp}
                                    tier="recommended"
                                    onPromote={() => setPreSelectedTier(comp.key, "required")}
                                    onDemote={() => {}}
                                    onRemove={() => togglePreSelectedComponent(comp.key)}
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
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-04 px-6 py-4">
            <div>
              {newIntegrationStep !== "name" && (
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => {
                    if (newIntegrationStep === "trigger") setNewIntegrationStep("name")
                    else if (newIntegrationStep === "components") setNewIntegrationStep("trigger")
                  }}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {newIntegrationStep === "name" && (
                <Button
                  size="sm"
                  disabled={!canProceedFromName}
                  onClick={() => setNewIntegrationStep("trigger")}
                >
                  Next
                </Button>
              )}

              {newIntegrationStep === "trigger" && (
                <Button
                  size="sm"
                  className="bg-brand-mint hover:bg-brand-mint/90 text-white"
                  disabled={!canProceedFromTrigger}
                  onClick={() => handleCreate()}
                >
                  Create
                </Button>
              )}

              {newIntegrationStep === "components" && (
                <Button
                  size="sm"
                  className="bg-brand-mint hover:bg-brand-mint/90 text-white"
                  onClick={() => handleCreate()}
                >
                  Create
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {(showClassifications ? ["name", "trigger", "components"] : ["name", "trigger"]).map((step, i, steps) => (
            <div
              key={step}
              className={cn(
                "size-2 rounded-full transition-all",
                newIntegrationStep === step
                  ? "bg-brand-deep-purple"
                  : i < steps.indexOf(newIntegrationStep)
                    ? "bg-brand-mint"
                    : "bg-gray-05"
              )}
            />
          ))}
        </div>
      </div>

      {addConnectionComponent && (
        <AddConnectionModal
          open={!!addConnectionComponent}
          onOpenChange={(open) => {
            if (!open) {
              setAddConnectionComponent(null)
              setPreselectedConnectionId(null)
            }
          }}
          component={addConnectionComponent}
          preselectedConnectionId={preselectedConnectionId}
          onCreated={(connectionId) => handleCreate(connectionId)}
        />
      )}
    </div>
  )
}

interface SelectionRowProps {
  comp: { key: string; label: string; iconColor: string; iconInitials: string }
  tier: "required" | "recommended"
  onPromote: () => void
  onDemote: () => void
  onRemove: () => void
}

const SelectionRow = ({ comp, tier, onPromote, onDemote, onRemove }: SelectionRowProps) => (
  <div className="group flex items-center gap-2 rounded px-1.5 py-1 hover:bg-white">
    <ComponentIcon color={comp.iconColor} initials={comp.iconInitials} size="sm" className="!size-5 !rounded !text-[8px]" />
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
