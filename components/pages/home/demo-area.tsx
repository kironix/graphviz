"use client"

import * as React from "react"
import type { GraphEdge, GraphNode } from "@/types"
import { graphStore, HOME_DEMO_EDGES, HOME_DEMO_NODES } from "@/utils"
import { motion, useScroll, useSpring, useTransform } from "motion/react"

import { GraphCanvas } from "@/components/pages/editor/graph-canvas"
import { GraphTextEditor } from "@/components/pages/editor/graph-text-editor"
import { ScrollReveal } from "@/components/scroll-reveal"

function toGraphState() {
  const nodes: GraphNode[] = HOME_DEMO_NODES.map((n) => ({
    id: String(n.id),
    label: n.label,
    x: n.x,
    y: n.y,
    vx: 0,
    vy: 0,
    fixed: false,
  }))
  const edges: GraphEdge[] = HOME_DEMO_EDGES.map((e) => ({
    source: String(e.from),
    target: String(e.to),
    ...(typeof e.weight === "number" ? { weight: e.weight } : {}),
    ...(e.label ? { label: e.label } : {}),
  }))
  const customLabels = Object.fromEntries(
    HOME_DEMO_NODES.map((n) => [String(n.id), n.label])
  )
  return { nodes, edges, customLabels }
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

export function DemoArea() {
  const sectionRef = React.useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const rawOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.35, 1, 1, 0.35]
  )
  const rawY = useTransform(scrollYProgress, [0, 1], [20, -20])
  const opacity = useSpring(rawOpacity, {
    stiffness: 60,
    damping: 22,
    mass: 0.6,
  })
  const y = useSpring(rawY, {
    stiffness: 60,
    damping: 22,
    mass: 0.6,
  })

  React.useEffect(() => {
    const previousState = cloneStoreState()
    const { nodes, edges, customLabels } = toGraphState()
    graphStore.setState({
      nodes,
      edges,
      customLabels,
      searchQuery: "",
      searchMatches: [],
      searchEdgeMatches: [],
      focusedNodeId: null,
      indexMode: "custom",
      mode: "force",
    })

    return () => {
      graphStore.setState(previousState)
    }
  }, [])

  return (
    <motion.section ref={sectionRef} className="py-24" style={{ opacity }}>
      <motion.div
        className="mx-auto w-full max-w-7xl px-6 sm:px-8"
        style={{ y }}
      >
        <ScrollReveal className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            See it in action
          </h2>
          <p className="text-muted-foreground mx-auto max-w-md">
            Model real architectures — from microservices to knowledge graphs.
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          <ScrollReveal className="lg:col-span-2" delay={0.1}>
            <div className="bg-card/50 border-border/40 overflow-hidden rounded-xl border p-2">
              <div className="bg-background/50 relative h-[300px] rounded-lg sm:h-[400px]">
                <GraphCanvas disabled />
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal className="flex flex-col gap-4" delay={0.18}>
            <div className="bg-card/50 border-border/40 flex-1 overflow-hidden rounded-xl border p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="bg-primary/60 h-2 w-2 rounded-full" />
                <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Edge List
                </span>
              </div>
              <div className="h-[200px] min-h-0">
                <GraphTextEditor disabled />
              </div>
            </div>

            <div className="bg-card/50 border-border/40 rounded-xl border p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="bg-primary/60 h-2 w-2 rounded-full" />
                <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Force Mode
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Drag nodes to reposition. The physics simulation adapts the
                entire layout in real time. Pin nodes to lock them in place.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </motion.div>
    </motion.section>
  )
}
