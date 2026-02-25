import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-[15px] font-semibold tracking-[0.075px] transition-all disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-interactive-primary text-white hover:bg-interactive-primary-hover active:bg-interactive-primary-active disabled:bg-interactive-primary-disabled disabled:text-white/70",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 disabled:opacity-50",
        outline:
          "border-2 border-interactive-secondary bg-transparent text-interactive-secondary hover:bg-interactive-secondary-hover hover:text-white active:bg-interactive-secondary-active active:border-interactive-secondary-active active:text-white disabled:border-interactive-secondary-disabled disabled:text-interactive-secondary-disabled disabled:bg-transparent",
        secondary:
          "border-2 border-interactive-secondary bg-transparent text-interactive-secondary hover:bg-interactive-secondary-hover hover:text-white active:bg-interactive-secondary-active active:border-interactive-secondary-active active:text-white disabled:border-interactive-secondary-disabled disabled:text-interactive-secondary-disabled disabled:bg-transparent",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        tertiary:
          "bg-gray-04 text-foreground/85 hover:bg-gray-05 active:bg-gray-06 disabled:bg-gray-04 disabled:text-foreground/55",
        link: "text-interactive-secondary font-semibold hover:text-interactive-secondary/80 gap-1 px-0 py-0 h-auto",
      },
      size: {
        default: "h-12 px-5 py-[14.5px]",
        sm: "h-9 px-4 py-2",
        lg: "h-12 px-5 py-[14.5px]",
        icon: "size-12",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
