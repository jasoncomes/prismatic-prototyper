import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "@/lib/utils"

const RadioCardGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("flex flex-col gap-3", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioCardGroup.displayName = "RadioCardGroup"

interface RadioCardProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  icon?: React.ReactNode
  iconVariant?: "default" | "mint" | "gray"
  title: string
  description?: string
  children?: React.ReactNode
}

const RadioCard = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioCardProps
>(({ className, icon, iconVariant = "default", title, description, children, value, ...props }, ref) => {
  const iconBgClass = {
    default: "bg-neutral-100 text-neutral-400",
    mint: "bg-brand-mint/15 text-brand-mint",
    gray: "bg-neutral-100 text-neutral-400",
  }[iconVariant]

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      value={value}
      className={cn(
        "group/radio-card flex flex-col rounded-lg border border-neutral-300 bg-white cursor-pointer transition-all",
        "hover:border-neutral-400",
        "data-[state=checked]:border-brand-mint data-[state=checked]:border-2",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-mint focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3 p-4">
        {icon && (
          <span className={cn(
            "flex items-center justify-center size-10 rounded-md shrink-0",
            iconBgClass
          )}>
            {icon}
          </span>
        )}
        <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0 pt-0.5">
          <span className="text-[15px] font-semibold text-foreground/85 leading-[22px]">
            {title}
          </span>
          {description && (
            <span className="text-[13px] text-foreground/55 leading-[18px]">
              {description}
            </span>
          )}
        </div>
        <div className="shrink-0 flex items-start pt-1">
          <div
            className={cn(
              "size-5 rounded-full border-2 border-neutral-300 transition-all",
              "group-data-[state=checked]/radio-card:border-brand-mint group-data-[state=checked]/radio-card:border-[6px]"
            )}
          />
        </div>
      </div>
      {children && (
        <div className="hidden group-data-[state=checked]/radio-card:block border-t border-neutral-200 px-4 pb-4 pt-4">
          {children}
        </div>
      )}
    </RadioGroupPrimitive.Item>
  )
})
RadioCard.displayName = "RadioCard"

const RadioCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-4", className)} {...props} />
))
RadioCardContent.displayName = "RadioCardContent"

export { RadioCardGroup, RadioCard, RadioCardContent }
