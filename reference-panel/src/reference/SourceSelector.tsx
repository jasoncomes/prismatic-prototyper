import { useState } from "react"
import UilAngleDown from "@iconscout/react-unicons/icons/uil-angle-down"
import UilAngleRight from "@iconscout/react-unicons/icons/uil-angle-right"
import UilPlay from "@iconscout/react-unicons/icons/uil-play"
import UilTimes from "@iconscout/react-unicons/icons/uil-times"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { SOURCE_ICON, STATUS_VARIANT } from "./icons"
import { StatusIndicator } from "@/components/status-indicator"
import { SubDropdown } from "./SubDropdown"
import type { RunOption, SourceDef, SourceKind, VariantId } from "./types"

export interface SelectorProps {
  variant: VariantId
  sources: SourceDef[]
  selectedKind: SourceKind
  onSelectSource: (k: SourceKind) => void
  selectedRunId?: string
  onSelectRun: (r: RunOption) => void
  onRunNew: () => void
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-1.5 text-[13px] font-semibold text-foreground/70">
    {children}
  </div>
)

const SourceGlyph = ({
  kind,
  className,
}: {
  kind: SourceKind
  className?: string
}) => {
  const Icon = SOURCE_ICON[kind]
  return <Icon className={cn("size-4", className)} />
}

function activeRunnable(p: SelectorProps): SourceDef | undefined {
  const active = p.sources.find((s) => s.kind === p.selectedKind)
  return active?.runnable && active.available ? active : undefined
}

const Sub = ({ p, compact }: { p: SelectorProps; compact?: boolean }) => {
  const active = activeRunnable(p)
  if (!active) return null
  return (
    <SubDropdown
      source={active}
      selectedRunId={p.selectedRunId}
      onSelectRun={p.onSelectRun}
      onRunNew={p.onRunNew}
      compact={compact}
    />
  )
}

