"use client"

import * as React from "react"
import Link from "next/link"
import { Config } from "@/config"
import type { GraphEdge, GraphNode } from "@/types"
import { Command, Network, Play } from "lucide-react"
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

const shortcuts = [
  { label: "Open editor", value: "Enter" },
  { label: "Switch modes", value: "1 / 2 / 3" },
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
      <main
        className="relative px-6 pb-12 sm:px-8"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 6rem)" }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-120 bg-[radial-gradient(circle_at_top,oklch(0.6218_0.1029_214.69/0.12),transparent_58%)]" />

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="border-border/60 bg-card/55 relative mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border backdrop-blur"
        >
          <div className="border-border/60 bg-background/88 flex flex-col gap-4 border-b px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.24em] uppercase">
                  Workspace Preview
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {Config.title}
                </h1>
                <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-7 sm:text-base">
                  A minimal graph workspace with the canvas, raw edge data, and
                  editor entry point visible immediately.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/editor"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors"
                >
                  <Play className="size-4 fill-current" />
                  Open Editor
                </Link>
                <div className="text-muted-foreground inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm">
                  Local-first graph workspace
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-h-[42rem] lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex min-h-[26rem] flex-col p-4 sm:p-5">
              <div className="border-border/60 bg-background/72 flex items-center justify-between rounded-t-[1.5rem] border border-b-0 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400">
                    Graph canvas
                  </p>
                  <p className="mt-1 text-sm font-medium">Live preview</p>
                </div>
                <div className="text-muted-foreground rounded-full border px-3 py-1 text-xs">
                  Force
                </div>
              </div>

              <div className="border-border/60 min-h-[22rem] flex-1 overflow-hidden rounded-b-[1.5rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(248,250,252,0.76))] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.72),rgba(15,23,42,0.72))]">
                <GraphCanvas disabled />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-background/80 px-4 py-3">
                  <p className="text-muted-foreground text-[11px] uppercase">
                    Nodes
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {HOME_DEMO_NODES.length}
                  </p>
                </div>
                <div className="rounded-xl border bg-background/80 px-4 py-3">
                  <p className="text-muted-foreground text-[11px] uppercase">
                    Edges
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {HOME_DEMO_EDGES.length}
                  </p>
                </div>
                <div className="rounded-xl border bg-background/80 px-4 py-3">
                  <p className="text-muted-foreground text-[11px] uppercase">
                    Runtime
                  </p>
                  <p className="mt-1 text-lg font-semibold">Offline</p>
                </div>
              </div>
            </div>

            <aside className="border-border/60 bg-background/64 flex flex-col gap-4 border-t p-4 lg:border-t-0 lg:border-l lg:p-5">
              <div className="rounded-[1.4rem] border bg-background/80 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Network className="text-primary size-4" />
                  <p className="text-sm font-semibold">Edge data</p>
                </div>
                <GraphTextEditor disabled />
              </div>

              <div className="rounded-[1.4rem] border bg-background/80 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Command className="text-primary size-4" />
                  <p className="text-sm font-semibold">Shortcuts</p>
                </div>
                <div className="space-y-2">
                  {shortcuts.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900"
                    >
                      <span>{item.label}</span>
                      <span className="rounded-md border bg-background px-2 py-0.5 font-mono text-xs">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </motion.section>
      </main>
      <ScrollToTop />
    </div>
  )
}
