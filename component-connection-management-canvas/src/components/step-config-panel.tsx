import { useState, useRef, useEffect } from "react"
import UilTimes from "@iconscout/react-unicons/icons/uil-times"
import UilPen from "@iconscout/react-unicons/icons/uil-pen"
import UilInfoCircle from "@iconscout/react-unicons/icons/uil-info-circle"
import UilListUl from "@iconscout/react-unicons/icons/uil-list-ul"
import UilAngleDown from "@iconscout/react-unicons/icons/uil-angle-down"
import UilTimesCircle from "@iconscout/react-unicons/icons/uil-times-circle"
import UilEllipsisV from "@iconscout/react-unicons/icons/uil-ellipsis-v"
import UilPlus from "@iconscout/react-unicons/icons/uil-plus"
import { ComponentIcon } from "@/components/component-icon"
import { ConnectionHealthDot } from "@/components/connection-health-dot"
import { ConnectionListItem } from "@/components/connection-list-item"
import { AddConnectionModal } from "@/components/add-connection-modal"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useStore } from "@/data/store"
import { COMPONENTS } from "@/data/components"
import type { FlowStep, ConnectionConfigVar, Component } from "@/data/types"
import { MANAGED_BY_LABELS } from "@/data/constants"
import { cn } from "@/lib/utils"

interface StepConfigField {
  key: string
  label: string
  description: string
  required: boolean
  defaultValue?: string
  type: "text" | "number" | "textarea"
}

const STEP_CONFIG_FIELDS: Record<string, StepConfigField[]> = {
  salesforce: [
    { key: "version", label: "Version", description: "The Salesforce API version number to use for requests.", required: false, defaultValue: "63.0", type: "number" },
    { key: "soql_query", label: "SOQL Query", description: "A Salesforce Object Query Language (SOQL) query to execute against the Salesforce API.", required: true, type: "text" },
  ],
  slack: [
    { key: "channel", label: "Channel", description: "The Slack channel to send the message to.", required: true, type: "text" },
    { key: "message", label: "Message", description: "The message content to send.", required: true, type: "textarea" },
  ],
  "aws-s3": [
    { key: "bucket", label: "Bucket Name", description: "The name of the S3 bucket.", required: true, type: "text" },
    { key: "key", label: "Object Key", description: "The key (path) of the object in the bucket.", required: true, type: "text" },
  ],
  jira: [
    { key: "project", label: "Project Key", description: "The Jira project key (e.g., PROJ).", required: true, type: "text" },
    { key: "summary", label: "Summary", description: "The issue summary or title.", required: true, type: "text" },
  ],
  hubspot: [
    { key: "email", label: "Email", description: "The contact's email address.", required: true, type: "text" },
    { key: "first_name", label: "First Name", description: "The contact's first name.", required: false, type: "text" },
  ],
}

const DEFAULT_FIELDS: StepConfigField[] = [
  { key: "input", label: "Input", description: "The input value for this step.", required: false, type: "text" },
]

interface StepConfigPanelProps {
  step: FlowStep
  stepIndex: number
  onClose: () => void
}

