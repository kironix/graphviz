"use client"

import Link from "next/link"
import { Config } from "@/config"
import { ArrowUpRight, NetworkIcon } from "lucide-react"
import { motion } from "motion/react"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden pt-16 pb-0">
      <div className="bg-card border-border/45 relative w-full overflow-hidden border-y backdrop-blur-sm">
        <div className="from-primary/10 via-primary/5 to-primary/10 pointer-events-none absolute inset-0 bg-linear-to-r" />
        <div className="from-primary/15 pointer-events-none absolute -top-24 -left-28 h-72 w-72 rounded-full bg-radial to-transparent blur-3xl" />
        <div className="from-primary/15 pointer-events-none absolute -right-24 -bottom-28 h-72 w-72 rounded-full bg-radial to-transparent blur-3xl" />
        <div className="mx-auto w-full max-w-7xl px-6 py-6 sm:px-8 sm:py-8">
          <motion.div
            className="relative grid gap-10 md:grid-cols-2 md:items-start"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div>
              <div className="mb-4 inline-flex items-center gap-2.5">
                <span className="bg-primary/15 border-primary/30 flex h-10 w-10 items-center justify-center rounded-lg border">
                  <NetworkIcon className="text-primary size-5" />
                </span>
                <div>
                  <p className="font-bold tracking-tight sm:text-lg">
                    {Config.title}
                  </p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {Config.tagLine}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground max-w-md text-sm leading-relaxed sm:text-base">
                {Config.description}
              </p>
            </div>
            <div className="space-y-3 md:justify-self-end">
              <p className="text-xs font-semibold tracking-wider uppercase">
                Workspace
              </p>
              <Link
                href="/editor"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
              >
                Open Editor
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
          <motion.div
            className="border-border/45 text-muted-foreground relative mt-8 flex items-center justify-center gap-2 border-t pt-6 text-xs sm:text-sm"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{
              duration: 0.45,
              delay: 0.1,
              ease: [0.25, 0.4, 0.25, 1],
            }}
          >
            <p>
              &copy; {year}{" "}
              <span className="text-primary font-bold">{Config.title}</span>.
              All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
