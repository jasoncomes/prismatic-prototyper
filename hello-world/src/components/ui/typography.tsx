import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "text-[length:var(--font-size-h1)] font-normal leading-[2.75rem] tracking-[-0.01em]",
      h2: "text-[length:var(--font-size-h2)] font-normal leading-[2.375rem] tracking-[-0.005em]",
      h3: "text-[length:var(--font-size-h3)] font-semibold leading-[2.125rem] tracking-normal",
      h4: "text-[length:var(--font-size-h4)] font-semibold leading-normal tracking-[0.005em]",
      h5: "text-[length:var(--font-size-h5)] font-semibold leading-[1.5rem] tracking-[0.01em]",
      h6: "text-[length:var(--font-size-h6)] font-semibold leading-[1.375rem] tracking-[0.005em]",
      body1: "text-[length:var(--font-size-body1)] font-normal leading-[1.438rem] tracking-[0.005em]",
      body2: "text-[length:var(--font-size-body2)] font-normal leading-[1.375rem] tracking-[0.015em]",
      label: "text-[length:var(--font-size-body2)] font-semibold leading-[1.375rem] tracking-[0.005em]",
      caption: "text-[13px] font-normal leading-[1.25rem] tracking-[0.02em]",
    },
    color: {
      default: "text-foreground",
      muted: "text-foreground/70",
      subtle: "text-foreground/55",
      primary: "text-primary",
      secondary: "text-secondary",
      accent: "text-accent",
      error: "text-destructive",
    },
  },
  defaultVariants: {
    variant: "body1",
    color: "default",
  },
})

type PolymorphicProps<E extends React.ElementType> = {
  as?: E
  asChild?: boolean
} & VariantProps<typeof typographyVariants> &
  Omit<React.ComponentPropsWithoutRef<E>, "as" | "asChild">

const defaultElementMap: Record<string, React.ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  body1: "p",
  body2: "p",
  label: "span",
  caption: "span",
}

function Typography<E extends React.ElementType = "p">({
  as,
  asChild = false,
  variant = "body1",
  color,
  className,
  ...props
}: PolymorphicProps<E>) {
  const defaultElement = variant ? defaultElementMap[variant] || "p" : "p"
  const Comp = asChild ? Slot : as || defaultElement

  return (
    <Comp
      data-slot="typography"
      className={cn(typographyVariants({ variant, color, className }))}
      {...props}
    />
  )
}

export { Typography, typographyVariants }
