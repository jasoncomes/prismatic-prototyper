import * as React from "react"

import { cn } from "@/lib/utils"
import { Input, type InputProps } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputError } from "./input-error"

export interface TextFieldProps extends InputProps {
  label?: string
  errorMessage?: string
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, label, errorMessage, error, id, ...props }, ref) => {
    const inputId = id || React.useId()
    const hasError = error || !!errorMessage

    return (
      <div className={cn("flex flex-col items-start gap-1.5", className)}>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <Input
          id={inputId}
          ref={ref}
          error={hasError}
          className="w-full"
          {...props}
        />
        <InputError>{errorMessage}</InputError>
      </div>
    )
  }
)
TextField.displayName = "TextField"

export { TextField }
