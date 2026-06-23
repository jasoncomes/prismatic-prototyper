import * as React from "react"

import { cn } from "@/lib/utils"

const AppHeader = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <header
    ref={ref}
    className={cn(
      "flex h-[75px] w-full items-center justify-between bg-white px-10",
      className
    )}
    {...props}
  />
))
AppHeader.displayName = "AppHeader"

const AppHeaderLeft = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-4", className)}
    {...props}
  />
))
AppHeaderLeft.displayName = "AppHeaderLeft"

const AppHeaderRight = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-5", className)}
    {...props}
  />
))
AppHeaderRight.displayName = "AppHeaderRight"

const AppHeaderPlanInfo = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "text-[15px] font-semibold leading-[125%] text-foreground/85",
      className
    )}
    {...props}
  />
))
AppHeaderPlanInfo.displayName = "AppHeaderPlanInfo"

export interface NotificationBadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  count?: number
}

const NotificationBadge = React.forwardRef<HTMLDivElement, NotificationBadgeProps>(
  ({ className, count, children, ...props }, ref) => (
    <div ref={ref} className={cn("relative", className)} {...props}>
      {children}
      {count !== undefined && count > 0 && (
        <span className="absolute -right-1.5 -top-1 flex size-[18px] items-center justify-center rounded-full bg-interactive-secondary text-[10px] font-medium leading-[125%] text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  )
)
NotificationBadge.displayName = "NotificationBadge"

const AppHeaderIconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex size-6 items-center justify-center text-neutral-400 transition-colors hover:text-foreground/85",
      className
    )}
    {...props}
  />
))
AppHeaderIconButton.displayName = "AppHeaderIconButton"

export {
  AppHeader,
  AppHeaderLeft,
  AppHeaderRight,
  AppHeaderPlanInfo,
  NotificationBadge,
  AppHeaderIconButton,
}
