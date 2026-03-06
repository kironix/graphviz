import type {
  DemoSeedEdge,
  DemoSeedNode,
  HomeFeature,
  HomeToolbarPreviewMode,
} from "@/types"
import {
  Download,
  Layers,
  MousePointer,
  Move,
  Pencil,
  PenTool,
  Settings,
  Share2,
  Sliders,
  Trash2,
  Zap,
} from "lucide-react"

export const HOME_FEATURES: HomeFeature[] = [
  {
    icon: Zap,
    title: "Force-Directed Layout",
    description:
      "Physics-based simulation that arranges nodes for optimal readability. Tune repulsion, attraction, and gravity in real time.",
  },
  {
    icon: PenTool,
    title: "Draw & Edit",
    description:
      "Create nodes with a click, connect them by selecting pairs. Edit labels inline and restructure freely.",
  },
  {
    icon: Download,
    title: "Import & Export",
    description:
      "Import/export graph data as JSON. Export renders as high-resolution PNG or vector SVG.",
  },
  {
    icon: Sliders,
    title: "Configurable Simulation",
    description:
      "Adjust node radius, edge length, and layout commands - arrange nodes in circles, grids, or layered views.",
  },
  {
    icon: Layers,
    title: "Undo / Redo",
    description:
      "Full history with Ctrl+Z / Ctrl+Shift+Z. Never lose your work - roll back up to 50 steps.",
  },
  {
    icon: Share2,
    title: "Directed & Undirected",
    description:
      "Toggle between directed and undirected graphs. Arrowheads render automatically on directed edges.",
  },
]

export const HOME_DEMO_NODES: DemoSeedNode[] = [
  { id: 0, x: 260, y: 55, label: "API" },
  { id: 1, x: 120, y: 130, label: "AU" },
  { id: 2, x: 260, y: 130, label: "CA" },
  { id: 3, x: 400, y: 130, label: "Q" },
  { id: 4, x: 120, y: 215, label: "DB" },
  { id: 5, x: 260, y: 215, label: "CD" },
  { id: 6, x: 400, y: 215, label: "ST" },
  { id: 7, x: 260, y: 300, label: "LG" },
]

export const HOME_DEMO_EDGES: DemoSeedEdge[] = [
  { from: 0, to: 1, label: "auth" },
  { from: 0, to: 2, label: "cache" },
  { from: 0, to: 3, label: "enqueue" },
  { from: 1, to: 4, label: "query" },
  { from: 2, to: 5, label: "serve" },
  { from: 3, to: 6, label: "store" },
  { from: 4, to: 7, label: "log" },
  { from: 5, to: 7, label: "log" },
  { from: 6, to: 7, label: "log" },
]

export const HOME_TOOLBAR_PREVIEW_MODES: HomeToolbarPreviewMode[] = [
  { icon: Move, label: "Force", active: true },
  { icon: Pencil, label: "Draw", active: false },
  { icon: MousePointer, label: "Edit", active: false },
  { icon: Trash2, label: "Delete", active: false },
  { icon: Settings, label: "Config", active: false },
]
