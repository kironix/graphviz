"use client"

import { EDITOR_MODES, TABLET_SHEET_COPY, useGraphStore } from "@/utils"
import { Code2, Network, SlidersHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { GraphActions } from "@/components/pages/editor/graph-actions"
import { GraphCanvas } from "@/components/pages/editor/graph-canvas"
import { GraphRightPanel } from "@/components/pages/editor/graph-right-panel"
import { GraphSearchControls } from "@/components/pages/editor/graph-search-controls"
import { GraphTextEditor } from "@/components/pages/editor/graph-text-editor"
import { GraphToolbar } from "@/components/pages/editor/graph-toolbar"

export function TabletLayout({
  rightOpen,
  setRightOpen,
}: {
  rightOpen: boolean
  setRightOpen: (v: boolean) => void
}) {
  const { mode, actions } = useGraphStore()

  return (
    <div className="bg-background relative flex h-screen flex-col overflow-hidden p-3">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.6218_0.1029_214.69/0.12),transparent_40%)]" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <GraphToolbar />
        <div className="grid min-h-0 flex-1 grid-cols-[16rem_minmax(0,1fr)] gap-3 pt-3">
          <div className="border-border/60 bg-card/75 flex min-h-0 flex-col overflow-hidden rounded-[1.7rem] border shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="border-border/60 flex items-center gap-2 border-b px-4 py-3">
              <Code2 className="text-primary h-4 w-4" />
              <div>
                <p className="text-sm font-semibold">Edge List</p>
                <p className="text-muted-foreground text-xs">
                  Edit graph structure directly
                </p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              <GraphTextEditor />
            </div>
          </div>
          <div className="relative flex min-w-0 flex-col">
            <div className="border-border/60 bg-card/70 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.9rem] border shadow-[0_18px_44px_rgba(15,23,42,0.09)]">
              <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <Network className="text-primary h-4 w-4" />
                  <div>
                    <p className="text-sm font-semibold">Canvas</p>
                    <p className="text-muted-foreground text-xs">
                      Interactive graph workspace
                    </p>
                  </div>
                </div>
              </div>
              <div className="min-h-0 flex-1 p-3">
                <div className="h-full overflow-hidden rounded-[1.3rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(248,250,252,0.82))] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.72),rgba(15,23,42,0.82))]">
                  <GraphCanvas />
                </div>
              </div>
            </div>
            <Button
              size="icon"
              className="absolute right-4 bottom-4 z-30 h-11 w-11 rounded-full shadow-lg"
              onClick={() => setRightOpen(true)}
              aria-label="Open config panel"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <Sheet open={rightOpen} onOpenChange={setRightOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{TABLET_SHEET_COPY.title}</SheetTitle>
            <SheetDescription>{TABLET_SHEET_COPY.description}</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-6rem)]">
            <div className="flex flex-col gap-4 px-4 pb-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Search</div>
                <GraphSearchControls
                  className="w-full flex-wrap gap-2"
                  inputWidthClassName="w-60"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Mode</div>
                <div className="border-border flex overflow-hidden rounded-lg border">
                  {EDITOR_MODES.map(({ value, label }, i) => (
                    <button
                      key={value}
                      onClick={() => actions.setState({ mode: value })}
                      className={cn(
                        "focus-visible:ring-primary flex-1 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2",
                        i > 0 && "border-border border-l",
                        mode === value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <GraphRightPanel />
              <GraphActions />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
