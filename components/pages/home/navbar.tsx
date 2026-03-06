"use client"

import * as React from "react"
import Link from "next/link"
import { Config } from "@/config"
import { NetworkIcon } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { useAnchorScroll } from "@/hooks/use-anchor-scroll"
import { ThemeSwitcher } from "@/components/theme-switcher"

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)

  const { scrollToId } = useAnchorScroll()

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
        "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/70 shadow-sm backdrop-blur-xs"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          onClick={() => scrollToId("hero")}
          className="group flex items-center gap-2.5"
        >
          <div className="bg-primary/15 border-primary/20 group-hover:bg-primary/25 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors">
            <NetworkIcon className="text-primary size-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            {Config.title}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/editor"
            className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:border-primary/30 hidden rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:shadow-sm sm:block"
          >
            Open Editor
          </Link>
          <ThemeSwitcher className="text-primary" />
        </div>
      </div>
    </motion.nav>
  )
}
