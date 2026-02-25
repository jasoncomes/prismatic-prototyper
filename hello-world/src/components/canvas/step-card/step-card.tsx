import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { StepCardIcon } from "./step-card-icon"
import { StepCardActions, type StepCardMenuItem } from "./step-card-actions"

const stepCardVariants = cva("relative flex items-center group cursor-pointer", {
  variants: {
    state: {
      default: "",
      selected: "",
      error: "",
      disabled: "opacity-50 cursor-not-allowed",
    },
  },
  defaultVariants: {
    state: "default",
  },
})

export interface StepCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof stepCardVariants> {
  icon?: React.ReactNode
  iconSrc?: string
  title: string
  description?: string
  selected?: boolean
  error?: boolean
  disabled?: boolean
  badge?: "error" | "warning" | number
  onDelete?: () => void
  menuItems?: StepCardMenuItem[]
  showDragHandle?: boolean
}

const StepCard = React.forwardRef<HTMLDivElement, StepCardProps>(
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
        data-slot="step-card"
        className={cn(
          stepCardVariants({
            state: disabled ? "disabled" : "default",
            className,
          })
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        {/* Actions - positioned to the left */}
        <StepCardActions
          onDelete={onDelete}
          menuItems={menuItems}
          visible={showActions}
          className="mr-2"
        />

        {/* Icon Container */}
        <StepCardIcon
          icon={icon}
          src={iconSrc}
          state={iconState}
          badge={badge}
          showDragHandle={showDragHandle && showActions}
        />

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
        </div>
      </div>
    )
  }
)
StepCard.displayName = "StepCard"

export { StepCard, stepCardVariants }
