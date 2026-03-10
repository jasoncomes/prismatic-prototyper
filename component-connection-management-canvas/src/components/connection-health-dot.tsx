import { cn } from "@/lib/utils"

interface ConnectionHealthDotProps {
  status: "connected" | "partial" | "disconnected" | "none"
  className?: string
}

const statusColors = {
  connected: "bg-[#2ECE95]",
  partial: "bg-[#FBC12D]",
  disconnected: "bg-[#FF265A]",
  none: "",
}

export const ConnectionHealthDot = ({ status, className }: ConnectionHealthDotProps) => {
  if (status === "none") return null
  return (
    <div
      className={cn(
        "size-2 rounded-full border border-white",
        statusColors[status],
        className
      )}
    />
  )
}
