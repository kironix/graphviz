import type {
  GraphConfig,
  GraphConfigCommandKey,
  GraphDirection,
  IndexMode,
  InteractionMode,
} from "@/types"

export const DEFAULT_CONFIG: GraphConfig = {
  nodeRadius: 19,
  edgeIdealLength: 140,
  nodeBackground: "var(--background)",
  nodeColor: "var(--foreground)",
  edgeColor: "var(--foreground)",
  labelColor: "var(--foreground)",
  nodeLabelFontSize: 16,
  edgeLabelFontSize: 18,
}

export const EDITOR_MODES: { value: InteractionMode; label: string }[] = [
  { value: "force", label: "Force" },
  { value: "draw", label: "Draw" },
  { value: "edit", label: "Edit" },
  { value: "delete", label: "Delete" },
  { value: "config", label: "Config" },
]

export const EDITOR_INDEX_MODES: {
  value: IndexMode
  label: string
  compactLabel: string
}[] = [
  { value: "0-index", label: "0-index", compactLabel: "0-idx" },
  { value: "1-index", label: "1-index", compactLabel: "1-idx" },
  { value: "custom", label: "Custom", compactLabel: "Custom" },
]

export const EDITOR_DIRECTIONS: {
  value: GraphDirection
  label: string
}[] = [
  { value: "undirected", label: "Undirected" },
  { value: "directed", label: "Directed" },
]

export const TOOLBAR_DESKTOP_BUTTON_CLASS =
  "shrink-0 rounded-none text-sm first:rounded-l-md last:rounded-r-md"

export const LARGE_GRAPH_NODE_THRESHOLD = 500
export const GRAPH_CANVAS_PADDING = 20
export const GRAPH_CURVE_OFFSET = 50

export const GRAPH_RESET_DIALOG = {
  title: "Reset graph?",
  description:
    "This will clear nodes, edges, labels, and restore default config.",
} as const

export const MOBILE_DIALOG_COPY = {
  options: {
    title: "Graph Options",
    description: "Direction and index settings",
  },
  textEditor: {
    title: "Text Editor",
    description: "Edit graph structure as text",
  },
  modeConfig: {
    title: "Mode & Config",
    description: "Switch modes and adjust settings",
  },
  export: {
    title: "Export",
    description: "Download or generate graph output",
  },
} as const

export const TABLET_SHEET_COPY = {
  title: "Config & Export",
  description: "Mode settings, visual config, and export options",
} as const

export const EDITOR_MODE_INFO: Record<
  InteractionMode,
  { title: string; description: string; bullets: string[] }
> = {
  force: {
    title: "Force mode",
    description:
      "In this mode, there is a gravitation pull that acts on the nodes and keeps them in the center of the drawing area. Also, the nodes exert a force on each other, making the whole graph look and act like real objects in space.",
    bullets: [
      "Nodes support drag and drop.",
      "Dragging keeps each node's fixed/unfixed state.",
      "You can fix/unfix a node by simple click.",
    ],
  },
  draw: {
    title: "Draw mode",
    description:
      "In this mode, you can add new nodes and edges to the graph. Changes automatically update in the text editor.",
    bullets: [
      "Click on empty space to add a new node.",
      "Drag from one node to another to create an edge.",
      "New nodes are created as fixed.",
    ],
  },
  edit: {
    title: "Edit mode",
    description:
      "In this mode, you can edit node labels by clicking on them. Changes instantly update the text editor.",
    bullets: [
      "Click on a node to edit its label.",
      "Click on an edge to edit weight and label.",
      "Press Enter to confirm the new label.",
      "Press Escape to cancel editing.",
    ],
  },
  delete: {
    title: "Delete mode",
    description:
      "In this mode, you can delete nodes and edges from the graph. Changes automatically sync to the text editor.",
    bullets: [
      "Click on a node to delete it and all its edges.",
      "Click on an edge to delete just that edge.",
    ],
  },
  config: {
    title: "Config mode",
    description:
      "In this mode, you can configure the visual properties of the graph and run special commands.",
    bullets: [
      "Adjust node radius, edge length, and colors.",
      "Fix or unfix all nodes at once.",
      "Arrange nodes as layered, circular, or grid layouts.",
    ],
  },
}

export const GRAPH_CONFIG_COMMANDS: {
  key: GraphConfigCommandKey
  name: string
  description: string
}[] = [
  {
    key: "fix-all",
    name: "Fix all nodes",
    description: "Fix all nodes in the graph.",
  },
  {
    key: "unfix-all",
    name: "Unfix all nodes",
    description: "Unfix all nodes in the graph.",
  },
  {
    key: "arrange-layered",
    name: "Arrange layered",
    description: "Arrange nodes as layered in the graph.",
  },
  {
    key: "arrange-circular",
    name: "Arrange circular",
    description: "Arrange nodes as circular in the graph.",
  },
  {
    key: "arrange-grid",
    name: "Arrange grid",
    description: "Arrange nodes as grid in the graph.",
  },
]

export const GRAPH_ACTIONS_COPY = {
  exportJsonTitle: "Export JSON",
  exportJsonDescription:
    "Export graph as JSON. This will download a file to your computer.",
  importJsonTitle: "Import JSON",
  importJsonDescription:
    "Paste graph JSON or upload a .json file. Config colors must be HEX format (#RRGGBB). This will import the graph into the current session.",
} as const
