"use client"

import { EDITOR_MODES, TABLET_SHEET_COPY, useGraphStore } from "@/utils"
import { SlidersHorizontal } from "lucide-react"

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
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      <GraphToolbar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="border-border w-52 shrink-0 overflow-auto border-r p-3 md:w-64">
          <GraphTextEditor />
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="border-border m-2 min-h-0 flex-1 overflow-hidden rounded-lg border">
            <GraphCanvas />
          </div>
          <Button
            size="icon"
            className="absolute right-4 bottom-4 z-30 h-10 w-10 rounded-full shadow-lg"
            onClick={() => setRightOpen(true)}
            aria-label="Open config panel"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
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
