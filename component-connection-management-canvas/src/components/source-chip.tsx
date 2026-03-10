import { cn } from "@/lib/utils"

interface SourceChipProps {
  source: "org" | "integration"
}

const config = {
  org: {
    label: "Org",
    className: "border-indigo-300 text-indigo-600 bg-indigo-50",
  },
  integration: {
    label: "Integration",
    className: "border-gray-06 text-foreground/55 bg-transparent",
  },
} as const

export const SourceChip = ({ source }: SourceChipProps) => {
  const { label, className } = config[source]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-medium leading-tight",
        className
      )}
    >
      {label}
    </span>
  )
}
