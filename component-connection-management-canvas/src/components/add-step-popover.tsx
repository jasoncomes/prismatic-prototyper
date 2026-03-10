import { useState, useMemo } from "react"
import UilTimes from "@iconscout/react-unicons/icons/uil-times"
import UilAngleRight from "@iconscout/react-unicons/icons/uil-angle-right"
import UilAngleLeft from "@iconscout/react-unicons/icons/uil-angle-left"
import UilPlus from "@iconscout/react-unicons/icons/uil-plus"
import { SearchInput } from "@/components/search-input"
import { ComponentIcon } from "@/components/component-icon"
import { ConnectionListItem } from "@/components/connection-list-item"
import { useStore } from "@/data/store"
import { COMPONENTS, MOCK_ACTIONS, DEFAULT_ACTIONS, CATEGORY_LABELS } from "@/data/components"
import type { Component } from "@/data/types"

type PopoverView = "home" | "components" | "actions" | "connections"

const CATEGORY_CARDS = [
  {
    key: "logic",
    label: "Logic",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    ),
  },
  {
    key: "helper",
    label: "Helpers",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    key: "app",
    label: "App",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
  },
]

interface AddStepPopoverProps {
  onClose: () => void
  onAddConnection: (component: Component, preselectedConnectionId?: string, stepId?: string) => void
}

