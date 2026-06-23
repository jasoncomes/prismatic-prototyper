import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import UilDraggabledots from "@iconscout/react-unicons/icons/uil-draggabledots"
import { cn } from "@/lib/utils"

const stepCardIconVariants = cva(
  "relative inline-flex items-center justify-center shrink-0 rounded-md border transition-colors",
  {
    variants: {
      size: {
        default: "size-16", // 64px
        wide: "w-[116px] h-16", // 116px x 64px for collapsible
      },
      state: {
        default: "bg-neutral-50 border-ui-border-rest",
        selected: "bg-neutral-50 border-interactive-primary",
        error: "bg-neutral-50 border-destructive",
        disabled: "bg-neutral-50 border-ui-border-disabled opacity-50",
      },
    },
    defaultVariants: {
      size: "default",
      state: "default",
    },
  }
)

const badgeVariants = cva(
  "absolute -top-1 -right-1 size-3 rounded-full border-2 border-background",
  {
    variants: {
      variant: {
        error: "bg-destructive",
        warning: "bg-amber-500",
      },
    },
  }
)

export interface StepCardIconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stepCardIconVariants> {
  icon?: React.ReactNode
  src?: string
  alt?: string
  badge?: "error" | "warning" | number
  showDragHandle?: boolean
}

const StepCardIcon = React.forwardRef<HTMLDivElement, StepCardIconProps>(
  ({ className, size, state, icon, src, alt, badge, showDragHandle, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="step-card-icon"
        className={cn(stepCardIconVariants({ size, state, className }))}
        {...props}
      >
        {/* Drag Handle */}
        {showDragHandle && (
          <div
            data-slot="step-card-drag-handle"
            className="absolute top-1 left-1/2 -translate-x-1/2 z-10"
          >
            <UilDraggabledots className="size-4 text-muted-foreground rotate-90" />
          </div>
        )}

        {src ? (
          <img
            src={src}
            alt={alt || "Step icon"}
            className="size-8 object-contain"
          />
        ) : icon ? (
          <span className="text-foreground [&_svg]:size-8">{icon}</span>
        ) : (
          children
        )}

        {badge && (
          <span
            data-slot="step-card-badge"
            className={cn(
              badgeVariants({
                variant: typeof badge === "number" ? "error" : badge,
              })
            )}
          >
            {typeof badge === "number" && badge > 0 && (
              <span className="sr-only">{badge} errors</span>
            )}
          </span>
        )}
      </div>
    )
  }
)
StepCardIcon.displayName = "StepCardIcon"

export { StepCardIcon, stepCardIconVariants }
