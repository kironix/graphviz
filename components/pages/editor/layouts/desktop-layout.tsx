"use client"

import { GraphActions } from "@/components/pages/editor/graph-actions"
import { GraphCanvas } from "@/components/pages/editor/graph-canvas"
import { GraphRightPanel } from "@/components/pages/editor/graph-right-panel"
import { GraphTextEditor } from "@/components/pages/editor/graph-text-editor"
import { GraphToolbar } from "@/components/pages/editor/graph-toolbar"

export function DesktopLayout() {
  return (
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      <GraphToolbar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="border-border w-52 shrink-0 overflow-auto border-r p-3 md:w-64 xl:w-76">
          <GraphTextEditor />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-border m-2 min-h-0 flex-1 overflow-hidden rounded-lg border">
            <GraphCanvas />
          </div>
        </div>
        <div className="border-border flex w-52 shrink-0 flex-col overflow-hidden border-l p-3 md:w-64 xl:w-76">
          <div className="min-h-0 flex-1 overflow-auto">
            <GraphRightPanel />
          </div>
          <div className="shrink-0 pt-3">
            <GraphActions />
          </div>
        </div>
      </div>
    </div>
  )
}
