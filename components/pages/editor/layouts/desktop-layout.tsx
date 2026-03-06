"use client"

import { Code2, Download, Network, SlidersHorizontal } from "lucide-react"

import { GraphActions } from "@/components/pages/editor/graph-actions"
import { GraphCanvas } from "@/components/pages/editor/graph-canvas"
import { GraphRightPanel } from "@/components/pages/editor/graph-right-panel"
import { GraphTextEditor } from "@/components/pages/editor/graph-text-editor"
import { GraphToolbar } from "@/components/pages/editor/graph-toolbar"

export function DesktopLayout() {
  return (
    <div className="bg-background relative flex h-screen flex-col overflow-hidden p-3">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.6218_0.1029_214.69/0.12),transparent_40%)]" />
      <div className="pointer-events-none absolute top-16 -left-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-10 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <GraphToolbar />
        <div className="grid min-h-0 flex-1 grid-cols-[16rem_minmax(0,1fr)_17rem] gap-3 pt-3 xl:grid-cols-[18rem_minmax(0,1fr)_19rem]">
          <div className="border-border/60 bg-card/75 flex min-h-0 flex-col overflow-hidden rounded-[1.7rem] border shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="border-border/60 flex items-center gap-2 border-b px-4 py-3">
              <Code2 className="text-primary h-4 w-4" />
              <div>
                <p className="text-sm font-semibold">Edge List</p>
                <p className="text-muted-foreground text-xs">
                  Direct graph input and raw structure editing
                </p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              <GraphTextEditor />
            </div>
          </div>

          <div className="border-border/60 bg-card/70 flex min-w-0 flex-col overflow-hidden rounded-[1.9rem] border shadow-[0_18px_44px_rgba(15,23,42,0.09)]">
            <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <Network className="text-primary h-4 w-4" />
                <div>
                  <p className="text-sm font-semibold">Canvas</p>
                  <p className="text-muted-foreground text-xs">
                    Live graph workspace
                  </p>
                </div>
              </div>
              <div className="text-muted-foreground rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.2em]">
                Ready
              </div>
            </div>
            <div className="min-h-0 flex-1 p-3">
              <div className="h-full overflow-hidden rounded-[1.3rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(248,250,252,0.82))] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.72),rgba(15,23,42,0.82))]">
                <GraphCanvas />
              </div>
            </div>
          </div>

          <div className="border-border/60 bg-card/75 flex min-h-0 flex-col overflow-hidden rounded-[1.7rem] border shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="border-border/60 flex items-center gap-2 border-b px-4 py-3">
              <SlidersHorizontal className="text-primary h-4 w-4" />
              <div>
                <p className="text-sm font-semibold">Inspector</p>
                <p className="text-muted-foreground text-xs">
                  Graph settings, search, and exports
                </p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              <GraphRightPanel />
            </div>
            <div className="border-border/60 shrink-0 border-t p-3">
              <div className="mb-3 flex items-center gap-2 px-1">
                <Download className="text-primary h-4 w-4" />
                <p className="text-sm font-semibold">Actions</p>
              </div>
              <GraphActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
