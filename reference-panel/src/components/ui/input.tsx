import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-[50px] w-full rounded bg-white px-4 text-[15px] leading-[22px] tracking-[0.005em] text-foreground/85 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/55 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-transparent disabled:text-foreground/55 disabled:opacity-65",
  {
    variants: {
      variant: {
        default:
          "border border-ui-border-rest hover:border-ui-border-hover focus:border-ui-border-focus",
        error:
          "border border-ui-border-error hover:border-ui-border-error focus:border-ui-border-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, error, type, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({
            variant: error ? "error" : variant,
            className
          }),
          disabled && "border-ui-border-disabled hover:border-ui-border-disabled"
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
