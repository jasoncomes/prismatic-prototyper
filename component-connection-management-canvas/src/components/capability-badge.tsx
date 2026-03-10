import { cn } from "@/lib/utils"
import type { Capability } from "@/data/types"

const CAPABILITY_LABELS: Record<Capability, string> = {
  trigger: "Trigger",
  step: "Step",
  data_source: "Data Source",
}

interface CapabilityBadgeProps {
  capability: Capability
  className?: string
}

export const CapabilityBadge = ({ capability, className }: CapabilityBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full bg-gray-04 px-2.5 py-0.5 text-xs text-foreground/70",
      className
    )}
  >
    {CAPABILITY_LABELS[capability]}
  </span>
)

interface CapabilityBadgesProps {
  capabilities: Capability[]
  className?: string
}

export const CapabilityBadges = ({ capabilities, className }: CapabilityBadgesProps) => {
  if (capabilities.length === 0) return null
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {capabilities.map((cap) => (
        <CapabilityBadge key={cap} capability={cap} />
      ))}
    </div>
  )
}
