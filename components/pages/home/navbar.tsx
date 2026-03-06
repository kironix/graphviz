"use client"

import * as React from "react"
import Link from "next/link"
import { Config } from "@/config"
import { Command, NetworkIcon, Play } from "lucide-react"
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
        "fixed top-0 right-0 left-0 z-50 px-4 pt-4 transition-all duration-300 sm:px-6",
        scrolled
          ? "backdrop-blur-sm"
          : "backdrop-blur-0"
      )}
    >
      <div
        className={cn(
          "border-border/60 mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-2xl border px-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition-all duration-300 sm:px-5",
          scrolled ? "bg-background/88" : "bg-background/72"
        )}
      >
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="bg-primary/15 border-primary/20 group-hover:bg-primary/25 flex h-9 w-9 items-center justify-center rounded-xl border transition-colors">
            <NetworkIcon className="text-primary size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight sm:text-lg">
                {Config.title}
              </span>
            </div>
            <p className="text-muted-foreground hidden text-xs sm:block">
              Local-first graph workspace
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-muted-foreground hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs lg:inline-flex">
            <Command className="size-3.5" />
            <span>Ready</span>
          </div>
          <Link
            href="/editor"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          >
            <Play className="size-3.5 fill-current" />
            <span className="hidden sm:inline">Open Editor</span>
          </Link>
          <ThemeSwitcher className="text-primary" />
        </div>
      </div>
    </motion.nav>
  )
}
