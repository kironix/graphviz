"use client"

import * as React from "react"
import Link from "next/link"
import { Config } from "@/config"
import {
  DEFAULT_CONFIG,
  EDITOR_DIRECTIONS,
  EDITOR_INDEX_MODES,
  EDITOR_MODES,
  GRAPH_RESET_DIALOG,
  MOBILE_DIALOG_COPY,
  useGraphStore,
} from "@/utils"
import {
  Code2,
  Download,
  HouseHeart,
  Network,
  Redo2,
  Settings,
  SlidersHorizontal,
  Trash2,
  Undo2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { AlertDialogHelper } from "@/components/alert-dialog-helper"
import { DialogHelper } from "@/components/dialog-helper"
import { GraphActions } from "@/components/pages/editor/graph-actions"
import { GraphCanvas } from "@/components/pages/editor/graph-canvas"
import { GraphRightPanel } from "@/components/pages/editor/graph-right-panel"
import { GraphSearchControls } from "@/components/pages/editor/graph-search-controls"
import { GraphTextEditor } from "@/components/pages/editor/graph-text-editor"
import { ShortcutHelpDialog } from "@/components/pages/editor/shortcut-help-dialog"
import { ThemeSwitcher } from "@/components/theme-switcher"

export function MobileLayout({
  leftOpen,
  setLeftOpen,
  rightOpen,
  setRightOpen,
  actionsOpen,
  setActionsOpen,
}: {
  leftOpen: boolean
  setLeftOpen: (v: boolean) => void
  rightOpen: boolean
  setRightOpen: (v: boolean) => void
  actionsOpen: boolean
  setActionsOpen: (v: boolean) => void
}) {
  const {
    direction,
    indexMode,
    mode,
    nodes,
    edges,
    config,
    customLabels,
    actions,
  } = useGraphStore()
  const [optionsOpen, setOptionsOpen] = React.useState(false)

  const canUndo = actions.canUndo()
  const canRedo = actions.canRedo()

  const isDefaultConfig =
    config.nodeRadius === DEFAULT_CONFIG.nodeRadius &&
    config.edgeIdealLength === DEFAULT_CONFIG.edgeIdealLength &&
    config.nodeBackground === DEFAULT_CONFIG.nodeBackground &&
    config.nodeColor === DEFAULT_CONFIG.nodeColor &&
    config.edgeColor === DEFAULT_CONFIG.edgeColor &&
    config.labelColor === DEFAULT_CONFIG.labelColor

  const isResetDisabled =
    nodes.length === 0 &&
    edges.length === 0 &&
    Object.keys(customLabels).length === 0 &&
    isDefaultConfig

  return (
    <div className="bg-background relative flex h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,oklch(0.6218_0.1029_214.69/0.16),transparent_60%)]" />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="border-border/60 bg-background/88 absolute right-3 left-3 z-40 flex items-center justify-between rounded-2xl border px-4 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.12)] backdrop-blur"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary/12 text-primary flex size-9 items-center justify-center rounded-xl">
              <Network className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{Config.title}</p>
              <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                {Config.title} workspace
              </p>
            </div>
          </div>
          <div className="text-muted-foreground rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
            {mode}
          </div>
        </div>
        <div className="h-full w-full">
          <GraphCanvas />
        </div>
        <div
          className="border-border/60 bg-background/90 absolute left-1/2 z-40 flex w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center justify-center gap-1 rounded-[1.6rem] border px-3 py-2 shadow-[0_18px_42px_rgba(15,23,42,0.18)] backdrop-blur-sm"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <HouseHeart className="h-5 w-5" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setOptionsOpen(true)}
            aria-label="Graph options"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setLeftOpen(true)}
            aria-label="Open text editor"
          >
            <Code2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setRightOpen(true)}
            aria-label="Open config"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setActionsOpen(true)}
            aria-label="Export actions"
          >
            <Download className="h-5 w-5" />
          </Button>
          <ThemeSwitcher />
        </div>
      </div>
      <DialogHelper
        title={MOBILE_DIALOG_COPY.options.title}
        description={MOBILE_DIALOG_COPY.options.description}
        open={optionsOpen}
        setOpen={setOptionsOpen}
      >
        <div className="mt-4 space-y-4 pb-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Direction</div>
            <div className="border-border flex overflow-hidden rounded-lg border">
              {EDITOR_DIRECTIONS.map(({ value, label }, i) => (
                <button
                  key={value}
                  onClick={() => actions.setState({ direction: value })}
                  className={cn(
                    "focus-visible:ring-primary flex-1 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2",
                    i > 0 && "border-border border-l",
                    direction === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Index Mode</div>
            <div className="border-border flex overflow-hidden rounded-lg border">
              {EDITOR_INDEX_MODES.map(({ value, label }, i) => (
                <button
                  key={value}
                  onClick={() => {
                    actions.setState({ indexMode: value })
                    actions.updateLabelsForIndexMode()
                  }}
                  className={cn(
                    "focus-visible:ring-primary flex-1 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2",
                    i > 0 && "border-border border-l",
                    indexMode === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Search</div>
            <GraphSearchControls />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">History</div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="secondary"
                onClick={() => actions.undo()}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </Button>
              <Button
                variant="secondary"
                onClick={() => actions.redo()}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
                Redo
              </Button>
              <AlertDialogHelper
                title={GRAPH_RESET_DIALOG.title}
                description={GRAPH_RESET_DIALOG.description}
                func={() => actions.clearGraph()}
                disabled={isResetDisabled}
                className="w-full"
                trigger={
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={isResetDisabled}
                  >
                    <Trash2 className="h-4 w-4" />
                    Reset
                  </Button>
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Help</div>
            <ShortcutHelpDialog className="w-full" />
          </div>
        </div>
      </DialogHelper>
      <DialogHelper
        title={MOBILE_DIALOG_COPY.textEditor.title}
        description={MOBILE_DIALOG_COPY.textEditor.description}
        open={leftOpen}
        setOpen={setLeftOpen}
      >
        <GraphTextEditor />
      </DialogHelper>
      <DialogHelper
        title={MOBILE_DIALOG_COPY.modeConfig.title}
        description={MOBILE_DIALOG_COPY.modeConfig.description}
        open={rightOpen}
        setOpen={setRightOpen}
      >
        <div className="space-y-4">
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
        </div>
      </DialogHelper>
      <DialogHelper
        title={MOBILE_DIALOG_COPY.export.title}
        description={MOBILE_DIALOG_COPY.export.description}
        open={actionsOpen}
        setOpen={setActionsOpen}
      >
        <GraphActions />
      </DialogHelper>
    </div>
  )
}
