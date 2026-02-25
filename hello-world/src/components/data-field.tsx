import * as React from "react"

import { cn } from "@/lib/utils"

const DataField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col items-start gap-1", className)}
    {...props}
  />
))
DataField.displayName = "DataField"

const DataFieldLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-row items-center gap-2 text-[13.5px] leading-[21px] tracking-[0.015em] text-foreground/55",
      className
    )}
    {...props}
  />
))
DataFieldLabel.displayName = "DataFieldLabel"

const DataFieldValue = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-[15px] font-semibold leading-[125%] tracking-[0.005em] text-foreground/85",
      className
    )}
    {...props}
  />
))
DataFieldValue.displayName = "DataFieldValue"

export { DataField, DataFieldLabel, DataFieldValue }
