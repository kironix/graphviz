import * as React from "react"
import type {
  GraphDirection,
  GraphEdge,
  GraphNode,
  GraphSnapshot,
  GraphState,
  GraphStoreListener as Listener,
  GraphMutationOptions as MutationOptions,
} from "@/types"
import { DEFAULT_CONFIG } from "@/utils/constants/editor"

const HISTORY_LIMIT = 200
const INTEGER_TOKEN_RE = /^-?\d+$/
const NUMBER_TOKEN_RE = /^-?\d+(\.\d+)?$/

function parseIntegerToken(token: string): number | null {
  if (!INTEGER_TOKEN_RE.test(token)) return null
  const value = Number(token)
  return Number.isInteger(value) ? value : null
}

function parseEdgeMetadata(parts: string[]) {
  let weight: number | undefined
  let labelStart = 2
  const token = parts[2]

  if (token && NUMBER_TOKEN_RE.test(token)) {
    const parsed = Number(token)
    if (Number.isFinite(parsed)) {
      weight = parsed
      labelStart = 3
    }
  }

  const label = parts.slice(labelStart).join(" ").trim()

  return {
    weight,
    label: label || undefined,
  }
}

function toEdgeKey(source: number, target: number, direction: GraphDirection) {
  if (direction === "undirected") {
    return source < target ? `${source}-${target}` : `${target}-${source}`
  }
  return `${source}->${target}`
}

function getQuarterLayoutBounds(
  canvasSize: { width: number; height: number },
  margin: number
) {
  const safeWidth = Math.max(1, canvasSize.width)
  const safeHeight = Math.max(1, canvasSize.height)
  const layoutWidth = safeWidth * 0.5
  const layoutHeight = safeHeight * 0.5
  const minX = Math.max(margin, (safeWidth - layoutWidth) / 2)
  const maxX = Math.max(minX, Math.min(safeWidth - margin, minX + layoutWidth))
  const minY = Math.max(margin, (safeHeight - layoutHeight) / 2)
  const maxY = Math.max(
    minY,
    Math.min(safeHeight - margin, minY + layoutHeight)
  )

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  }
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  return a.every((id, i) => id === b[i])
}

function syncSearchState(source: GraphState): GraphState {
  const query = source.searchQuery.trim().toLowerCase()
  if (!query) {
    if (
      source.searchMatches.length === 0 &&
      source.searchEdgeMatches.length === 0 &&
      source.focusedNodeId === null
    ) {
      return source
    }
    return {
      ...source,
      searchMatches: [],
      searchEdgeMatches: [],
      focusedNodeId: null,
    }
  }

  const matchedIds = new Set<string>()
  const searchEdgeMatches: string[] = []
  source.nodes.forEach((node) => {
    if (node.label.toLowerCase().includes(query)) {
      matchedIds.add(node.id)
    }
  })
  source.edges.forEach((edge, edgeIndex) => {
    if (edge.label?.toLowerCase().includes(query)) {
      matchedIds.add(edge.source)
      matchedIds.add(edge.target)
      searchEdgeMatches.push(String(edgeIndex))
    }
  })
  Object.entries(source.customLabels).forEach(([nodeId, label]) => {
    if (label.toLowerCase().includes(query)) {
      matchedIds.add(nodeId)
    }
  })

  const searchMatches = source.nodes
    .filter((node) => matchedIds.has(node.id))
    .map((node) => node.id)

  const focusedNodeId =
    source.focusedNodeId && searchMatches.includes(source.focusedNodeId)
      ? source.focusedNodeId
      : searchMatches[0] || null

  if (
    sameIds(searchMatches, source.searchMatches) &&
    sameIds(searchEdgeMatches, source.searchEdgeMatches) &&
    focusedNodeId === source.focusedNodeId
  ) {
    return source
  }

  return {
    ...source,
    searchMatches,
    searchEdgeMatches,
    focusedNodeId,
  }
}

