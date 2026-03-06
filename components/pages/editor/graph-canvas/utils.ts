import type {
  GraphConfig,
  GraphDirection,
  GraphEdge,
  ResolvedCanvasColors as ResolvedColors,
} from "@/types"
import {
  GRAPH_CURVE_OFFSET as CURVE_OFFSET,
  ForceSimulation,
  LARGE_GRAPH_NODE_THRESHOLD as PERFORMANCE_NODE_THRESHOLD,
} from "@/utils"

import { getEdgeMetaText } from "@/components/pages/editor/graph-actions/utils"

let _ppEdgesRef: GraphEdge[] | null = null
let _ppResult: Set<string> = new Set()

let _csDecl: CSSStyleDeclaration | null = null
let _csCanvas: HTMLCanvasElement | null = null

export function computeProximityBend(
  sx: number,
  sy: number,
  edx: number,
  edy: number,
  dist: number,
  perpX: number,
  perpY: number,
  sim: ForceSimulation,
  sourceId: string,
  targetId: string,
  nodeRadius: number
): number {
  const threshold = nodeRadius * 3.5
  const maxBend = nodeRadius * 2
  let offset = 0

  for (let ni = 0; ni < sim.count; ni++) {
    const nid = sim.nodeIds[ni]
    if (nid === sourceId || nid === targetId) continue

    const dnx = sim.x[ni] - sx
    const dny = sim.y[ni] - sy

    const t = (dnx * edx + dny * edy) / (dist * dist)
    if (t < 0.05 || t > 0.95) continue

    const signedDist = perpX * dnx + perpY * dny
    const absDist = Math.abs(signedDist)

    if (absDist < threshold) {
      const ratio = absDist / threshold
      const influence = 4 * ratio * (1 - ratio)
      const pushDir = signedDist > 0 ? -1 : 1
      offset += pushDir * influence * maxBend
    }
  }

  return offset
}

export function edgePairKey(source: string, target: string): string {
  return source < target ? `${source}:${target}` : `${target}:${source}`
}

