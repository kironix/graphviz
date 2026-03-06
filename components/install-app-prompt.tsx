"use client"

import * as React from "react"
import { Config } from "@/config"
import { Download, Network, X } from "lucide-react"

import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt: () => Promise<void>
}

const STORAGE_KEY = Config.keys.installPrompt
const HIDE_DURATION_MS = Config.keys.hideDuration

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const isStandalone =
      (window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches) ||
      (window.navigator as any).standalone

    if (isStandalone) return

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const lastDismissed = Number(raw)
        if (!Number.isNaN(lastDismissed)) {
          const elapsed = Date.now() - lastDismissed
          if (elapsed < HIDE_DURATION_MS) {
            return
          }
        }
      }
    } catch {}

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      const bipEvent = event as BeforeInstallPromptEvent
      setDeferredPrompt(bipEvent)
      setIsVisible(true)
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    )

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      )
    }
  }, [])

  const hideBanner = React.useCallback(() => {
    setIsVisible(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch {}
  }, [])

  const handleInstallClick = React.useCallback(async () => {
    if (!deferredPrompt) {
      hideBanner()
      return
    }

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === "accepted") {
        hideBanner()
      } else {
        setIsVisible(false)
      }
    } catch {
      setIsVisible(false)
    } finally {
      setDeferredPrompt(null)
    }
  }, [deferredPrompt, hideBanner])

  if (!isVisible) return null

  return (
    <div className="pointer-events-none fixed top-4 right-4 left-4 z-50 sm:top-auto sm:bottom-4 sm:w-full sm:max-w-xs">
      <div className="border-border bg-background/95 text-foreground pointer-events-auto relative flex items-start gap-3 rounded-xl border p-3 shadow-lg backdrop-blur">
        <div className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Network className="size-4" />
        </div>
        <div className="min-w-0 flex-1 pr-7">
          <p className="text-sm font-medium">Install {Config.title}</p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            Add this app to your home screen for faster access.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="h-8 rounded-md px-3 text-xs"
            >
              <Download className="size-4" />
              Install
            </Button>
            <Button
              type="button"
              onClick={hideBanner}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
            >
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={hideBanner}
          aria-label="Close install app prompt"
          className="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-2.5 right-2.5 inline-flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
