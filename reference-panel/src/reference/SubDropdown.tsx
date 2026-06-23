import UilPlay from "@iconscout/react-unicons/icons/uil-play"
import UilAngleDown from "@iconscout/react-unicons/icons/uil-angle-down"

import { StatusIndicator } from "@/components/status-indicator"
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
import { cn } from "@/lib/utils"

import { STATUS_VARIANT } from "./icons"
import type { RunGroup, RunOption, SourceDef } from "./types"

interface SubDropdownProps {
  source: SourceDef
  selectedRunId?: string
  onSelectRun: (run: RunOption) => void
  onRunNew: () => void
  compact?: boolean
  borderless?: boolean
}

const Dot = ({ status }: { status: RunOption["status"] }) => (
  <StatusIndicator
    variant={STATUS_VARIANT[status]}
    size="sm"
    showIcon={false}
    className="size-2.5 shrink-0"
  />
)

const allRuns = (source: SourceDef): RunOption[] =>
  source.groups ? source.groups.flatMap((g) => g.runs) : (source.runs ?? [])

const RunItems = ({
  runs,
  selectedRunId,
  onSelectRun,
}: {
  runs: RunOption[]
  selectedRunId?: string
  onSelectRun: (run: RunOption) => void
}) => (
  <>
    {runs.map((run) => (
      <DropdownMenuItem
        key={run.id}
        onSelect={() => onSelectRun(run)}
        className="gap-2"
      >
        <Dot status={run.status} />
        <span className="flex-1">{run.label}</span>
        {run.id === selectedRunId && (
          <span className="text-brand-mint text-xs font-medium">current</span>
        )}
      </DropdownMenuItem>
    ))}
  </>
)

export function SubDropdown({
  source,
  selectedRunId,
  onSelectRun,
  onRunNew,
  compact = false,
  borderless = false,
}: SubDropdownProps) {
  const runs = allRuns(source)
  const selected = runs.find((r) => r.id === selectedRunId)

  const groups: RunGroup[] = (
    source.groups ?? [{ label: source.label, runs: source.runs ?? [] }]
  ).filter((g) => g.runs.length > 0)
  const hasRuns = groups.length > 0
  const multiType = groups.length > 1

  return (
    <div className="w-fit" data-visual-id={`subdropdown-${source.kind}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center gap-2 text-[13px] text-foreground/80 transition-colors hover:bg-neutral-50",
              borderless
                ? "bg-transparent"
                : "rounded-md border border-neutral-200 bg-background",
              compact ? "px-2" : "min-w-[180px] px-3"
            )}
          >
            {hasRuns ? (
              selected ? (
                <>
                  <Dot status={selected.status} />
                  {!compact && (
                    <span className="flex-1 truncate text-left">
                      {selected.label}
                    </span>
                  )}
                </>
              ) : (
                <span
                  className={cn(
                    "flex-1 text-left text-muted-foreground",
                    compact && "sr-only"
                  )}
                >
                  Select {source.kind === "inline" ? "result" : "run"}
                </span>
              )
            ) : (
              <>
                <UilPlay className="size-4 text-brand-mint" />
                {!compact && <span className="flex-1 text-left">Run</span>}
              </>
            )}
            <UilAngleDown className="size-4 shrink-0 text-foreground/40" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[230px]">
          {hasRuns && (
            <>
              {multiType ? (
                groups.map((group) => (
                  <DropdownMenuSub key={group.label}>
                    <DropdownMenuSubTrigger className="gap-2">
                      {group.label}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <RunItems
                        runs={group.runs}
                        selectedRunId={selectedRunId}
                        onSelectRun={onSelectRun}
                      />
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))
              ) : (
                <RunItems
                  runs={groups[0].runs}
                  selectedRunId={selectedRunId}
                  onSelectRun={onSelectRun}
                />
              )}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onSelect={onRunNew}
            className="gap-2 font-medium"
            data-visual-id={`run-new-${source.kind}`}
          >
            <UilPlay className="size-4 text-brand-mint" />
            {source.runVerb ?? "Run new"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
