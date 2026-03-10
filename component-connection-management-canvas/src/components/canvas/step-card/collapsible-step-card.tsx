import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import UilAngleDoubleDown from "@iconscout/react-unicons/icons/uil-angle-double-down"
import UilDraggabledots from "@iconscout/react-unicons/icons/uil-draggabledots"
import { cn } from "@/lib/utils"
import { StepCardActions, type StepCardMenuItem } from "./step-card-actions"
import { Button } from "@/components/ui/button"

const collapsibleIconVariants = cva(
  "relative inline-flex items-center justify-between shrink-0 rounded-md border transition-colors px-2",
  {
    variants: {
      state: {
        default: "bg-neutral-50 border-ui-border-rest",
        selected: "bg-neutral-50 border-interactive-primary",
        error: "bg-neutral-50 border-destructive",
        disabled: "bg-neutral-50 border-ui-border-disabled opacity-50",
      },
      collapsed: {
        true: "shadow-[2px_2px_0_0_var(--neutral-300)]",
        false: "",
      },
    },
    defaultVariants: {
      state: "default",
      collapsed: false,
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

export interface CollapsibleStepCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof collapsibleIconVariants> {
  icon?: React.ReactNode
  iconSrc?: string
  title: string
  description?: string
  selected?: boolean
  error?: boolean
  disabled?: boolean
  badge?: "error" | "warning" | number
  expanded?: boolean
  onToggleExpand?: () => void
  descendantCount?: number
  onDelete?: () => void
  menuItems?: StepCardMenuItem[]
  showDragHandle?: boolean
}

const CollapsibleStepCard = React.forwardRef<HTMLDivElement, CollapsibleStepCardProps>(
  (
    {
      className,
      icon,
      iconSrc,
      title,
      description,
      selected = false,
      error = false,
      disabled = false,
      badge,
      expanded = true,
      onToggleExpand,
      descendantCount,
      onDelete,
      menuItems,
      showDragHandle = true,
      onClick,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false)

    const iconState = error ? "error" : selected ? "selected" : disabled ? "disabled" : "default"
    const showActions = isHovered || selected

    return (
      <div
        ref={ref}
        data-slot="collapsible-step-card"
        className={cn(
          "relative flex items-center group cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        {/* Actions */}
        <StepCardActions
          onDelete={onDelete}
          menuItems={menuItems}
          visible={showActions}
          className="mr-2"
        />

        {/* Wide Icon Container with Expand/Collapse */}
        <div
          data-slot="collapsible-step-card-icon"
          className={cn(
            collapsibleIconVariants({
              state: iconState,
              collapsed: !expanded,
            }),
            "w-[116px] h-16"
          )}
        >
          {/* Drag Handle */}
          {showDragHandle && showActions && (
            <div
              data-slot="step-card-drag-handle"
              className="absolute top-1 left-1/2 -translate-x-1/2 z-10"
            >
              <UilDraggabledots className="size-4 text-muted-foreground rotate-90" />
            </div>
          )}

          {/* Icon */}
            <div className="flex items-center justify-center size-8">
              {iconSrc ? (
                <img
                  src={iconSrc}
                  alt={title}
                  className="size-8 object-contain"
                />
              ) : icon ? (
                <span className="text-foreground [&_svg]:size-8">{icon}</span>
              ) : null}
            </div>

            {/* Expand/Collapse Toggle */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand?.()
              }}
            >
              <UilAngleDoubleDown className="size-4" />
              <span className="sr-only">
                {expanded ? "Collapse" : "Expand"} step
              </span>
            </Button>

            {/* Badge */}
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

        {/* Content */}
        <div
          data-slot="step-card-content"
          className="ml-3 flex flex-col min-w-0 max-w-[200px]"
        >
          <span
            data-slot="step-card-title"
            className="text-sm font-medium text-foreground truncate"
          >
            {title}
          </span>
          {description && (
            <span
              data-slot="step-card-description"
              className={cn(
                "text-xs truncate",
                error ? "text-destructive font-semibold" : "text-muted-foreground"
              )}
            >
              {description}
            </span>
          )}
          {!expanded && descendantCount !== undefined && descendantCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {descendantCount} step{descendantCount !== 1 ? "s" : ""} hidden
            </span>
          )}
        </div>
      </div>
    )
  }
)
CollapsibleStepCard.displayName = "CollapsibleStepCard"

export { CollapsibleStepCard, collapsibleIconVariants }
