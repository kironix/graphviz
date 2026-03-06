"use client"

import * as React from "react"
import { useGraphStore } from "@/utils"
import { ChevronDown, ChevronUp, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function GraphSearchControls({
  className,
  inputWidthClassName = "w-full",
}: {
  className?: string
  inputWidthClassName?: string
}) {
  const { searchQuery, searchMatches, focusedNodeId, actions } = useGraphStore()

  const focusRelative = React.useCallback(
    (delta: 1 | -1) => {
      if (searchMatches.length === 0) return

      const current = focusedNodeId ? searchMatches.indexOf(focusedNodeId) : -1
      const start = current === -1 ? (delta === 1 ? -1 : 0) : current
      const next = (start + delta + searchMatches.length) % searchMatches.length

      actions.setState({ focusedNodeId: searchMatches[next] })
    },
    [actions, focusedNodeId, searchMatches]
  )

  return (
    <div className={cn("flex items-center justify-between gap-1", className)}>
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(e) =>
            actions.setState({
              searchQuery: e.target.value,
            })
          }
          onKeyDown={(e) => {
            if (e.key !== "Enter") return
            e.preventDefault()
            focusRelative(e.shiftKey ? -1 : 1)
          }}
          placeholder="Search node or edge label"
          className={cn("h-9 pl-8", inputWidthClassName)}
          aria-label="Search node or edge label"
          aria-controls="graph-canvas-keyboard-help"
        />
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          onClick={() => focusRelative(-1)}
          disabled={searchMatches.length === 0}
          aria-label="Previous match"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={() => focusRelative(1)}
          disabled={searchMatches.length === 0}
          aria-label="Next match"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
