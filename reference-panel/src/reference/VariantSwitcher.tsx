import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { VARIATIONS } from "./mockData"
import type { Audience, Availability, Variant } from "./types"

interface VariantSwitcherProps {
  variant: Variant
  onVariant: (v: Variant) => void
  availability: Availability
  onAvailability: (a: Availability) => void
  audience: Audience
  onAudience: (a: Audience) => void
}

const ALL_VARIATIONS = [...VARIATIONS.easy, ...VARIATIONS.one]

const AVAIL_KEYS: { key: keyof Availability; label: string }[] = [
  { key: "real", label: "Test run exists" },
  { key: "inline", label: "Step is runnable" },
  { key: "schema", label: "Output schema" },
  { key: "example", label: "Example payload" },
]

const AUDIENCES: { id: Audience; label: string }[] = [
  { id: "ewb", label: "EWB (no change)" },
  { id: "lowcode", label: "Low-code / Designer" },
]

const Field = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground/35">
      {label}
    </span>
    {children}
  </div>
)

export function VariantSwitcher({
  variant,
  onVariant,
  availability,
  onAvailability,
  audience,
  onAudience,
}: VariantSwitcherProps) {
  const current = ALL_VARIATIONS.find((v) => v.id === variant)

  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-6 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
            Reference Panel · variations
          </div>
          <div className="text-sm font-semibold text-brand-deep-purple">
            {current?.name}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-5">
          <Field label="Audience">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={audience}
              onValueChange={(v) => v && onAudience(v as Audience)}
            >
              {AUDIENCES.map((a) => (
                <ToggleGroupItem key={a.id} value={a.id}>
                  {a.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <Field label="Availability (per step)">
            <div className="flex gap-1.5">
              {AVAIL_KEYS.map(({ key, label }) => {
                const on = availability[key]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      onAvailability({ ...availability, [key]: !on })
                    }
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      on
                        ? "border-brand-mint bg-brand-mint/15 text-foreground/80"
                        : "border-neutral-200 text-foreground/40 line-through"
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground/35">
            Variation
          </span>
          {ALL_VARIATIONS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onVariant(v.id)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[12px] transition-colors",
                v.id === variant
                  ? "border-brand-deep-purple bg-brand-deep-purple text-white"
                  : "border-neutral-200 text-foreground/65 hover:border-neutral-300"
              )}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
