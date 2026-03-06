"use client"

import * as React from "react"
import { Config } from "@/config"
import {
  buildShareUrl,
  DEFAULT_CONFIG,
  encodeGraphStateForShare,
  getSharedGraphFromUrl,
  graphStore,
  isShareableGraphState,
  type ShareableGraphState,
} from "@/utils"

import { useIsDesktop, useIsMobile } from "@/hooks/use-mobile"
import { DesktopLayout } from "@/components/pages/editor/layouts/desktop-layout"
import { MobileLayout } from "@/components/pages/editor/layouts/mobile-layout"
import { TabletLayout } from "@/components/pages/editor/layouts/tablet-layout"

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  )
}

function seedDefaultGraph() {
  const nodes = [
    { id: "0", label: "0", x: 180, y: 140, vx: 0, vy: 0, fixed: false },
    { id: "1", label: "1", x: 320, y: 120, vx: 0, vy: 0, fixed: false },
    { id: "2", label: "2", x: 470, y: 170, vx: 0, vy: 0, fixed: false },
    { id: "3", label: "3", x: 540, y: 300, vx: 0, vy: 0, fixed: false },
    { id: "4", label: "4", x: 470, y: 430, vx: 0, vy: 0, fixed: false },
    { id: "5", label: "5", x: 320, y: 480, vx: 0, vy: 0, fixed: false },
    { id: "6", label: "6", x: 180, y: 430, vx: 0, vy: 0, fixed: false },
    { id: "7", label: "7", x: 110, y: 300, vx: 0, vy: 0, fixed: false },
  ]
  const edges = [
    { source: "0", target: "1" },
    { source: "1", target: "2" },
    { source: "2", target: "3" },
    { source: "3", target: "4" },
    { source: "4", target: "5" },
    { source: "5", target: "6" },
    { source: "6", target: "7" },
    { source: "7", target: "0" },
    { source: "0", target: "4" },
    { source: "1", target: "5" },
    { source: "2", target: "6" },
    { source: "3", target: "7" },
  ]
  graphStore.setState({ nodes, edges })
}

