import UilAngleDown from "@iconscout/react-unicons/icons/uil-angle-down"
import UilPlay from "@iconscout/react-unicons/icons/uil-play"
import UilCheck from "@iconscout/react-unicons/icons/uil-check"

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ButtonGroup } from "@/components/ui/button-group"
import { Switch } from "@/components/ui/switch"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { PROVENANCE_COPY } from "./icons"
import type {
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
  actionResults: RunOption[]
  selectedActionId?: string
  onSelectActionResult: (id: string) => void
  onRunAction: () => void
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

/* Split-picker: the selected run + a dropdown that lists runs AND the Run item */
const RunMenu = ({
  runs,
  selectedRunId,
  onSelect,
  runLabel,
  onRun,
  fullWidth = false,
}: {
  runs: RunOption[]
  selectedRunId?: string
  onSelect: (id: string) => void
  runLabel: string
  onRun: () => void
  fullWidth?: boolean
}) => {
  const selected = runs.find((r) => r.id === selectedRunId) ?? runs[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-background px-3 text-[13px] text-foreground/80 hover:bg-neutral-50",
            fullWidth ? "w-full" : "min-w-[210px]"
          )}
        >
          {selected ? (
            <>
              <RunDot status={selected.status} />
              <span className="flex-1 truncate text-left">
                {selected.label}
              </span>
            </>
          ) : (
            <span className="flex-1 text-left text-foreground/45">
              No results yet
            </span>
          )}
          <UilAngleDown className="size-4 shrink-0 text-foreground/40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {runs.map((r) => (
          <DropdownMenuItem
            key={r.id}
            className="gap-2"
            onSelect={() => onSelect(r.id)}
          >
            <RunDot status={r.status} />
            {r.label}
          </DropdownMenuItem>
        ))}
        {runs.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onSelect={onRun} className="gap-2 font-medium">
          <UilPlay className="size-4 text-brand-mint" />
          {runLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const realRunner = (p: SelectorProps, fullWidth = false) => (
  <RunMenu
    runs={p.executions}
    selectedRunId={p.selectedRunId}
    onSelect={p.onSelectExecution}
    runLabel="Run execution"
    onRun={p.onRunTestExecution}
    fullWidth={fullWidth}
  />
)

const testRunner = (p: SelectorProps, fullWidth = false) => (
  <RunMenu
    runs={p.actionResults}
    selectedRunId={p.selectedActionId}
    onSelect={p.onSelectActionResult}
    runLabel="Run action"
    onRun={p.onRunAction}
    fullWidth={fullWidth}
  />
)

/* Runs + Run item for whichever source (Real/Test) is currently active */
const activeRunCfg = (p: SelectorProps) =>
  p.activeSource === "action"
    ? {
        runs: p.actionResults,
        sel: p.selectedActionId,
        onSelect: p.onSelectActionResult,
        runLabel: "Run action",
        onRun: p.onRunAction,
      }
    : {
        runs: p.executions,
        sel: p.selectedRunId,
        onSelect: p.onSelectExecution,
        runLabel: "Run execution",
        onRun: p.onRunTestExecution,
      }

const RunMenuContent = (cfg: ReturnType<typeof activeRunCfg>) => (
  <DropdownMenuContent align="start" className="min-w-[220px]">
    {cfg.runs.map((r) => (
      <DropdownMenuItem
        key={r.id}
        className="gap-2"
        onSelect={() => cfg.onSelect(r.id)}
      >
        <RunDot status={r.status} />
        {r.label}
      </DropdownMenuItem>
    ))}
    {cfg.runs.length > 0 && <DropdownMenuSeparator />}
    <DropdownMenuItem onSelect={cfg.onRun} className="gap-2 font-medium">
      <UilPlay className="size-4 text-brand-mint" />
      {cfg.runLabel}
    </DropdownMenuItem>
  </DropdownMenuContent>
)

const Section = ({
  title,
  active,
  children,
}: {
  title: string
  active: boolean
  children: React.ReactNode
}) => (
  <div
    className={cn(
      "rounded-md border px-3 py-2.5",
      active
        ? "border-brand-deep-purple/40 bg-brand-deep-purple/5"
        : "border-neutral-200"
    )}
  >
    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/45">
      {title}
    </div>
    {children}
  </div>
)

const readout = (p: SelectorProps) => {
  if (p.activeSource === "example") return "Example"
  if (p.activeSource === "action") return "Test data · action result"
  const run = p.executions.find((r) => r.id === p.selectedRunId)
  return run ? `Real data · ${run.label}` : "Real data"
}

/* ---------------- ONE-option chooser body (used by popover) ---------------- */

const ChooserBody = (p: SelectorProps) => (
  <div className="space-y-2">
    <Section title="Real" active={p.activeSource === "execution"}>
      {realRunner(p)}
    </Section>
    <Section title="Test" active={p.activeSource === "action"}>
      {testRunner(p)}
    </Section>
    <button
      type="button"
      onClick={() => p.onSelectKind("example")}
      className={cn(
        "flex w-full items-center gap-2 rounded-md border px-3 py-2.5 text-[13px]",
        p.selectedKind === "example"
          ? "border-brand-deep-purple/40 bg-brand-deep-purple/5 font-medium text-brand-deep-purple"
          : "border-neutral-200 text-foreground/70 hover:bg-neutral-50"
      )}
    >
      <ProvDot provenance="example" />
      Example
      {p.selectedKind === "example" && (
        <UilCheck className="ml-auto size-4 text-brand-deep-purple" />
      )}
    </button>
  </div>
)

/* The cascading menu shared by one-cascade, one-pill, and the easy paths */
const CascadeItems = (p: SelectorProps) => (
  <>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        <ProvDot provenance="real" />
        Real
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
          Run execution
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        <ProvDot provenance="test" />
        Test
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {p.actionResults.map((r) => (
          <DropdownMenuItem
            key={r.id}
            className="gap-2"
            onSelect={() => p.onSelectActionResult(r.id)}
          >
            <RunDot status={r.status} />
            {r.label}
          </DropdownMenuItem>
        ))}
        {p.actionResults.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem
          className="gap-2 font-medium"
          onSelect={() => p.onRunAction()}
        >
          <UilPlay className="size-4 text-brand-mint" />
          Run action
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
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

const OnePopover = (p: SelectorProps) => (
  <div className="space-y-2" data-visual-id="presentation-one">
    <FieldLabel>Data</FieldLabel>
    <Popover>
      <PopoverTrigger asChild>{OneTrigger(p)}</PopoverTrigger>
      <PopoverContent align="start" className="w-[420px]">
        {ChooserBody(p)}
      </PopoverContent>
    </Popover>
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

const sourceLabel = (p: SelectorProps) =>
  p.activeSource === "action"
    ? "Test"
    : p.activeSource === "example"
      ? "Example"
      : "Real"

/* one-split — run picker + source-switch caret in one control */
const OneSplit = (p: SelectorProps) => {
  const isExample = p.activeSource === "example"
  const cfg = activeRunCfg(p)
  const selected = cfg.runs.find((r) => r.id === cfg.sel) ?? cfg.runs[0]
  return (
    <div className="space-y-2" data-visual-id="presentation-one">
      <FieldLabel>Data</FieldLabel>
      <ButtonGroup>
        {isExample ? (
          <div className="inline-flex h-9 min-w-[210px] items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 text-[13px] text-foreground/70">
            <ProvDot provenance="example" />
            <span className="flex-1 truncate text-left">Example</span>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 min-w-[210px] items-center gap-2 rounded-md border border-neutral-200 bg-background px-3 text-[13px] text-foreground/80 hover:bg-neutral-50"
              >
                <ProvDot provenance={p.provenance} />
                <span className="flex-1 truncate text-left">
                  {selected ? selected.label : "No results yet"}
                </span>
              </button>
            </DropdownMenuTrigger>
            {RunMenuContent(cfg)}
          </DropdownMenu>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Switch source"
              className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-background px-2 text-foreground/55 hover:bg-neutral-50"
            >
              <UilAngleDown className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[280px]">
            {CascadeItems(p)}
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
    </div>
  )
}

/* one-breadcrumb — source › run, each segment its own menu */
const OneBreadcrumb = (p: SelectorProps) => {
  const isExample = p.activeSource === "example"
  const cfg = activeRunCfg(p)
  const selected = cfg.runs.find((r) => r.id === cfg.sel) ?? cfg.runs[0]
  const segment =
    "inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-background px-2.5 py-1.5 text-[13px] text-foreground/80 hover:bg-neutral-50"
  return (
    <div className="space-y-2" data-visual-id="presentation-one">
      <FieldLabel>Data</FieldLabel>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={segment}>
                  <ProvDot provenance={p.provenance} />
                  {sourceLabel(p)}
                  <UilAngleDown className="size-3.5 text-foreground/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[180px]">
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={() =>
                    p.onSelectExecution(p.selectedRunId ?? p.executions[0].id)
                  }
                >
                  <ProvDot provenance="real" />
                  Real
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={() =>
                    p.onSelectActionResult(
                      p.selectedActionId ?? p.actionResults[0]?.id ?? ""
                    )
                  }
                >
                  <ProvDot provenance="test" />
                  Test
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={() => p.onSelectKind("example")}
                >
                  <ProvDot provenance="example" />
                  Example
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
          {!isExample && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={segment}>
                      {selected && <RunDot status={selected.status} />}
                      {selected ? selected.label : "No results yet"}
                      <UilAngleDown className="size-3.5 text-foreground/40" />
                    </button>
                  </DropdownMenuTrigger>
                  {RunMenuContent(cfg)}
                </DropdownMenu>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}

/* ---------------- TWO-option (Real data | Example) ---------------- */

type SubStyle = "stacked" | "subtabs"

const twoDot = (p: SelectorProps, s: SourceDef): Provenance =>
  s.kind === "example" ? "example" : p.activeSource === "action" ? "test" : "real"

const RealExampleTop = (p: SelectorProps) => (
  <div className="flex w-full items-stretch overflow-hidden rounded-md border border-neutral-200">
    {p.sources.map((s) => {
      const sel = s.kind === p.selectedKind
      return (
        <button
          key={s.kind}
          type="button"
          disabled={!s.available}
          onClick={() => p.onSelectKind(s.kind)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 border-r border-neutral-200 px-3 py-2 text-[13px] last:border-r-0 transition-colors",
            sel
              ? "bg-brand-deep-purple/8 font-medium text-brand-deep-purple"
              : "text-foreground/65 hover:bg-neutral-50",
            !s.available && "cursor-not-allowed opacity-40"
          )}
        >
          <ProvDot provenance={twoDot(p, s)} />
          {s.label}
        </button>
      )
    })}
  </div>
)

const RealSub = ({ p, style }: { p: SelectorProps; style: SubStyle }) => {
  const isTest = p.activeSource === "action"
  if (style === "stacked") {
    return (
      <div className="space-y-2">
        <Section title="Real" active={!isTest}>
          {realRunner(p)}
        </Section>
        <Section title="Test" active={isTest}>
          {testRunner(p)}
        </Section>
      </div>
    )
  }
  const goReal = () =>
    p.onSelectExecution(p.selectedRunId ?? p.executions[0].id)
  const goTest = () =>
    p.onSelectActionResult(p.selectedActionId ?? p.actionResults[0]?.id ?? "")
  return (
    <div className="space-y-2 rounded-md border border-neutral-200 px-3 py-2.5">
      <div className="flex gap-4 border-b border-neutral-200">
        {[
          { label: "Real", on: !isTest, go: goReal },
          { label: "Test", on: isTest, go: goTest },
        ].map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={t.go}
            className={cn(
              "-mb-px border-b-2 px-1 pb-1.5 text-[12px]",
              t.on
                ? "border-brand-deep-purple font-medium text-brand-deep-purple"
                : "border-transparent text-foreground/60"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {isTest ? testRunner(p) : realRunner(p)}
    </div>
  )
}

const TwoComposed = ({
  subStyle,
  ...p
}: SelectorProps & { subStyle: SubStyle }) => (
  <div className="space-y-2" data-visual-id="presentation-two">
    <FieldLabel>Data</FieldLabel>
    <RealExampleTop {...p} />
    {p.selectedKind === "real" && <RealSub p={p} style={subStyle} />}
  </div>
)

/* two-toggle — "Use real data" switch reveals the runner; off = Example */
const TwoToggle = (p: SelectorProps) => {
  const on = p.selectedKind === "real"
  return (
    <div className="space-y-2" data-visual-id="presentation-two">
      <FieldLabel>Data</FieldLabel>
      <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-foreground/75">
        <Switch
          checked={on}
          onCheckedChange={(v) => p.onSelectKind(v ? "real" : "example")}
        />
        Use real data
        {!on && <span className="text-foreground/45">· showing Example</span>}
      </label>
      {on && <RealSub p={p} style="stacked" />}
    </div>
  )
}

/* two-dropdown — compact 2-item source menu; Real reveals the runner */
const TwoDropdown = (p: SelectorProps) => {
  const isReal = p.selectedKind === "real"
  return (
    <div className="space-y-2" data-visual-id="presentation-two">
      <FieldLabel>Data</FieldLabel>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-9 w-full items-center gap-2 rounded-md border border-neutral-200 bg-background px-3 text-[13px] text-foreground/80 hover:bg-neutral-50"
          >
            <ProvDot provenance={isReal ? p.provenance : "example"} />
            <span className="flex-1 truncate text-left">
              {isReal ? "Real data" : "Example"}
            </span>
            <UilAngleDown className="size-4 shrink-0 text-foreground/40" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[220px]">
          <DropdownMenuItem
            className="gap-2"
            onSelect={() => p.onSelectKind("real")}
          >
            <ProvDot provenance="real" />
            Real data
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onSelect={() => p.onSelectKind("example")}
          >
            <ProvDot provenance="example" />
            Example
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isReal && <RealSub p={p} style="stacked" />}
    </div>
  )
}

/* ---------------- THREE-option (flat Real | Test | Example) ---------------- */

const flatDot = (kind: SourceKind): Provenance =>
  kind === "real" ? "real" : kind === "test" ? "test" : "example"

/* three-segmented — peers Real | Test | Example; Real/Test reveal the picker
   directly (no inner tab list) */
const ThreeSegmented = (p: SelectorProps) => (
  <div className="space-y-2" data-visual-id="presentation-three">
    <FieldLabel>Data</FieldLabel>
    <div className="flex w-full items-stretch overflow-hidden rounded-md border border-neutral-200">
      {p.sources.map((s) => (
        <button
          key={s.kind}
          type="button"
          disabled={!s.available}
          onClick={() => p.onSelectKind(s.kind)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 border-r border-neutral-200 px-3 py-2 text-[13px] last:border-r-0 transition-colors",
            s.kind === p.selectedKind
              ? "bg-brand-deep-purple/8 font-medium text-brand-deep-purple"
              : "text-foreground/65 hover:bg-neutral-50",
            !s.available && "cursor-not-allowed opacity-40"
          )}
        >
          <ProvDot provenance={flatDot(s.kind)} />
          {s.label}
        </button>
      ))}
    </div>
    {p.selectedKind === "real" && realRunner(p, true)}
    {p.selectedKind === "test" && testRunner(p, true)}
  </div>
)

/* ---------------- EASY path ---------------- */

type LineStyle = "dot" | "banner" | "chip"

const EasyLine = ({ lineStyle, ...p }: SelectorProps & { lineStyle: LineStyle }) => {
  const change = (
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
        {change}
      </div>
    )
  }
  if (lineStyle === "chip") {
    return (
      <div
        className="flex flex-wrap items-center gap-2 text-[12px] text-foreground/55"
        data-visual-id="presentation-easy"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">
          <ProvDot provenance={p.provenance} />
          {p.provenance === "real"
            ? "Real data"
            : p.provenance === "test"
              ? "Test data"
              : "Example"}
        </span>
        <span>·</span>
        {change}
      </div>
    )
  }
  return (
    <div
      className="flex flex-wrap items-center gap-1.5 text-[12px] text-foreground/55"
      data-visual-id="presentation-easy"
    >
      <ProvDot provenance={p.provenance} />
      <span>{copy}</span>
      <span>·</span>
      {change}
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
  "one-popover": OnePopover,
  "one-pill": OnePill,
  "one-split": OneSplit,
  "one-breadcrumb": OneBreadcrumb,
  "two-seg-stacked": mk(TwoComposed, { subStyle: "stacked" }),
  "two-seg-subtabs": mk(TwoComposed, { subStyle: "subtabs" }),
  "two-toggle": TwoToggle,
  "two-dropdown": TwoDropdown,
  "three-segmented": ThreeSegmented,
  "easy-dot": mk(EasyLine, { lineStyle: "dot" }),
  "easy-banner": mk(EasyLine, { lineStyle: "banner" }),
  "easy-chip": mk(EasyLine, { lineStyle: "chip" }),
}

export function SourceSelector(props: SelectorProps) {
  const Comp = VARIANT_REGISTRY[props.variant]
  return <Comp {...props} />
}
