import UilCheck from "@iconscout/react-unicons/icons/uil-check"
import UilExclamationTriangle from "@iconscout/react-unicons/icons/uil-exclamation-triangle"
import { cn } from "@/lib/utils"

interface FlowStatusIndicatorProps {
  inFlow: boolean
  className?: string
}

export const FlowStatusIndicator = ({ inFlow, className }: FlowStatusIndicatorProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 text-xs font-medium",
      inFlow ? "text-brand-mint" : "text-amber-500",
      className
    )}
  >
    {inFlow ? (
      <>
        <UilCheck className="size-3.5" />
        In use
      </>
    ) : (
      <>
        <UilExclamationTriangle className="size-3.5" />
        Not used in flow
      </>
    )}
  </span>
)
