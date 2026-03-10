import { useState } from "react"
import UilApps from "@iconscout/react-unicons/icons/uil-apps"
import UilPlus from "@iconscout/react-unicons/icons/uil-plus"
import UilSetting from "@iconscout/react-unicons/icons/uil-setting"
import UilPlay from "@iconscout/react-unicons/icons/uil-play"
import UilHistory from "@iconscout/react-unicons/icons/uil-history"
import UilFileAlt from "@iconscout/react-unicons/icons/uil-file-alt"
import UilArrowLeft from "@iconscout/react-unicons/icons/uil-arrow-left"
import UilStar from "@iconscout/react-unicons/icons/uil-star"
import UilBracketsCurly from "@iconscout/react-unicons/icons/uil-brackets-curly"
import UilQuestionCircle from "@iconscout/react-unicons/icons/uil-question-circle"
import UilAngleDown from "@iconscout/react-unicons/icons/uil-angle-down"
import UilColumns from "@iconscout/react-unicons/icons/uil-columns"
import UilGrid from "@iconscout/react-unicons/icons/uil-grid"
import UilChannel from "@iconscout/react-unicons/icons/uil-channel"
import UilSearchPlus from "@iconscout/react-unicons/icons/uil-search-plus"
import UilSearchMinus from "@iconscout/react-unicons/icons/uil-search-minus"
import UilExpandArrows from "@iconscout/react-unicons/icons/uil-expand-arrows"
import UilFocusTarget from "@iconscout/react-unicons/icons/uil-focus-target"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useStore } from "@/data/store"
import { COMPONENTS } from "@/data/components"
import { TierDecorator } from "@/components/tier-decorator"
import { ConnectionHealthDot } from "@/components/connection-health-dot"
import { AddStepPopover } from "@/components/add-step-popover"
import { AddConnectionModal } from "@/components/add-connection-modal"
import { StepConfigPanel } from "@/components/step-config-panel"
import type { Component } from "@/data/types"
import { cn } from "@/lib/utils"

type SidebarEntry = {
  Icon: React.ComponentType<{ className?: string }>
  label: string
  key: string
}

const SIDEBAR_ICONS: SidebarEntry[] = [
  { Icon: UilSetting, label: "Settings", key: "settings" },
  { Icon: UilSetting, label: "Config", key: "config" },
  { Icon: UilHistory, label: "History", key: "history" },
  { Icon: UilBracketsCurly, label: "Code", key: "code" },
  { Icon: UilApps, label: "Components", key: "components" },
  { Icon: UilFileAlt, label: "Docs", key: "docs" },
]

const VIEW_ICONS = [UilChannel, UilColumns, UilGrid]

const FlowNode = ({
  label,
  sublabel,
  color,
  initials,
  tier,
  connectionHealth,
  onClick,
  tooltipText,
}: {
  label: string
  sublabel?: string
  color: string
  initials: string
  tier?: "required" | "recommended" | "optional"
  connectionHealth?: "connected" | "partial" | "disconnected" | "none"
  onClick?: () => void
  tooltipText?: string
}) => {
  const healthDot = connectionHealth && connectionHealth !== "none" && (
    <div className="absolute -bottom-0.5 -right-0.5">
      <ConnectionHealthDot status={connectionHealth} />
    </div>
  )

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-xl border border-gray-04 bg-white px-4 py-3 shadow-sm min-w-[260px]",
        onClick && "cursor-pointer hover:border-gray-06 hover:shadow-md transition-all"
      )}
      onClick={onClick}
    >
      <div className="relative">
        <div
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        {tooltipText && healthDot ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {healthDot}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        ) : healthDot}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground/85 truncate">{label}</div>
        {sublabel && (
          <div className="text-xs text-foreground/45 truncate">{sublabel}</div>
        )}
      </div>
      {tier && tier !== "optional" && (
        <div className="absolute -top-1.5 -right-1.5">
          <TierDecorator tier={tier} />
        </div>
      )}
    </div>
  )
}

const FlowConnector = () => (
  <div className="flex justify-center py-0.5">
    <div className="h-6 w-px bg-gray-06" />
  </div>
)

