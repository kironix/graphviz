import packageJson from "../package.json"

const title = "GraphViz"
const tagLine = "Interactive Graph Visualization"

const siteConfig = {
  title,
  tagLine,
  description:
    "Build and explore graph structures with force layouts, instant editing, and export-ready visuals.",
  keywords: [
    "graph editor",
    "visual graph editor",
    "force directed graph",
    "interactive graph",
    "node link diagram",
    "visualization tool",
    "responsive graph editor",
    "graph visualization",
    "web development project",
  ],
  contact: {
    name: "Toufiq Hasan Kiron",
    email: "hello@kiron.dev",
  },
  keys: {
    storageKey: `${title.toLowerCase().replace(" ", "-")}-state-v1`,
    installPrompt: `${title.toLowerCase().replace(" ", "-")}-install-prompt`,
    shareParam: "graph",
    hideDuration: 3 * 24 * 60 * 60 * 1000, // 3 days
  },
}

export const Config = {
  ...siteConfig,
  version: packageJson.version,
}
