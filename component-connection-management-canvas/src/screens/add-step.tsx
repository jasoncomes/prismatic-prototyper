import { useState, useMemo } from "react"
import UilArrowLeft from "@iconscout/react-unicons/icons/uil-arrow-left"
import UilCheck from "@iconscout/react-unicons/icons/uil-check"
import UilTimes from "@iconscout/react-unicons/icons/uil-times"
import UilSetting from "@iconscout/react-unicons/icons/uil-setting"
import UilHistory from "@iconscout/react-unicons/icons/uil-history"
import UilApps from "@iconscout/react-unicons/icons/uil-apps"
import UilFileAlt from "@iconscout/react-unicons/icons/uil-file-alt"
import UilBracketsCurly from "@iconscout/react-unicons/icons/uil-brackets-curly"
import UilLink from "@iconscout/react-unicons/icons/uil-link"
import UilRobot from "@iconscout/react-unicons/icons/uil-robot"
import UilCodeBranch from "@iconscout/react-unicons/icons/uil-code-branch"
import UilWrench from "@iconscout/react-unicons/icons/uil-wrench"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SearchInput } from "@/components/search-input"
import { ComponentIcon } from "@/components/component-icon"
import { TierChip } from "@/components/tier-chip"
import { StatusIndicator } from "@/components/status-indicator"
import { useStore } from "@/data/store"
import { COMPONENTS, MOCK_ACTIONS, DEFAULT_ACTIONS } from "@/data/components"
import type { Component, Tier } from "@/data/types"
import { cn } from "@/lib/utils"

const SIDEBAR_ICONS = [
  { Icon: UilSetting, label: "Settings" },
  { Icon: UilSetting, label: "Config" },
  { Icon: UilHistory, label: "History" },
  { Icon: UilBracketsCurly, label: "Code" },
  { Icon: UilApps, label: "Components", active: true },
  { Icon: UilFileAlt, label: "Docs" },
]

const CATEGORY_CARDS = [
  { key: "logic", label: "Logic", Icon: UilCodeBranch, color: "#EC4899" },
  { key: "helper", label: "Helpers", Icon: UilWrench, color: "#14B8A6" },
  { key: "app", label: "App", Icon: UilRobot, color: "#6366F1" },
]

const TIER_BORDER_COLORS: Record<string, string> = {
  required: "border-l-brand-mint",
  recommended: "border-l-amber-500",
  "in-use": "border-l-gray-06",
}

