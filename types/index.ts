import type { LucideIcon } from "lucide-react"

export interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
  fixed: boolean
}

export interface GraphEdge {
  source: string
  target: string
  weight?: number
  label?: string
}

export type GraphDirection = "undirected" | "directed"
export type IndexMode = "0-index" | "1-index" | "custom"
export type InteractionMode = "force" | "draw" | "edit" | "delete" | "config"

export interface GraphConfig {
  nodeRadius: number
  edgeIdealLength: number
  nodeBackground: string
  nodeColor: string
  edgeColor: string
  labelColor: string
  nodeLabelFontSize: number
  edgeLabelFontSize: number
}

export interface GraphState {
  nodes: GraphNode[]
  edges: GraphEdge[]
  direction: GraphDirection
  indexMode: IndexMode
  mode: InteractionMode
  config: GraphConfig
  customLabels: Record<string, string>
  canvasSize: { width: number; height: number }
  searchQuery: string
  searchMatches: string[]
  searchEdgeMatches: string[]
  focusedNodeId: string | null
}

export type ShareableGraphState = Pick<
  GraphState,
  "nodes" | "edges" | "direction" | "indexMode" | "config" | "customLabels"
> & {
  canvasSize?: GraphState["canvasSize"]
}

export type GraphStoreListener = () => void
export type GraphMutationOptions = { recordHistory?: boolean }
export type GraphSnapshot = Pick<
  GraphState,
  "nodes" | "edges" | "customLabels" | "config"
>

export type GraphConfigCommandKey =
  | "fix-all"
  | "unfix-all"
  | "arrange-layered"
  | "arrange-circular"
  | "arrange-grid"

export interface GraphRightPanelCommandItem {
  key: GraphConfigCommandKey
  name: string
  description: string
  command: () => void
}

export type GraphPendingDelete =
  | {
      type: "node"
      id: string
      label: string
      connectedEdges: number
    }
  | {
      type: "edge"
      source: string
      target: string
    }

export interface GraphEditingEdge {
  source: string
  target: string
}

export interface GraphEdgeSegment {
  edge: GraphEdge
  src: GraphNode
  tgt: GraphNode
}

export interface ResolvedCanvasColors {
  nodeBackground: string
  nodeColor: string
  edgeColor: string
  labelColor: string
  focusColor: string
}

export type ValidationIssue = { line: number; message: string }

export interface HeroGraphNode {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

export interface HeroGraphEdge {
  from: number
  to: number
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt: () => Promise<void>
}

export interface QTCell {
  x0: number
  y0: number
  x1: number
  y1: number
  cx: number
  cy: number
  mass: number
  bodyIdx: number
  children: (QTCell | null)[]
}

export type HomeFeature = {
  icon: LucideIcon
  title: string
  description: string
}

export type DemoSeedNode = { id: number; x: number; y: number; label: string }

export type DemoSeedEdge = {
  from: number
  to: number
  weight?: number
  label?: string
}

export type HomeToolbarPreviewMode = {
  icon: LucideIcon
  label: string
  active: boolean
}
