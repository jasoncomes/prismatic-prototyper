import * as React from "react"

import { cn } from "@/lib/utils"

const InputError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  if (!children) return null

  return (
    <p
      ref={ref}
      className={cn(
        "text-[13.5px] font-normal leading-[21px] tracking-[0.015em] text-interactive-error",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
})
InputError.displayName = "InputError"

export { InputError }
