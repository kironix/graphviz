"use client"

import * as React from "react"
import {
  buildShareUrl,
  encodeGraphStateForShare,
  GRAPH_ACTIONS_COPY,
  useGraphStore,
  type ShareableGraphState,
} from "@/utils"
import { Check, Code2, Download, FileJson, Share2, Upload } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialogHelper } from "@/components/alert-dialog-helper"
import { DialogHelper } from "@/components/dialog-helper"

import {
  computeBounds,
  escapeXml,
  getEdgeMetaText,
  validateImportedState,
} from "./utils"

export function GraphActions() {
  const {
    nodes,
    edges,
    direction,
    indexMode,
    config,
    customLabels,
    canvasSize,
    actions,
  } = useGraphStore()
  const [shareStatus, setShareStatus] = React.useState<
    "idle" | "copied" | "error"
  >("idle")
  const [importOpen, setImportOpen] = React.useState(false)
  const [importText, setImportText] = React.useState("")
  const [importError, setImportError] = React.useState<string | null>(null)
  const [isDragOverImport, setIsDragOverImport] = React.useState(false)
  const importFileInputRef = React.useRef<HTMLInputElement | null>(null)
  const isEmpty = nodes.length === 0

  const resolveColor = React.useCallback((color: string) => {
    if (typeof window === "undefined") return color
    if (color.startsWith("var(")) {
      const varName = color.match(/var\(([^)]+)\)/)?.[1]
      if (varName) {
        const style = getComputedStyle(document.documentElement)
        return style.getPropertyValue(varName).trim() || color
      }
    }
    return color
  }, [])

  const normalizeToHex = React.useCallback(
    (inputColor: string) => {
      const resolved = resolveColor(inputColor)
      const canvas = document.createElement("canvas")
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return resolved
      ctx.fillStyle = "#000000"
      ctx.fillStyle = resolved
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
      const toHex = (n: number) => n.toString(16).padStart(2, "0")
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    },
    [resolveColor]
  )

  const handleDownloadPNG = React.useCallback(() => {
    if (nodes.length === 0) return

    const pad = config.nodeRadius + 20
    const { minX, minY, w, h } = computeBounds(nodes, pad)

    const dpr = window.devicePixelRatio || 1
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = w * dpr
    tempCanvas.height = h * dpr
    const ctx = tempCanvas.getContext("2d")
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = resolveColor("var(--background)")
    ctx.fillRect(0, 0, w, h)

    ctx.translate(-minX, -minY)

    const edgeColor = resolveColor(config.edgeColor)
    const labelColor = resolveColor(config.labelColor)
    edges.forEach((edge) => {
      const src = nodes.find((n) => n.id === edge.source)
      const tgt = nodes.find((n) => n.id === edge.target)
      if (!src || !tgt) return

      ctx.beginPath()
      ctx.strokeStyle = edgeColor
      ctx.lineWidth = 1.5
      ctx.moveTo(src.x, src.y)
      ctx.lineTo(tgt.x, tgt.y)
      ctx.stroke()

      if (direction === "directed") {
        const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x)
        const dx = tgt.x - src.x
        const dy = tgt.y - src.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const r = config.nodeRadius
        const ratio = (dist - r) / dist
        const ax = src.x + dx * ratio
        const ay = src.y + dy * ratio
        const arrowLen = 12

        ctx.beginPath()
        ctx.fillStyle = edgeColor
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

      const metaText = getEdgeMetaText(edge)
      if (metaText) {
        const midX = (src.x + tgt.x) / 2
        const midY = (src.y + tgt.y) / 2
        const dx = tgt.x - src.x
        const dy = tgt.y - src.y
        const length = Math.hypot(dx, dy) || 1
        const normalX = -dy / length
        const normalY = dx / length
        const offset = config.edgeLabelFontSize * 1.5
        const textX = midX + normalX * offset
        const textY = midY + normalY * offset

        const edgeFontSize = config.edgeLabelFontSize
        ctx.font = `700 ${edgeFontSize}px sans-serif`
        ctx.fillStyle = labelColor
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(metaText, textX, textY)
      }
    })

    nodes.forEach((node) => {
      ctx.beginPath()
      ctx.arc(node.x, node.y, config.nodeRadius, 0, Math.PI * 2)
      ctx.fillStyle = resolveColor(config.nodeBackground)
      ctx.fill()
      ctx.strokeStyle = resolveColor(config.nodeColor)
      ctx.lineWidth = node.fixed ? 6 : 2
      ctx.stroke()

      ctx.fillStyle = labelColor
      ctx.font = `700 ${config.nodeLabelFontSize}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(node.label, node.x, node.y)
    })

    const link = document.createElement("a")
    link.download = "graph.png"
    link.href = tempCanvas.toDataURL("image/png")
    link.click()
  }, [nodes, edges, direction, config, resolveColor])

  const handleGenerateMarkup = React.useCallback(() => {
    if (nodes.length === 0) return

    const pad = config.nodeRadius + 20
    const { minX, minY, w, h } = computeBounds(nodes, pad)

    const svgParts: string[] = []
    svgParts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${minX} ${minY} ${w} ${h}">`
    )
    svgParts.push(
      `<rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="${resolveColor("var(--background)")}"/>`
    )

    const edgeColor = resolveColor(config.edgeColor)
    const labelColor = resolveColor(config.labelColor)
    edges.forEach((edge) => {
      const src = nodes.find((n) => n.id === edge.source)
      const tgt = nodes.find((n) => n.id === edge.target)
      if (!src || !tgt) return

      if (direction === "directed") {
        const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x)
        const dx = tgt.x - src.x
        const dy = tgt.y - src.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const r = config.nodeRadius
        const ratio = (dist - r) / dist
        const ax = src.x + dx * ratio
        const ay = src.y + dy * ratio
        const arrowLen = 12

        svgParts.push(
          `<line x1="${src.x}" y1="${src.y}" x2="${tgt.x}" y2="${tgt.y}" stroke="${edgeColor}" stroke-width="1.5"/>`
        )
        svgParts.push(
          `<polygon points="${ax},${ay} ${ax - arrowLen * Math.cos(angle - Math.PI / 7)},${ay - arrowLen * Math.sin(angle - Math.PI / 7)} ${ax - arrowLen * Math.cos(angle + Math.PI / 7)},${ay - arrowLen * Math.sin(angle + Math.PI / 7)}" fill="${edgeColor}"/>`
        )
      } else {
        svgParts.push(
          `<line x1="${src.x}" y1="${src.y}" x2="${tgt.x}" y2="${tgt.y}" stroke="${edgeColor}" stroke-width="1.5"/>`
        )
      }

        const metaText = getEdgeMetaText(edge)
        if (metaText) {
          const midX = (src.x + tgt.x) / 2
          const midY = (src.y + tgt.y) / 2
          const dx = tgt.x - src.x
          const dy = tgt.y - src.y
          const length = Math.hypot(dx, dy) || 1
          const normalX = -dy / length
          const normalY = dx / length
          const offset = config.edgeLabelFontSize * 1.5
          const textX = midX + normalX * offset
          const textY = midY + normalY * offset

          svgParts.push(
            `<text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="central" fill="${labelColor}" font-size="${config.edgeLabelFontSize}" font-family="sans-serif" font-weight="700">${escapeXml(metaText)}</text>`
          )
        }
    })

    nodes.forEach((node) => {
      svgParts.push(
        `<circle cx="${node.x}" cy="${node.y}" r="${config.nodeRadius}" fill="${resolveColor(config.nodeBackground)}" stroke="${resolveColor(config.nodeColor)}" stroke-width="${node.fixed ? 6 : 2}"/>`
      )
      svgParts.push(
        `<text x="${node.x}" y="${node.y}" text-anchor="middle" dominant-baseline="central" fill="${labelColor}" font-size="${config.nodeLabelFontSize}" font-family="sans-serif" font-weight="700">${node.label}</text>`
      )
    })

    svgParts.push("</svg>")
    const svgContent = svgParts.join("\n")

    const blob = new Blob([svgContent], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.download = "graph.svg"
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [nodes, edges, direction, config, resolveColor])

  const copyText = React.useCallback(async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }

    const input = document.createElement("textarea")
    input.value = text
    input.setAttribute("readonly", "")
    input.style.position = "absolute"
    input.style.left = "-9999px"
    document.body.appendChild(input)
    input.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(input)
    if (!ok) throw new Error("Copy failed")
  }, [])

  const handleCopyShareLink = React.useCallback(async () => {
    if (isEmpty) return
    try {
      const payload: ShareableGraphState = {
        nodes,
        edges,
        direction,
        indexMode,
        config,
        customLabels,
        ...(canvasSize.width > 0 && canvasSize.height > 0
          ? { canvasSize }
          : {}),
      }
      const encoded = encodeGraphStateForShare(payload)
      const shareUrl = buildShareUrl(window.location.href, encoded)
      await copyText(shareUrl)
      setShareStatus("copied")
    } catch {
      setShareStatus("error")
    }
  }, [
    nodes,
    edges,
    direction,
    indexMode,
    config,
    customLabels,
    canvasSize,
    copyText,
    isEmpty,
  ])

  const handleExportJSON = React.useCallback(() => {
    if (isEmpty) return
    const payload: ShareableGraphState = {
      nodes,
      edges,
      direction,
      indexMode,
      config: {
        ...config,
        nodeBackground: normalizeToHex(config.nodeBackground),
        nodeColor: normalizeToHex(config.nodeColor),
        edgeColor: normalizeToHex(config.edgeColor),
        labelColor: normalizeToHex(config.labelColor),
      },
      customLabels,
      ...(canvasSize.width > 0 && canvasSize.height > 0 ? { canvasSize } : {}),
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "graph.json"
    link.click()
    URL.revokeObjectURL(url)
  }, [
    nodes,
    edges,
    direction,
    indexMode,
    config,
    customLabels,
    canvasSize,
    isEmpty,
    normalizeToHex,
  ])

  const loadImportFile = React.useCallback(async (file: File) => {
    const looksLikeJson =
      file.type === "application/json" ||
      file.name.toLowerCase().endsWith(".json")
    if (!looksLikeJson) {
      setImportError("Please drop/select a valid .json file.")
      return
    }
    try {
      const text = await file.text()
      setImportText(text)
      setImportError(null)
    } catch {
      setImportError("Failed to read JSON file.")
    }
  }, [])

  const handleImportFile = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      await loadImportFile(file)
      e.target.value = ""
    },
    [loadImportFile]
  )

  const handleImportDragOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDragOverImport) setIsDragOverImport(true)
    },
    [isDragOverImport]
  )

  const handleImportDragLeave = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOverImport(false)
    },
    []
  )

  const handleImportDrop = React.useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOverImport(false)
      const file = e.dataTransfer.files?.[0]
      if (!file) return
      await loadImportFile(file)
    },
    [loadImportFile]
  )

  const handleImportJSON = React.useCallback(() => {
    setImportError(null)
    let parsed: unknown
    try {
      parsed = JSON.parse(importText)
    } catch {
      setImportError("Invalid JSON format.")
      return
    }

    const validated = validateImportedState(parsed)
    if (!validated.ok) {
      setImportError(validated.error)
      return
    }

    const data = validated.data
    actions.setState(
      {
        nodes: data.nodes,
        edges: data.edges,
        direction: data.direction,
        indexMode: data.indexMode,
        config: data.config,
        customLabels: data.customLabels,
        ...(data.canvasSize ? { canvasSize: data.canvasSize } : {}),
      },
      { recordHistory: true }
    )
    setImportOpen(false)
    setImportText("")
  }, [importText, actions])

  React.useEffect(() => {
    if (shareStatus === "idle") return
    const timer = setTimeout(() => setShareStatus("idle"), 2000)
    return () => clearTimeout(timer)
  }, [shareStatus])

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Button
        variant="secondary"
        className="flex-1 sm:col-span-2"
        onClick={handleCopyShareLink}
        disabled={isEmpty}
      >
        {shareStatus === "copied" ? (
          <Check className="h-4 w-4" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {shareStatus === "copied"
          ? "Copied"
          : shareStatus === "error"
            ? "Copy failed"
            : "Share Link"}
      </Button>
      <Button
        variant="secondary"
        className="flex-1 gap-2"
        onClick={handleDownloadPNG}
        disabled={isEmpty}
      >
        <Download className="h-4 w-4" />
        PNG
      </Button>
      <Button
        variant="secondary"
        className="flex-1 gap-2"
        onClick={handleGenerateMarkup}
        disabled={isEmpty}
      >
        <Code2 className="h-4 w-4" />
        SVG
      </Button>
      <AlertDialogHelper
        title={GRAPH_ACTIONS_COPY.exportJsonTitle}
        description={GRAPH_ACTIONS_COPY.exportJsonDescription}
        func={handleExportJSON}
        disabled={isEmpty}
        trigger={
          <Button variant="secondary" disabled={isEmpty} className="w-full">
            <FileJson className="h-4 w-4" />
            Export
          </Button>
        }
      />
      <DialogHelper
        title={GRAPH_ACTIONS_COPY.importJsonTitle}
        description={GRAPH_ACTIONS_COPY.importJsonDescription}
        open={importOpen}
        setOpen={(open) => {
          setImportOpen(open)
          if (!open) {
            setImportError(null)
            setIsDragOverImport(false)
          }
        }}
        className="max-w-4xl"
        trigger={
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
        }
      >
        <div className="space-y-3">
          <div
            onDragOver={handleImportDragOver}
            onDragEnter={handleImportDragOver}
            onDragLeave={handleImportDragLeave}
            onDrop={handleImportDrop}
            onClick={() => importFileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                importFileInputRef.current?.click()
              }
            }}
            tabIndex={0}
            role="button"
            className={cn(
              "focus-visible:ring-primary flex h-32 cursor-pointer items-center justify-center rounded-md border border-dashed px-3 py-2 text-xs outline-none focus-visible:ring-2",
              isDragOverImport
                ? "border-primary bg-primary/10"
                : "border-border bg-muted/40"
            )}
          >
            Drag and drop a `.json` file here, or click to browse
          </div>
          <Input
            ref={importFileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />
          <Textarea
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value)
              if (importError) setImportError(null)
            }}
            placeholder="Paste JSON here..."
            className="h-56 resize-none"
          />
          {importError && (
            <div className="text-destructive text-xs">{importError}</div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setImportOpen(false)
                setImportError(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImportJSON} disabled={!importText.trim()}>
              Import
            </Button>
          </div>
        </div>
      </DialogHelper>
      <span className="sr-only" aria-live="polite">
        {shareStatus === "copied"
          ? "Share link copied"
          : shareStatus === "error"
            ? "Share link copy failed"
            : ""}
      </span>
    </div>
  )
}