function createGraphStore() {
  let state: GraphState = {
    nodes: [],
    edges: [],
    direction: "undirected",
    indexMode: "0-index",
    mode: "force",
    config: { ...DEFAULT_CONFIG },
    customLabels: {},
    canvasSize: { width: 0, height: 0 },
    searchQuery: "",
    searchMatches: [],
    searchEdgeMatches: [],
    focusedNodeId: null,
  }

  const listeners = new Set<Listener>()
  const past: GraphSnapshot[] = []
  const future: GraphSnapshot[] = []
  let layoutVersion = 0

  function emit() {
    state = syncSearchState(state)
    listeners.forEach((l) => l())
  }

  function getState() {
    return state
  }

  function getLayoutVersion() {
    return layoutVersion
  }

  function snapshotFromState(source: GraphState = state): GraphSnapshot {
    return {
      nodes: source.nodes.map((n) => ({ ...n })),
      edges: source.edges.map((e) => ({ ...e })),
      customLabels: { ...source.customLabels },
      config: { ...source.config },
    }
  }

  function applySnapshot(snapshot: GraphSnapshot) {
    state = {
      ...state,
      nodes: snapshot.nodes.map((n) => ({ ...n })),
      edges: snapshot.edges.map((e) => ({ ...e })),
      customLabels: { ...snapshot.customLabels },
      config: { ...snapshot.config },
    }
  }

  function pushHistory() {
    past.push(snapshotFromState())
    if (past.length > HISTORY_LIMIT) past.shift()
    future.length = 0
  }

  function subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function setState(
    partial: Partial<GraphState>,
    options: MutationOptions = {}
  ) {
    if (options.recordHistory) {
      pushHistory()
    }
    state = { ...state, ...partial }
    emit()
  }

  function setNodes(nodes: GraphNode[], options: MutationOptions = {}) {
    if (options.recordHistory !== false) {
      pushHistory()
    }
    state = { ...state, nodes: [...nodes] }
    emit()
  }

  function setEdges(edges: GraphEdge[], options: MutationOptions = {}) {
    if (options.recordHistory !== false) {
      pushHistory()
    }
    state = { ...state, edges: [...edges] }
    emit()
  }

  function addNode(node: GraphNode) {
    pushHistory()
    state = { ...state, nodes: [...state.nodes, node] }
    emit()
  }

  function removeNode(id: string) {
    if (!state.nodes.some((n) => n.id === id)) return
    pushHistory()
    state = {
      ...state,
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
    }
    emit()
  }

  function addEdge(edge: GraphEdge) {
    const exists = state.edges.some(
      (e) =>
        (e.source === edge.source && e.target === edge.target) ||
        (state.direction === "undirected" &&
          e.source === edge.target &&
          e.target === edge.source)
    )
    if (!exists && edge.source !== edge.target) {
      pushHistory()
      state = { ...state, edges: [...state.edges, edge] }
      emit()
    }
  }

  function removeEdge(source: string, target: string) {
    const nextEdges = state.edges.filter((e) => {
      if (state.direction === "directed") {
        return !(e.source === source && e.target === target)
      }
      return !(
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source)
      )
    })
    if (nextEdges.length === state.edges.length) return
    pushHistory()
    state = {
      ...state,
      edges: nextEdges,
    }
    emit()
  }

  function updateNodePosition(
    id: string,
    x: number,
    y: number,
    options: MutationOptions = {}
  ) {
    const idx = state.nodes.findIndex((n) => n.id === id)
    if (idx >= 0) {
      const margin = state.config.nodeRadius + 10
      const maxX = Math.max(margin, state.canvasSize.width - margin)
      const maxY = Math.max(margin, state.canvasSize.height - margin)
      const clampedX = Math.max(margin, Math.min(x, maxX))
      const clampedY = Math.max(margin, Math.min(y, maxY))
      const newNodes = [...state.nodes]
      const curr = newNodes[idx]
      if (
        curr.x === clampedX &&
        curr.y === clampedY &&
        curr.vx === 0 &&
        curr.vy === 0
      )
        return
      if (options.recordHistory !== false) {
        pushHistory()
      }
      newNodes[idx] = {
        ...newNodes[idx],
        x: clampedX,
        y: clampedY,
        vx: 0,
        vy: 0,
      }
      state = { ...state, nodes: newNodes }
      emit()
    }
  }

  function toggleNodeFixed(id: string, options: MutationOptions = {}) {
    const idx = state.nodes.findIndex((n) => n.id === id)
    if (idx >= 0) {
      if (options.recordHistory !== false) {
        pushHistory()
      }
      const newNodes = [...state.nodes]
      newNodes[idx] = { ...newNodes[idx], fixed: !newNodes[idx].fixed }
      state = { ...state, nodes: newNodes }
      emit()
    }
  }

  function setNodeFixed(
    id: string,
    fixed: boolean,
    options: MutationOptions = {}
  ) {
    const idx = state.nodes.findIndex((n) => n.id === id)
    if (idx >= 0) {
      if (state.nodes[idx].fixed === fixed) return
      if (options.recordHistory !== false) {
        pushHistory()
      }
      const newNodes = [...state.nodes]
      newNodes[idx] = { ...newNodes[idx], fixed }
      state = { ...state, nodes: newNodes }
      emit()
    }
  }

  function fixAllNodes() {
    pushHistory()
    state = {
      ...state,
      nodes: state.nodes.map((n) => ({ ...n, fixed: true })),
    }
    emit()
  }

  function unfixAllNodes() {
    pushHistory()
    state = {
      ...state,
      nodes: state.nodes.map((n) => ({ ...n, fixed: false })),
    }
    emit()
  }

  function setCanvasSize(width: number, height: number) {
    const nextWidth = Math.max(0, Math.floor(width))
    const nextHeight = Math.max(0, Math.floor(height))
    const prevSize = state.canvasSize

    if (prevSize.width === nextWidth && prevSize.height === nextHeight) {
      return
    }

    let nextNodes = state.nodes
    if (state.nodes.length > 0 && nextWidth > 0 && nextHeight > 0) {
      const margin = state.config.nodeRadius + 10
      const minX = margin
      const maxX = Math.max(margin, nextWidth - margin)
      const minY = margin
      const maxY = Math.max(margin, nextHeight - margin)
      const clampX = (x: number) => Math.max(minX, Math.min(x, maxX))
      const clampY = (y: number) => Math.max(minY, Math.min(y, maxY))

      if (prevSize.width > 0 && prevSize.height > 0) {
        const prevMinX = margin
        const prevMaxX = Math.max(margin, prevSize.width - margin)
        const prevMinY = margin
        const prevMaxY = Math.max(margin, prevSize.height - margin)
        const prevSpanX = Math.max(1, prevMaxX - prevMinX)
        const prevSpanY = Math.max(1, prevMaxY - prevMinY)
        const nextSpanX = Math.max(1, maxX - minX)
        const nextSpanY = Math.max(1, maxY - minY)
        const prevScale = Math.min(prevSpanX, prevSpanY)
        const nextScale = Math.min(nextSpanX, nextSpanY)
        const uniformScale = nextScale / prevScale
        const prevCenterX = (prevMinX + prevMaxX) / 2
        const prevCenterY = (prevMinY + prevMaxY) / 2
        const nextCenterX = (minX + maxX) / 2
        const nextCenterY = (minY + maxY) / 2

        let didMove = false
        const remapped = state.nodes.map((node) => {
          const nextX = clampX(
            (node.x - prevCenterX) * uniformScale + nextCenterX
          )
          const nextY = clampY(
            (node.y - prevCenterY) * uniformScale + nextCenterY
          )
          if (nextX === node.x && nextY === node.y) {
            return node
          }
          didMove = true
          return { ...node, x: nextX, y: nextY }
        })
        nextNodes = didMove ? remapped : state.nodes
      } else {
        let boundsMinX = Infinity
        let boundsMaxX = -Infinity
        let boundsMinY = Infinity
        let boundsMaxY = -Infinity

        for (const node of state.nodes) {
          if (node.x < boundsMinX) boundsMinX = node.x
          if (node.x > boundsMaxX) boundsMaxX = node.x
          if (node.y < boundsMinY) boundsMinY = node.y
          if (node.y > boundsMaxY) boundsMaxY = node.y
        }

        const outOfBounds =
          boundsMinX < minX ||
          boundsMaxX > maxX ||
          boundsMinY < minY ||
          boundsMaxY > maxY

        if (outOfBounds) {
          const sourceSpanX = Math.max(1, boundsMaxX - boundsMinX)
          const sourceSpanY = Math.max(1, boundsMaxY - boundsMinY)
          const targetSpanX = Math.max(1, maxX - minX)
          const targetSpanY = Math.max(1, maxY - minY)
          const fitScale = Math.min(
            targetSpanX / sourceSpanX,
            targetSpanY / sourceSpanY
          )
          const sourceCenterX = (boundsMinX + boundsMaxX) / 2
          const sourceCenterY = (boundsMinY + boundsMaxY) / 2
          const targetCenterX = (minX + maxX) / 2
          const targetCenterY = (minY + maxY) / 2

          let didMove = false
          const remapped = state.nodes.map((node) => {
            const nextX = clampX(
              (node.x - sourceCenterX) * fitScale + targetCenterX
            )
            const nextY = clampY(
              (node.y - sourceCenterY) * fitScale + targetCenterY
            )
            if (nextX === node.x && nextY === node.y) {
              return node
            }
            didMove = true
            return { ...node, x: nextX, y: nextY }
          })
          nextNodes = didMove ? remapped : state.nodes
        }
      }
    }

    state = {
      ...state,
      ...(nextNodes !== state.nodes ? { nodes: nextNodes } : {}),
      canvasSize: { width: nextWidth, height: nextHeight },
    }
    emit()
  }

  function arrangeCircular() {
    if (state.nodes.length === 0) return

    const margin = state.config.nodeRadius + 16
    const bounds = getQuarterLayoutBounds(state.canvasSize, margin)
    const cx = (bounds.minX + bounds.maxX) / 2
    const cy = (bounds.minY + bounds.maxY) / 2
    const radius = Math.max(
      state.config.nodeRadius * 1.5,
      Math.min(bounds.width, bounds.height) / 2
    )

    const newNodes = state.nodes.map((node, i, arr) => {
      const angle = (2 * Math.PI * i) / arr.length - Math.PI / 2
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      return {
        ...node,
        x: Math.max(bounds.minX, Math.min(x, bounds.maxX)),
        y: Math.max(bounds.minY, Math.min(y, bounds.maxY)),
        fixed: true,
        vx: 0,
        vy: 0,
      }
    })

    pushHistory()
    state = { ...state, nodes: newNodes }
    layoutVersion++
    emit()
  }

  function arrangeGrid() {
    if (state.nodes.length === 0) return

    const n = state.nodes.length
    const cols = Math.ceil(Math.sqrt(n))
    const rows = Math.ceil(n / cols)
    const margin = state.config.nodeRadius + 16
    const bounds = getQuarterLayoutBounds(state.canvasSize, margin)
    const stepX = cols > 1 ? bounds.width / (cols - 1) : 0
    const stepY = rows > 1 ? bounds.height / (rows - 1) : 0

    const newNodes = state.nodes.map((node, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      return {
        ...node,
        x: bounds.minX + col * stepX,
        y: bounds.minY + row * stepY,
        fixed: true,
        vx: 0,
        vy: 0,
      }
    })

    pushHistory()
    state = { ...state, nodes: newNodes }
    layoutVersion++
    emit()
  }

  function arrangeAsTree() {
    if (state.nodes.length === 0) return

    const margin = state.config.nodeRadius + 16
    const bounds = getQuarterLayoutBounds(state.canvasSize, margin)
    const adj: Record<string, string[]> = {}
    state.nodes.forEach((n) => {
      adj[n.id] = []
    })
    state.edges.forEach((e) => {
      if (adj[e.source]) adj[e.source].push(e.target)
      if (state.direction === "undirected" && adj[e.target]) {
        adj[e.target].push(e.source)
      }
    })

    const visited = new Set<string>()
    const levels: Record<string, number> = {}
    const children: Record<string, string[]> = {}

    const root = state.nodes[0].id
    const queue = [root]
    visited.add(root)
    levels[root] = 0
    children[root] = []

    while (queue.length > 0) {
      const curr = queue.shift()!
      const neighbors = adj[curr] || []
      for (const nb of neighbors) {
        if (!visited.has(nb)) {
          visited.add(nb)
          levels[nb] = (levels[curr] || 0) + 1
          if (!children[curr]) children[curr] = []
          children[curr].push(nb)
          children[nb] = []
          queue.push(nb)
        }
      }
    }

    state.nodes.forEach((n) => {
      if (!visited.has(n.id)) {
        visited.add(n.id)
        levels[n.id] = 0
      }
    })

    const levelNodes: Record<number, string[]> = {}
    Object.entries(levels).forEach(([id, level]) => {
      if (!levelNodes[level]) levelNodes[level] = []
      levelNodes[level].push(id)
    })

    const maxLevel = Math.max(...Object.values(levels))
    const ySpacing = maxLevel > 0 ? bounds.height / maxLevel : 0
    const startY = bounds.minY

    const newNodes = [...state.nodes]
    for (let level = 0; level <= maxLevel; level++) {
      const nodesAtLevel = levelNodes[level] || []
      const xSpacing = bounds.width / (nodesAtLevel.length + 1)
      nodesAtLevel.forEach((id, i) => {
        const idx = newNodes.findIndex((n) => n.id === id)
        if (idx >= 0) {
          newNodes[idx] = {
            ...newNodes[idx],
            x: bounds.minX + xSpacing * (i + 1),
            y: startY + level * ySpacing,
            fixed: true,
            vx: 0,
            vy: 0,
          }
        }
      })
    }

    pushHistory()
    state = { ...state, nodes: newNodes }
    layoutVersion++
    emit()
  }

  function parseFromText(text: string) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) {
      if (
        state.nodes.length === 0 &&
        state.edges.length === 0 &&
        Object.keys(state.customLabels).length === 0
      ) {
        return
      }
      pushHistory()
      state = { ...state, nodes: [], edges: [] }
      emit()
      return
    }

    const nodeCount = parseIntegerToken(lines[0])
    if (nodeCount === null || nodeCount < 0) return

    const offset = state.indexMode === "1-index" ? 1 : 0
    const existingNodes = state.nodes

    const newNodes: GraphNode[] = []
    for (let i = 0; i < nodeCount; i++) {
      const id = String(i)
      const existing = existingNodes.find((n) => n.id === id)
      if (existing) {
        newNodes.push({ ...existing })
      } else {
        newNodes.push({
          id,
          label:
            state.indexMode === "custom"
              ? state.customLabels[id] || String(i)
              : String(i + offset),
          x: 200 + Math.random() * 200,
          y: 200 + Math.random() * 200,
          vx: 0,
          vy: 0,
          fixed: false,
        })
      }
    }

    newNodes.forEach((n, i) => {
      n.label =
        state.indexMode === "custom"
          ? state.customLabels[n.id] || String(i)
          : String(i + offset)
    })

    const newEdges: GraphEdge[] = []
    const seenEdges = new Set<string>()
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/)
      if (parts.length >= 2) {
        let sourceIdx = parseIntegerToken(parts[0])
        let targetIdx = parseIntegerToken(parts[1])
        if (sourceIdx === null || targetIdx === null) continue
        if (state.indexMode === "1-index") {
          sourceIdx -= 1
          targetIdx -= 1
        }
        if (
          sourceIdx >= 0 &&
          sourceIdx < nodeCount &&
          targetIdx >= 0 &&
          targetIdx < nodeCount &&
          sourceIdx !== targetIdx
        ) {
          const edgeKey = toEdgeKey(sourceIdx, targetIdx, state.direction)
          if (seenEdges.has(edgeKey)) continue
          seenEdges.add(edgeKey)
          const metadata = parseEdgeMetadata(parts)
          newEdges.push({
            source: String(sourceIdx),
            target: String(targetIdx),
            ...(typeof metadata.weight === "number"
              ? { weight: metadata.weight }
              : {}),
            ...(metadata.label ? { label: metadata.label } : {}),
          })
        }
      }
    }

    pushHistory()
    state = { ...state, nodes: newNodes, edges: newEdges }
    emit()
  }

  function generateText(): string {
    const offset = state.indexMode === "1-index" ? 1 : 0
    let text = String(state.nodes.length) + "\n"
    state.edges.forEach((e) => {
      const src = parseInt(e.source, 10) + offset
      const tgt = parseInt(e.target, 10) + offset
      let line = `${src} ${tgt}`
      if (typeof e.weight === "number" && Number.isFinite(e.weight)) {
        line += ` ${e.weight}`
      }
      if (e.label?.trim()) {
        line += ` ${e.label.trim()}`
      }
      text += `${line}\n`
    })
    return text
  }

  function updateLabelsForIndexMode() {
    pushHistory()
    const offset = state.indexMode === "1-index" ? 1 : 0
    state = {
      ...state,
      nodes: state.nodes.map((n, i) => ({
        ...n,
        label:
          state.indexMode === "custom"
            ? state.customLabels[n.id] || String(i)
            : String(i + offset),
      })),
    }
    emit()
  }

  function clearGraph(options: MutationOptions = {}) {
    const isConfigDefault =
      state.config.nodeRadius === DEFAULT_CONFIG.nodeRadius &&
      state.config.edgeIdealLength === DEFAULT_CONFIG.edgeIdealLength &&
      state.config.nodeBackground === DEFAULT_CONFIG.nodeBackground &&
      state.config.nodeColor === DEFAULT_CONFIG.nodeColor &&
      state.config.edgeColor === DEFAULT_CONFIG.edgeColor &&
      state.config.labelColor === DEFAULT_CONFIG.labelColor &&
      state.config.nodeLabelFontSize === DEFAULT_CONFIG.nodeLabelFontSize &&
      state.config.edgeLabelFontSize === DEFAULT_CONFIG.edgeLabelFontSize

    if (
      state.nodes.length === 0 &&
      state.edges.length === 0 &&
      Object.keys(state.customLabels).length === 0 &&
      isConfigDefault
    ) {
      return
    }
    if (options.recordHistory !== false) {
      pushHistory()
    }
    state = {
      ...state,
      nodes: [],
      edges: [],
      customLabels: {},
      config: { ...DEFAULT_CONFIG },
    }
    emit()
  }

  function canUndo() {
    return past.length > 0
  }

  function canRedo() {
    return future.length > 0
  }

  function undo() {
    if (past.length === 0) return
    future.push(snapshotFromState())
    const previous = past.pop()
    if (!previous) return
    applySnapshot(previous)
    emit()
  }

  function redo() {
    if (future.length === 0) return
    past.push(snapshotFromState())
    const next = future.pop()
    if (!next) return
    applySnapshot(next)
    emit()
  }

  return {
    getState,
    getLayoutVersion,
    subscribe,
    setState,
    setNodes,
    setEdges,
    addNode,
    removeNode,
    addEdge,
    removeEdge,
    updateNodePosition,
    toggleNodeFixed,
    setNodeFixed,
    fixAllNodes,
    unfixAllNodes,
    arrangeCircular,
    arrangeGrid,
    arrangeAsTree,
    parseFromText,
    generateText,
    updateLabelsForIndexMode,
    setCanvasSize,
    clearGraph,
    canUndo,
    canRedo,
    undo,
    redo,
  }
}

export const graphStore = createGraphStore()

export function useGraphStore(): GraphState & {
  actions: ReturnType<typeof createGraphStore>
} {
  const state = React.useSyncExternalStore(
    graphStore.subscribe,
    graphStore.getState,
    graphStore.getState
  )
  return { ...state, actions: graphStore }
}

export function useGraphSelector<T>(selector: (state: GraphState) => T): T {
  const getSnapshot = React.useCallback(() => {
    return selector(graphStore.getState())
  }, [selector])

  return React.useSyncExternalStore(
    graphStore.subscribe,
    getSnapshot,
    getSnapshot
  )
}
