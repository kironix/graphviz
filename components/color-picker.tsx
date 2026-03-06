"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { HexColorPicker } from "react-colorful"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ColorPickerProps {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

function ColorPicker({
  value = "#ffffff",
  onChange,
  disabled = false,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false)
  const { resolvedTheme } = useTheme()

  const resolvedHex = React.useMemo(() => {
    if (typeof window === "undefined") return "#000000"

    let resolved = value || "#000000"

    if (resolved.startsWith("var(")) {
      const varName = resolved.match(/var\(([^)]+)\)/)?.[1]
      if (varName) {
        resolved =
          getComputedStyle(document.documentElement)
            .getPropertyValue(varName)
            .trim() || resolved
      }
    }

    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return "#000000"

    ctx.fillStyle = "#000000"
    ctx.fillStyle = resolved
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    const toHex = (n: number) => n.toString(16).padStart(2, "0")
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }, [value, resolvedTheme])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "focus-visible:ring-ring bg-background relative inline-flex h-9 min-w-24 items-center gap-2 rounded-md border px-2 text-[11px] uppercase focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          disabled={disabled}
          aria-label={`Select color, current color is ${value}`}
        >
          <span
            className="h-5 w-5 rounded border shadow-sm"
            style={{ backgroundColor: value }}
          />
          <span className="text-foreground truncate font-semibold">
            {resolvedHex}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-3">
        <div className="flex flex-col gap-3">
          <HexColorPicker
            color={resolvedHex}
            onChange={(newColor) => {
              if (newColor.toLowerCase() === resolvedHex.toLowerCase()) return
              onChange?.(newColor)
            }}
          />
          <div className="text-foreground text-center text-[10px] uppercase">
            {resolvedHex}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

ColorPicker.displayName = "ColorPicker"

export { ColorPicker }
