import UilShieldCheck from "@iconscout/react-unicons/icons/uil-shield-check"
import UilStar from "@iconscout/react-unicons/icons/uil-star"
import type { Tier } from "@/data/types"
import { cn } from "@/lib/utils"

interface TierDecoratorProps {
  tier: Tier
  className?: string
}

export const TierDecorator = ({ tier, className }: TierDecoratorProps) => {
  if (tier === "optional") return null

  return (
    <div
      className={cn(
        "flex size-4 items-center justify-center rounded-full",
        tier === "required" ? "bg-[#2ECE95]" : "bg-amber-500",
        className
      )}
    >
      {tier === "required" ? (
        <UilShieldCheck className="size-2.5 text-white" />
      ) : (
        <UilStar className="size-2.5 text-white" />
      )}
    </div>
  )
}
