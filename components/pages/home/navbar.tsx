"use client"

import * as React from "react"
import Link from "next/link"
import { Config } from "@/config"
import { NetworkIcon, Play } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { ThemeSwitcher } from "@/components/theme-switcher"

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 right-0 left-0 z-50 px-4 transition-all duration-300 sm:px-6",
        scrolled
          ? "backdrop-blur-sm"
          : "backdrop-blur-0"
      )}
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
    >
      <div
        className={cn(
          "border-border/60 mx-auto flex h-15 w-full max-w-6xl items-center justify-between rounded-2xl border px-4 transition-all duration-300 sm:px-5",
          scrolled ? "bg-background/88" : "bg-background/72"
        )}
      >
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="bg-primary/12 border-primary/15 group-hover:bg-primary/18 flex h-9 w-9 items-center justify-center rounded-xl border transition-colors">
            <NetworkIcon className="text-primary size-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-base font-semibold tracking-tight sm:text-lg">
              {Config.title}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/editor"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
          >
            <Play className="size-3.5 fill-current" />
            <span>Open Editor</span>
          </Link>
          <ThemeSwitcher className="text-primary" />
        </div>
      </div>
    </motion.nav>
  )
}
