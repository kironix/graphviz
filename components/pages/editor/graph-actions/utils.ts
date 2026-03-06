import {
  type GraphConfig,
  type GraphDirection,
  type GraphEdge,
  type GraphNode,
  type IndexMode,
} from "@/types"
import {
  HEX_COLOR_RE,
  DEFAULT_CONFIG,
  type ShareableGraphState,
} from "@/utils"

export function computeBounds(
  nodes: { x: number; y: number }[],
  padding: number
) {
  if (nodes.length === 0) return { minX: 0, minY: 0, w: 600, h: 500 }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const n of nodes) {
    if (n.x < minX) minX = n.x
    if (n.y < minY) minY = n.y
    if (n.x > maxX) maxX = n.x
    if (n.y > maxY) maxY = n.y
  }
  minX -= padding
  minY -= padding
  maxX += padding
  maxY += padding
  return { minX, minY, w: maxX - minX, h: maxY - minY }
}

export function getEdgeMetaText(edge: { weight?: number; label?: string }) {
  const label = edge.label?.trim()
  const hasWeight =
    typeof edge.weight === "number" && Number.isFinite(edge.weight)
  if (label && hasWeight) return `${label}:${edge.weight}`
  if (label) return label
  if (hasWeight) return `${edge.weight}`
  return ""
}

export function escapeXml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