export const StepConfigPanel = ({ step, stepIndex, onClose }: StepConfigPanelProps) => {
  const { getComponentConnectionVars, getAvailableConnections, linkStepConnection, activateConnection, connectionConfigVars } = useStore()

  const component = COMPONENTS.find((c) => c.key === step.componentKey)
  const [activeTab, setActiveTab] = useState<"configure" | "error-handling">("configure")
  const [stepName, setStepName] = useState(step.actionName)
  const [isEditingName, setIsEditingName] = useState(false)
  const [connectionDropdownOpen, setConnectionDropdownOpen] = useState(false)
  const [showAddConnectionModal, setShowAddConnectionModal] = useState(false)
  const [preselectedConnectionId, setPreselectedConnectionId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const fields = STEP_CONFIG_FIELDS[step.componentKey] ?? DEFAULT_FIELDS
    const values: Record<string, string> = {}
    for (const f of fields) {
      values[f.key] = f.defaultValue ?? ""
    }
    return values
  })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setConnectionDropdownOpen(false)
      }
    }
    if (connectionDropdownOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [connectionDropdownOpen])

  if (!component) return null

  const configFields = STEP_CONFIG_FIELDS[step.componentKey] ?? DEFAULT_FIELDS
  const hasConnections = component.connectionType !== "none" && component.connections.length > 0
  const configuredConnections = getComponentConnectionVars(component.key)
  const availableConnections = getAvailableConnections(component.key)
  const selectedConnection: ConnectionConfigVar | undefined = step.connectionConfigVarId
    ? connectionConfigVars.find((c) => c.id === step.connectionConfigVarId)
    : configuredConnections[0]

  const hasRequiredEmpty = configFields.some((f) => f.required && !fieldValues[f.key])
  const isTrigger = stepIndex === 0

  const handleSelectConnection = (ccvId: string) => {
    linkStepConnection(step.id, ccvId)
    setConnectionDropdownOpen(false)
  }

  const handleSelectAvailable = (ccv: ConnectionConfigVar) => {
    if (ccv.managedBy === "build-only") {
      const newId = activateConnection(ccv.id)
      if (newId) linkStepConnection(step.id, newId)
      setConnectionDropdownOpen(false)
    } else {
      setPreselectedConnectionId(ccv.id)
      setShowAddConnectionModal(true)
      setConnectionDropdownOpen(false)
    }
  }

  const handleClearConnection = () => {
    linkStepConnection(step.id, undefined)
  }

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-l border-gray-04 bg-white">
      {/* Header */}
      <div className="border-b border-gray-04 px-5 py-4">
        <div className="flex items-center gap-3">
          <ComponentIcon color={component.iconColor} initials={component.iconInitials} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground/85 truncate">
                {component.label} - {step.actionName}
              </span>
              <span className="shrink-0 rounded bg-gray-04 px-1.5 py-0.5 text-[10px] font-medium text-foreground/55">
                v{component.version.replace(/\./g, "")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isEditingName ? (
                <input
                  className="text-sm font-medium text-foreground/85 border-b border-brand-deep-purple outline-none bg-transparent w-full"
                  value={stepName}
                  onChange={(e) => setStepName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                  autoFocus
                />
              ) : (
                <>
                  <span className="text-sm font-medium text-foreground/70">{stepName}</span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-foreground/35 hover:text-foreground/55 cursor-pointer"
                  >
                    <UilPen className="size-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
          <button className="flex size-7 items-center justify-center rounded text-foreground/35 hover:bg-gray-03 hover:text-foreground/55">
            <UilEllipsisV className="size-4" />
          </button>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded text-foreground/35 hover:bg-gray-03 hover:text-foreground/55 cursor-pointer"
          >
            <UilTimes className="size-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-04 px-5">
        <button
          onClick={() => setActiveTab("configure")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 py-3 text-sm font-medium transition-colors cursor-pointer",
            activeTab === "configure"
              ? "border-brand-deep-purple text-foreground/85"
              : "border-transparent text-foreground/45 hover:text-foreground/70"
          )}
        >
          {hasRequiredEmpty && (
            <span className="size-2 rounded-full bg-interactive-error" />
          )}
          Configure
        </button>
        <button
          onClick={() => setActiveTab("error-handling")}
          className={cn(
            "border-b-2 py-3 text-sm font-medium transition-colors cursor-pointer",
            activeTab === "error-handling"
              ? "border-brand-deep-purple text-foreground/85"
              : "border-transparent text-foreground/45 hover:text-foreground/70"
          )}
        >
          Error handling
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {activeTab === "configure" ? (
          <div className="space-y-6">
            {/* Connection field */}
            {hasConnections && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground/85">
                  Connection <span className="text-interactive-error">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setConnectionDropdownOpen((prev) => !prev)}
                    className="flex w-full items-center gap-2 rounded-lg border border-gray-04 bg-white px-3 py-2 cursor-pointer transition-colors hover:border-gray-06"
                  >
                    {selectedConnection ? (
                      <>
                        <ConnectionHealthDot
                          status={selectedConnection.status === "connected" ? "connected" : selectedConnection.status === "pending" ? "partial" : "disconnected"}
                        />
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-mint/15 px-2.5 py-1 text-xs font-medium text-brand-mint">
                          <span className="text-brand-mint/60">⇆</span>
                          {selectedConnection.name}
                          <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); handleClearConnection() }}
                            className="text-brand-mint/60 hover:text-brand-mint cursor-pointer"
                          >
                            <UilTimesCircle className="size-3.5" />
                          </span>
                        </span>
                        <span className="inline-flex items-center rounded-full bg-foreground/10 px-2 py-1 text-[10px] font-semibold text-foreground/55">
                          {MANAGED_BY_LABELS[selectedConnection.managedBy] ?? selectedConnection.managedBy}
                        </span>
                        <div className="flex-1" />
                        <UilAngleDown className={cn("size-4 shrink-0 text-foreground/35 transition-transform", connectionDropdownOpen && "rotate-180")} />
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-left text-sm text-foreground/35">Select a connection...</span>
                        <UilAngleDown className={cn("size-4 shrink-0 text-foreground/35 transition-transform", connectionDropdownOpen && "rotate-180")} />
                      </>
                    )}
                  </button>

                  {connectionDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[320px] overflow-y-auto rounded-lg border border-gray-04 bg-white shadow-lg">
                      {/* Configured */}
                      {configuredConnections.length > 0 && (
                        <div className="p-2">
                          <span className="mb-1 block px-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                            Configured ({configuredConnections.length})
                          </span>
                          {configuredConnections.map((ccv) => (
                            <ConnectionListItem
                              key={ccv.id}
                              connection={ccv}
                              selected={step.connectionConfigVarId === ccv.id}
                              showManagedBy
                              onClick={() => handleSelectConnection(ccv.id)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Available */}
                      {availableConnections.length > 0 && (
                        <div className="border-t border-gray-04 p-2">
                          <span className="mb-1 block px-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                            Available ({availableConnections.length})
                          </span>
                          {availableConnections.map((ccv) => (
                            <ConnectionListItem
                              key={ccv.id}
                              connection={ccv}
                              onClick={() => handleSelectAvailable(ccv)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Create Connection */}
                      <div className="border-t border-gray-04 p-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPreselectedConnectionId(null)
                            setShowAddConnectionModal(true)
                            setConnectionDropdownOpen(false)
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-foreground/55 transition-colors hover:bg-gray-02 cursor-pointer"
                        >
                          <UilPlus className="size-4" />
                          Create Connection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-foreground/45">
                  The {component.label} connection to use.
                </p>

                {showAddConnectionModal && component && (
                  <AddConnectionModal
                    key={preselectedConnectionId ?? "new"}
                    open={showAddConnectionModal}
                    onOpenChange={(open) => {
                      setShowAddConnectionModal(open)
                      if (!open) setPreselectedConnectionId(null)
                    }}
                    component={component}
                    preselectedConnectionId={preselectedConnectionId}
                    onCreated={(connectionId) => {
                      linkStepConnection(step.id, connectionId)
                    }}
                  />
                )}
              </div>
            )}

            {/* Config fields */}
            {configFields.map((field) => {
              const isEmpty = !fieldValues[field.key]
              return (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <label className="text-sm font-semibold text-foreground/85">
                      {field.label}
                      {field.required && <span className="text-interactive-error"> *</span>}
                    </label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-foreground/35 cursor-help">
                          <UilInfoCircle className="size-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{field.description}</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-stretch">
                    <div className="flex w-10 shrink-0 items-center justify-center rounded-l-lg border border-r-0 border-gray-04 bg-gray-02">
                      <UilListUl className="size-4 text-foreground/35" />
                    </div>
                    <Input
                      value={fieldValues[field.key]}
                      onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className={cn(
                        "rounded-l-none border-l-0 h-10",
                        field.required && isEmpty && "border-interactive-error focus-visible:ring-interactive-error/20"
                      )}
                    />
                  </div>
                  <p className="text-xs text-foreground/45">{field.description}</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-foreground/45">Error handling configuration</p>
            <p className="mt-1 text-xs text-foreground/35">Configure retry logic, error notifications, and fallback behavior.</p>
          </div>
        )}
      </div>
    </div>
  )
}
