"use client"

import * as React from "react"
import Link from "next/link"
import { Config } from "@/config"
import type { GraphEdge, GraphNode } from "@/types"
import {
  Clock3,
  Command,
  Download,
  FolderTree,
  Network,
  Play,
  Sparkles,
} from "lucide-react"
import { motion } from "motion/react"

import { graphStore, HOME_DEMO_EDGES, HOME_DEMO_NODES } from "@/utils"

import { Navbar } from "@/components/pages/home/navbar"
import { GraphCanvas } from "@/components/pages/editor/graph-canvas"
import { GraphTextEditor } from "@/components/pages/editor/graph-text-editor"
import { ScrollToTop } from "@/components/pages/home/scroll-to-top"

function toPreviewState() {
  const nodes: GraphNode[] = HOME_DEMO_NODES.map((node) => ({
    id: String(node.id),
    label: node.label,
    x: node.x,
    y: node.y,
    vx: 0,
    vy: 0,
    fixed: false,
  }))

  const edges: GraphEdge[] = HOME_DEMO_EDGES.map((edge) => ({
    source: String(edge.from),
    target: String(edge.to),
    ...(typeof edge.weight === "number" ? { weight: edge.weight } : {}),
    ...(edge.label ? { label: edge.label } : {}),
  }))

  return {
    nodes,
    edges,
    customLabels: Object.fromEntries(
      HOME_DEMO_NODES.map((node) => [String(node.id), node.label])
    ),
  }
}

function cloneStoreState() {
  const state = graphStore.getState()
  return {
    nodes: state.nodes.map((node) => ({ ...node })),
    edges: state.edges.map((edge) => ({ ...edge })),
    customLabels: { ...state.customLabels },
    indexMode: state.indexMode,
    mode: state.mode,
    direction: state.direction,
    config: { ...state.config },
    canvasSize: { ...state.canvasSize },
    searchQuery: state.searchQuery,
    searchMatches: [...state.searchMatches],
    searchEdgeMatches: [...state.searchEdgeMatches],
    focusedNodeId: state.focusedNodeId,
  }
}

const quickFacts = [
  {
    icon: Network,
    label: "Offline-first",
    value: "Local canvas, local graph state",
  },
  {
    icon: Command,
    label: "Shortcut-driven",
    value: "Undo, redo, search, and mode switching",
  },
  {
    icon: Download,
    label: "Export-ready",
    value: "SVG output with force and matrix workflows",
  },
]

const shortcutRows = [
  { label: "Open editor", value: "Enter" },
  { label: "Switch mode", value: "1 / 2 / 3" },
  { label: "Undo / Redo", value: "Cmd Z / Shift Cmd Z" },
]

export function Home() {
  React.useEffect(() => {
    const previousState = cloneStoreState()
    const preview = toPreviewState()

    graphStore.setState({
      ...preview,
      searchQuery: "",
      searchMatches: [],
      searchEdgeMatches: [],
      focusedNodeId: null,
      indexMode: "custom",
      mode: "force",
      direction: "undirected",
    })

    return () => {
      graphStore.setState(previousState)
    }
  }, [])

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="relative overflow-hidden px-6 pt-24 pb-12 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-136 bg-[radial-gradient(circle_at_top,oklch(0.6218_0.1029_214.69/0.16),transparent_55%)]" />
        <div className="pointer-events-none absolute top-28 -left-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_22rem]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="border-border/60 from-background via-background to-primary/5 relative overflow-hidden rounded-4xl border bg-linear-to-br p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8"
            >
              <div className="mb-6 flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-cyan-700 uppercase">
                <Sparkles className="size-3.5" />
                Graph workspace
              </div>
              <div className="max-w-3xl">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl xl:text-6xl">
                  {Config.title} feels like an app the moment it opens.
                </h1>
                <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-7 sm:text-lg">
                  Start on a real workspace, inspect the graph canvas, edit edge
                  data, and jump straight into the editor without scrolling
                  through a marketing site first.
                </p>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/editor"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors"
                >
                  <Play className="size-4 fill-current" />
                  Launch Editor
                </Link>
                <div className="border-border bg-card/70 text-muted-foreground inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm">
                  <FolderTree className="size-4 text-cyan-700" />
                  Local-first graph editing
                </div>
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 }}
              className="grid gap-4"
            >
              {quickFacts.map((item) => (
                <div
                  key={item.label}
                  className="border-border/60 bg-card/70 rounded-3xl border p-5 shadow-sm backdrop-blur"
                >
                  <div className="bg-primary/12 text-primary mb-4 flex size-10 items-center justify-center rounded-xl">
                    <item.icon className="size-4.5" />
                  </div>
                  <p className="text-sm font-semibold tracking-tight">
                    {item.label}
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-6">
                    {item.value}
                  </p>
                </div>
              ))}
            </motion.aside>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="border-border/60 bg-card/50 overflow-hidden rounded-4xl border shadow-[0_24px_80px_rgba(15,23,42,0.1)]"
          >
            <div className="border-border/60 bg-background/85 flex items-center justify-between border-b px-4 py-3 backdrop-blur sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-muted-foreground rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-xs dark:border-slate-800 dark:bg-slate-900/80">
                  {Config.title}.app
                </div>
              </div>
              <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex dark:text-slate-400">
                <Clock3 className="size-3.5" />
                Ready to edit
              </div>
            </div>

            <div className="grid min-h-168 xl:grid-cols-[16rem_minmax(0,1fr)_20rem]">
              <aside className="border-border/60 bg-background/70 hidden border-r p-4 xl:block">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-4 dark:border-cyan-950 dark:bg-cyan-950/20">
                    <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase dark:text-cyan-300">
                      Session
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-tight">
                      Workspace Preview
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      Home now opens like a graph tool, not a brochure.
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400">
                      Quick keys
                    </p>
                    <div className="mt-3 space-y-2">
                      {shortcutRows.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900"
                        >
                          <span>{item.label}</span>
                          <span className="rounded-md border bg-background px-2 py-0.5 font-mono text-xs">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400">
                      Modes
                    </p>
                    <div className="mt-3 grid gap-2">
                      {["Force layout", "Adjacency matrix", "Edge text"].map(
                        (item, index) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 rounded-xl px-3 py-2"
                          >
                            <span className="bg-primary/12 text-primary flex size-7 items-center justify-center rounded-lg text-xs font-semibold">
                              {index + 1}
                            </span>
                            <span className="text-sm">{item}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </aside>

              <div className="bg-background/55 border-border/60 flex min-h-104 flex-col border-r">
                <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400">
                      Graph canvas
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      Interactive preview of the editor workspace
                    </p>
                  </div>
                  <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
                    Force mode
                  </div>
                </div>
                <div className="relative flex-1 p-4">
                  <div className="absolute inset-4 overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(248,250,252,0.76))] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.72),rgba(15,23,42,0.72))]">
                    <GraphCanvas disabled />
                  </div>
                </div>
              </div>

              <aside className="bg-card/55 flex min-h-104 flex-col">
                <div className="border-border/60 border-b px-4 py-3">
                  <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400">
                    Edge editor
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    Raw graph data stays visible and editable
                  </p>
                </div>
                <div className="flex-1 p-4">
                  <div className="h-full rounded-[1.4rem] border bg-background/80 p-4">
                    <GraphTextEditor disabled />
                  </div>
                </div>
              </aside>
            </div>
          </motion.section>
        </div>
      </main>
      <ScrollToTop />
    </div>
  )
}
