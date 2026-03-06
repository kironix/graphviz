"use client"

import * as React from "react"
import type {
  GraphEditingEdge as EditingEdge,
  GraphEdge,
  GraphNode,
  GraphPendingDelete as PendingDelete,
  ResolvedCanvasColors as ResolvedColors,
} from "@/types"
import {
  GRAPH_CANVAS_PADDING as CANVAS_PADDING,
  GRAPH_CURVE_OFFSET as CURVE_OFFSET,
  ForceSimulation,
  LARGE_GRAPH_NODE_THRESHOLD as PERFORMANCE_NODE_THRESHOLD,
  useGraphStore,
} from "@/utils"

import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertDialogHelper } from "@/components/alert-dialog-helper"
import { GraphEmptyState } from "@/components/pages/editor/graph-empty-state"

import {
  buildParallelPairs,
  computeProximityBend,
  drawGraphToCanvas,
  edgePairKey,
  pointToBezierDist,
  resolveCanvasColors,
} from "./utils"

interface GraphCanvasProps {
  disabled?: boolean
}

export function GraphCanvas(props?: GraphCanvasProps) {
  const { disabled = false } = props ?? {}
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const animFrameRef = React.useRef<number>(0)
  const simRef = React.useRef(new ForceSimulation())
  const physicsRunningRef = React.useRef(false)
  const draggingIdRef = React.useRef<string | null>(null)
  const {
    nodes,
    edges,
    direction,
    mode,
    config,
    actions,
    canvasSize,
    searchMatches,
    searchEdgeMatches,
    focusedNodeId,
  } = useGraphStore()
  const isMobile = useIsMobile()

  const [themeKey, setThemeKey] = React.useState("")
  React.useEffect(() => {
    setThemeKey(document.documentElement.className)
    const obs = new MutationObserver(() =>
      setThemeKey(document.documentElement.className)
    )
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => obs.disconnect()
  }, [])

  const [dragging, setDragging] = React.useState<string | null>(null)
  const [drawSource, setDrawSource] = React.useState<string | null>(null)
  const [editingNode, setEditingNode] = React.useState<string | null>(null)
  const [editingEdge, setEditingEdge] = React.useState<EditingEdge | null>(null)
  const [editValue, setEditValue] = React.useState("")
  const [edgeWeightValue, setEdgeWeightValue] = React.useState("")
  const [edgeLabelValue, setEdgeLabelValue] = React.useState("")
  const [edgeEditError, setEdgeEditError] = React.useState<string | null>(null)
  const [editPos, setEditPos] = React.useState({ x: 0, y: 0 })
  const [pendingDelete, setPendingDelete] =
    React.useState<PendingDelete | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const didDrag = React.useRef(false)
  const dragStartFixed = React.useRef<boolean | null>(null)
  const mouseDownPos = React.useRef({ x: 0, y: 0 })

  const hitRadius = isMobile ? config.nodeRadius * 1.5 : config.nodeRadius
  const isPerformanceMode = nodes.length >= PERFORMANCE_NODE_THRESHOLD

  const nodeById = React.useMemo(() => {
    const map = new Map<string, GraphNode>()
    nodes.forEach((node) => map.set(node.id, node))
    return map
  }, [nodes])

  const nodeSpatialIndex = React.useMemo(() => {
    const cellSize = Math.max(24, hitRadius * 2 + 8)
    const cells = new Map<string, number[]>()
    nodes.forEach((node, idx) => {
      const cellX = Math.floor(node.x / cellSize)
      const cellY = Math.floor(node.y / cellSize)
      const key = `${cellX},${cellY}`
      const bucket = cells.get(key)
      if (bucket) {
        bucket.push(idx)
      } else {
        cells.set(key, [idx])
      }
    })
    return { cellSize, cells }
  }, [nodes, hitRadius])

  const syncCanvasSizeToContainer = React.useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const nextWidth = Math.floor(container.clientWidth)
    const nextHeight = Math.floor(container.clientHeight)
    if (nextWidth <= 0 || nextHeight <= 0) return

    const current = actions.getState().canvasSize
    if (current.width === nextWidth && current.height === nextHeight) {
      return
    }

    actions.setCanvasSize(nextWidth, nextHeight)
  }, [actions])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    syncCanvasSizeToContainer()
    const observer = new ResizeObserver(() => {
      syncCanvasSizeToContainer()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [syncCanvasSizeToContainer])

  React.useEffect(() => {
    syncCanvasSizeToContainer()
  }, [syncCanvasSizeToContainer, canvasSize.width, canvasSize.height])

  React.useEffect(() => {
    if (mode !== "force" && mode !== "config") return
    if (canvasSize.width <= 0 || canvasSize.height <= 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const sim = simRef.current
    const initState = actions.getState()
    sim.syncNodes(initState.nodes)
    sim.syncEdges(initState.edges)
    sim.setCenter(canvasSize.width / 2, canvasSize.height / 2)
    sim.setIdealLength(initState.config.edgeIdealLength)
    sim.boundaryMargin = initState.config.nodeRadius + CANVAS_PADDING
    sim.reheat(1.0)

    let running = true
    let lastNodesRef = initState.nodes
    let lastEdgesRef = initState.edges
    let lastLayoutVer = actions.getLayoutVersion()
    let didSyncBack = false
    let cachedColors: ResolvedColors | null = resolveCanvasColors(
      canvas,
      initState.config
    )

    let drawnDirection = initState.direction
    let drawnConfig = initState.config
    let drawnSearchRef = initState.searchMatches
    let drawnEdgeSearchRef = initState.searchEdgeMatches
    let drawnFocus = initState.focusedNodeId
    let drawnDragging: string | null = null
    let drawnTheme = document.documentElement.className
    let idleFrames = 0
    let lastIdealLength = initState.config.edgeIdealLength
    let searchSetRef = initState.searchMatches
    let searchSet = new Set<string>(initState.searchMatches)
    let edgeSetRef = initState.searchEdgeMatches
    let edgeSet = new Set<string>(initState.searchEdgeMatches)

    physicsRunningRef.current = true

    const step = () => {
      if (!running) return

      if (idleFrames > 120 && idleFrames % 8 !== 0) {
        idleFrames++
        animFrameRef.current = requestAnimationFrame(step)
        return
      }

      const current = actions.getState()
      const currentLayoutVer = actions.getLayoutVersion()

      if (currentLayoutVer !== lastLayoutVer) {
        sim.syncNodes(current.nodes)
        lastNodesRef = current.nodes
        lastLayoutVer = currentLayoutVer
        sim.reheat(1.0)
        didSyncBack = false
        idleFrames = 0
      } else if (current.nodes !== lastNodesRef) {
        sim.mergeSyncNodes(current.nodes)
        lastNodesRef = current.nodes
        if (sim.alpha < 0.1) sim.reheat(0.5)
        didSyncBack = false
        idleFrames = 0
      }
      if (current.edges !== lastEdgesRef) {
        sim.syncEdges(current.edges)
        lastEdgesRef = current.edges
        if (sim.alpha < 0.1) sim.reheat(0.3)
        didSyncBack = false
        idleFrames = 0
      }

      sim.setCenter(current.canvasSize.width / 2, current.canvasSize.height / 2)
      if (current.config.edgeIdealLength !== lastIdealLength) {
        sim.setIdealLength(current.config.edgeIdealLength)
        lastIdealLength = current.config.edgeIdealLength
        sim.reheat(0.6)
        didSyncBack = false
        idleFrames = 0
      }
      sim.boundaryMargin = current.config.nodeRadius + CANVAS_PADDING

      const active = sim.tick()

      const themeNow = document.documentElement.className
      const visualChanged =
        current.direction !== drawnDirection ||
        current.config !== drawnConfig ||
        current.searchMatches !== drawnSearchRef ||
        current.searchEdgeMatches !== drawnEdgeSearchRef ||
        current.focusedNodeId !== drawnFocus ||
        draggingIdRef.current !== drawnDragging ||
        themeNow !== drawnTheme

      if (visualChanged) {
        cachedColors = resolveCanvasColors(canvas, current.config)
        idleFrames = 0
      }
      if (active) idleFrames = 0

      const needsDraw = active || !didSyncBack || visualChanged

      if (current.searchMatches !== searchSetRef) {
        searchSet = new Set<string>(current.searchMatches)
        searchSetRef = current.searchMatches
      }
      if (current.searchEdgeMatches !== edgeSetRef) {
        edgeSet = new Set<string>(current.searchEdgeMatches)
        edgeSetRef = current.searchEdgeMatches
      }

      if (needsDraw && cachedColors) {
        drawGraphToCanvas(
          canvas,
          sim,
          current.edges,
          current.direction,
          current.config,
          cachedColors,
          searchSet,
          edgeSet,
          current.focusedNodeId,
          draggingIdRef.current,
          dragStartFixed.current,
          current.canvasSize.width,
          current.canvasSize.height
        )
        drawnDirection = current.direction
        drawnConfig = current.config
        drawnSearchRef = current.searchMatches
        drawnEdgeSearchRef = current.searchEdgeMatches
        drawnFocus = current.focusedNodeId
        drawnDragging = draggingIdRef.current
        drawnTheme = themeNow

        if (!active && !didSyncBack) {
          const updated = sim.writeBack(current.nodes)
          actions.setNodes(updated, { recordHistory: false })
          lastNodesRef = actions.getState().nodes
          didSyncBack = true
        }
      } else {
        idleFrames++
      }

      animFrameRef.current = requestAnimationFrame(step)
    }

    animFrameRef.current = requestAnimationFrame(step)
    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
      const current = actions.getState()
      if (!didSyncBack && sim.count > 0) {
        const updated = sim.writeBack(current.nodes)
        actions.setNodes(updated, { recordHistory: false })
      }
      physicsRunningRef.current = false
    }
  }, [mode, actions, canvasSize])

  React.useEffect(() => {
    if (physicsRunningRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    if (canvasSize.width <= 0 || canvasSize.height <= 0) return

    const sim = simRef.current
    sim.syncNodes(nodes)
    sim.syncEdges(edges)

    const colors = resolveCanvasColors(canvas, config)
    drawGraphToCanvas(
      canvas,
      sim,
      edges,
      direction,
      config,
      colors,
      new Set(searchMatches),
      new Set(searchEdgeMatches),
      focusedNodeId,
      dragging,
      dragStartFixed.current,
      canvasSize.width,
      canvasSize.height
    )
  }, [
    nodes,
    edges,
    direction,
    config,
    canvasSize,
    dragging,
    searchMatches,
    searchEdgeMatches,
    focusedNodeId,
    isPerformanceMode,
    themeKey,
  ])

  const findNodeAt = React.useCallback(
    (x: number, y: number): GraphNode | null => {
      if (physicsRunningRef.current) {
        const sim = simRef.current
        for (let i = sim.count - 1; i >= 0; i--) {
          const dx = sim.x[i] - x
          const dy = sim.y[i] - y
          if (dx * dx + dy * dy <= hitRadius * hitRadius) {
            return {
              id: sim.nodeIds[i],
              label: sim.nodeLabels[i],
              x: sim.x[i],
              y: sim.y[i],
              vx: sim.vx[i],
              vy: sim.vy[i],
              fixed: sim.fixed[i] === 1,
            }
          }
        }
        return null
      }

      if (isPerformanceMode) {
        const cellX = Math.floor(x / nodeSpatialIndex.cellSize)
        const cellY = Math.floor(y / nodeSpatialIndex.cellSize)
        const candidateIndices: number[] = []

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const key = `${cellX + dx},${cellY + dy}`
            const bucket = nodeSpatialIndex.cells.get(key)
            if (!bucket) continue
            candidateIndices.push(...bucket)
          }
        }

        candidateIndices.sort((a, b) => b - a)
        for (const idx of candidateIndices) {
          const n = nodes[idx]
          if (!n) continue
          const dx = n.x - x
          const dy = n.y - y
          if (dx * dx + dy * dy <= hitRadius * hitRadius) {
            return n
          }
        }
        return null
      }

      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        const dx = n.x - x
        const dy = n.y - y
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          return n
        }
      }
      return null
    },
    [nodes, hitRadius, isPerformanceMode, nodeSpatialIndex]
  )

  const findEdgeAt = React.useCallback(
    (x: number, y: number): GraphEdge | null => {
      const edgeHitDist = isMobile ? 16 : 8

      const sim = simRef.current
      const currentEdges = physicsRunningRef.current
        ? actions.getState().edges
        : edges
      const pp = buildParallelPairs(currentEdges)
      const useProx = sim.count > 2

      for (const edge of currentEdges) {
        const si = sim.indexOfId(edge.source)
        const ti = sim.indexOfId(edge.target)
        if (si < 0 || ti < 0) continue
        const sx = sim.x[si],
          sy = sim.y[si]
        const tx = sim.x[ti],
          ty = sim.y[ti]
        const dx = tx - sx,
          dy = ty - sy
        const eDist = Math.sqrt(dx * dx + dy * dy) || 1
        const perpX = -dy / eDist,
          perpY = dx / eDist

        const isP = pp.has(edgePairKey(edge.source, edge.target))
        const parallelAmt = isP
          ? Math.min(CURVE_OFFSET, Math.max(15, eDist * 0.3))
          : 0
        const proxAmt = useProx
          ? computeProximityBend(
              sx,
              sy,
              dx,
              dy,
              eDist,
              perpX,
              perpY,
              sim,
              edge.source,
              edge.target,
              config.nodeRadius
            )
          : 0
        const totalOffset = parallelAmt + proxAmt
        const isCurved = Math.abs(totalOffset) > 0.5

        let dist: number
        if (!isCurved) {
          const lenSq = dx * dx + dy * dy
          if (lenSq === 0) continue
          const t = Math.max(
            0,
            Math.min(1, ((x - sx) * dx + (y - sy) * dy) / lenSq)
          )
          const projX = sx + t * dx,
            projY = sy + t * dy
          dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2)
        } else {
          const mx = (sx + tx) / 2,
            my = (sy + ty) / 2
          dist = pointToBezierDist(
            x,
            y,
            sx,
            sy,
            mx + perpX * totalOffset,
            my + perpY * totalOffset,
            tx,
            ty
          )
        }
        if (dist < edgeHitDist) return edge
      }
      return null
    },
    [edges, isMobile, actions, config.nodeRadius]
  )

  const queueNodeDelete = React.useCallback(
    (node: GraphNode) => {
      const connectedEdges = edges.reduce((count, edge) => {
        if (edge.source === node.id || edge.target === node.id) {
          return count + 1
        }
        return count
      }, 0)
      setPendingDelete({
        type: "node",
        id: node.id,
        label: node.label,
        connectedEdges,
      })
      setDeleteConfirmOpen(true)
    },
    [edges]
  )

  const queueEdgeDelete = React.useCallback((edge: GraphEdge) => {
    setPendingDelete({
      type: "edge",
      source: edge.source,
      target: edge.target,
    })
    setDeleteConfirmOpen(true)
  }, [])

  const openNodeEditor = React.useCallback(
    (node: GraphNode) => {
      setEditingEdge(null)
      setEdgeEditError(null)
      setEditingNode(node.id)
      setEditValue(node.label)
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setEditPos({
          x: node.x + rect.left,
          y: node.y + rect.top - config.nodeRadius - 30,
        })
      }
    },
    [config.nodeRadius]
  )

  const openEdgeEditor = React.useCallback(
    (edge: GraphEdge) => {
      setEditingNode(null)
      setEditValue("")
      setEditingEdge({ source: edge.source, target: edge.target })
      setEdgeWeightValue(
        typeof edge.weight === "number" ? String(edge.weight) : ""
      )
      setEdgeLabelValue(edge.label || "")
      setEdgeEditError(null)
      const src = nodeById.get(edge.source)
      const tgt = nodeById.get(edge.target)
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect && src && tgt) {
        setEditPos({
          x: (src.x + tgt.x) / 2 + rect.left,
          y: (src.y + tgt.y) / 2 + rect.top - 24,
        })
      }
    },
    [nodeById]
  )

  const getCanvasCoords = React.useCallback(
    (
      e:
        | React.MouseEvent
        | React.TouchEvent
        | React.PointerEvent
        | MouseEvent
        | TouchEvent
        | PointerEvent
    ) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }

      let clientX: number, clientY: number
      if ("touches" in e) {
        const touch = e.touches[0] || (e as TouchEvent).changedTouches[0]
        if (!touch) return { x: 0, y: 0 }
        clientX = touch.clientX
        clientY = touch.clientY
      } else {
        clientX = (e as MouseEvent).clientX
        clientY = (e as MouseEvent).clientY
      }

      return { x: clientX - rect.left, y: clientY - rect.top }
    },
    []
  )

  const handlePointerDown = React.useCallback(
    (x: number, y: number) => {
      if (disabled) return
      mouseDownPos.current = { x, y }
      didDrag.current = false
      const node = findNodeAt(x, y)
      if (node) {
        actions.setState({ focusedNodeId: node.id })
      }

      if (mode === "force" || mode === "config") {
        if (node) {
          setDragging(node.id)
          draggingIdRef.current = node.id
          dragStartFixed.current = node.fixed
          if (physicsRunningRef.current) {
            const sim = simRef.current
            const idx = sim.indexOfId(node.id)
            if (idx >= 0 && !sim.fixed[idx]) {
              sim.setFixed(idx, true)
            }
            sim.reheat(0.3)
          } else if (!node.fixed) {
            actions.setNodeFixed(node.id, true, { recordHistory: false })
          }
        }
      } else if (mode === "draw") {
        if (node) {
          setDrawSource(node.id)
        } else {
          const state = actions.getState()
          const id = String(state.nodes.length)
          const offset = state.indexMode === "1-index" ? 1 : 0
          const label =
            state.indexMode === "custom"
              ? state.customLabels[id] || String(state.nodes.length)
              : String(state.nodes.length + offset)
          actions.addNode({
            id,
            label,
            x,
            y,
            vx: 0,
            vy: 0,
            fixed: true,
          })
        }
      } else if (mode === "edit") {
        if (node) {
          openNodeEditor(node)
        } else {
          const edge = findEdgeAt(x, y)
          if (edge) {
            openEdgeEditor(edge)
          }
        }
      } else if (mode === "delete") {
        if (node) {
          queueNodeDelete(node)
        } else {
          const edge = findEdgeAt(x, y)
          if (edge) {
            queueEdgeDelete(edge)
          }
        }
      }
    },
    [
      findNodeAt,
      findEdgeAt,
      mode,
      actions,
      openNodeEditor,
      openEdgeEditor,
      queueNodeDelete,
      queueEdgeDelete,
      disabled,
    ]
  )

  const handlePointerMove = React.useCallback(
    (x: number, y: number) => {
      if (disabled) return
      const dx = x - mouseDownPos.current.x
      const dy = y - mouseDownPos.current.y
      if (dx * dx + dy * dy > 9) {
        didDrag.current = true
      }

      if (dragging) {
        if (physicsRunningRef.current) {
          const sim = simRef.current
          const idx = sim.indexOfId(dragging)
          if (idx >= 0) {
            const margin = config.nodeRadius + CANVAS_PADDING
            const state = actions.getState()
            const maxX = Math.max(margin, state.canvasSize.width - margin)
            const maxY = Math.max(margin, state.canvasSize.height - margin)
            sim.setPosition(
              idx,
              Math.max(margin, Math.min(x, maxX)),
              Math.max(margin, Math.min(y, maxY))
            )
            sim.reheat(0.3)
          }
        } else {
          actions.updateNodePosition(dragging, x, y, { recordHistory: false })
        }
      }
    },
    [dragging, actions, config.nodeRadius, disabled]
  )

  const handlePointerUp = React.useCallback(
    (x: number, y: number) => {
      if (disabled) return
      if (mode === "force" || mode === "config") {
        if (dragging) {
          if (physicsRunningRef.current) {
            const sim = simRef.current
            const idx = sim.indexOfId(dragging)
            if (idx >= 0) {
              if (didDrag.current) {
                const margin = config.nodeRadius + CANVAS_PADDING
                const state = actions.getState()
                const maxX = Math.max(margin, state.canvasSize.width - margin)
                const maxY = Math.max(margin, state.canvasSize.height - margin)
                sim.setPosition(
                  idx,
                  Math.max(margin, Math.min(x, maxX)),
                  Math.max(margin, Math.min(y, maxY))
                )
                const wasFixed = dragStartFixed.current ?? false
                sim.setFixed(idx, wasFixed)
              } else {
                const wasFixed = dragStartFixed.current ?? false
                sim.setFixed(idx, !wasFixed)
                actions.setNodeFixed(dragging, !wasFixed)
              }
            }
            sim.reheat(0.3)
          } else {
            if (didDrag.current) {
              actions.updateNodePosition(dragging, x, y)
              const wasFixed = dragStartFixed.current ?? false
              actions.setNodeFixed(dragging, wasFixed, {
                recordHistory: false,
              })
            } else {
              const wasFixed = dragStartFixed.current ?? false
              actions.setNodeFixed(dragging, !wasFixed)
            }
          }
          dragStartFixed.current = null
          draggingIdRef.current = null
          setDragging(null)
        }
      } else if (mode === "draw" && drawSource) {
        const node = findNodeAt(x, y)
        if (node && node.id !== drawSource) {
          actions.addEdge({ source: drawSource, target: node.id })
        }
        setDrawSource(null)
      } else {
        setDragging(null)
      }
    },
    [
      mode,
      dragging,
      drawSource,
      actions,
      findNodeAt,
      config.nodeRadius,
      disabled,
    ]
  )

  const handleCanvasPointerDown = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault()
    const { x, y } = getCanvasCoords(e)
    handlePointerDown(x, y)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleCanvasPointerMove = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault()
    const { x, y } = getCanvasCoords(e)
    handlePointerMove(x, y)
  }

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const { x, y } = getCanvasCoords(e)
    handlePointerUp(x, y)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const handleCanvasPointerCancel = () => {
    if (dragging && dragStartFixed.current !== null) {
      if (physicsRunningRef.current) {
        const sim = simRef.current
        const idx = sim.indexOfId(dragging)
        if (idx >= 0) {
          sim.setFixed(idx, dragStartFixed.current)
        }
      } else {
        actions.setNodeFixed(dragging, dragStartFixed.current, {
          recordHistory: false,
        })
      }
    }
    dragStartFixed.current = null
    draggingIdRef.current = null
    setDragging(null)
    setDrawSource(null)
  }

  const handleCanvasFocus = () => {
    if (disabled || nodes.length === 0) return
    if (!focusedNodeId || !nodes.some((n) => n.id === focusedNodeId)) {
      actions.setState({ focusedNodeId: nodes[0].id })
    }
  }

  const handleCanvasKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (disabled || nodes.length === 0) return

    const currentIndex =
      focusedNodeId && nodes.some((n) => n.id === focusedNodeId)
        ? nodes.findIndex((n) => n.id === focusedNodeId)
        : 0
    const currentNode = nodes[Math.max(0, currentIndex)]
    if (!currentNode) return

    const moveStep = e.shiftKey ? 30 : 10

    if (e.key === "Tab") {
      e.preventDefault()
      const delta = e.shiftKey ? -1 : 1
      const nextIndex = (currentIndex + delta + nodes.length) % nodes.length
      actions.setState({ focusedNodeId: nodes[nextIndex].id })
      return
    }

    if (e.key === "Home") {
      e.preventDefault()
      actions.setState({ focusedNodeId: nodes[0].id })
      return
    }

    if (e.key === "End") {
      e.preventDefault()
      actions.setState({ focusedNodeId: nodes[nodes.length - 1].id })
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      actions.updateNodePosition(
        currentNode.id,
        currentNode.x,
        currentNode.y - moveStep
      )
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      actions.updateNodePosition(
        currentNode.id,
        currentNode.x,
        currentNode.y + moveStep
      )
      return
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault()
      actions.updateNodePosition(
        currentNode.id,
        currentNode.x - moveStep,
        currentNode.y
      )
      return
    }

    if (e.key === "ArrowRight") {
      e.preventDefault()
      actions.updateNodePosition(
        currentNode.id,
        currentNode.x + moveStep,
        currentNode.y
      )
      return
    }

    if (e.key === " " && (mode === "force" || mode === "config")) {
      e.preventDefault()
      actions.toggleNodeFixed(currentNode.id)
      return
    }

    if (e.key === "Enter" && mode === "edit") {
      e.preventDefault()
      openNodeEditor(currentNode)
      return
    }

    if ((e.key === "Delete" || e.key === "Backspace") && mode === "delete") {
      e.preventDefault()
      queueNodeDelete(currentNode)
    }
  }

  const handleEditSubmit = () => {
    if (editingNode !== null) {
      const state = actions.getState()
      const newCustomLabels = {
        ...state.customLabels,
        [editingNode]: editValue,
      }
      actions.setState(
        { customLabels: newCustomLabels },
        { recordHistory: true }
      )
      const newNodes = state.nodes.map((n) =>
        n.id === editingNode ? { ...n, label: editValue } : n
      )
      actions.setNodes(newNodes, { recordHistory: false })
      setEditingNode(null)
    }
  }

  const handleEdgeEditSubmit = () => {
    if (!editingEdge) return

    const trimmedWeight = edgeWeightValue.trim()
    let nextWeight: number | undefined = undefined
    if (trimmedWeight !== "") {
      const parsed = Number(trimmedWeight)
      if (!Number.isFinite(parsed)) {
        setEdgeEditError("Weight must be a finite number.")
        return
      }
      nextWeight = parsed
    }

    const trimmedLabel = edgeLabelValue.trim()
    const matchEdge = (edge: { source: string; target: string }) =>
      direction === "directed"
        ? edge.source === editingEdge.source &&
          edge.target === editingEdge.target
        : (edge.source === editingEdge.source &&
            edge.target === editingEdge.target) ||
          (edge.source === editingEdge.target &&
            edge.target === editingEdge.source)

    const updatedEdges = edges.map((edge) => {
      if (!matchEdge(edge)) return edge
      return {
        ...edge,
        ...(typeof nextWeight === "number" ? { weight: nextWeight } : {}),
        ...(trimmedLabel ? { label: trimmedLabel } : {}),
        ...(typeof nextWeight !== "number" ? { weight: undefined } : {}),
        ...(!trimmedLabel ? { label: undefined } : {}),
      }
    })

    actions.setEdges(updatedEdges)
    setEditingEdge(null)
    setEdgeEditError(null)
  }

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return
    if (pendingDelete.type === "node") {
      actions.removeNode(pendingDelete.id)
    } else {
      actions.removeEdge(pendingDelete.source, pendingDelete.target)
    }
    setDeleteConfirmOpen(false)
    setPendingDelete(null)
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      style={disabled ? { pointerEvents: "none" } : undefined}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="focus-visible:ring-primary focus-visible:ring-offset-background h-full w-full rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          touchAction: disabled ? "auto" : "none",
          cursor: disabled
            ? "default"
            : dragging
              ? "grabbing"
              : mode === "delete"
                ? "not-allowed"
                : mode === "draw"
                  ? "crosshair"
                  : mode === "edit"
                    ? "text"
                    : "grab",
        }}
        tabIndex={disabled ? -1 : 0}
        role="region"
        aria-label="Graph canvas. Use Tab to cycle nodes and arrow keys to move focused node."
        aria-keyshortcuts="Tab,Shift+Tab,ArrowUp,ArrowDown,ArrowLeft,ArrowRight"
        aria-describedby="graph-canvas-keyboard-help"
        onFocus={handleCanvasFocus}
        onKeyDown={handleCanvasKeyDown}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerCancel}
      />
      <p id="graph-canvas-keyboard-help" className="sr-only">
        Tab and Shift plus Tab cycle nodes. Arrow keys move focused node. In
        force or config mode, space toggles fixed state. In edit mode, Enter
        starts label editing.
      </p>
      <GraphEmptyState />
      {editingNode !== null && (
        <div
          className="fixed z-50 flex flex-col gap-1"
          style={{ left: editPos.x - 70, top: editPos.y }}
        >
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEditSubmit()
              if (e.key === "Escape") setEditingNode(null)
            }}
            onBlur={handleEditSubmit}
            className="border-border bg-background text-foreground w-28 rounded-md border px-2 py-1 text-center text-sm shadow-md"
            autoFocus
          />
          {mode === "edit" && nodes.length > 1 && (
            <div className="border-border bg-background flex flex-wrap gap-1 rounded-md border p-1 shadow-md">
              {nodes
                .filter((n) => n.id !== editingNode)
                .slice(0, 8)
                .map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setEditValue(node.label)}
                    className="bg-secondary text-secondary-foreground hover:bg-accent focus-visible:ring-primary rounded px-2 py-0.5 text-xs font-medium outline-none focus-visible:ring-2"
                  >
                    {node.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
      {editingEdge !== null && (
        <div
          className="bg-background fixed z-50 flex w-56 flex-col gap-2 rounded-md border p-2 shadow-md"
          style={{ left: editPos.x - 110, top: editPos.y }}
        >
          <div className="text-xs font-medium">Edit Edge Metadata</div>
          <Input
            type="text"
            value={edgeWeightValue}
            onChange={(e) => {
              setEdgeWeightValue(e.target.value)
              if (edgeEditError) setEdgeEditError(null)
            }}
            placeholder="Weight (optional)"
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEdgeEditSubmit()
              if (e.key === "Escape") {
                setEditingEdge(null)
                setEdgeEditError(null)
              }
            }}
          />
          <Input
            type="text"
            value={edgeLabelValue}
            onChange={(e) => setEdgeLabelValue(e.target.value)}
            placeholder="Label (optional)"
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEdgeEditSubmit()
              if (e.key === "Escape") {
                setEditingEdge(null)
                setEdgeEditError(null)
              }
            }}
          />
          {edgeEditError && (
            <div className="text-destructive text-[11px]">{edgeEditError}</div>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-8 flex-1"
              onClick={handleEdgeEditSubmit}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 flex-1"
              onClick={() => {
                setEditingEdge(null)
                setEdgeEditError(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      <AlertDialogHelper
        open={deleteConfirmOpen}
        setOpen={(open) => {
          setDeleteConfirmOpen(open)
          if (!open) setPendingDelete(null)
        }}
        title={pendingDelete?.type === "node" ? "Delete node?" : "Delete edge?"}
        description={
          pendingDelete?.type === "node"
            ? pendingDelete.connectedEdges > 0
              ? `Node "${pendingDelete.label}" and ${pendingDelete.connectedEdges} connected edge(s) will be removed.`
              : `Node "${pendingDelete.label}" will be removed.`
            : pendingDelete
              ? `Edge ${pendingDelete.source} -> ${pendingDelete.target} will be removed.`
              : "This action cannot be undone."
        }
        func={handleDeleteConfirm}
      />
    </div>
  )
}
