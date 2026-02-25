import * as React from "react"
import UilTimes from "@iconscout/react-unicons/icons/uil-times"

import { cn } from "@/lib/utils"

export interface InputChipProps extends React.HTMLAttributes<HTMLDivElement> {
  onRemove?: () => void
  variant?: "default" | "success"
}

const InputChip = React.forwardRef<HTMLDivElement, InputChipProps>(
  ({ className, children, onRemove, variant = "success", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded text-sm font-normal",
        variant === "success" &&
          "bg-builder-chip-bg border border-builder-chip-border text-white",
        variant === "default" &&
          "bg-builder-adornment-bg border border-builder-border text-builder-text",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 px-3 py-[5px] overflow-hidden">
        <span className="truncate">{children}</span>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "flex items-center px-2 hover:bg-black/10",
            variant === "success" && "border-l border-builder-chip-border bg-black/20",
            variant === "default" && "border-l border-builder-border bg-black/10"
          )}
        >
          <UilTimes className="size-[18px]" />
        </button>
      )}
    </div>
  )
)
InputChip.displayName = "InputChip"

export { InputChip }
