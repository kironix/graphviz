"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NumberCounterProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

const REPEAT_START_DELAY_MS = 350
const REPEAT_INTERVAL_MS = 70

export function NumberCounter({
  value = 1,
  onChange,
  min = 1,
  max = 1000,
  className,
  step = 1,
  disabled = false,
}: NumberCounterProps) {
  const repeatTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const repeatIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(
    null
  )
  const valueRef = React.useRef(value)
  const minRef = React.useRef(min)
  const maxRef = React.useRef(max)
  const stepRef = React.useRef(step)
  const disabledRef = React.useRef(disabled)
  const onChangeRef = React.useRef(onChange)

  React.useEffect(() => {
    valueRef.current = value
    minRef.current = min
    maxRef.current = max
    stepRef.current = step
    disabledRef.current = disabled
    onChangeRef.current = onChange
  }, [value, min, max, step, disabled, onChange])

  const clearRepeat = React.useCallback(() => {
    if (repeatTimeoutRef.current) {
      clearTimeout(repeatTimeoutRef.current)
      repeatTimeoutRef.current = null
    }
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current)
      repeatIntervalRef.current = null
    }
  }, [])

  const applyDelta = React.useCallback((delta: number) => {
    if (disabledRef.current) return
    const baseStep =
      Number.isFinite(stepRef.current) && stepRef.current > 0
        ? stepRef.current
        : 1
    const signedStep = baseStep * (delta < 0 ? -1 : 1)
    const nextRaw = valueRef.current + signedStep
    const next = Math.min(maxRef.current, Math.max(minRef.current, nextRaw))
    if (next === valueRef.current) return
    valueRef.current = next
    onChangeRef.current(next)
  }, [])

  const startRepeat = React.useCallback(
    (delta: number) => {
      applyDelta(delta)
      clearRepeat()
      repeatTimeoutRef.current = setTimeout(() => {
        repeatIntervalRef.current = setInterval(() => {
          applyDelta(delta)
        }, REPEAT_INTERVAL_MS)
      }, REPEAT_START_DELAY_MS)
    },
    [applyDelta, clearRepeat]
  )

  React.useEffect(() => clearRepeat, [clearRepeat])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onPointerDown={(e) => {
          e.preventDefault()
          startRepeat(-1)
        }}
        onPointerUp={clearRepeat}
        onPointerLeave={clearRepeat}
        onPointerCancel={clearRepeat}
        onBlur={clearRepeat}
        onClick={(e) => {
          if (e.detail === 0) applyDelta(-1)
        }}
        disabled={disabled || value <= min}
        className="h-8 w-8 rounded-full p-0"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="border-input bg-background pointer-events-none flex h-8 min-w-[60px] items-center justify-center rounded-md border px-3 text-sm font-medium select-none">
        {value}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onPointerDown={(e) => {
          e.preventDefault()
          startRepeat(1)
        }}
        onPointerUp={clearRepeat}
        onPointerLeave={clearRepeat}
        onPointerCancel={clearRepeat}
        onBlur={clearRepeat}
        onClick={(e) => {
          if (e.detail === 0) applyDelta(1)
        }}
        disabled={disabled || value >= max}
        className="h-8 w-8 rounded-full p-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
