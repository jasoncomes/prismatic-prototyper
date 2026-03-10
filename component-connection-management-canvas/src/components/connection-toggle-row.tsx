import UilTrashAlt from "@iconscout/react-unicons/icons/uil-trash-alt"
import { ManagedByLabel } from "@/components/managed-by-label"
import { ConnectionHealthDot } from "@/components/connection-health-dot"
import { CONNECTION_TYPE_LABELS } from "@/data/constants"
import type { ConnectionConfigVar } from "@/data/types"
import { cn } from "@/lib/utils"

interface ConnectionToggleRowProps {
  connectionVar: ConnectionConfigVar
  usedBySteps?: string[]
  onClick?: () => void
  onDelete?: () => void
}

export const ConnectionToggleRow = ({
  connectionVar,
  usedBySteps,
  onClick,
  onDelete,
}: ConnectionToggleRowProps) => {
  const healthStatus = connectionVar.status === "connected"
    ? "connected" as const
    : connectionVar.status === "pending"
      ? "partial" as const
      : "disconnected" as const

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-gray-04 bg-white p-3 transition-all hover:border-gray-06",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="relative">
        <div className="flex size-8 items-center justify-center rounded-md bg-gray-04">
          <span className="text-[10px] font-semibold text-foreground/55">
            {CONNECTION_TYPE_LABELS[connectionVar.type]?.slice(0, 3) ?? "???"}
          </span>
        </div>
        {connectionVar.type === "oauth2" && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <ConnectionHealthDot status={healthStatus} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground/85 truncate">
            {connectionVar.name}
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[10px] font-medium",
              connectionVar.status === "connected"
                ? "bg-brand-mint/10 text-brand-mint"
                : connectionVar.status === "pending"
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-interactive-error/10 text-interactive-error"
            )}
          >
            {connectionVar.status === "connected" ? "Connected" : connectionVar.status === "pending" ? "Pending" : "Disconnected"}
          </span>
          {connectionVar.isScv && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-indigo-500/10 px-1.5 py-px text-[10px] font-medium text-indigo-600">
              Test runner credentials configured
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3">
          <span className="text-[10px] text-foreground/45">
            {CONNECTION_TYPE_LABELS[connectionVar.type]}
          </span>
          <ManagedByLabel managedBy={connectionVar.managedBy} />
        </div>
        {usedBySteps && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {usedBySteps.length > 0 ? (
              usedBySteps.map((step) => (
                <span
                  key={step}
                  className="inline-flex items-center rounded-full bg-brand-deep-purple/8 px-2 py-0.5 text-[10px] font-medium text-brand-deep-purple"
                >
                  {step}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-foreground/40">
                Not assigned to a step
              </span>
            )}
          </div>
        )}
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded text-foreground/30 hover:bg-interactive-error/10 hover:text-interactive-error transition-colors cursor-pointer"
        >
          <UilTrashAlt className="size-4" />
        </button>
      )}
    </div>
  )
}