export function validateImportedState(
  value: unknown
): { ok: true; data: ShareableGraphState } | { ok: false; error: string } {
  if (!isPlainObject(value)) {
    return { ok: false, error: "Root JSON must be an object." }
  }

  const {
    nodes,
    edges,
    direction,
    indexMode,
    config,
    customLabels,
    canvasSize,
  } = value

  if (!Array.isArray(nodes)) {
    return { ok: false, error: "`nodes` must be an array." }
  }
  if (!Array.isArray(edges)) {
    return { ok: false, error: "`edges` must be an array." }
  }
  if (direction !== "directed" && direction !== "undirected") {
    return {
      ok: false,
      error: "`direction` must be `directed` or `undirected`.",
    }
  }
  if (
    indexMode !== "0-index" &&
    indexMode !== "1-index" &&
    indexMode !== "custom"
  ) {
    return {
      ok: false,
      error: "`indexMode` must be `0-index`, `1-index`, or `custom`.",
    }
  }
  if (!isPlainObject(config)) {
    return { ok: false, error: "`config` must be an object." }
  }
  if (!isPlainObject(customLabels)) {
    return { ok: false, error: "`customLabels` must be an object." }
  }

  let parsedCanvasSize: { width: number; height: number } | undefined
  if (canvasSize !== undefined) {
    if (!isPlainObject(canvasSize)) {
      return {
        ok: false,
        error: "`canvasSize` must be an object with non-negative width/height.",
      }
    }
    const w = (canvasSize as Record<string, unknown>).width
    const h = (canvasSize as Record<string, unknown>).height
    if (
      typeof w !== "number" ||
      !Number.isFinite(w) ||
      w < 0 ||
      typeof h !== "number" ||
      !Number.isFinite(h) ||
      h < 0
    ) {
      return {
        ok: false,
        error: "`canvasSize` must be an object with non-negative width/height.",
      }
    }
    parsedCanvasSize = {
      width: Math.round(w),
      height: Math.round(h),
    }
  }
  const parsedNodes: GraphNode[] = []
  const idSet = new Set<string>()
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (!isPlainObject(n)) {
      return { ok: false, error: `nodes[${i}] must be an object.` }
    }
    const { id, label, x, y, vx, vy, fixed } = n
    if (typeof id !== "string" || !id.trim()) {
      return { ok: false, error: `nodes[${i}].id must be a non-empty string.` }
    }
    if (idSet.has(id)) {
      return { ok: false, error: `Duplicate node id: ${id}` }
    }
    if (typeof label !== "string") {
      return { ok: false, error: `nodes[${i}].label must be a string.` }
    }
    if (
      ![x, y, vx, vy].every(
        (num) => typeof num === "number" && Number.isFinite(num)
      )
    ) {
      return { ok: false, error: `nodes[${i}] has invalid numeric fields.` }
    }
    if (typeof fixed !== "boolean") {
      return { ok: false, error: `nodes[${i}].fixed must be boolean.` }
    }
    idSet.add(id)
    parsedNodes.push({
      id,
      label,
      x: Number(x),
      y: Number(y),
      vx: Number(vx),
      vy: Number(vy),
      fixed,
    })
  }

  const parsedEdges: GraphEdge[] = []
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]
    if (!isPlainObject(e)) {
      return { ok: false, error: `edges[${i}] must be an object.` }
    }
    const { source, target, weight, label } = e
    if (typeof source !== "string" || typeof target !== "string") {
      return { ok: false, error: `edges[${i}] source/target must be strings.` }
    }
    if (!idSet.has(source) || !idSet.has(target)) {
      return {
        ok: false,
        error: `edges[${i}] references unknown node id(s): ${source}, ${target}.`,
      }
    }
    if (
      weight !== undefined &&
      (typeof weight !== "number" || !Number.isFinite(weight))
    ) {
      return { ok: false, error: `edges[${i}].weight must be a finite number.` }
    }
    if (label !== undefined && typeof label !== "string") {
      return {
        ok: false,
        error: `edges[${i}].label must be a string if provided.`,
      }
    }
    parsedEdges.push({
      source,
      target,
      ...(weight !== undefined ? { weight } : {}),
      ...(label !== undefined ? { label } : {}),
    })
  }

  for (const [key, val] of Object.entries(customLabels)) {
    if (typeof val !== "string") {
      return { ok: false, error: `customLabels.${key} must be a string.` }
    }
  }

  const cfg = config as Record<string, unknown>
  const radius = cfg.nodeRadius
  const edgeLen = cfg.edgeIdealLength
  const nodeBackground = cfg.nodeBackground
  const nodeColor = cfg.nodeColor
  const edgeColor = cfg.edgeColor
  const labelColor = cfg.labelColor
  const nodeLabelFontSizeRaw = cfg.nodeLabelFontSize
  const edgeLabelFontSizeRaw = cfg.edgeLabelFontSize

  if (
    typeof radius !== "number" ||
    !Number.isFinite(radius) ||
    typeof edgeLen !== "number" ||
    !Number.isFinite(edgeLen)
  ) {
    return {
      ok: false,
      error:
        "`config.nodeRadius` and `config.edgeIdealLength` must be finite numbers.",
    }
  }

  let nodeLabelFontSize = DEFAULT_CONFIG.nodeLabelFontSize
  if (nodeLabelFontSizeRaw !== undefined) {
    if (
      typeof nodeLabelFontSizeRaw !== "number" ||
      !Number.isFinite(nodeLabelFontSizeRaw)
    ) {
      return {
        ok: false,
        error: "`config.nodeLabelFontSize` must be a finite number if provided.",
      }
    }
    nodeLabelFontSize = nodeLabelFontSizeRaw
  }

  let edgeLabelFontSize = DEFAULT_CONFIG.edgeLabelFontSize
  if (edgeLabelFontSizeRaw !== undefined) {
    if (
      typeof edgeLabelFontSizeRaw !== "number" ||
      !Number.isFinite(edgeLabelFontSizeRaw)
    ) {
      return {
        ok: false,
        error: "`config.edgeLabelFontSize` must be a finite number if provided.",
      }
    }
    edgeLabelFontSize = edgeLabelFontSizeRaw
  }

  const colors = {
    nodeBackground,
    nodeColor,
    edgeColor,
    labelColor,
  }
  for (const [name, val] of Object.entries(colors)) {
    if (typeof val !== "string" || !HEX_COLOR_RE.test(val)) {
      return {
        ok: false,
        error: `config.${name} must be HEX color like #1a2b3c.`,
      }
    }
  }

  const parsedConfig: GraphConfig = {
    nodeRadius: Math.min(60, Math.max(10, Math.round(radius))),
    edgeIdealLength: Math.min(300, Math.max(30, Math.round(edgeLen))),
    nodeBackground: String(nodeBackground),
    nodeColor: String(nodeColor),
    edgeColor: String(edgeColor),
    labelColor: String(labelColor),
    nodeLabelFontSize: Math.min(
      48,
      Math.max(8, Math.round(nodeLabelFontSize))
    ),
    edgeLabelFontSize: Math.min(
      48,
      Math.max(8, Math.round(edgeLabelFontSize))
    ),
  }

  return {
    ok: true,
    data: {
      nodes: parsedNodes,
      edges: parsedEdges,
      direction: direction as GraphDirection,
      indexMode: indexMode as IndexMode,
      config: parsedConfig,
      customLabels: customLabels as Record<string, string>,
      ...(parsedCanvasSize ? { canvasSize: parsedCanvasSize } : {}),
    },
  }
}
