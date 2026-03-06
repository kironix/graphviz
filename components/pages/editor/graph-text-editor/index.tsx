"use client"

import * as React from "react"
import { useGraphStore } from "@/utils"

import {
  formatIssueLineLabel,
  parseIntegerToken,
  validateGraphText,
} from "./utils"

interface GraphTextEditorProps {
  disabled?: boolean
}

export function GraphTextEditor({ disabled }: GraphTextEditorProps) {
  const { nodes, edges, indexMode, direction, actions } = useGraphStore()
  const [localText, setLocalText] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = React.useRef<HTMLDivElement>(null)
  const skipNextSync = React.useRef(false)

  const canonicalText = React.useMemo(() => {
    if (nodes.length === 0) {
      return "0"
    }

    const offset = indexMode === "1-index" ? 1 : 0
    let result = String(nodes.length)
    edges.forEach((e) => {
      const src = parseInt(e.source, 10) + offset
      const tgt = parseInt(e.target, 10) + offset
      let line = `${src} ${tgt}`
      if (typeof e.weight === "number" && Number.isFinite(e.weight)) {
        line += ` ${e.weight}`
      }
      if (e.label?.trim()) {
        line += ` ${e.label.trim()}`
      }
      result += `\n${line}`
    })
    return result
  }, [nodes.length, edges, indexMode])

  React.useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }
    setLocalText(canonicalText)
  }, [canonicalText])

  const validationIssues = React.useMemo(
    () => validateGraphText(localText, indexMode, direction),
    [localText, indexMode, direction]
  )

  const handleNodeCountChange = (value: string) => {
    const lines = localText.split("\n")
    lines[0] = value
    const newText = lines.join("\n")
    setLocalText(newText)
    skipNextSync.current = true
    if (validateGraphText(newText, indexMode, direction).length === 0) {
      actions.parseFromText(newText)
    }
  }

  const handleEdgeLinesChange = (value: string) => {
    const edgeLinesParsed = value
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)

    let maxIdx = -1
    const offset = indexMode === "1-index" ? 1 : 0
    for (const line of edgeLinesParsed) {
      const parts = line.split(/\s+/)
      if (parts.length >= 2) {
        const a = parseIntegerToken(parts[0])
        const b = parseIntegerToken(parts[1])
        if (a !== null) maxIdx = Math.max(maxIdx, a - offset)
        if (b !== null) maxIdx = Math.max(maxIdx, b - offset)
      }
    }

    const neededCount = maxIdx >= 0 ? maxIdx + 1 : 0
    const nodeCount = Math.max(
      neededCount,
      edgeLinesParsed.length > 0 ? neededCount : 0
    )

    const newText = String(nodeCount) + "\n" + value
    setLocalText(newText)
    skipNextSync.current = true
    if (validateGraphText(newText, indexMode, direction).length === 0) {
      actions.parseFromText(newText)
    }
  }

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const allLines = localText.split("\n")
  const nodeCountLine = allLines[0] || ""
  const edgeLines = allLines.slice(1).join("\n")
  const edgeLinesArray = allLines.slice(1)

  return (
    <div className="flex h-full flex-col overflow-hidden text-sm">
      <div className="flex-1 overflow-hidden">
        <div className="mb-1 flex items-center justify-between px-1 text-xs">
          <span className="font-semibold">Node Count:</span>
          <span className="text-muted-foreground">
            {nodes.length} nodes · {edges.length} edges
          </span>
        </div>
        <div className="mb-2 flex items-start">
          <div className="text-muted-foreground w-8 shrink-0 pr-1 text-right text-xs leading-6 select-none">
            1
          </div>
          <input
            type="text"
            value={nodeCountLine}
            onChange={(e) => handleNodeCountChange(e.target.value)}
            readOnly={disabled}
            disabled={disabled}
            className="text-foreground min-h-11 w-full border-0 bg-transparent px-1 py-0 text-sm leading-6 outline-none disabled:cursor-default disabled:opacity-70 md:min-h-0"
          />
        </div>

        <div className="mb-1 px-1 text-xs font-semibold">Graph Data:</div>
        <div className="text-muted-foreground mb-1 px-1 text-[11px]">
          Format: <code>source target [weight] [label...]</code>
        </div>
        <div className="relative flex flex-1 overflow-auto">
          <div
            ref={lineNumbersRef}
            className="text-muted-foreground pointer-events-none w-8 shrink-0 overflow-hidden pr-1 text-right text-xs select-none"
          >
            {edgeLinesArray.map((_, i) => (
              <div key={i} className="leading-5.5">
                {i + 1}
              </div>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={edgeLines}
            onChange={(e) => handleEdgeLinesChange(e.target.value)}
            onScroll={handleScroll}
            readOnly={disabled}
            disabled={disabled}
            className="text-foreground min-h-48 flex-1 resize-none border-0 bg-transparent px-1 text-sm leading-5.5 outline-none disabled:cursor-default disabled:opacity-70"
            spellCheck={false}
          />
        </div>
        {validationIssues.length > 0 && (
          <div className="border-destructive/40 bg-destructive/5 text-destructive mt-2 rounded-md border p-2 text-xs">
            {validationIssues.slice(0, 8).map((issue, i) => (
              <div key={`${issue.line}-${issue.message}-${i}`}>
                {formatIssueLineLabel(issue.line)}: {issue.message}
              </div>
            ))}
            {validationIssues.length > 8 && (
              <div>+{validationIssues.length - 8} more issue(s)</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
