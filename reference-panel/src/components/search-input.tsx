import * as React from "react"
import UilSearch from "@iconscout/react-unicons/icons/uil-search"
import UilTimes from "@iconscout/react-unicons/icons/uil-times"

import { cn } from "@/lib/utils"

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, ...props }, ref) => {
    const hasValue = value !== undefined && value !== ""

    return (
      <div
        className={cn(
          "flex h-[50px] w-full items-center gap-3 rounded bg-neutral-50 px-4",
          className
        )}
      >
        <UilSearch className="size-6 shrink-0 text-neutral-400 opacity-70" />
        <input
          ref={ref}
          type="text"
          value={value}
          className="flex-1 bg-transparent text-[15px] leading-[22px] tracking-[0.005em] text-foreground/85 placeholder:text-foreground/55 focus:outline-none"
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-neutral-400 opacity-70 hover:opacity-100"
          >
            <UilTimes className="size-5" />
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
