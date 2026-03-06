"use client"

import * as React from "react"
import type { GraphRightPanelCommandItem } from "@/types"
import {
  GRAPH_CONFIG_COMMANDS,
  LARGE_GRAPH_NODE_THRESHOLD,
  useGraphStore,
} from "@/utils"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ColorPicker } from "@/components/color-picker"
import { NumberCounter } from "@/components/number-counter"

export function ConfigPanel() {
  const { config, actions, nodes } = useGraphStore()
  const isPerformanceMode = nodes.length >= LARGE_GRAPH_NODE_THRESHOLD

  const commands: GraphRightPanelCommandItem[] = React.useMemo(
    () =>
      GRAPH_CONFIG_COMMANDS.map((item) => ({
        key: item.key,
        name: item.name,
        description: item.description,
        command: () => {
          if (item.key === "fix-all") {
            actions.fixAllNodes()
            return
          }
          if (item.key === "unfix-all") {
            actions.unfixAllNodes()
            return
          }
          if (item.key === "arrange-layered") {
            actions.arrangeAsTree()
            return
          }
          if (item.key === "arrange-circular") {
            actions.arrangeCircular()
            return
          }
          actions.arrangeGrid()
        },
      })),
    [actions]
  )

  const handleRadiusChange = (nextValue: number) => {
    const clamped = Math.min(60, Math.max(10, nextValue))
    if (clamped === config.nodeRadius) return
    actions.setState({ config: { ...config, nodeRadius: clamped } })
  }

  const handleEdgeLenChange = (nextValue: number) => {
    const clamped = Math.min(300, Math.max(30, nextValue))
    if (clamped === config.edgeIdealLength) return
    actions.setState({ config: { ...config, edgeIdealLength: clamped } })
  }

  const handleNodeFontSizeChange = (nextValue: number) => {
    const clamped = Math.min(48, Math.max(8, nextValue))
    if (clamped === config.nodeLabelFontSize) return
    actions.setState({
      config: { ...config, nodeLabelFontSize: clamped },
    })
  }

  const handleEdgeFontSizeChange = (nextValue: number) => {
    const clamped = Math.min(48, Math.max(8, nextValue))
    if (clamped === config.edgeLabelFontSize) return
    actions.setState({
      config: { ...config, edgeLabelFontSize: clamped },
    })
  }

  const handleColorChange = (
    key: "nodeBackground" | "nodeColor" | "edgeColor" | "labelColor",
    nextColor: string
  ) => {
    const currentConfig = actions.getState().config
    const currentColor = currentConfig[key]
    if (
      typeof currentColor === "string" &&
      currentColor.toLowerCase() === nextColor.toLowerCase()
    ) {
      return
    }
    actions.setState({
      config: { ...currentConfig, [key]: nextColor },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Label className="text-muted-foreground min-w-0 text-xs leading-tight">
          Node Radius
        </Label>
        <NumberCounter
          value={config.nodeRadius}
          onChange={handleRadiusChange}
          min={10}
          max={50}
          step={1}
          className="justify-self-end"
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Label className="text-muted-foreground min-w-0 text-xs leading-tight">
          Edge Length
        </Label>
        <NumberCounter
          value={config.edgeIdealLength}
          onChange={handleEdgeLenChange}
          min={30}
          max={300}
          step={5}
          className="justify-self-end"
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Label className="text-muted-foreground min-w-0 text-xs leading-tight">
          Node Font Size
        </Label>
        <NumberCounter
          value={config.nodeLabelFontSize}
          onChange={handleNodeFontSizeChange}
          min={8}
          max={48}
          step={1}
          className="justify-self-end"
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Label className="text-muted-foreground min-w-0 text-xs leading-tight">
          Weight Label Font Size
        </Label>
        <NumberCounter
          value={config.edgeLabelFontSize}
          onChange={handleEdgeFontSizeChange}
          min={8}
          max={48}
          step={1}
          className="justify-self-end"
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Label className="text-muted-foreground min-w-0 text-xs leading-tight">
          Node Background
        </Label>
        <ColorPicker
          value={config.nodeBackground}
          onChange={(nextColor) =>
            handleColorChange("nodeBackground", nextColor)
          }
          className="justify-self-end"
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Label className="text-muted-foreground min-w-0 text-xs leading-tight">
          Node Color
        </Label>
        <ColorPicker
          value={config.nodeColor}
          onChange={(nextColor) => handleColorChange("nodeColor", nextColor)}
          className="justify-self-end"
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Label className="text-muted-foreground min-w-0 text-xs leading-tight">
          Edge Color
        </Label>
        <ColorPicker
          value={config.edgeColor}
          onChange={(nextColor) => handleColorChange("edgeColor", nextColor)}
          className="justify-self-end"
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Label className="text-muted-foreground min-w-0 text-xs leading-tight">
          Label Color
        </Label>
        <ColorPicker
          value={config.labelColor}
          onChange={(nextColor) => handleColorChange("labelColor", nextColor)}
          className="justify-self-end"
        />
      </div>

      <div className="border-border mt-2 border-t pt-3">
        <div className="text-muted-foreground mb-3 text-xs font-semibold">
          Run Command
        </div>
        {isPerformanceMode && (
          <div className="bg-muted text-muted-foreground mb-3 rounded-md px-2 py-1 text-[11px]">
            Performance mode active for large graph ({nodes.length} nodes)
          </div>
        )}
        <div className="flex flex-col gap-2">
          {commands.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-md border px-2 py-1.5"
              title={item.description}
            >
              <div className="min-w-0">
                <div className="text-muted-foreground text-xs">{item.name}</div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={item.command}
              >
                Run
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
