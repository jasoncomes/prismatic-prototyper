import { cn } from "@/lib/utils"
import type { Tier } from "@/data/types"
import { TIER_CONFIG } from "@/data/types"

interface TierChipProps {
  tier: Tier
  size?: "sm" | "md"
  className?: string
}

export const TierChip = ({ tier, size = "sm", className }: TierChipProps) => {
  const config = TIER_CONFIG[tier]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-semibold",
        config.bgClass,
        config.textClass,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {config.label}
    </span>
  )
}
