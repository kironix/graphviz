"use client"

import { Config } from "@/config"
import { useGraphStore } from "@/utils"
import { Network } from "lucide-react"

export function GraphEmptyState() {
  const { nodes } = useGraphStore()

  if (nodes.length > 0) return null

  return (
    <div className="bg-background/80 absolute inset-0 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
      <div className="bg-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <Network className="text-primary h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{Config.title}</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-lg">
        {Config.description}
      </p>
      <div className="text-muted-foreground mt-8 text-sm">
        Designed for local-first graph editing.
      </div>
    </div>
  )
}
