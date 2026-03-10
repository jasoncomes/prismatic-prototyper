import { cn } from "@/lib/utils"

interface ComponentIconProps {
  color: string
  initials: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "size-10 text-sm",
  md: "size-12 text-base",
  lg: "size-14 text-lg",
}

export const ComponentIcon = ({
  color,
  initials,
  size = "md",
  className,
}: ComponentIconProps) => (
  <div
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-lg font-bold text-white",
      sizeClasses[size],
      className
    )}
    style={{ backgroundColor: color }}
  >
    {initials}
  </div>
)