export function GraphEditor() {
  const isMobile = useIsMobile()
  const isDesktop = useIsDesktop()
  const [leftOpen, setLeftOpen] = React.useState(false)
  const [rightOpen, setRightOpen] = React.useState(false)
  const [actionsOpen, setActionsOpen] = React.useState(false)

  const copyShareLink = React.useCallback(async () => {
    const state = graphStore.getState()
    const payload: ShareableGraphState = {
      nodes: state.nodes,
      edges: state.edges,
      direction: state.direction,
      indexMode: state.indexMode,
      config: state.config,
      customLabels: state.customLabels,
      ...(state.canvasSize.width > 0 && state.canvasSize.height > 0
        ? { canvasSize: state.canvasSize }
        : {}),
    }
    const encoded = encodeGraphStateForShare(payload)
    const shareUrl = buildShareUrl(window.location.href, encoded)

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl)
      return
    }
  }, [])

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let idleHandle: number | null = null
    let lastPersistedJson = ""
    const idleApi = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        opts?: { timeout: number }
      ) => number
      cancelIdleCallback?: (handle: number) => void
    }
    const clearIdlePersist = () => {
      if (idleHandle === null) return
      if (typeof idleApi.cancelIdleCallback === "function") {
        idleApi.cancelIdleCallback(idleHandle)
      } else {
        clearTimeout(idleHandle)
      }
      idleHandle = null
    }
    const runPersistWhenIdle = (cb: () => void) => {
      clearIdlePersist()
      if (typeof idleApi.requestIdleCallback === "function") {
        idleHandle = idleApi.requestIdleCallback(
          () => {
            idleHandle = null
            cb()
          },
          { timeout: 1000 }
        )
      } else {
        idleHandle = window.setTimeout(() => {
          idleHandle = null
          cb()
        }, 0)
      }
    }
    type PersistSlice = {
      nodes: ReturnType<typeof graphStore.getState>["nodes"]
      edges: ReturnType<typeof graphStore.getState>["edges"]
      direction: ReturnType<typeof graphStore.getState>["direction"]
      indexMode: ReturnType<typeof graphStore.getState>["indexMode"]
      config: ReturnType<typeof graphStore.getState>["config"]
      customLabels: ReturnType<typeof graphStore.getState>["customLabels"]
      canvasWidth: number
      canvasHeight: number
    }
    const readPersistSlice = (): PersistSlice => {
      const state = graphStore.getState()
      return {
        nodes: state.nodes,
        edges: state.edges,
        direction: state.direction,
        indexMode: state.indexMode,
        config: state.config,
        customLabels: state.customLabels,
        canvasWidth: state.canvasSize.width,
        canvasHeight: state.canvasSize.height,
      }
    }
    const isSamePersistSlice = (a: PersistSlice, b: PersistSlice) =>
      a.nodes === b.nodes &&
      a.edges === b.edges &&
      a.direction === b.direction &&
      a.indexMode === b.indexMode &&
      a.config === b.config &&
      a.customLabels === b.customLabels &&
      a.canvasWidth === b.canvasWidth &&
      a.canvasHeight === b.canvasHeight
    let lastObservedSlice = readPersistSlice()

    const persistNow = () => {
      const state = graphStore.getState()
      const payload: ShareableGraphState = {
        nodes: state.nodes,
        edges: state.edges,
        direction: state.direction,
        indexMode: state.indexMode,
        config: state.config,
        customLabels: state.customLabels,
        ...(state.canvasSize.width > 0 && state.canvasSize.height > 0
          ? { canvasSize: state.canvasSize }
          : {}),
      }
      const json = JSON.stringify(payload)
      if (json === lastPersistedJson) return
      localStorage.setItem(Config.keys.storageKey, json)
      lastPersistedJson = json
    }
    const schedulePersist = () => {
      const nextSlice = readPersistSlice()
      if (isSamePersistSlice(lastObservedSlice, nextSlice)) {
        return
      }
      lastObservedSlice = nextSlice
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        runPersistWhenIdle(persistNow)
      }, 500)
    }
    const flushPersist = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      clearIdlePersist()
      persistNow()
    }

    let restored = false
    let restoredFromShared = false
    try {
      const shared = getSharedGraphFromUrl(window.location.href)
      if (shared) {
        graphStore.setState({
          ...shared,
          config: { ...DEFAULT_CONFIG, ...shared.config },
          mode: "force",
        })
        restored = true
        restoredFromShared = true
      } else {
        const raw = localStorage.getItem(Config.keys.storageKey)
        if (raw) {
          const parsed = JSON.parse(raw) as unknown
          if (isShareableGraphState(parsed)) {
            graphStore.setState({
              ...parsed,
              config: { ...DEFAULT_CONFIG, ...parsed.config },
              mode: "force",
            })
            restored = true
          }
        }
      }
    } catch {
      restored = false
      restoredFromShared = false
    }

    const hasSavedGraph =
      graphStore.getState().nodes.length > 0 ||
      graphStore.getState().edges.length > 0

    if (!restored || (!hasSavedGraph && !restoredFromShared)) {
      seedDefaultGraph()
    }

    lastObservedSlice = readPersistSlice()
    persistNow()

    const unsubscribe = graphStore.subscribe(schedulePersist)
    window.addEventListener("pagehide", flushPersist)

    return () => {
      flushPersist()
      unsubscribe()
      window.removeEventListener("pagehide", flushPersist)
    }
  }, [])

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return

      const key = e.key.toLowerCase()
      const hasMeta = e.metaKey || e.ctrlKey

      if (hasMeta && key === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          graphStore.redo()
        } else {
          graphStore.undo()
        }
        return
      }

      if (hasMeta && e.shiftKey && key === "s") {
        e.preventDefault()
        void copyShareLink()
        return
      }

      if (hasMeta || e.altKey || e.shiftKey) return

      if (key === "v") {
        graphStore.setState({ mode: "force" })
      } else if (key === "d") {
        graphStore.setState({ mode: "draw" })
      } else if (key === "e") {
        graphStore.setState({ mode: "edit" })
      } else if (key === "x") {
        graphStore.setState({ mode: "delete" })
      } else if (key === "c") {
        graphStore.setState({ mode: "config" })
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [copyShareLink])

  if (isMobile === undefined || isDesktop === undefined) return null

  if (isMobile) {
    return (
      <MobileLayout
        leftOpen={leftOpen}
        setLeftOpen={setLeftOpen}
        rightOpen={rightOpen}
        setRightOpen={setRightOpen}
        actionsOpen={actionsOpen}
        setActionsOpen={setActionsOpen}
      />
    )
  }

  if (!isDesktop) {
    return <TabletLayout rightOpen={rightOpen} setRightOpen={setRightOpen} />
  }

  return <DesktopLayout />
}
