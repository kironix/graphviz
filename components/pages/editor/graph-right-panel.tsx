"use client"

import { EDITOR_MODE_INFO, useGraphStore } from "@/utils"

import { ConfigPanel } from "@/components/pages/editor/config-panel"

export function GraphRightPanel() {
  const { mode } = useGraphStore()
  const info = EDITOR_MODE_INFO[mode]

  return (
    <div className="flex min-h-0 flex-col">
      <div className="border-border min-h-0 flex-1 overflow-auto rounded-lg border p-4">
        <h3 className="text-foreground mb-3 text-base font-bold">
          {info.title}
        </h3>
        {mode === "config" ? (
          <ConfigPanel />
        ) : (
          <>
            <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
              {info.description}
            </p>
            <div className="text-muted-foreground text-sm">
              <p className="mb-2">Ways you can interact with the graph:</p>
              <ul className="list-disc space-y-1 pl-5">
                {info.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