export function buildParallelPairs(edges: GraphEdge[]): Set<string> {
  if (edges === _ppEdgesRef) return _ppResult
  _ppEdgesRef = edges
  const counts = new Map<string, number>()
  for (const e of edges) {
    const key = edgePairKey(e.source, e.target)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  const result = new Set<string>()
  for (const [key, count] of counts) {
    if (count > 1) result.add(key)
  }
  _ppResult = result
  return result
}

export function drawGraphToCanvas(
  canvas: HTMLCanvasElement,
  sim: ForceSimulation,
  edges: GraphEdge[],
  direction: GraphDirection,
  config: GraphConfig,
  colors: ResolvedColors,
  highlightedIds: Set<string>,
  highlightedEdgeIds: Set<string>,
  focusedNodeId: string | null,
  draggingId: string | null,
  dragStartFixedVal: boolean | null,
  width: number,
  height: number
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const targetW = Math.round(width * dpr)
  const targetH = Math.round(height * dpr)
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW
    canvas.height = targetH
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const n = sim.count
  const isPerf = n >= PERFORMANCE_NODE_THRESHOLD
  const shouldRenderEdgeMeta = !isPerf
  const shouldRenderAllNodeLabels = !isPerf

  const parallelPairs = buildParallelPairs(edges)

  const useProximityBend = !isPerf && n > 2

  for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex++) {
    const edge = edges[edgeIndex]
    const isEdgeHighlighted = highlightedEdgeIds.has(String(edgeIndex))
    const edgeStrokeColor = isEdgeHighlighted
      ? colors.focusColor
      : colors.edgeColor
    const edgeGlowAlpha = isEdgeHighlighted ? 0.32 : 0.2
    const edgeGlowWidth = isEdgeHighlighted ? 4.5 : 3.5
    const edgeLineWidth = isEdgeHighlighted ? 2.5 : 1.5
    const si = sim.indexOfId(edge.source)
    const ti = sim.indexOfId(edge.target)
    if (si < 0 || ti < 0) continue

    const sx = sim.x[si],
      sy = sim.y[si],
      tx = sim.x[ti],
      ty = sim.y[ti]
    const edx = tx - sx,
      edy = ty - sy
    const dist = Math.sqrt(edx * edx + edy * edy) || 1

    const isParallel = parallelPairs.has(edgePairKey(edge.source, edge.target))
    const parallelAmt = isParallel
      ? Math.min(CURVE_OFFSET, Math.max(15, dist * 0.3))
      : 0

    const perpX = -edy / dist
    const perpY = edx / dist

    const proximityAmt = useProximityBend
      ? computeProximityBend(
          sx,
          sy,
          edx,
          edy,
          dist,
          perpX,
          perpY,
          sim,
          edge.source,
          edge.target,
          config.nodeRadius
        )
      : 0

    const totalOffset = parallelAmt + proximityAmt
    const midX = (sx + tx) / 2
    const midY = (sy + ty) / 2
    const cpx = midX + perpX * totalOffset
    const cpy = midY + perpY * totalOffset
    const isCurved = Math.abs(totalOffset) > 0.5

    ctx.strokeStyle = edgeStrokeColor
    ctx.globalAlpha = edgeGlowAlpha
    ctx.lineWidth = edgeGlowWidth
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    if (!isCurved) {
      ctx.lineTo(tx, ty)
    } else {
      ctx.quadraticCurveTo(cpx, cpy, tx, ty)
    }
    ctx.stroke()
    ctx.globalAlpha = 1

    ctx.beginPath()
    ctx.strokeStyle = edgeStrokeColor
    ctx.lineWidth = edgeLineWidth
    ctx.moveTo(sx, sy)
    if (!isCurved) {
      ctx.lineTo(tx, ty)
    } else {
      ctx.quadraticCurveTo(cpx, cpy, tx, ty)
    }
    ctx.stroke()

    if (direction === "directed") {
      const arrowLen = 12
      const r = config.nodeRadius
      let angle: number, ax: number, ay: number

      if (!isCurved) {
        angle = Math.atan2(edy, edx)
        const ratio = dist > 0 ? (dist - r) / dist : 0
        ax = sx + edx * ratio
        ay = sy + edy * ratio
      } else {
        const tangentX = tx - cpx
        const tangentY = ty - cpy
        const tangentDist =
          Math.sqrt(tangentX * tangentX + tangentY * tangentY) || 1
        angle = Math.atan2(tangentY, tangentX)
        ax = tx - (tangentX / tangentDist) * r
        ay = ty - (tangentY / tangentDist) * r
      }

      ctx.beginPath()
      ctx.fillStyle = edgeStrokeColor
      ctx.moveTo(ax, ay)
      ctx.lineTo(
        ax - arrowLen * Math.cos(angle - Math.PI / 7),
        ay - arrowLen * Math.sin(angle - Math.PI / 7)
      )
      ctx.lineTo(
        ax - arrowLen * Math.cos(angle + Math.PI / 7),
        ay - arrowLen * Math.sin(angle + Math.PI / 7)
      )
      ctx.closePath()
      ctx.fill()
    }

    if (shouldRenderEdgeMeta) {
      const metaText = getEdgeMetaText(edge)
      if (metaText) {
        const offset =
          Math.max(config.edgeLabelFontSize, config.nodeRadius * 0.6) ||
          14
        let textX: number, textY: number
        if (!isCurved) {
          textX = midX + perpX * offset
          textY = midY + perpY * offset
        } else {
          textX = (sx + 2 * cpx + tx) / 4
          textY = (sy + 2 * cpy + ty) / 4
        }

        const edgeFontSize = config.edgeLabelFontSize
        ctx.font = `700 ${edgeFontSize}px sans-serif`
        ctx.fillStyle = isEdgeHighlighted
          ? colors.focusColor
          : colors.labelColor
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(metaText, textX, textY)
      }
    }
  }

  for (let i = 0; i < n; i++) {
    const id = sim.nodeIds[i]
    const px = sim.x[i],
      py = sim.y[i]
    const isHighlighted = highlightedIds.has(id)
    const isFocused = focusedNodeId === id

    if (isHighlighted) {
      ctx.beginPath()
      ctx.arc(px, py, config.nodeRadius + 5, 0, Math.PI * 2)
      ctx.strokeStyle = colors.focusColor
      ctx.lineWidth = isFocused ? 3 : 2
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.arc(px, py, config.nodeRadius, 0, Math.PI * 2)
    ctx.fillStyle = colors.nodeBackground
    ctx.fill()
    ctx.strokeStyle = colors.nodeColor
    const isFixed = sim.fixed[i] === 1
    const isTempPinned = draggingId === id && dragStartFixedVal === false
    const baseLineWidth = isFixed && !isTempPinned ? 6 : 2
    ctx.lineWidth = isFocused ? Math.max(4, baseLineWidth) : baseLineWidth
    ctx.stroke()

    if (shouldRenderAllNodeLabels || isHighlighted || isFocused) {
      ctx.fillStyle = colors.labelColor
      ctx.font = `700 ${config.nodeLabelFontSize}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(sim.nodeLabels[i], px, py)
    }
  }
}

export function pointToBezierDist(
  px: number,
  py: number,
  x0: number,
  y0: number,
  cpx: number,
  cpy: number,
  x1: number,
  y1: number
): number {
  let minDist = Infinity
  let prevX = x0,
    prevY = y0
  for (let i = 1; i <= 8; i++) {
    const t = i / 8
    const u = 1 - t
    const bx = u * u * x0 + 2 * u * t * cpx + t * t * x1
    const by = u * u * y0 + 2 * u * t * cpy + t * t * y1
    const dx = bx - prevX,
      dy = by - prevY
    const lenSq = dx * dx + dy * dy
    if (lenSq > 0) {
      const proj = Math.max(
        0,
        Math.min(1, ((px - prevX) * dx + (py - prevY) * dy) / lenSq)
      )
      const cx = prevX + proj * dx,
        cy = prevY + proj * dy
      const d = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
      if (d < minDist) minDist = d
    }
    prevX = bx
    prevY = by
  }
  return minDist
}

export function resolveCanvasColors(
  canvas: HTMLCanvasElement,
  config: GraphConfig
): ResolvedColors {
  if (_csCanvas !== canvas) {
    _csDecl = getComputedStyle(canvas)
    _csCanvas = canvas
  }
  const cs = _csDecl!
  const resolve = (color: string): string => {
    if (color.startsWith("var(")) {
      const varName = color.match(/var\(([^)]+)\)/)?.[1]
      if (varName) {
        const val = cs.getPropertyValue(varName).trim()
        return val || color
      }
    }
    return color
  }
  return {
    nodeBackground: resolve(config.nodeBackground),
    nodeColor: resolve(config.nodeColor),
    edgeColor: resolve(config.edgeColor),
    labelColor: resolve(config.labelColor),
    focusColor: resolve("var(--primary)"),
  }
}
