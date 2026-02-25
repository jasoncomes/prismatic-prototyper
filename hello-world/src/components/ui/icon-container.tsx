import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const iconContainerVariants = cva(
  "inline-flex items-center justify-center shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      size: {
        sm: "size-5 [&_svg]:size-4",
        md: "size-6 [&_svg]:size-5",
        lg: "size-8 [&_svg]:size-6",
        xl: "size-10 [&_svg]:size-7",
      },
      color: {
        default: "text-foreground",
        primary: "text-brand-blue-purple",
        secondary: "text-neutral-400",
        muted: "text-foreground/55",
        accent: "text-brand-mint",
        error: "text-destructive",
      },
      background: {
        none: "",
        subtle: "bg-neutral-100 rounded",
        solid: "bg-neutral-200 rounded",
        primary: "bg-brand-blue-purple/10 rounded",
        accent: "bg-brand-mint/10 rounded",
      },
    },
    compoundVariants: [
      // When background is set, add padding
      {
        background: ["subtle", "solid", "primary", "accent"],
        size: "sm",
        className: "p-1",
      },
      {
        background: ["subtle", "solid", "primary", "accent"],
        size: "md",
        className: "p-1.5",
      },
      {
        background: ["subtle", "solid", "primary", "accent"],
        size: "lg",
        className: "p-2",
      },
      {
        background: ["subtle", "solid", "primary", "accent"],
        size: "xl",
        className: "p-2.5",
      },
    ],
    defaultVariants: {
      size: "md",
      color: "secondary",
      background: "none",
    },
  }
)

export interface IconContainerProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconContainerVariants> {}

const IconContainer = React.forwardRef<HTMLSpanElement, IconContainerProps>(
  ({ className, size, color, background, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="icon-container"
        className={cn(iconContainerVariants({ size, color, background, className }))}
        {...props}
      />
    )
  }
)
IconContainer.displayName = "IconContainer"

export { IconContainer, iconContainerVariants }
