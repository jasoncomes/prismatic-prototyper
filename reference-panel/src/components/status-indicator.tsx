import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import UilCheck from "@iconscout/react-unicons/icons/uil-check"

import { cn } from "@/lib/utils"

const statusIndicatorVariants = cva(
  "inline-flex items-center justify-center rounded-full",
  {
    variants: {
      variant: {
        success: "bg-brand-mint text-white",
        error: "bg-interactive-error text-white",
        warning: "bg-brand-cyan text-white",
        default: "bg-gray-05 text-foreground/70",
      },
      size: {
        default: "size-6",
        sm: "size-5",
        lg: "size-8",
      },
    },
    defaultVariants: {
      variant: "success",
      size: "default",
    },
  }
)

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  showIcon?: boolean
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, variant, size, showIcon = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(statusIndicatorVariants({ variant, size, className }))}
      {...props}
    >
      {showIcon && variant === "success" && (
        <UilCheck className="size-3.5 opacity-85" />
      )}
      {children}
    </div>
  )
)
StatusIndicator.displayName = "StatusIndicator"

export { StatusIndicator, statusIndicatorVariants }
