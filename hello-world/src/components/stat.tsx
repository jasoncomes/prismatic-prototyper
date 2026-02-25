import * as React from "react"

import { cn } from "@/lib/utils"

const Stat = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-row items-center gap-2", className)}
    {...props}
  />
))
Stat.displayName = "Stat"

const StatValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "text-[32px] font-normal leading-[44px] tracking-[-0.01em] text-brand-mint",
      className
    )}
    {...props}
  />
))
StatValue.displayName = "StatValue"

const StatLabel = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "text-[15px] font-medium leading-[135%] tracking-[0.005em] text-foreground/85",
      className
    )}
    {...props}
  />
))
StatLabel.displayName = "StatLabel"

export { Stat, StatValue, StatLabel }
