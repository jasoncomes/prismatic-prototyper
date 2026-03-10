import UilLink from "@iconscout/react-unicons/icons/uil-link"
import { cn } from "@/lib/utils"

interface ConnectionHealthSummaryProps {
  configured: number
  total: number
  className?: string
}

export const ConnectionHealthSummary = ({ configured, total, className }: ConnectionHealthSummaryProps) => {
  if (total === 0) return null

  const allConfigured = configured === total
  const noneConfigured = configured === 0

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        allConfigured
          ? "bg-brand-mint/10 text-brand-mint"
          : noneConfigured
            ? "bg-interactive-error/10 text-interactive-error"
            : "bg-amber-500/10 text-amber-600",
        className
      )}
    >
      <UilLink className="size-3.5" />
      <span>
        {allConfigured
          ? `All ${total} connections ready`
          : noneConfigured
            ? `${total} connections need setup`
            : `${configured} of ${total} connections ready`}
      </span>
    </div>
  )
}