export const DesignerCanvasScreen = () => {
  const {
    setShowModal,
    setScreen,
    setModalView,
    setSelectedComponentKey,
    recommendedCount,
    flowSteps,
    getMissingRequiredComponents,
    canPublish,
    showModal,
    getTier,
    getComponentConnectionHealth,
    getComponentConnectionVars,
    integrationName,
    showClassifications,
    configuredConnectionCount,
    totalConnectionCount,
    linkStepConnection,
  } = useStore()

  const [showAddStep, setShowAddStep] = useState(false)
  const [addConnectionComponent, setAddConnectionComponent] = useState<Component | null>(null)
  const [preselectedConnectionId, setPreselectedConnectionId] = useState<string | null>(null)
  const [pendingStepIdForConnection, setPendingStepIdForConnection] = useState<string | null>(null)
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)

  const missingRequired = getMissingRequiredComponents()
  const hasMissing = missingRequired.length > 0
  const hasRecommendations = recommendedCount > 0

  const sidebarBadgeColor = showClassifications
    ? hasMissing
      ? "bg-interactive-error"
      : hasRecommendations
        ? "bg-amber-500"
        : null
    : null

  const publishTooltip = showClassifications && !canPublish
    ? `Cannot publish: ${missingRequired.map((c) => c.label).join(" and ")} ${missingRequired.length === 1 ? "is" : "are"} required but not used in any flow.`
    : null

  return (
    <div className="flex h-screen">
      {/* Left sidebar */}
      <div className="flex w-14 flex-col items-center gap-1 border-r border-gray-04 bg-white py-4">
        <div className="mb-4 flex size-8 items-center justify-center rounded bg-gray-04">
          <span className="text-xs font-bold text-foreground/70">P</span>
        </div>
        {SIDEBAR_ICONS.map(({ Icon, key }) => {
          const isComponents = key === "components"
          const active = isComponents
          return (
            <button
              key={key}
              onClick={isComponents ? () => setShowModal(true) : undefined}
              className={cn(
                "relative flex size-9 items-center justify-center rounded transition-colors",
                active
                  ? "bg-gray-04 text-foreground/85"
                  : "text-foreground/40 hover:bg-gray-03 hover:text-foreground/70"
              )}
            >
              <Icon className="size-[18px]" />
              {isComponents && sidebarBadgeColor && !showModal && (
                <span
                  className={cn(
                    "absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white",
                    sidebarBadgeColor
                  )}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-2 border-b border-gray-04 bg-white px-3 py-1.5">
          <button className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-foreground/55 hover:bg-gray-03 hover:text-foreground/85">
            <UilArrowLeft className="size-4" />
            Exit
          </button>

          <div className="mx-1 h-5 w-px bg-gray-04" />

          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
              JC
            </div>
            <span className="text-sm font-semibold text-foreground/85">
              {integrationName || "Prototype"}
            </span>
            <span className="text-xs text-foreground/35">/ Jason Comes</span>
          </div>

          <button className="flex size-7 items-center justify-center rounded text-foreground/35 hover:bg-gray-03 hover:text-foreground/55">
            <UilStar className="size-4" />
          </button>

          <div className="flex-1" />

          <Button variant="tertiary" size="sm" className="gap-1.5 text-foreground/55">
            <UilBracketsCurly className="size-4" />
            Convert to Code
          </Button>

          <div className="mx-1 h-5 w-px bg-gray-04" />

          {publishTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="tertiary" size="sm" className="text-foreground/30 pointer-events-none">
                    Publish
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[280px]">
                {publishTooltip}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="tertiary" size="sm" className="text-foreground/55">
              Publish
            </Button>
          )}
          <Button variant="tertiary" size="sm" className="text-foreground/55">
            Cancel
          </Button>
          <Button size="sm" className="bg-brand-mint hover:bg-brand-mint/90 text-white">
            Save
          </Button>

          <div className="mx-1 h-5 w-px bg-gray-04" />

          <button className="flex size-7 items-center justify-center rounded text-foreground/35 hover:bg-gray-03 hover:text-foreground/55">
            <UilQuestionCircle className="size-4" />
          </button>
        </div>

        {/* Canvas + Panel */}
        <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1 bg-gray-02 overflow-auto">
          {/* Floating flow toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-xl border border-gray-04 bg-white px-3 py-1.5 shadow-sm">
            <Button variant="tertiary" size="sm" className="gap-1 text-foreground/70">
              Flow 1
              <UilAngleDown className="size-3.5" />
            </Button>

            <div className="flex items-center gap-0.5">
              {VIEW_ICONS.map((Icon, i) => (
                <button
                  key={i}
                  className={cn(
                    "flex size-7 items-center justify-center rounded transition-colors",
                    i === 0
                      ? "bg-gray-04 text-foreground/85"
                      : "text-foreground/35 hover:bg-gray-03 hover:text-foreground/55"
                  )}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-gray-04" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => setShowModal(true)}
                  className="relative gap-1.5"
                >
                  <span className="relative">
                    <UilApps className="size-4" />
                    {totalConnectionCount > 0 && (
                      <span
                        className={cn(
                          "absolute -top-0.5 -right-0.5 size-1.5 rounded-full",
                          configuredConnectionCount === totalConnectionCount
                            ? "bg-brand-mint"
                            : configuredConnectionCount === 0
                              ? "bg-interactive-error"
                              : "bg-amber-500"
                        )}
                      />
                    )}
                  </span>
                  Components
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {totalConnectionCount > 0
                  ? `Components & Connections — ${configuredConnectionCount}/${totalConnectionCount} configured`
                  : "Components & Connections"}
              </TooltipContent>
            </Tooltip>
          </div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, #D6DEE3 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative flex flex-col items-center pt-24">
            {flowSteps.map((step, i) => {
              const comp = COMPONENTS.find((c) => c.key === step.componentKey)
              const tier = showClassifications && comp ? getTier(comp.key) : "optional" as const
              const health = comp ? getComponentConnectionHealth(comp.key) : "none" as const
              const vars = comp ? getComponentConnectionVars(comp.key) : []
              const configured = vars.filter((v) => v.status === "connected").length
              const tooltipText = vars.length > 0 ? `${configured}/${vars.length} connections configured` : undefined
              return (
                <div key={step.id}>
                  {i > 0 && <FlowConnector />}
                  <FlowNode
                    label={step.actionName}
                    sublabel={comp ? `${comp.label} ${i === 0 ? "- Trigger" : "- Action"}` : undefined}
                    color={comp?.iconColor ?? "#6B7280"}
                    initials={comp?.iconInitials ?? "??"}
                    tier={tier}
                    connectionHealth={health}
                    onClick={comp ? () => setSelectedStepIndex(i) : undefined}
                    tooltipText={tooltipText}
                  />
                </div>
              )
            })}

            <FlowConnector />

            <div className="relative">
              <button
                onClick={() => setShowAddStep((prev) => !prev)}
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg border-2 border-dashed bg-white transition-all",
                  showAddStep
                    ? "border-brand-mint text-brand-mint shadow-sm"
                    : "border-gray-06 text-gray-06 hover:border-brand-mint hover:text-brand-mint hover:shadow-sm"
                )}
              >
                <UilPlus className="size-5" />
              </button>

              {showAddStep && (
                <div className="absolute left-14 -top-4 z-20">
                  <AddStepPopover
                    onClose={() => setShowAddStep(false)}
                    onAddConnection={(comp, connId, stepId) => {
                      setShowAddStep(false)
                      setPreselectedConnectionId(connId ?? null)
                      setPendingStepIdForConnection(stepId ?? null)
                      setAddConnectionComponent(comp)
                    }}
                  />
                </div>
              )}
            </div>
            <span className="mt-2 text-xs text-foreground/45">Add Step</span>
          </div>

          {addConnectionComponent && (
            <AddConnectionModal
              key={preselectedConnectionId ?? "new"}
              open={!!addConnectionComponent}
              onOpenChange={(open) => {
                if (!open) {
                  setAddConnectionComponent(null)
                  setPreselectedConnectionId(null)
                  setPendingStepIdForConnection(null)
                }
              }}
              component={addConnectionComponent}
              preselectedConnectionId={preselectedConnectionId}
              onCreated={(connectionId) => {
                if (pendingStepIdForConnection) {
                  linkStepConnection(pendingStepIdForConnection, connectionId)
                }
              }}
            />
          )}

          {/* Minimap */}
          <div className="absolute bottom-4 left-4 h-20 w-28 rounded-md border border-gray-04 bg-white/80 shadow-sm">
            <div className="flex h-full items-center justify-center text-[10px] text-foreground/25">
              Minimap
            </div>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-36 flex items-center gap-1 rounded-md border border-gray-04 bg-white p-0.5 shadow-sm">
            <button className="flex size-7 items-center justify-center rounded text-foreground/45 hover:bg-gray-03">
              <UilSearchPlus className="size-4" />
            </button>
            <button className="flex size-7 items-center justify-center rounded text-foreground/45 hover:bg-gray-03">
              <UilSearchMinus className="size-4" />
            </button>
            <button className="flex size-7 items-center justify-center rounded text-foreground/45 hover:bg-gray-03">
              <UilExpandArrows className="size-4" />
            </button>
            <button className="flex size-7 items-center justify-center rounded text-foreground/45 hover:bg-gray-03">
              <UilFocusTarget className="size-4" />
            </button>
          </div>
        </div>

          {selectedStepIndex !== null && flowSteps[selectedStepIndex] && (
            <StepConfigPanel
              step={flowSteps[selectedStepIndex]}
              stepIndex={selectedStepIndex}
              onClose={() => setSelectedStepIndex(null)}
            />
          )}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-gray-04 bg-white px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5 bg-brand-mint hover:bg-brand-mint/90 text-white">
              <UilPlay className="size-4" />
              Run
            </Button>
            <Button variant="tertiary" size="sm" className="text-foreground/55">
              Test Runs
            </Button>
            <Button variant="tertiary" size="sm" className="text-foreground/55">
              Test Configuration
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground/55">Debug Mode</span>
            <Switch />
          </div>
        </div>
      </div>
    </div>
  )
}