/* ---- 1. Segmented Up Top ---- */
const Segmented = (p: SelectorProps) => (
  <div className="space-y-2" data-visual-id="variant-segmented">
    <FieldLabel>Data source</FieldLabel>
    <ToggleGroup
      type="single"
      variant="outline"
      value={p.selectedKind}
      onValueChange={(v) => v && p.onSelectSource(v as SourceKind)}
      className="w-full"
    >
      {p.sources.map((s) => (
        <ToggleGroupItem
          key={s.kind}
          value={s.kind}
          disabled={!s.available}
          title={!s.available ? s.reason : undefined}
          className="flex-1 gap-1.5"
        >
          <SourceGlyph kind={s.kind} />
          {s.shortLabel}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
    <Sub p={p} />
  </div>
)

/* ---- 2. Source Row, reflows right ---- */
const Reflow = (p: SelectorProps) => (
  <div className="space-y-2" data-visual-id="variant-reflow">
    <FieldLabel>Data source</FieldLabel>
    <div className="flex flex-wrap items-center gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        value={p.selectedKind}
        onValueChange={(v) => v && p.onSelectSource(v as SourceKind)}
      >
        {p.sources.map((s) => (
          <ToggleGroupItem
            key={s.kind}
            value={s.kind}
            disabled={!s.available}
            title={!s.available ? s.reason : s.label}
            className="px-2.5"
          >
            <SourceGlyph kind={s.kind} />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Sub p={p} />
    </div>
  </div>
)

/* ---- 3. Stacked Labeled Fields ---- */
const Stacked = (p: SelectorProps) => {
  const active = activeRunnable(p)
  return (
    <div className="space-y-3" data-visual-id="variant-stacked">
      <div>
        <FieldLabel>Data source</FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          value={p.selectedKind}
          onValueChange={(v) => v && p.onSelectSource(v as SourceKind)}
          className="w-full"
        >
          {p.sources.map((s) => (
            <ToggleGroupItem
              key={s.kind}
              value={s.kind}
              disabled={!s.available}
              title={!s.available ? s.reason : undefined}
              className="flex-1 gap-1.5"
            >
              <SourceGlyph kind={s.kind} />
              {s.shortLabel}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {active && (
        <div>
          <FieldLabel>
            {active.kind === "inline" ? "Action result" : "Test run"}
          </FieldLabel>
          <Sub p={p} />
        </div>
      )}
    </div>
  )
}

/* ---- 4. Underlined Tabs ---- */
const TabsVariant = (p: SelectorProps) => (
  <div className="space-y-2" data-visual-id="variant-tabs">
    <Tabs
      value={p.selectedKind}
      onValueChange={(v) => p.onSelectSource(v as SourceKind)}
    >
      <TabsList className="w-full justify-start">
        {p.sources.map((s) => (
          <TabsTrigger
            key={s.kind}
            value={s.kind}
            disabled={!s.available}
            title={!s.available ? s.reason : undefined}
            className="gap-1.5"
          >
            <SourceGlyph kind={s.kind} />
            {s.shortLabel}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
    <Sub p={p} />
  </div>
)

/* ---- 5. Chip Trio+1 ---- */
const Chips = (p: SelectorProps) => (
  <div className="space-y-2" data-visual-id="variant-chips">
    <FieldLabel>Data source</FieldLabel>
    <div className="flex flex-wrap items-center gap-2">
      {p.sources.map((s) => {
        const selected = s.kind === p.selectedKind
        return (
          <button
            key={s.kind}
            type="button"
            disabled={!s.available}
            title={!s.available ? s.reason : undefined}
            onClick={() => p.onSelectSource(s.kind)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] transition-colors",
              selected
                ? "border-brand-deep-purple bg-brand-deep-purple text-white"
                : "border-neutral-200 bg-background text-foreground/70 hover:border-neutral-300",
              !s.available && "cursor-not-allowed opacity-40"
            )}
          >
            <SourceGlyph kind={s.kind} className="size-3.5" />
            {s.shortLabel}
          </button>
        )
      })}
    </div>
    <Sub p={p} />
  </div>
)

/* ---- 6. Smart Default + Disclosure ---- */
const Disclosure = (p: SelectorProps) => {
  const [open, setOpen] = useState(false)
  const active = p.sources.find((s) => s.kind === p.selectedKind)
  const selectedRun = activeRunnable(p)?.runs?.find(
    (r) => r.id === p.selectedRunId
  )
  return (
    <div className="space-y-2" data-visual-id="variant-disclosure">
      <div className="flex items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
        <div className="flex items-center gap-2 text-[13px] text-foreground/75">
          {active && <SourceGlyph kind={active.kind} />}
          <span className="font-medium">Showing: {active?.label}</span>
          {selectedRun && (
            <span className="text-foreground/45">· {selectedRun.label}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          className="gap-1 text-brand-blue-purple"
        >
          Change source
          <UilAngleDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </div>
      {open && (
        <div className="space-y-2 rounded-md border border-dashed border-neutral-200 p-2">
          <Segmented {...p} />
        </div>
      )}
    </div>
  )
}

/* ---- 7. Card Radio Stack ---- */
const Cards = (p: SelectorProps) => (
  <div className="space-y-1.5" data-visual-id="variant-cards">
    <FieldLabel>Data source</FieldLabel>
    {p.sources.map((s) => {
      const selected = s.kind === p.selectedKind
      return (
        <div
          key={s.kind}
          role="button"
          tabIndex={s.available ? 0 : -1}
          onClick={() => s.available && p.onSelectSource(s.kind)}
          title={!s.available ? s.reason : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md border px-3 py-2 text-[13px] transition-colors",
            selected
              ? "border-brand-deep-purple bg-brand-deep-purple/5"
              : "border-neutral-200 hover:border-neutral-300",
            s.available ? "cursor-pointer" : "cursor-not-allowed opacity-50"
          )}
        >
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded-full border",
              selected ? "border-brand-deep-purple" : "border-neutral-300"
            )}
          >
            {selected && (
              <span className="size-2 rounded-full bg-brand-deep-purple" />
            )}
          </span>
          <SourceGlyph kind={s.kind} />
          <span className="font-medium text-foreground/85">{s.label}</span>
          {!s.available && (
            <span className="ml-auto text-[11px] text-foreground/45">
              unavailable
            </span>
          )}
          {selected && s.runnable && s.available && (
            <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
              <Sub p={p} />
            </div>
          )}
        </div>
      )
    })}
  </div>
)

/* ---- 8. Pill Tabs ---- */
const Pills = (p: SelectorProps) => (
  <div className="space-y-2" data-visual-id="variant-pills">
    <FieldLabel>Data source</FieldLabel>
    <div className="flex flex-wrap items-center gap-1.5">
      {p.sources.map((s) => {
        const selected = s.kind === p.selectedKind
        return (
          <button
            key={s.kind}
            type="button"
            disabled={!s.available}
            title={!s.available ? s.reason : undefined}
            onClick={() => p.onSelectSource(s.kind)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors",
              selected
                ? "bg-brand-mint text-brand-black"
                : "text-foreground/60 hover:bg-neutral-100",
              !s.available && "cursor-not-allowed opacity-40"
            )}
          >
            <SourceGlyph kind={s.kind} className="size-3.5" />
            {s.shortLabel}
          </button>
        )
      })}
    </div>
    <Sub p={p} />
  </div>
)

/* ---- 9. Source Dropdown + dependent ---- */
const DropdownVariant = (p: SelectorProps) => {
  const active = activeRunnable(p)
  return (
    <div className="space-y-3" data-visual-id="variant-dropdown">
      <div>
        <FieldLabel>Data source</FieldLabel>
        <Select
          value={p.selectedKind}
          onValueChange={(v) => p.onSelectSource(v as SourceKind)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {p.sources.map((s) => (
              <SelectItem key={s.kind} value={s.kind} disabled={!s.available}>
                <span className="flex items-center gap-2">
                  <SourceGlyph kind={s.kind} />
                  {s.label}
                  {!s.available && (
                    <span className="text-foreground/40">— unavailable</span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {active && (
        <div>
          <FieldLabel>
            {active.kind === "inline" ? "Action result" : "Test run"}
          </FieldLabel>
          <Sub p={p} />
        </div>
      )}
    </div>
  )
}

/* ---- 10. Header Switch (icon-only) ---- */
const Header = (p: SelectorProps) => (
  <div
    className="flex items-center gap-3 rounded-md bg-neutral-50 px-3 py-2"
    data-visual-id="variant-header"
  >
    <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
      Source
    </span>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-neutral-200 bg-background px-3 text-[13px] font-medium text-foreground/80 hover:bg-neutral-50"
        >
          {(() => {
            const active = p.sources.find((s) => s.kind === p.selectedKind)
            return active ? (
              <>
                <SourceGlyph kind={active.kind} />
                {active.label}
              </>
            ) : null
          })()}
          <UilAngleDown className="size-4 text-foreground/40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {p.sources.map((s) => (
          <DropdownMenuItem
            key={s.kind}
            disabled={!s.available}
            onSelect={() => p.onSelectSource(s.kind)}
            className="gap-2"
          >
            <SourceGlyph kind={s.kind} />
            {s.label}
            {!s.available && (
              <span className="ml-auto text-[11px] text-foreground/40">
                unavailable
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
    <Sub p={p} compact />
  </div>
)

const activeSourceOf = (p: SelectorProps) =>
  p.sources.find((s) => s.kind === p.selectedKind)

const flattenRuns = (s?: SourceDef): RunOption[] =>
  !s ? [] : s.groups ? s.groups.flatMap((g) => g.runs) : (s.runs ?? [])

const Dot = ({ status }: { status: RunOption["status"] }) => (
  <StatusIndicator
    variant={STATUS_VARIANT[status]}
    size="sm"
    showIcon={false}
    className="size-2.5 shrink-0"
  />
)

const SourceMenuItems = (p: SelectorProps) =>
  p.sources.map((s) => (
    <DropdownMenuItem
      key={s.kind}
      disabled={!s.available}
      onSelect={() => p.onSelectSource(s.kind)}
      className="gap-2"
    >
      <SourceGlyph kind={s.kind} />
      {s.label}
      {!s.available && (
        <span className="ml-auto text-[11px] text-foreground/40">
          unavailable
        </span>
      )}
    </DropdownMenuItem>
  ))

/* ---- 11. Merged Source + Run Pill ---- */
const MergedPill = (p: SelectorProps) => {
  const active = activeSourceOf(p)
  const runnable = activeRunnable(p)
  return (
    <div className="space-y-2" data-visual-id="variant-mergedPill">
      <FieldLabel>Data source</FieldLabel>
      <div className="inline-flex h-9 w-fit items-stretch overflow-hidden rounded-md border border-neutral-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 border-r border-neutral-200 px-3 text-[13px] font-medium text-foreground/80 hover:bg-neutral-50">
              {active && <SourceGlyph kind={active.kind} />}
              {active?.label}
              <UilAngleDown className="size-4 text-foreground/40" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SourceMenuItems(p)}
          </DropdownMenuContent>
        </DropdownMenu>
        {runnable ? (
          <Sub p={p} borderless />
        ) : (
          <span className="flex items-center px-3 text-[12px] text-foreground/40">
            static — no run
          </span>
        )}
      </div>
    </div>
  )
}

/* ---- 14. Accordion Sources ---- */
const AccordionSrc = (p: SelectorProps) => (
  <div className="space-y-2" data-visual-id="variant-accordionSrc">
    <FieldLabel>Data source</FieldLabel>
    <div className="divide-y divide-neutral-100 overflow-hidden rounded-md border border-neutral-200">
      {p.sources.map((s) => {
        const selected = s.kind === p.selectedKind
        return (
          <div key={s.kind}>
            <button
              type="button"
              disabled={!s.available}
              onClick={() => p.onSelectSource(s.kind)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-[13px]",
                selected && "bg-neutral-50 font-medium",
                s.available
                  ? "hover:bg-neutral-50"
                  : "cursor-not-allowed opacity-40"
              )}
            >
              <SourceGlyph kind={s.kind} />
              {s.label}
              {!s.available ? (
                <span className="ml-auto text-[11px] text-foreground/45">
                  unavailable
                </span>
              ) : (
                s.runnable && (
                  <UilAngleDown
                    className={cn(
                      "ml-auto size-4 text-foreground/40 transition-transform",
                      selected && "rotate-180"
                    )}
                  />
                )
              )}
            </button>
            {selected && s.runnable && s.available && (
              <div className="bg-neutral-50/60 px-3 pb-2 pt-1">
                <Sub p={p} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  </div>
)

/* ---- 15. Segmented + Status Badges ---- */
const SegmentedBadges = (p: SelectorProps) => (
  <div className="space-y-2" data-visual-id="variant-segmentedBadges">
    <FieldLabel>Data source</FieldLabel>
    <ToggleGroup
      type="single"
      variant="outline"
      value={p.selectedKind}
      onValueChange={(v) => v && p.onSelectSource(v as SourceKind)}
      className="w-full"
    >
      {p.sources.map((s) => (
        <ToggleGroupItem
          key={s.kind}
          value={s.kind}
          disabled={!s.available}
          title={!s.available ? s.reason : undefined}
          className="flex-1 gap-1.5"
        >
          <SourceGlyph kind={s.kind} />
          {s.shortLabel}
          {s.available ? (
            s.runnable && (
              <span className="size-1.5 rounded-full bg-brand-mint" />
            )
          ) : (
            <UilTimes className="size-3.5 text-foreground/30" />
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
    <Sub p={p} />
  </div>
)

/* ---- 16. Icon Toolbar + Readout ---- */
const Toolbar = (p: SelectorProps) => {
  const active = activeSourceOf(p)
  return (
    <div className="space-y-2" data-visual-id="variant-toolbar">
      <FieldLabel>Data source</FieldLabel>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-md border border-neutral-200 p-1">
          {p.sources.map((s) => {
            const selected = s.kind === p.selectedKind
            return (
              <button
                key={s.kind}
                type="button"
                disabled={!s.available}
                title={!s.available ? s.reason : s.label}
                onClick={() => p.onSelectSource(s.kind)}
                className={cn(
                  "flex size-8 items-center justify-center rounded transition-colors",
                  selected
                    ? "bg-brand-deep-purple text-white"
                    : "text-foreground/55 hover:bg-neutral-100",
                  !s.available && "cursor-not-allowed opacity-30"
                )}
              >
                <SourceGlyph kind={s.kind} />
              </button>
            )
          })}
        </div>
        <span className="text-[13px] text-foreground/55">
          Showing{" "}
          <span className="font-semibold text-foreground/80">
            {active?.label}
          </span>
        </span>
        <Sub p={p} />
      </div>
    </div>
  )
}

/* ---- 17. Inline Radio Group ---- */
const Radios = (p: SelectorProps) => {
  const runnable = activeRunnable(p)
  return (
    <div className="space-y-3" data-visual-id="variant-radios">
      <div>
        <FieldLabel>Data source</FieldLabel>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {p.sources.map((s) => (
            <label
              key={s.kind}
              className={cn(
                "flex items-center gap-2 text-[13px]",
                s.available
                  ? "cursor-pointer text-foreground/80"
                  : "cursor-not-allowed text-foreground/40"
              )}
              title={!s.available ? s.reason : undefined}
            >
              <input
                type="radio"
                name="source-radio"
                disabled={!s.available}
                checked={s.kind === p.selectedKind}
                onChange={() => p.onSelectSource(s.kind)}
                className="accent-brand-deep-purple"
              />
              <SourceGlyph kind={s.kind} />
              {s.label}
            </label>
          ))}
        </div>
      </div>
      {runnable && (
        <div>
          <FieldLabel>
            {runnable.kind === "inline" ? "Action result" : "Test run"}
          </FieldLabel>
          <Sub p={p} />
        </div>
      )}
    </div>
  )
}

/* ---- 18. Vertical Tabs (left) ---- */
const VTabs = (p: SelectorProps) => {
  const active = activeSourceOf(p)
  const runnable = activeRunnable(p)
  return (
    <div data-visual-id="variant-vtabs">
      <FieldLabel>Data source</FieldLabel>
      <div className="flex gap-3">
        <div className="flex w-[150px] shrink-0 flex-col gap-0.5 border-r border-neutral-100 pr-2">
          {p.sources.map((s) => {
            const selected = s.kind === p.selectedKind
            return (
              <button
                key={s.kind}
                type="button"
                disabled={!s.available}
                title={!s.available ? s.reason : undefined}
                onClick={() => p.onSelectSource(s.kind)}
                className={cn(
                  "flex items-center gap-2 rounded px-2 py-1.5 text-left text-[13px]",
                  selected
                    ? "bg-brand-deep-purple/8 font-medium text-brand-deep-purple"
                    : "text-foreground/65 hover:bg-neutral-50",
                  !s.available && "cursor-not-allowed opacity-40"
                )}
              >
                <SourceGlyph kind={s.kind} />
                {s.shortLabel}
              </button>
            )
          })}
        </div>
        <div className="flex-1 pt-1">
          <div className="mb-2 text-[13px] font-medium text-foreground/80">
            {active?.label}
          </div>
          {runnable ? (
            <Sub p={p} />
          ) : (
            <span className="text-[12px] text-foreground/45">
              Static source — no run needed
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---- 19. Consolidated Picker ---- */
const PopoverPicker = (p: SelectorProps) => {
  const active = activeSourceOf(p)
  const selRun = flattenRuns(activeRunnable(p)).find(
    (r) => r.id === p.selectedRunId
  )
  return (
    <div className="space-y-2" data-visual-id="variant-popoverPicker">
      <FieldLabel>Data source</FieldLabel>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2 rounded-md border border-neutral-200 bg-background px-3 text-[13px] text-foreground/80 hover:bg-neutral-50"
          >
            {active && <SourceGlyph kind={active.kind} />}
            <span className="flex-1 truncate text-left">
              {active?.label}
              {selRun && (
                <span className="text-foreground/45"> · {selRun.label}</span>
              )}
            </span>
            <UilAngleDown className="size-4 text-foreground/40" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[280px]">
          {p.sources.map((s) =>
            s.runnable && s.available ? (
              <DropdownMenuSub key={s.kind}>
                <DropdownMenuSubTrigger className="gap-2">
                  <SourceGlyph kind={s.kind} />
                  {s.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {flattenRuns(s).map((r) => (
                    <DropdownMenuItem
                      key={r.id}
                      className="gap-2"
                      onSelect={() => {
                        p.onSelectSource(s.kind)
                        p.onSelectRun(r)
                      }}
                    >
                      <Dot status={r.status} />
                      {r.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 font-medium"
                    onSelect={() => {
                      p.onSelectSource(s.kind)
                      p.onRunNew()
                    }}
                  >
                    <UilPlay className="size-4 text-brand-mint" />
                    {s.runVerb}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : (
              <DropdownMenuItem
                key={s.kind}
                disabled={!s.available}
                onSelect={() => p.onSelectSource(s.kind)}
                className="gap-2"
              >
                <SourceGlyph kind={s.kind} />
                {s.label}
                {!s.available && (
                  <span className="ml-auto text-[11px] text-foreground/40">
                    unavailable
                  </span>
                )}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/* ---- 20. Dependency Breadcrumb ---- */
const Breadcrumb = (p: SelectorProps) => {
  const active = activeSourceOf(p)
  return (
    <div className="space-y-2" data-visual-id="variant-breadcrumb">
      <FieldLabel>Reference data</FieldLabel>
      <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 font-medium text-foreground/80 hover:bg-neutral-50">
              {active && <SourceGlyph kind={active.kind} />}
              {active?.label}
              <UilAngleDown className="size-4 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SourceMenuItems(p)}
          </DropdownMenuContent>
        </DropdownMenu>
        {activeRunnable(p) && (
          <>
            <UilAngleRight className="size-4 text-foreground/30" />
            <Sub p={p} />
          </>
        )}
      </div>
    </div>
  )
}

const REGISTRY: Record<VariantId, (p: SelectorProps) => React.ReactNode> = {
  segmented: Segmented,
  reflow: Reflow,
  stacked: Stacked,
  tabs: TabsVariant,
  chips: Chips,
  disclosure: Disclosure,
  cards: Cards,
  pills: Pills,
  dropdown: DropdownVariant,
  header: Header,
  mergedPill: MergedPill,
  accordionSrc: AccordionSrc,
  segmentedBadges: SegmentedBadges,
  toolbar: Toolbar,
  radios: Radios,
  vtabs: VTabs,
  popoverPicker: PopoverPicker,
  breadcrumb: Breadcrumb,
}

export function SourceSelector(props: SelectorProps) {
  return <>{REGISTRY[props.variant](props)}</>
}
