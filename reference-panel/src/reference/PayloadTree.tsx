import { useState } from "react"
import UilAngleRight from "@iconscout/react-unicons/icons/uil-angle-right"
import UilAngleDown from "@iconscout/react-unicons/icons/uil-angle-down"

import { cn } from "@/lib/utils"
import { TYPE_ICON } from "./icons"
import type { PayloadDoc, PayloadNode } from "./types"

interface TreeNodeProps {
  node: PayloadNode
  depth: number
  forceOpen?: boolean
  selectedPath?: string
  onSelect: (path: string) => void
}

const branchTypes: PayloadNode["type"][] = ["object", "array"]

const matches = (node: PayloadNode, q: string): boolean =>
  node.key.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)

const filterNodes = (nodes: PayloadNode[], q: string): PayloadNode[] => {
  if (!q) return nodes
  const lower = q.toLowerCase()
  return nodes.reduce<PayloadNode[]>((acc, node) => {
    if (matches(node, lower)) {
      acc.push(node)
      return acc
    }
    const kids = node.children ? filterNodes(node.children, lower) : []
    if (kids.length) acc.push({ ...node, children: kids })
    return acc
  }, [])
}

function TreeNode({
  node,
  depth,
  forceOpen,
  selectedPath,
  onSelect,
}: TreeNodeProps) {
  const isBranch = branchTypes.includes(node.type) && !!node.children?.length
  const [open, setOpen] = useState(depth < 2)
  const isOpen = forceOpen || open
  const Icon = TYPE_ICON[node.type]
  const isSelected = selectedPath === node.path

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        data-visual-id={`tree-node-${node.path}`}
        onClick={() => (isBranch ? setOpen((v) => !v) : onSelect(node.path))}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            isBranch ? setOpen((v) => !v) : onSelect(node.path)
          }
        }}
        className={cn(
          "group flex cursor-pointer items-center gap-1.5 rounded py-1 pr-2 text-[13px] hover:bg-neutral-50",
          isSelected && "bg-brand-mint/12 ring-1 ring-brand-mint/40"
        )}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
      >
        <span className="flex size-4 shrink-0 items-center justify-center text-foreground/40">
          {isBranch ? (
            isOpen ? (
              <UilAngleDown className="size-4" />
            ) : (
              <UilAngleRight className="size-4" />
            )
          ) : null}
        </span>
        <Icon className="size-3.5 shrink-0 text-brand-blue-purple/70" />
        <span className="font-medium text-foreground/85">{node.key}</span>
        {node.value !== undefined && (
          <span className="ml-2 truncate text-foreground/45">{node.value}</span>
        )}
        {!isBranch && (
          <span className="ml-auto pl-2 text-[11px] font-medium text-brand-mint opacity-0 transition-opacity group-hover:opacity-100">
            Insert
          </span>
        )}
      </div>
      {isBranch && isOpen && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              forceOpen={forceOpen}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface SectionProps {
  title: string
  count: number
  defaultOpen: boolean
  children: React.ReactNode
}

function Section({ title, count, defaultOpen, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-1 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-foreground/45 hover:text-foreground/70"
      >
        {open ? (
          <UilAngleDown className="size-4" />
        ) : (
          <UilAngleRight className="size-4" />
        )}
        {title}
        <span className="ml-1 font-normal normal-case text-foreground/35">
          ({count})
        </span>
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  )
}

interface PayloadTreeProps {
  doc: PayloadDoc
  query?: string
  selectedPath?: string
  onSelect: (path: string) => void
}

export function PayloadTree({
  doc,
  query = "",
  selectedPath,
  onSelect,
}: PayloadTreeProps) {
  const properties = filterNodes(doc.properties, query)
  const body = filterNodes(doc.body, query)
  const filtering = query.trim().length > 0

  return (
    <div data-visual-id="payload-tree">
      <Section
        title="Properties"
        count={properties.length}
        defaultOpen={filtering}
      >
        {properties.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            forceOpen={filtering}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
      </Section>
      <Section title="Payload body" count={body.length} defaultOpen={true}>
        {body.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            forceOpen={filtering}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
      </Section>
    </div>
  )
}