export const AddStepPopover = ({ onClose, onAddConnection }: AddStepPopoverProps) => {
  const {
    isComponentInFlow,
    addFlowStep,
    linkStepConnection,
    getComponentConnectionVars,
    getAvailableConnections,
    activateConnection,
  } = useStore()

  const [view, setView] = useState<PopoverView>("home")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [search, setSearch] = useState("")
  const [lastAddedStepId, setLastAddedStepId] = useState<string | null>(null)

  const inUseComponents = useMemo(
    () => COMPONENTS.filter((c) => isComponentInFlow(c.key)),
    [isComponentInFlow]
  )

  const filteredComponents = useMemo(() => {
    let list = COMPONENTS.filter((c) => c.category === activeCategory)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeCategory, search])

  const filteredActions = useMemo(() => {
    if (!selectedComponent) return []
    const actions = MOCK_ACTIONS[selectedComponent.key] ?? DEFAULT_ACTIONS
    if (!search) return actions
    const q = search.toLowerCase()
    return actions.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    )
  }, [selectedComponent, search])

  const configuredConnections = useMemo(() => {
    if (!selectedComponent) return []
    return getComponentConnectionVars(selectedComponent.key)
  }, [selectedComponent, getComponentConnectionVars])

  const availableConnections = useMemo(() => {
    if (!selectedComponent) return []
    return getAvailableConnections(selectedComponent.key)
  }, [selectedComponent, getAvailableConnections])

  const handleCategorySelect = (key: string) => {
    setActiveCategory(key)
    setSearch("")
    setView("components")
  }

  const handleComponentSelect = (comp: Component) => {
    setSelectedComponent(comp)
    setSearch("")
    setView("actions")
  }

  const handleActionSelect = (actionName: string) => {
    if (!selectedComponent) return

    const stepId = `step-${Date.now()}`
    addFlowStep({
      id: stepId,
      componentKey: selectedComponent.key,
      actionName,
    })
    setLastAddedStepId(stepId)

    if (selectedComponent.connectionType !== "none" && selectedComponent.connections.length > 0) {
      setView("connections")
    } else {
      onClose()
    }
  }

  const handleBack = () => {
    setSearch("")
    if (view === "connections") {
      setView("actions")
    } else if (view === "actions") {
      setSelectedComponent(null)
      setView("components")
    } else if (view === "components") {
      setActiveCategory(null)
      setView("home")
    }
  }

  const title =
    view === "connections"
      ? "Connections"
      : view === "actions"
        ? "Actions"
        : view === "components"
          ? CATEGORY_LABELS[activeCategory ?? ""] ?? "Components"
          : "Add a step"

  return (
    <div className="flex w-[400px] max-h-[520px] flex-col overflow-hidden rounded-xl border border-gray-04 bg-white shadow-lg">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
        <div className="flex items-center gap-2">
          {view !== "home" && (
            <>
              <button
                onClick={handleBack}
                className="flex items-center gap-0.5 text-sm text-foreground/55 hover:text-foreground/85 cursor-pointer"
              >
                <UilAngleLeft className="size-5" />
                Back
              </button>
              <div className="mx-1 h-4 w-px bg-gray-06" />
            </>
          )}
          <h3 className="text-base font-semibold text-foreground/85">{title}</h3>
        </div>
        <button
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded cursor-pointer text-foreground/45 hover:text-foreground/70"
        >
          <UilTimes className="size-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-5 pt-3 pb-5">
          {/* ── Home view ── */}
          {view === "home" && (
            <>
              <SearchInput
                placeholder="Search apps, actions, and tools"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch("")}
                className="mb-4"
              />

              {!search ? (
                <>
                  <div className="mb-5 grid grid-cols-3 gap-3">
                    {CATEGORY_CARDS.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => handleCategorySelect(cat.key)}
                        className="flex flex-col items-center gap-2.5 rounded-xl border border-gray-04 bg-white px-3 py-4 cursor-pointer transition-all hover:border-gray-06 hover:shadow-sm"
                      >
                        <div className="text-foreground/40">{cat.icon}</div>
                        <span className="text-xs font-medium text-foreground/70">{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {inUseComponents.length > 0 && (
                    <div>
                      <span className="mb-2 block text-sm font-semibold text-foreground/70">In use</span>
                      <div className="flex flex-wrap gap-2">
                        {inUseComponents.map((comp) => (
                          <button
                            key={comp.key}
                            onClick={() => handleComponentSelect(comp)}
                            className="cursor-pointer transition-transform hover:scale-105"
                          >
                            <ComponentIcon color={comp.iconColor} initials={comp.iconInitials} size="sm" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <SearchResults search={search} onSelect={handleComponentSelect} />
              )}
            </>
          )}

          {/* ── Component list view ── */}
          {view === "components" && (
            <>
              <SearchInput
                placeholder="Search components"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch("")}
                className="mb-3"
              />
              <div className="space-y-0.5">
                {filteredComponents.map((comp) => {
                  const actionCount = (MOCK_ACTIONS[comp.key] ?? DEFAULT_ACTIONS).length
                  return (
                    <button
                      key={comp.key}
                      onClick={() => handleComponentSelect(comp)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left cursor-pointer transition-colors hover:bg-gray-02"
                    >
                      <ComponentIcon color={comp.iconColor} initials={comp.iconInitials} size="sm" />
                      <span className="min-w-0 flex-1 text-sm font-medium text-foreground/85 truncate">{comp.label}</span>
                      <span className="shrink-0 text-xs text-foreground/45">{actionCount} action{actionCount !== 1 ? "s" : ""}</span>
                      <UilAngleRight className="size-4 shrink-0 text-foreground/35" />
                    </button>
                  )
                })}
                {filteredComponents.length === 0 && (
                  <div className="py-8 text-center text-sm text-foreground/45">No components found.</div>
                )}
              </div>
            </>
          )}

          {/* ── Actions view ── */}
          {view === "actions" && selectedComponent && (
            <>
              <div className="mb-4 flex items-center gap-3">
                <ComponentIcon color={selectedComponent.iconColor} initials={selectedComponent.iconInitials} size="sm" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-foreground/85">{selectedComponent.label}</span>
                  <div className="text-xs text-foreground/50">{selectedComponent.description}</div>
                </div>
              </div>

              <SearchInput
                placeholder="Search actions"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch("")}
                className="mb-3"
              />

              <div className="space-y-2">
                {filteredActions.map((action) => (
                  <button
                    key={action.name}
                    onClick={() => handleActionSelect(action.name)}
                    className="flex w-full flex-col rounded-lg border border-gray-04 bg-white px-4 py-3 text-left cursor-pointer transition-all hover:border-gray-06 hover:shadow-sm"
                  >
                    <span className="text-sm font-semibold text-foreground/85">{action.name}</span>
                    <span className="mt-0.5 text-xs text-foreground/50 line-clamp-2">{action.description}</span>
                  </button>
                ))}
                {filteredActions.length === 0 && (
                  <div className="py-8 text-center text-sm text-foreground/45">No actions found.</div>
                )}
              </div>
            </>
          )}

          {/* ── Connections view ── */}
          {view === "connections" && selectedComponent && (
            <>
              <div className="mb-4 flex items-center gap-3">
                <ComponentIcon color={selectedComponent.iconColor} initials={selectedComponent.iconInitials} size="sm" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-foreground/85">{selectedComponent.label}</span>
                  <div className="text-xs text-foreground/50">{selectedComponent.description}</div>
                </div>
              </div>

              {/* Configured Connections */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
                    Configured Connections
                  </span>
                  <span className="text-xs text-foreground/35">({configuredConnections.length})</span>
                </div>
                {configuredConnections.length > 0 ? (
                  <div className="space-y-1.5">
                    {configuredConnections.map((ccv) => (
                      <ConnectionListItem
                        key={ccv.id}
                        connection={ccv}
                        onClick={() => {
                          if (lastAddedStepId) linkStepConnection(lastAddedStepId, ccv.id)
                          onClose()
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-06 bg-white px-4 py-3 text-center">
                    <p className="text-xs text-foreground/45">No configured connections</p>
                  </div>
                )}
              </div>

              {/* Available Connections */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
                    Available Connections
                  </span>
                  <span className="text-xs text-foreground/35">({availableConnections.length})</span>
                </div>
                {availableConnections.length > 0 ? (
                  <div className="space-y-1.5">
                    {availableConnections.map((ccv) => (
                      <ConnectionListItem
                        key={ccv.id}
                        connection={ccv}
                        onClick={() => {
                          if (ccv.managedBy === "build-only") {
                            const newId = activateConnection(ccv.id)
                            if (lastAddedStepId && newId) linkStepConnection(lastAddedStepId, newId)
                            onClose()
                          } else {
                            onAddConnection(selectedComponent!, ccv.id, lastAddedStepId ?? undefined)
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
                onClick={() => onAddConnection(selectedComponent)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-06 bg-white px-4 py-3 cursor-pointer text-sm font-medium text-foreground/55 transition-all hover:border-brand-mint hover:text-brand-mint hover:shadow-sm"
              >
                <UilPlus className="size-4" />
                Create Connection
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const SearchResults = ({
  search,
  onSelect,
}: {
  search: string
  onSelect: (comp: Component) => void
}) => {
  const results = useMemo(() => {
    const q = search.toLowerCase()
    return COMPONENTS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <div className="space-y-0.5">
      {results.map((comp) => {
        const actionCount = (MOCK_ACTIONS[comp.key] ?? DEFAULT_ACTIONS).length
        return (
          <button
            key={comp.key}
            onClick={() => onSelect(comp)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left cursor-pointer transition-colors hover:bg-gray-02"
          >
            <ComponentIcon color={comp.iconColor} initials={comp.iconInitials} size="sm" />
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground/85 truncate">{comp.label}</span>
              <span className="block text-xs text-foreground/45 truncate">{comp.description}</span>
            </div>
            <span className="shrink-0 text-xs text-foreground/45">{actionCount} action{actionCount !== 1 ? "s" : ""}</span>
            <UilAngleRight className="size-4 shrink-0 text-foreground/35" />
          </button>
        )
      })}
      {results.length === 0 && (
        <div className="py-8 text-center text-sm text-foreground/45">No results found.</div>
      )}
    </div>
  )
}
