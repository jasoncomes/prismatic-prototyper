import * as React from "react"
import UilInfoCircle from "@iconscout/react-unicons/icons/uil-info-circle"

import { cn } from "@/lib/utils"

const InputExpressionField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full max-w-[650px] min-w-[125px]", className)}
    {...props}
  />
))
InputExpressionField.displayName = "InputExpressionField"

export interface InputExpressionLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  tooltip?: string
}

const InputExpressionLabel = React.forwardRef<
  HTMLLabelElement,
  InputExpressionLabelProps
>(({ className, children, required, tooltip, ...props }, ref) => (
  <div className="flex items-center gap-2 mb-1.5">
    <label
      ref={ref}
      className={cn(
        "inline-flex items-center gap-0.5 text-sm font-semibold leading-[22px] tracking-[0.005em] text-builder-text",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-builder-required ml-0.5"
        >
          <path d="M18.562,14.63379,14.00031,12,18.562,9.36621a1.00016,1.00016,0,0,0-1-1.73242L13,10.26776V5a1,1,0,0,0-2,0v5.26776l-4.562-2.634a1.00016,1.00016,0,0,0-1,1.73242L9.99969,12,5.438,14.63379a1.00016,1.00016,0,0,0,1,1.73242L11,13.73224V19a1,1,0,0,0,2,0V13.73224l4.562,2.634a1.00016,1.00016,0,0,0,1-1.73242Z" />
        </svg>
      )}
    </label>
    {tooltip && (
      <UilInfoCircle className="size-5 text-builder-text" />
    )}
  </div>
))
InputExpressionLabel.displayName = "InputExpressionLabel"

const InputExpressionContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-row w-full min-w-[50px]", className)}
    {...props}
  />
))
InputExpressionContainer.displayName = "InputExpressionContainer"

const InputExpressionInput = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-row overflow-hidden rounded border border-builder-border w-full",
      className
    )}
    {...props}
  />
))
InputExpressionInput.displayName = "InputExpressionInput"

const InputExpressionAdornment = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    position?: "start" | "end"
  }
>(({ className, position = "start", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center bg-builder-adornment-bg min-w-min",
      position === "start" && "border-r border-builder-border",
      position === "end" && "border-l border-builder-border",
      className
    )}
    {...props}
  />
))
InputExpressionAdornment.displayName = "InputExpressionAdornment"

const InputExpressionAdornmentButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex items-center justify-center px-4 h-full text-builder-text transition-colors hover:bg-white/5",
      "[&_svg]:size-[22px]",
      className
    )}
    {...props}
  />
))
InputExpressionAdornmentButton.displayName = "InputExpressionAdornmentButton"

const InputExpressionButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex items-center w-full h-[50px] px-4 bg-builder-bg border-0 text-builder-text-placeholder text-[15px] leading-[23px] cursor-pointer text-left",
      className
    )}
    {...props}
  >
    <div className="flex-1 min-w-[20px] overflow-hidden text-ellipsis whitespace-nowrap">
      {children}
    </div>
  </button>
))
InputExpressionButton.displayName = "InputExpressionButton"

const InputExpressionAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center ml-2", className)}
    {...props}
  />
))
InputExpressionAction.displayName = "InputExpressionAction"

const InputExpressionActionButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex items-center justify-center p-2 rounded text-builder-text transition-colors hover:bg-white/5",
      "[&_svg]:size-5",
      className
    )}
    {...props}
  />
))
InputExpressionActionButton.displayName = "InputExpressionActionButton"

const InputExpressionHelper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-1 text-sm font-normal leading-[22px] tracking-[0.015em] text-builder-text-muted",
      className
    )}
    {...props}
  />
))
InputExpressionHelper.displayName = "InputExpressionHelper"

export {
  InputExpressionField,
  InputExpressionLabel,
  InputExpressionContainer,
  InputExpressionInput,
  InputExpressionAdornment,
  InputExpressionAdornmentButton,
  InputExpressionButton,
  InputExpressionAction,
  InputExpressionActionButton,
  InputExpressionHelper,
}
