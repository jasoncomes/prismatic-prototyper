import { useState } from "react"
import UilArrowLeft from "@iconscout/react-unicons/icons/uil-arrow-left"
import UilCheck from "@iconscout/react-unicons/icons/uil-check"
import UilKeySkeleton from "@iconscout/react-unicons/icons/uil-key-skeleton"
import UilLock from "@iconscout/react-unicons/icons/uil-lock"
import UilSetting from "@iconscout/react-unicons/icons/uil-setting"
import UilHistory from "@iconscout/react-unicons/icons/uil-history"
import UilApps from "@iconscout/react-unicons/icons/uil-apps"
import UilFileAlt from "@iconscout/react-unicons/icons/uil-file-alt"
import UilBracketsCurly from "@iconscout/react-unicons/icons/uil-brackets-curly"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ComponentIcon } from "@/components/component-icon"
import { TierChip } from "@/components/tier-chip"
import { StatusIndicator } from "@/components/status-indicator"
import { useStore } from "@/data/store"
import { COMPONENTS } from "@/data/components"
import { cn } from "@/lib/utils"

import { CONNECTION_TYPE_LABELS } from "@/data/constants"

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

const SIDEBAR_ICONS = [
  { Icon: UilSetting, label: "Settings" },
  { Icon: UilSetting, label: "Config" },
  { Icon: UilHistory, label: "History" },
  { Icon: UilBracketsCurly, label: "Code" },
  { Icon: UilApps, label: "Components", active: true },
  { Icon: UilFileAlt, label: "Docs" },
]

export const ConnectionSetupScreen = () => {
  const { setScreen, selectedComponentKey, getTier, addConnectionConfigVar } = useStore()
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const [apiKey, setApiKey] = useState("")

  const component = COMPONENTS.find((c) => c.key === selectedComponentKey)
  if (!component) return null

  const tier = getTier(component.key)
  const isOAuth = component.connectionType === "oauth2"

  const handleConnect = () => {
    setStatus("connecting")
    setTimeout(() => {
      setStatus("connected")
      addConnectionConfigVar({
        id: `ccv-${Date.now()}`,
        componentKey: component.key,
        connectionKey: component.connections[0]?.key ?? "default",
        name: `${component.label} Connection`,
        type: component.connectionType === "none" ? "api_key" : component.connectionType,
        managedBy: "customer",
        status: "connected",
        isRcv: false,
        isScv: false,
      })
    }, 1500)
  }

  const handleAddToFlow = () => {
    setScreen("designer")
  }

  return (
    <div className="flex h-screen">
      <div className="flex w-14 flex-col items-center gap-1 border-r border-gray-04 bg-white py-4">
        <div className="mb-4 flex size-8 items-center justify-center rounded bg-gray-04">
          <span className="text-xs font-bold text-foreground/70">P</span>
        </div>
        {SIDEBAR_ICONS.map(({ Icon, label, active }) => (
          <button
            key={label}
            className={cn(
              "flex size-9 items-center justify-center rounded transition-colors",
              active
                ? "bg-gray-04 text-foreground/85"
                : "text-foreground/40 hover:bg-gray-03 hover:text-foreground/70"
            )}
          >
            <Icon className="size-[18px]" />
          </button>
        ))}
      </div>

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

      <div className="flex w-[420px] flex-col border-l border-gray-04 bg-white">
        <div className="flex items-center gap-3 border-b border-gray-04 px-4 py-3">
          <button
            onClick={() => setScreen("add-step")}
            className="flex size-8 items-center justify-center rounded hover:bg-gray-03"
          >
            <UilArrowLeft className="size-5 text-foreground/55" />
          </button>
          <h3 className="text-sm font-semibold text-foreground/85">
            Connect {component.label}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center gap-4 rounded-lg border border-gray-04 p-4">
            <ComponentIcon color={component.iconColor} initials={component.iconInitials} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground/85">{component.label}</span>
                {tier !== "optional" && <TierChip tier={tier} />}
              </div>
              <p className="mt-0.5 text-sm text-foreground/55">{component.description}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              {isOAuth ? (
                <UilLock className="size-4 text-foreground/55" />
              ) : (
                <UilKeySkeleton className="size-4 text-foreground/55" />
              )}
              <span className="text-sm font-semibold text-foreground/85">
                {CONNECTION_TYPE_LABELS[component.connectionType]}
              </span>
            </div>

            <div
              className={cn(
                "mb-4 flex items-center gap-2 rounded-md px-3 py-2",
                status === "connected"
                  ? "bg-brand-mint/10"
                  : status === "error"
                    ? "bg-destructive/10"
                    : "bg-gray-03"
              )}
            >
              {status === "connected" ? (
                <StatusIndicator variant="success" size="sm" />
              ) : status === "error" ? (
                <StatusIndicator variant="error" size="sm" />
              ) : (
                <StatusIndicator variant="default" size="sm" showIcon={false} />
              )}
              <span
                className={cn(
                  "text-sm",
                  status === "connected"
                    ? "text-brand-mint font-semibold"
                    : status === "error"
                      ? "text-destructive font-semibold"
                      : "text-foreground/55"
                )}
              >
                {status === "disconnected" && "Not connected"}
                {status === "connecting" && "Connecting..."}
                {status === "connected" && "Connected"}
                {status === "error" && "Connection failed"}
              </span>
            </div>

            {isOAuth && status !== "connected" && (
              <div className="space-y-3">
                <p className="text-sm text-foreground/55">
                  Click below to authorize access to your {component.label} account.
                </p>
                <Button onClick={handleConnect} disabled={status === "connecting"} className="w-full">
                  {status === "connecting" ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <UilLock className="size-4" />
                      Connect with {component.label}
                    </>
                  )}
                </Button>
              </div>
            )}

            {!isOAuth && component.connectionType !== "none" && status !== "connected" && (
              <div className="space-y-3">
                {component.connectionType === "api_key" && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground/85">API Key</label>
                    <Input
                      type="password"
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                )}
                {component.connectionType === "basic" && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground/85">Host</label>
                      <Input placeholder="e.g., sftp.example.com" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground/85">Username</label>
                      <Input placeholder="Enter username" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground/85">Password</label>
                      <Input type="password" placeholder="Enter password" />
                    </div>
                  </>
                )}
                <Button onClick={handleConnect} disabled={status === "connecting"} className="w-full">
                  {status === "connecting" ? "Connecting..." : "Connect"}
                </Button>
              </div>
            )}
          </div>

          {status === "connected" && (
            <div className="mb-6 rounded-lg border border-brand-mint/30 bg-brand-mint/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-mint">
                  <UilCheck className="size-3.5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground/85">Connection config var created</div>
                  <p className="mt-0.5 text-xs text-foreground/55">
                    A config variable "{component.label} Connection" has been auto-created for this integration.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-04 px-6 py-4">
          <Button variant="outline" size="sm" onClick={() => setScreen("add-step")}>
            Back
          </Button>
          <Button size="sm" onClick={handleAddToFlow} disabled={status !== "connected"}>
            Add to Flow
          </Button>
        </div>
      </div>
    </div>
  )
}
