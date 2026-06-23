import { useEffect, useMemo, useState } from "react"
import UilTimes from "@iconscout/react-unicons/icons/uil-times"
import UilClipboardNotes from "@iconscout/react-unicons/icons/uil-clipboard-notes"
import UilFlask from "@iconscout/react-unicons/icons/uil-flask"
import UilSpinner from "@iconscout/react-unicons/icons/uil-spinner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { SearchInput } from "@/components/search-input"

import {
  Availability,
  PAYLOAD_BY_SOURCE,
  STEPS,
  buildPeerSources,
  buildTieredSources,
} from "./mockData"
import { PayloadTree } from "./PayloadTree"
import { SourceSelector } from "./SourceSelector"
import type { RunOption, SourceKind, SourceModel, VariantId } from "./types"

interface ReferencePanelProps {
  variant: VariantId
  sourceModel: SourceModel
  availability: Availability
}

export function ReferencePanel({
  variant,
  sourceModel,
  availability,
}: ReferencePanelProps) {
  const [stepSlug, setStepSlug] = useState(STEPS[1].slug)
  const [requestedKind, setRequestedKind] = useState<SourceKind | null>(null)
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>()
  const [path, setPath] = useState("")
  const [query, setQuery] = useState("")
  const [running, setRunning] = useState(false)

  const sources = useMemo(
    () =>
      sourceModel === "peers"
        ? buildPeerSources(availability)
        : buildTieredSources(availability),
    [sourceModel, availability]
  )

  const firstAvailable = sources.find((s) => s.available)?.kind
  const requestedAvailable = sources.find(
    (s) => s.kind === requestedKind && s.available
  )
  const effectiveKind = (requestedAvailable?.kind ??
    firstAvailable) as SourceKind | undefined

  const activeSource = sources.find((s) => s.kind === effectiveKind)
  const runs = activeSource?.groups
    ? activeSource.groups.flatMap((g) => g.runs)
    : (activeSource?.runs ?? [])
  const effectiveRunId =
    runs.find((r) => r.id === selectedRunId)?.id ?? runs[0]?.id

  useEffect(() => {
    setSelectedRunId(undefined)
  }, [effectiveKind, stepSlug])

  const onRunNew = () => {
    setRunning(true)
    window.setTimeout(() => {
      setRunning(false)
      if (runs[0]) setSelectedRunId(runs[0].id)
    }, 900)
  }

  const onSelectRun = (run: RunOption) => setSelectedRunId(run.id)

  const doc = effectiveKind ? PAYLOAD_BY_SOURCE[effectiveKind] : undefined
  const noneAvailable = !effectiveKind

  return (
    <div
      className="flex w-[500px] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-background shadow-[0_8px_40px_-8px_rgba(25,24,24,0.25)]"
      data-visual-id="reference-panel"
    >
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
        <h3 className="text-[15px] font-semibold text-foreground">Reference</h3>
        <button className="text-foreground/40 hover:text-foreground/70">
          <UilTimes className="size-5" />
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <div className="mb-1.5 text-[13px] font-semibold text-foreground/70">
            Step
          </div>
          <Select value={stepSlug} onValueChange={setStepSlug}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STEPS.map((s) => (
                <SelectItem key={s.slug} value={s.slug}>
                  <span className="flex flex-col items-start">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-[11px] text-foreground/45">
                      {s.component} · {s.action}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SourceSelector
          variant={variant}
          sources={sources}
          selectedKind={effectiveKind ?? sources[0].kind}
          onSelectSource={setRequestedKind}
          selectedRunId={effectiveRunId}
          onSelectRun={onSelectRun}
          onRunNew={onRunNew}
        />
      </div>

      <div className="space-y-2.5 px-5 pb-2 pt-1">
        <div>
          <div className="mb-1.5 text-[13px] font-semibold text-foreground/70">
            Path
          </div>
          <div className="flex items-stretch overflow-hidden rounded border border-neutral-200">
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="results.records[0].id"
              className="h-10 flex-1 bg-background px-3 text-[14px] text-foreground/85 placeholder:text-foreground/35 focus:outline-none"
            />
            <button
              type="button"
              title="Copy reference"
              className="flex items-center border-l border-neutral-200 bg-neutral-50 px-3 text-foreground/45 hover:text-foreground/70"
            >
              <UilClipboardNotes className="size-4" />
            </button>
          </div>
        </div>
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          placeholder="Search properties…"
          className="h-10 bg-neutral-50"
        />
      </div>

      <div className="max-h-[320px] min-h-[200px] overflow-auto px-5 pb-4">
        {running ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-foreground/50">
            <UilSpinner className="size-7 animate-spin" />
            <span className="text-sm">Running execution…</span>
          </div>
        ) : noneAvailable ? (
          <Empty className="h-[200px] border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UilFlask />
              </EmptyMedia>
              <EmptyTitle>No reference data yet</EmptyTitle>
              <EmptyDescription>
                This step has no data captured. Run a test execution to see
                real data here.
              </EmptyDescription>
            </EmptyHeader>
            <Button size="sm" onClick={onRunNew} className="gap-1.5">
              <UilFlask className="size-4" />
              Run a test execution
            </Button>
          </Empty>
        ) : (
          doc && (
            <PayloadTree
              doc={doc}
              query={query}
              selectedPath={path}
              onSelect={setPath}
            />
          )
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button size="sm" disabled={!path} className={cn(!path && "opacity-60")}>
          Insert
        </Button>
      </div>
    </div>
  )
}
