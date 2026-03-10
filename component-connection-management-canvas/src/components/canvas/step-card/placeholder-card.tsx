import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import UilPlus from "@iconscout/react-unicons/icons/uil-plus"
import { cn } from "@/lib/utils"

const placeholderCardVariants = cva(
  "inline-flex items-center justify-center rounded-md border-2 border-dashed transition-all cursor-pointer",
  {
    variants: {
      size: {
        default: "size-16", // 64px
        sm: "size-10", // 40px for edge labels
      },
      state: {
        default: "border-ui-border-rest text-muted-foreground hover:border-ui-border-hover hover:text-foreground",
        dropTarget: "border-interactive-primary text-interactive-primary animate-pulse",
        disabled: "border-ui-border-disabled text-muted-foreground/50 cursor-not-allowed",
      },
    },
    defaultVariants: {
      size: "default",
      state: "default",
    },
  }
)

export interface PlaceholderCardProps
  extends React.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof placeholderCardVariants> {
  isDropTarget?: boolean
  disabled?: boolean
}

const PlaceholderCard = React.forwardRef<HTMLButtonElement, PlaceholderCardProps>(
  (
    {
      className,
      size,
      state,
      isDropTarget = false,
      disabled = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const computedState = disabled
      ? "disabled"
      : isDropTarget
      ? "dropTarget"
      : state || "default"

    return (
      <button
        ref={ref}
        type="button"
        data-slot="placeholder-card"
        className={cn(
          placeholderCardVariants({
            size,
            state: computedState,
            className,
          })
        )}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        <UilPlus className={cn(size === "sm" ? "size-4" : "size-5")} />
        <span className="sr-only">Add step</span>
      </button>
    )
  }
)
PlaceholderCard.displayName = "PlaceholderCard"

export { PlaceholderCard, placeholderCardVariants }
