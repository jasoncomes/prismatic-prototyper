import * as React from "react"
import UilTrash from "@iconscout/react-unicons/icons/uil-trash"
import UilEllipsisH from "@iconscout/react-unicons/icons/uil-ellipsis-h"
import UilCopy from "@iconscout/react-unicons/icons/uil-copy"
import UilSync from "@iconscout/react-unicons/icons/uil-sync"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface StepCardMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: "default" | "destructive"
}

export interface StepCardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  onDelete?: () => void
  menuItems?: StepCardMenuItem[]
  visible?: boolean
}

const StepCardActions = React.forwardRef<HTMLDivElement, StepCardActionsProps>(
  ({ className, onDelete, menuItems, visible = true, ...props }, ref) => {
    const defaultMenuItems: StepCardMenuItem[] = [
      {
        label: "Duplicate",
        icon: <UilCopy />,
        onClick: () => {},
      },
      {
        label: "Change step action",
        icon: <UilSync />,
        onClick: () => {},
      },
    ]

    const items = menuItems || defaultMenuItems

    return (
      <div
        ref={ref}
        data-slot="step-card-actions"
        className={cn(
          "flex items-center gap-1 transition-opacity duration-150",
          visible ? "opacity-100" : "opacity-0 pointer-events-none",
          className
        )}
        {...props}
      >
        {onDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="text-muted-foreground hover:text-destructive"
          >
            <UilTrash className="size-4" />
            <span className="sr-only">Delete step</span>
          </Button>
        )}

        {items.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground"
              >
                <UilEllipsisH className="size-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom">
              {items.map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    item.onClick()
                  }}
                  variant={item.variant}
                >
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }
)
StepCardActions.displayName = "StepCardActions"

export { StepCardActions }
