"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { ScrollReveal } from "@/components/scroll-reveal"

export function CTA() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-6 sm:px-8 sm:pb-8">
      <div className="from-primary/15 via-primary/5 to-primary/15 border-primary/25 relative overflow-hidden rounded-2xl border bg-linear-to-r p-6 sm:p-8">
        <div className="from-primary/20 absolute -top-16 -left-20 h-40 w-40 rounded-full bg-radial to-transparent blur-2xl" />
        <div className="from-primary/20 absolute -right-20 -bottom-16 h-40 w-40 rounded-full bg-radial to-transparent blur-2xl" />
        <ScrollReveal
          className="relative flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:justify-between"
          y={24}
        >
          <div className="max-w-xl">
            <p className="text-primary mb-2 text-xs font-semibold tracking-wider uppercase">
              Ready to build?
            </p>
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Bring your graph ideas to life.
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Start editing instantly with force simulation, smart controls, and
              export-ready output.
            </p>
          </div>
          <div className="flex w-full flex-col justify-center gap-2 sm:flex-row sm:justify-start lg:w-auto">
            <Link
              href="/editor"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Open Editor
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <div className="border-primary/30 text-muted-foreground bg-background/60 inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-medium">
              Built for offline graph work
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}
