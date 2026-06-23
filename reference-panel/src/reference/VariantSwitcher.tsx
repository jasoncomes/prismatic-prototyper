import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { VARIANTS } from "./mockData"
import type { Availability } from "./mockData"
import type { NamingScheme, SourceModel, VariantId } from "./types"

interface VariantSwitcherProps {
  variant: VariantId
  onVariant: (v: VariantId) => void
  sourceModel: SourceModel
  onSourceModel: (m: SourceModel) => void
  naming: NamingScheme
  onNaming: (n: NamingScheme) => void
  availability: Availability
  onAvailability: (a: Availability) => void
}

const STAGES: {
  letter: string
  label: string
  variant: VariantId
  grouping: SourceModel
}[] = [
  { letter: "A", label: "4 sources", variant: "segmented", grouping: "peers" },
  { letter: "B", label: "Two buckets", variant: "segmented", grouping: "buckets" },
  { letter: "C", label: "Easy path", variant: "easyPath", grouping: "buckets" },
  {
    letter: "D",
    label: "Zero-choice",
    variant: "zeroChoice",
    grouping: "buckets",
  },
]

const AVAIL_KEYS: { key: keyof Availability; label: string }[] = [
  { key: "test", label: "Execution Results" },
  { key: "inline", label: "Inline Action" },
  { key: "schema", label: "Output Schema" },
  { key: "example", label: "Example Payload" },
]

export function VariantSwitcher({
  variant,
  onVariant,
  sourceModel,
  onSourceModel,
  naming,
  onNaming,
  availability,
  onAvailability,
}: VariantSwitcherProps) {
  const active = VARIANTS.find((v) => v.id === variant)!

  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
              Reference Panel · UX exploration
            </div>
            <div className="text-sm font-semibold text-foreground">
              <span className="text-brand-deep-purple">
                #{active.rank} {active.name}
              </span>
              <span className="ml-2 font-normal text-foreground/55">
                {active.blurb}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Field label="Source grouping">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={sourceModel}
                onValueChange={(v) => v && onSourceModel(v as SourceModel)}
              >
                <ToggleGroupItem value="peers">Separate</ToggleGroupItem>
                <ToggleGroupItem value="tiered">
                  Group Live Data
                </ToggleGroupItem>
                <ToggleGroupItem value="sample">
                  Group Schema + Example
                </ToggleGroupItem>
                <ToggleGroupItem value="buckets">
                  Two buckets
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field label="Source names">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={naming}
                onValueChange={(v) => v && onNaming(v as NamingScheme)}
              >
                <ToggleGroupItem value="descriptive">
                  Descriptive
                </ToggleGroupItem>
                <ToggleGroupItem value="friendly">
                  Real / Test Data
                </ToggleGroupItem>
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
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md bg-brand-deep-purple/5 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-deep-purple/70">
            Recommendation stages
          </span>
          {STAGES.map((st) => {
            const activeStage =
              variant === st.variant && sourceModel === st.grouping
            return (
              <button
                key={st.letter}
                type="button"
                onClick={() => {
                  onVariant(st.variant)
                  onSourceModel(st.grouping)
                }}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[12px] transition-colors",
                  activeStage
                    ? "border-brand-deep-purple bg-brand-deep-purple text-white"
                    : "border-neutral-200 bg-white text-foreground/70 hover:border-neutral-300"
                )}
              >
                <span className="font-bold">{st.letter}</span> {st.label}
              </button>
            )
          })}
          <span className="text-[11px] text-foreground/40">
            most control → easiest
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {VARIANTS.map((v) => (
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
              <span className="font-semibold">#{v.rank}</span> {v.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

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
