import { ConnectionHealthDot } from "@/components/connection-health-dot"
import { CONNECTION_TYPE_LABELS, MANAGED_BY_LABELS } from "@/data/constants"
import type { ConnectionConfigVar } from "@/data/types"
import { cn } from "@/lib/utils"

interface ConnectionListItemProps {
  connection: ConnectionConfigVar
  onClick?: () => void
  selected?: boolean
  showManagedBy?: boolean
}

export const ConnectionListItem = ({
  connection,
  onClick,
  selected,
  showManagedBy,
}: ConnectionListItemProps) => {
  const typeAbbrev = CONNECTION_TYPE_LABELS[connection.type]?.slice(0, 3) ?? "???"
  const healthStatus =
    connection.status === "connected"
      ? ("connected" as const)
      : connection.status === "pending"
        ? ("partial" as const)
        : ("disconnected" as const)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-left cursor-pointer transition-all",
        selected
          ? "border-brand-deep-purple/30 bg-brand-deep-purple/5"
          : "border-gray-04 hover:border-gray-06 hover:shadow-sm"
      )}
    >
      <div className="relative">
        <div className="flex size-8 items-center justify-center rounded-md bg-gray-04">
          <span className="text-[10px] font-semibold text-foreground/55">
            {typeAbbrev}
          </span>
        </div>
        {connection.type === "oauth2" && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <ConnectionHealthDot status={healthStatus} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground/85 truncate">
          {connection.name}
        </span>
        <span className="block text-[10px] text-foreground/45">
          {CONNECTION_TYPE_LABELS[connection.type]}
        </span>
      </div>
      {showManagedBy && (
        <span className="shrink-0 text-[10px] font-medium text-foreground/40">
          {MANAGED_BY_LABELS[connection.managedBy]}
        </span>
      )}
    </button>
  )
}