const TieredSection = ({
  tier,
  label,
  components,
  isInFlow,
  onSelect,
  getConnectionHealth,
}: {
  tier: Tier | "in-use"
  label?: string
  components: Component[]
  isInFlow: (key: string) => boolean
  onSelect: (key: string) => void
  getConnectionHealth: (key: string) => "connected" | "partial" | "disconnected" | "none"
}) => {
  if (components.length === 0) return null

  return (
    <div
      className={cn(
        "mb-4 rounded-lg border-l-4 bg-white p-3",
        TIER_BORDER_COLORS[tier] ?? "border-l-gray-06"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {tier !== "in-use" ? (
          <TierChip tier={tier as Tier} />
        ) : (
          <span className="rounded bg-gray-04 px-1.5 py-0.5 text-[10px] font-semibold text-foreground/55">
            {label ?? "In Use"}
          </span>
        )}
        <span className="text-xs text-foreground/55">
          {components.length} component{components.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {components.map((comp) => {
          const inFlow = isInFlow(comp.key)
          const connHealth = getConnectionHealth(comp.key)
          const hasConnections = comp.connections.length > 0
          return (
            <button
              key={comp.key}
              onClick={() => onSelect(comp.key)}
              className={cn(
                "group relative flex flex-col items-center gap-1 rounded-lg px-2 py-3 cursor-pointer transition-all hover:bg-gray-03"
              )}
            >
              <div className="relative">
                <ComponentIcon color={comp.iconColor} initials={comp.iconInitials} size="lg" />
                {inFlow && (
                  <div className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-brand-mint">
                    <UilCheck className="size-3.5 text-white" />
                  </div>
                )}
                {hasConnections && !inFlow && (
                  <div className="absolute -bottom-0.5 -right-0.5">
                    {connHealth === "connected" ? (
                      <StatusIndicator variant="success" size="sm" className="!size-3.5" />
                    ) : connHealth === "partial" ? (
                      <StatusIndicator variant="warning" size="sm" className="!size-3.5" />
                    ) : (
                      <div className="flex size-3.5 items-center justify-center rounded-full border border-gray-06 bg-white">
                        <UilLink className="size-2 text-foreground/35" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-foreground/70 text-center">
                {comp.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const AddStepScreen = () => {
  const {
    setScreen,
    getTier,
    isComponentInFlow,
    componentTiers,
    setSelectedComponentKey,
    getComponentConnectionHealth,
    addFlowStep,
    showClassifications,
  } = useStore()
  const [search, setSearch] = useState("")
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const required = useMemo(
    () =>
      COMPONENTS.filter(
        (c) =>
          componentTiers.find((ct) => ct.componentKey === c.key)?.tier === "required"
      ),
    [componentTiers]
  )

  const recommended = useMemo(
    () =>
      COMPONENTS.filter(
        (c) =>
          componentTiers.find((ct) => ct.componentKey === c.key)?.tier === "recommended"
      ),
    [componentTiers]
  )

  const inUse = useMemo(
    () => {
      const classifiedKeys = new Set(componentTiers.map((ct) => ct.componentKey))
      return COMPONENTS.filter(
        (c) => isComponentInFlow(c.key) && !classifiedKeys.has(c.key)
      )
    },
    [componentTiers, isComponentInFlow]
  )

  const allComponents = useMemo(() => {
    let list = COMPONENTS
    if (activeCategory) {
      list = list.filter((c) => c.category === activeCategory)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
    }
    // Sort: required first, then recommended, then in-use, then rest
    return [...list].sort((a, b) => {
      const tierOrder = { required: 0, recommended: 1, optional: 2 }
      return tierOrder[getTier(a.key)] - tierOrder[getTier(b.key)]
    })
  }, [search, activeCategory, getTier])

  const handleComponentSelect = (key: string) => {
    if (expandedComponent === key) {
      setExpandedComponent(null)
    } else {
      setExpandedComponent(key)
    }
  }

  const handleActionSelect = (componentKey: string) => {
    const comp = COMPONENTS.find((c) => c.key === componentKey)
    const actionName = MOCK_ACTIONS[componentKey]?.[0]?.name ?? "Execute"
    addFlowStep({
      id: `step-${Date.now()}`,
      componentKey,
      actionName,
    })
    if (comp && comp.connectionType !== "none") {
      setSelectedComponentKey(componentKey)
      setScreen("connection-setup")
    } else {
      setScreen("designer")
    }
  }

  return (
    <div className="flex h-screen">
      {/* Light sidebar */}
      <div className="flex w-14 flex-col items-center gap-1 border-r border-gray-04 bg-white py-4">
        <div className="mb-4 flex size-8 items-center justify-center rounded bg-gray-04">
          <span className="text-xs font-bold text-foreground/70">P</span>
        </div>
        {SIDEBAR_ICONS.map(({ Icon, label, active }) => (
          <button
            key={label}
            className={cn(
              "flex size-9 items-center justify-center rounded cursor-pointer transition-colors",
              active
                ? "bg-gray-04 text-foreground/85"
                : "text-foreground/40 hover:bg-gray-03 hover:text-foreground/70"
            )}
          >
            <Icon className="size-[18px]" />
          </button>
        ))}
      </div>

      {/* Designer canvas background (dimmed) */}
      <div className="relative flex-1 bg-gray-03">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle, #D6DEE3 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* AddStep Panel */}
      <div className="flex w-[400px] flex-col border-l border-gray-04 bg-white">
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-gray-04 px-4 py-3">
          <div className="flex items-center gap-3">
            {expandedComponent ? (
              <button
                onClick={() => setExpandedComponent(null)}
                className="flex size-8 items-center justify-center rounded cursor-pointer hover:bg-gray-03"
              >
                <UilArrowLeft className="size-5 text-foreground/55" />
              </button>
            ) : activeCategory ? (
              <button
                onClick={() => setActiveCategory(null)}
                className="flex size-8 items-center justify-center rounded cursor-pointer hover:bg-gray-03"
              >
                <UilArrowLeft className="size-5 text-foreground/55" />
              </button>
            ) : null}
            <h3 className="text-sm font-semibold text-foreground/85">
              {expandedComponent
                ? "Actions"
                : activeCategory
                  ? CATEGORY_CARDS.find((c) => c.key === activeCategory)?.label ?? "Components"
                  : "Add a step"}
            </h3>
          </div>
          <button
            onClick={() => setScreen("designer")}
            className="flex size-8 items-center justify-center rounded cursor-pointer hover:bg-gray-03"
          >
            <UilTimes className="size-5 text-foreground/55" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* Expanded component actions */}
            {expandedComponent && (() => {
              const comp = COMPONENTS.find((c) => c.key === expandedComponent)
              if (!comp) return null
              const actions = MOCK_ACTIONS[expandedComponent] ?? DEFAULT_ACTIONS
              return (
                <div>
                  <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-04 p-3">
                    <ComponentIcon color={comp.iconColor} initials={comp.iconInitials} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground/85">{comp.label}</div>
                      <div className="text-xs text-foreground/55">{comp.description}</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <SearchInput
                      placeholder="Search actions"
                      value=""
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    {actions.map((action) => (
                      <button
                        key={action.name}
                        onClick={() => handleActionSelect(expandedComponent)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left cursor-pointer transition-colors hover:bg-gray-03"
                      >
                        <div>
                          <div className="text-sm font-medium text-foreground/85">{action.name}</div>
                          <div className="text-xs text-foreground/55">{action.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Main view (no component expanded) */}
            {!expandedComponent && (
              <>
                {/* Search */}
                <div className="mb-4">
                  <SearchInput
                    placeholder="Search apps, actions, and tools"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClear={() => setSearch("")}
                    className="h-10"
                  />
                </div>

                {!search && !activeCategory && (
                  <>
                    {/* Category cards */}
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      {CATEGORY_CARDS.map((cat) => (
                        <button
                          key={cat.key}
                          onClick={() => setActiveCategory(cat.key)}
                          className="flex flex-col items-center gap-2 rounded-lg border border-gray-04 bg-white p-3 cursor-pointer transition-all hover:border-gray-06 hover:shadow-sm"
                        >
                          <div
                            className="flex size-10 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${cat.color}15` }}
                          >
                            <cat.Icon className="size-5" style={{ color: cat.color }} />
                          </div>
                          <span className="text-[11px] font-medium text-foreground/70">{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    {showClassifications && (
                      <>
                        <TieredSection
                          tier="required"
                          components={required}
                          isInFlow={isComponentInFlow}
                          onSelect={handleComponentSelect}
                          getConnectionHealth={getComponentConnectionHealth}
                        />
                        <TieredSection
                          tier="recommended"
                          components={recommended}
                          isInFlow={isComponentInFlow}
                          onSelect={handleComponentSelect}
                          getConnectionHealth={getComponentConnectionHealth}
                        />
                      </>
                    )}
                  </>
                )}

                {/* Component list (when searching or category selected) */}
                {(search || activeCategory) && (
                  <div className="space-y-1">
                    {allComponents.map((comp) => {
                      const tier = getTier(comp.key)
                      const inFlow = isComponentInFlow(comp.key)
                      return (
                        <button
                          key={comp.key}
                          onClick={() => handleComponentSelect(comp.key)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left cursor-pointer transition-colors hover:bg-gray-03",
                            expandedComponent === comp.key && "bg-gray-03"
                          )}
                        >
                          <div className="relative">
                            <ComponentIcon
                              color={comp.iconColor}
                              initials={comp.iconInitials}
                              size="sm"
                            />
                            {inFlow && (
                              <div className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-brand-mint">
                                <UilCheck className="size-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-foreground/85 truncate">
                                {comp.label}
                              </span>
                              {showClassifications && tier !== "optional" && <TierChip tier={tier} />}
                            </div>
                            <div className="text-xs text-foreground/55 truncate">
                              {comp.description}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    {allComponents.length === 0 && (
                      <div className="py-8 text-center text-sm text-foreground/45">
                        No components found.
                      </div>
                    )}
                  </div>
                )}

                {/* In Use section */}
                {!search && !activeCategory && (
                  <TieredSection
                    tier="in-use"
                    label="In Use"
                    components={inUse}
                    isInFlow={isComponentInFlow}
                    onSelect={handleComponentSelect}
                    getConnectionHealth={getComponentConnectionHealth}
                  />
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
