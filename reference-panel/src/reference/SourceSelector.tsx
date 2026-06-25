import UilAngleDown from "@iconscout/react-unicons/icons/uil-angle-down"
import UilPlay from "@iconscout/react-unicons/icons/uil-play"

import { cn } from "@/lib/utils"
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

import { PROVENANCE_COPY } from "./icons"
import type {
  Audience,
  Presentation,
  Provenance,
  RunOption,
  SourceDef,
  SourceKind,
  Variant,
} from "./types"

export type ActiveSource = "execution" | "action" | "example"

export interface SelectorProps {
  presentation: Presentation
  variant: Variant
  sources: SourceDef[]
  selectedKind: SourceKind
  onSelectKind: (k: SourceKind) => void
  activeSource: ActiveSource
  provenance: Provenance
  executions: RunOption[]
  selectedRunId?: string
  onSelectExecution: (id: string) => void
  onRunTestExecution: () => void
  hasTestRuns: boolean
  stepRunnable: boolean
  audience: Audience
  overridden: boolean
  onResetAuto: () => void
}

/* ---------------- shared atoms ---------------- */

const ProvDot = ({ provenance }: { provenance: Provenance }) => (
  <span
    className={cn(
      "size-2.5 shrink-0 rounded-full",
      provenance === "real" && "bg-brand-mint",
      provenance === "test" && "border-2 border-brand-mint",
      provenance === "example" && "border border-foreground/40"
    )}
  />
)

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-1.5 text-[13px] font-semibold text-foreground/70">
    {children}
  </div>
)

const RunDot = ({ status }: { status: RunOption["status"] }) => (
  <span
    className={cn(
      "size-2 shrink-0 rounded-full",
      status === "success" && "bg-brand-mint",
      status === "error" && "bg-interactive-error",
      status === "running" && "bg-brand-cyan"
    )}
  />
)

const readout = (p: SelectorProps) => {
  if (p.activeSource === "example") return "Example"
  if (p.activeSource === "action") return "Step result"
  const run = p.executions.find((r) => r.id === p.selectedRunId)
  return run ? `Test Runs · ${run.label}` : "Test Runs"
}

/* The cascading menu shared by one-cascade, one-pill, and the easy paths */
const CascadeItems = (p: SelectorProps) => (
  <>
    {p.hasTestRuns && (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="gap-2">
          <ProvDot provenance="real" />
          Test Runs
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {p.executions.map((r) => (
            <DropdownMenuItem
              key={r.id}
              className="gap-2"
              onSelect={() => p.onSelectExecution(r.id)}
            >
              <RunDot status={r.status} />
              {r.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 font-medium"
            onSelect={() => p.onRunTestExecution()}
          >
            <UilPlay className="size-4 text-brand-mint" />
            Run test
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )}
    {p.stepRunnable && (
      <DropdownMenuItem
        className="gap-2"
        onSelect={() => p.onSelectKind("test")}
      >
        <ProvDot provenance="test" />
        Step result
      </DropdownMenuItem>
    )}
    <DropdownMenuItem
      className="gap-2"
      onSelect={() => p.onSelectKind("example")}
    >
      <ProvDot provenance="example" />
      Example
    </DropdownMenuItem>
  </>
)

const OneTrigger = (p: SelectorProps) => (
  <button
    type="button"
    className="inline-flex h-9 w-full items-center gap-2 rounded-md border border-neutral-200 bg-background px-3 text-[13px] text-foreground/80 hover:bg-neutral-50"
  >
    <ProvDot provenance={p.provenance} />
    <span className="flex-1 truncate text-left">{readout(p)}</span>
    <UilAngleDown className="size-4 shrink-0 text-foreground/40" />
  </button>
)

const OneCascade = (p: SelectorProps) => (
  <div className="space-y-2" data-visual-id="presentation-one">
    <FieldLabel>Data</FieldLabel>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{OneTrigger(p)}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[280px]">
        {CascadeItems(p)}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)

const OnePill = (p: SelectorProps) => (
  <div className="space-y-2" data-visual-id="presentation-one">
    <FieldLabel>Data</FieldLabel>
    <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 py-1.5 pl-3 pr-1.5">
      <ProvDot provenance={p.provenance} />
      <span className="flex-1 truncate text-[13px] text-foreground/75">
        {readout(p)}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="rounded-full px-2.5 py-1 text-[12px] font-medium text-brand-blue-purple hover:bg-white"
          >
            Change
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[280px]">
          {CascadeItems(p)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
)

/* ---------------- EASY path ---------------- */

type LineStyle = "banner" | "chip"

const EasyLine = ({ lineStyle, ...p }: SelectorProps & { lineStyle: LineStyle }) => {
  // Tail controls only exist in low-code/designer; EWB shows provenance only.
  const tail =
    p.audience === "ewb" ? null : (
      <span className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="font-medium text-brand-blue-purple hover:underline"
            >
              Change
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[280px]">
            {CascadeItems(p)}
          </DropdownMenuContent>
        </DropdownMenu>
        {p.overridden && (
          <button
            type="button"
            onClick={p.onResetAuto}
            className="text-foreground/45 hover:underline"
          >
            Reset to auto
          </button>
        )}
      </span>
    )
  const copy = PROVENANCE_COPY[p.provenance]
  if (lineStyle === "banner") {
    return (
      <div
        className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] text-foreground/60"
        data-visual-id="presentation-easy"
      >
        <ProvDot provenance={p.provenance} />
        <span className="flex-1">{copy}</span>
        {tail}
      </div>
    )
  }
  // chip
  return (
    <div
      className="flex flex-wrap items-center gap-2 text-[12px] text-foreground/55"
      data-visual-id="presentation-easy"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">
        <ProvDot provenance={p.provenance} />
        {p.provenance === "real"
          ? "Test Runs"
          : p.provenance === "test"
            ? "Step"
            : "Example"}
      </span>
      {tail && (
        <>
          <span>·</span>
          {tail}
        </>
      )}
    </div>
  )
}

/* ---------------- registry ---------------- */

const mk =
  <X extends object>(Comp: (p: SelectorProps & X) => React.ReactNode, extra: X) =>
  (p: SelectorProps) =>
    Comp({ ...p, ...extra })

const VARIANT_REGISTRY: Record<Variant, (p: SelectorProps) => React.ReactNode> = {
  "one-cascade": OneCascade,
  "one-pill": OnePill,
  "easy-banner": mk(EasyLine, { lineStyle: "banner" }),
  "easy-chip": mk(EasyLine, { lineStyle: "chip" }),
}

export function SourceSelector(props: SelectorProps) {
  const Comp = VARIANT_REGISTRY[props.variant]
  return <Comp {...props} />
}
