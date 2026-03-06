"use client"

import * as React from "react"
import { CircleHelp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DialogHelper } from "@/components/dialog-helper"

function Key({ children }: { children: string }) {
  return (
    <kbd className="bg-muted text-foreground rounded border px-1.5 py-0.5 font-mono text-[11px]">
      {children}
    </kbd>
  )
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  )
}

export function ShortcutHelpDialog({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const isQuestionMark = e.key === "?" || (e.key === "/" && e.shiftKey)
      if (!isQuestionMark) return
      e.preventDefault()
      setOpen(true)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <DialogHelper
      title="Shortcuts & Interactions"
      description="Keyboard shortcuts, search navigation, and canvas interactions."
      open={open}
      setOpen={setOpen}
      trigger={
        compact ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Show shortcuts help"
            className={className}
          >
            <CircleHelp className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="default"
            className={cn("gap-2", className)}
          >
            <CircleHelp className="h-4 w-4" />
            Help
          </Button>
        )
      }
      className="max-w-6xl"
    >
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-2">
          <div className="font-medium">Global Keyboard</div>
          <div className="space-y-1">
            <div>
              <Key>Ctrl/Cmd + Z</Key> Undo
            </div>
            <div>
              <Key>Shift + Ctrl/Cmd + Z</Key> Redo
            </div>
            <div>
              <Key>Shift + Ctrl/Cmd + S</Key> Copy share link
            </div>
            <div>
              <Key>Shift + /</Key> Open shortcuts dialog
            </div>
            <div>
              <Key>V</Key> <Key>D</Key> <Key>E</Key> <Key>X</Key> <Key>C</Key>{" "}
              Switch modes
            </div>
            <div>
              Canvas: <Key>Tab</Key>/<Key>Shift + Tab</Key> cycle nodes
            </div>
            <div>
              Canvas: <Key>Arrow Keys</Key> move focused node
            </div>
            <div>
              Delete mode: <Key>Delete</Key>/<Key>Backspace</Key> delete focused
              node
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-medium">Search & Edit</div>
          <div className="space-y-1">
            <div>
              <Key>Enter</Key> Confirm label edit
            </div>
            <div>
              <Key>Esc</Key> Cancel label edit
            </div>
            <div>
              Search box: <Key>Enter</Key> next match
            </div>
            <div>
              Search box: <Key>Shift + Enter</Key> previous match
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-medium">Interactions</div>
          <div className="space-y-1">
            <div>Force/Config: click node to fix or unfix</div>
            <div>Force/Config: drag node to reposition</div>
            <div>Draw: click empty space to add node</div>
            <div>Draw: drag from node to node to add edge</div>
            <div>Edit: click edge to edit weight/label</div>
            <div>Delete: click node/edge, then confirm</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-medium">Where To Find Tools</div>
          <div className="space-y-1">
            <div>Desktop: toolbar search field</div>
            <div>Tablet: right sheet Search section</div>
            <div>Mobile: Graph Options Search section</div>
            <div>Export panel: Share Link button copies URL too.</div>
            <div>Performance mode auto-enables at 500+ nodes.</div>
          </div>
        </div>
      </div>
    </DialogHelper>
  )
}
