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

import { CAPTURED_RUNS, PAYLOAD, STEPS, autoKind, buildSources } from "./mockData"
import { PayloadTree } from "./PayloadTree"
import { SourceSelector, type ActiveSource } from "./SourceSelector"
import type {
  Audience,
  Availability,
  Presentation,
  Provenance,
  SourceKind,
  Variant,
} from "./types"

interface ReferencePanelProps {
  presentation: Presentation
  variant: Variant
  availability: Availability
  audience: Audience
}

export function ReferencePanel({
  presentation,
  variant,
  availability,
  audience,
}: ReferencePanelProps) {
  const [stepSlug, setStepSlug] = useState(STEPS[1].slug)
  const auto = useMemo(() => autoKind(availability), [availability])
  const [selectedKind, setSelectedKind] = useState<SourceKind>(auto ?? "real")
  const [overridden, setOverridden] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState<string>(CAPTURED_RUNS[0].id)
  const [running, setRunning] = useState<"none" | "execution" | "action">(
    "none"
  )
  const [path, setPath] = useState("")
  const [query, setQuery] = useState("")

  const sources = useMemo(
    () => buildSources(presentation, availability),
    [presentation, availability]
  )

  const kindAvailable = (k: SourceKind) =>
    k === "real"
      ? availability.real
      : k === "test"
        ? availability.inline
        : availability.schema || availability.example
  // Default to the auto pick; only honor the user's choice once they override.
  const effectiveKind = (
    overridden && kindAvailable(selectedKind) ? selectedKind : auto
  ) as SourceKind | undefined

  // On step / availability change: reset to auto, and if the auto pick is the
  // inline step, simulate invoking it on open (brief fetch → the one result).
  useEffect(() => {
    setRunning("none")
    setSelectedRunId(CAPTURED_RUNS[0].id)
    setOverridden(false)
    setSelectedKind(auto ?? "real")
    if (auto === "test") {
      setRunning("action")
      const t = window.setTimeout(() => setRunning("none"), 700)
      return () => window.clearTimeout(t)
    }
  }, [stepSlug, presentation, auto])

  const activeSource: ActiveSource = !effectiveKind
    ? "example"
    : effectiveKind === "example"
      ? "example"
      : effectiveKind === "test"
        ? "action"
        : "execution"

  const onSelectKind = (k: SourceKind) => {
    setOverridden(true)
    setSelectedKind(k)
  }
  const onSelectExecution = (id: string) => {
    setOverridden(true)
    setSelectedKind("real")
    setSelectedRunId(id)
  }
  const onRunTestExecution = () => {
    setOverridden(true)
    setSelectedKind("real")
    setRunning("execution")
    window.setTimeout(() => {
      setRunning("none")
      setSelectedRunId(CAPTURED_RUNS[0].id)
    }, 900)
  }
  const onResetAuto = () => {
    setOverridden(false)
    setSelectedKind(auto ?? "real")
  }

  const provenance: Provenance =
    activeSource === "example"
      ? "example"
      : activeSource === "action"
        ? "test"
        : "real"

  const exampleDoc = availability.schema ? PAYLOAD.schema : PAYLOAD.example
  const doc = !effectiveKind
    ? undefined
    : activeSource === "example"
      ? exampleDoc
      : activeSource === "action"
        ? PAYLOAD.test
        : PAYLOAD.real

  const selector = (
    <SourceSelector
      presentation={presentation}
      variant={variant}
      sources={sources}
      selectedKind={effectiveKind ?? sources[0].kind}
      onSelectKind={onSelectKind}
      activeSource={activeSource}
      provenance={provenance}
      executions={CAPTURED_RUNS}
      selectedRunId={selectedRunId}
      onSelectExecution={onSelectExecution}
      onRunTestExecution={onRunTestExecution}
      hasTestRuns={availability.real}
      stepRunnable={availability.inline}
      audience={audience}
      overridden={overridden}
      onResetAuto={onResetAuto}
    />
  )

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

        {presentation !== "easy" && selector}
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

      <div className="max-h-[360px] min-h-[210px] overflow-auto px-5 pb-4">
        {presentation === "easy" && <div className="mb-2">{selector}</div>}

        {running !== "none" ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-foreground/50">
            <UilSpinner className="size-7 animate-spin" />
            <span className="text-sm">
              {running === "execution"
                ? "Fetching test run…"
                : "Fetching this step's data…"}
            </span>
          </div>
        ) : !effectiveKind ? (
          <Empty className="h-[200px] border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UilFlask />
              </EmptyMedia>
              <EmptyTitle>No reference data yet</EmptyTitle>
              <EmptyDescription>
                Once this step has a test run, a runnable action, or an example,
                its data shows up here automatically.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          doc && (
            <>
              {activeSource === "example" && (
                <div className="mb-2 rounded bg-neutral-50 px-2.5 py-1.5 text-[12px] text-foreground/55">
                  {availability.schema
                    ? "No test run yet — showing the step's output schema."
                    : "No test run yet — showing an example payload."}
                </div>
              )}
              <PayloadTree
                doc={doc}
                query={query}
                selectedPath={path}
                onSelect={setPath}
              />
            </>
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
