import * as React from "react"

import { cn } from "@/lib/utils"

const PageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-2", className)}
    {...props}
  />
))
PageHeader.displayName = "PageHeader"

const PageHeaderRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-row items-end justify-between gap-10", className)}
    {...props}
  />
))
PageHeaderRow.displayName = "PageHeaderRow"

const PageHeaderContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col items-start gap-2", className)}
    {...props}
  />
))
PageHeaderContent.displayName = "PageHeaderContent"

const PageHeaderTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "flex flex-row items-center gap-4 text-[32px] font-normal leading-[44px] tracking-[-0.01em] text-foreground/85",
      className
    )}
    {...props}
  />
))
PageHeaderTitle.displayName = "PageHeaderTitle"

const PageHeaderActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-row items-center gap-4", className)}
    {...props}
  />
))
PageHeaderActions.displayName = "PageHeaderActions"

export {
  PageHeader,
  PageHeaderRow,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions,
}
