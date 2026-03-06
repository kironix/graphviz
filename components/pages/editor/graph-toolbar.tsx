"use client"

import Link from "next/link"
import {
  DEFAULT_CONFIG,
  EDITOR_DIRECTIONS,
  EDITOR_INDEX_MODES,
  EDITOR_MODES,
  GRAPH_RESET_DIALOG,
  TOOLBAR_DESKTOP_BUTTON_CLASS,
  useGraphStore,
} from "@/utils"
import { Home, HouseHeart, Redo2, Trash2, Undo2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useIsDesktop, useIsMobile } from "@/hooks/use-mobile"
import { Button, buttonVariants } from "@/components/ui/button"
import { AlertDialogHelper } from "@/components/alert-dialog-helper"
import { GraphSearchControls } from "@/components/pages/editor/graph-search-controls"
import { ShortcutHelpDialog } from "@/components/pages/editor/shortcut-help-dialog"
import { ThemeSwitcher } from "@/components/theme-switcher"

export function GraphToolbar() {
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

  const isMobile = useIsMobile()
  const isDesktop = useIsDesktop()

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

  const indexControls = (
    <div className="border-border flex shrink-0 overflow-hidden rounded-md border">
      {EDITOR_INDEX_MODES.map(({ value, compactLabel }, i, arr) => (
        <Button
          key={value}
          variant={indexMode === value ? "default" : "ghost"}
          size="default"
          className={cn(
            TOOLBAR_DESKTOP_BUTTON_CLASS,
            indexMode !== value &&
              i < arr.length - 1 &&
              "border-border border-r"
          )}
          onClick={() => {
            actions.setState({ indexMode: value })
            actions.updateLabelsForIndexMode()
          }}
        >
          {compactLabel}
        </Button>
      ))}
    </div>
  )

  if (isMobile) {
    return (
      <div className="border-border bg-background flex shrink-0 items-center justify-between gap-2 border-b px-2">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Back to home"
        >
          <Link href="/">
            <Home className="h-4 w-4" />
          </Link>
        </Button>
        <div className="border-border flex flex-1 overflow-hidden rounded-md border">
          {EDITOR_MODES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => actions.setState({ mode: value })}
              className={cn(
                "focus-visible:ring-primary flex-1 py-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2",
                mode === value
                  ? "text-foreground border-primary border-b-2"
                  : "text-muted-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "border-border bg-background shrink-0 gap-3 border-b px-4 py-2.5",
        isDesktop
          ? "grid grid-cols-[1fr_auto_1fr] items-center"
          : "flex flex-wrap items-center justify-between"
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href="/"
          className={buttonVariants({ variant: "secondary", size: "icon" })}
        >
          <HouseHeart className="h-4 w-4" />
        </Link>
        <div className="border-border flex shrink-0 overflow-hidden rounded-md border">
          {EDITOR_DIRECTIONS.map(({ value, label }, i, arr) => (
            <Button
              key={value}
              variant={direction === value ? "default" : "ghost"}
              size="default"
              className={cn(
                TOOLBAR_DESKTOP_BUTTON_CLASS,
                direction !== value &&
                  i < arr.length - 1 &&
                  "border-border border-r"
              )}
              onClick={() => actions.setState({ direction: value })}
            >
              {label}
            </Button>
          ))}
        </div>
        {indexControls}
      </div>
      {isDesktop && (
        <div className="justify-self-center">
          <div className="border-border flex shrink-0 overflow-hidden rounded-md border">
            {EDITOR_MODES.map(({ value, label }, i, arr) => (
              <Button
                key={value}
                variant={mode === value ? "default" : "ghost"}
                size="default"
                className={cn(
                  TOOLBAR_DESKTOP_BUTTON_CLASS,
                  mode !== value &&
                    i < arr.length - 1 &&
                    "border-border border-r"
                )}
                onClick={() => actions.setState({ mode: value })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div
        className={cn(
          "flex items-center gap-2",
          isDesktop ? "justify-self-end" : "ml-auto"
        )}
      >
        {isDesktop && <GraphSearchControls className="shrink-0" />}
        <div className="border-border flex shrink-0 overflow-hidden rounded-md border">
          <Button
            variant="ghost"
            size="default"
            className={cn(
              TOOLBAR_DESKTOP_BUTTON_CLASS,
              "border-border border-r"
            )}
            onClick={() => actions.undo()}
            disabled={!canUndo}
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button
            variant="ghost"
            size="default"
            className={cn(
              TOOLBAR_DESKTOP_BUTTON_CLASS,
              "border-border border-r"
            )}
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
            className="h-full"
            trigger={
              <Button
                variant="ghost"
                size="default"
                className={TOOLBAR_DESKTOP_BUTTON_CLASS}
                disabled={isResetDisabled}
              >
                <Trash2 className="h-4 w-4" />
                Reset
              </Button>
            }
          />
        </div>
        <ShortcutHelpDialog compact />
        <ThemeSwitcher />
      </div>
    </div>
  )
}
