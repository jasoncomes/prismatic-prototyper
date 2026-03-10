import type { Tier } from "@/data/types"
import { TIER_CONFIG } from "@/data/types"
import { cn } from "@/lib/utils"

interface TierSelectorProps {
  value: Tier
  onChange: (tier: Tier) => void
  disabled?: boolean
}

const tiers: Tier[] = ["required", "recommended", "optional"]

export const TierSelector = ({ value, onChange, disabled }: TierSelectorProps) => (
  <div className={cn("flex gap-1", disabled && "pointer-events-none opacity-50")}>
    {tiers.map((tier) => {
      const config = TIER_CONFIG[tier]
      const isActive = value === tier
      return (
        <button
          key={tier}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onChange(tier)
          }}
          className={cn(
            "rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all cursor-pointer",
            isActive
              ? cn(config.bgClass, config.textClass)
              : "bg-transparent text-foreground/55 hover:bg-gray-04"
          )}
        >
          {config.label}
        </button>
      )
    })}
  </div>
)
