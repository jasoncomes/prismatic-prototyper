import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const panelVariants = cva("flex flex-col bg-background", {
  variants: {
    variant: {
      default: "",
      bordered: "border border-neutral-200 rounded-lg",
      elevated: "shadow-default rounded-lg",
    },
    size: {
      auto: "",
      fill: "flex-1 min-h-0",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "auto",
  },
})

export interface PanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="panel"
      className={cn(panelVariants({ variant, size, className }))}
      {...props}
    />
  )
)
Panel.displayName = "Panel"

const PanelHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="panel-header"
    className={cn(
      "flex items-center justify-between gap-4 px-6 py-4 shrink-0",
      className
    )}
    {...props}
  />
))
PanelHeader.displayName = "PanelHeader"

const PanelTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    data-slot="panel-title"
    className={cn(
      "text-[length:var(--font-size-h5)] font-semibold leading-[1.5rem] tracking-[0.01em] text-foreground",
      className
    )}
    {...props}
  />
))
PanelTitle.displayName = "PanelTitle"

const PanelDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="panel-description"
    className={cn(
      "text-[length:var(--font-size-body2)] text-foreground/70",
      className
    )}
    {...props}
  />
))
PanelDescription.displayName = "PanelDescription"

const PanelContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="panel-content"
    className={cn("flex-1 min-h-0 px-6 py-4", className)}
    {...props}
  />
))
PanelContent.displayName = "PanelContent"

const PanelFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="panel-footer"
    className={cn(
      "flex items-center justify-end gap-3 px-6 py-4 shrink-0",
      className
    )}
    {...props}
  />
))
PanelFooter.displayName = "PanelFooter"

const PanelActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="panel-actions"
    className={cn("flex items-center gap-2 ml-auto", className)}
    {...props}
  />
))
PanelActions.displayName = "PanelActions"

export {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
  PanelFooter,
  PanelActions,
  panelVariants,
}
