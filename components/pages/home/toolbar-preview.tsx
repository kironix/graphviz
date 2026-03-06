"use client"

import { HOME_TOOLBAR_PREVIEW_MODES } from "@/utils"
import { ArrowRight, Hash, LetterText } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { ScrollReveal } from "@/components/scroll-reveal"

export function ToolbarPreview() {
  return (
    <section className="px-6 py-24">
      <ScrollReveal className="relative z-10 mx-auto max-w-4xl">
        <h2 className="text-primary/70 mb-3 text-center text-sm font-medium tracking-widest uppercase">
          Toolbar
        </h2>
        <p className="text-muted-foreground mb-12 text-center text-sm">
          Switch between modes seamlessly
        </p>

        <div className="flex flex-col items-center gap-6">
          <motion.div
            className="bg-card border-border/50 inline-flex items-center gap-1 rounded-full border p-1.5 backdrop-blur-sm"
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {HOME_TOOLBAR_PREVIEW_MODES.map((mode, i) => (
              <motion.button
                key={mode.label}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-200",
                  mode.active
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <mode.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{mode.label}</span>
              </motion.button>
            ))}
          </motion.div>

          <ScrollReveal
            delay={0.3}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <div className="bg-card border-border/50 inline-flex items-center rounded-lg border p-1 text-xs">
              <span className="bg-primary/10 text-primary rounded-md px-3 py-1.5">
                Undirected
              </span>
              <span className="text-muted-foreground flex items-center gap-1 px-3 py-1.5">
                Directed <ArrowRight className="h-3 w-3" />
              </span>
            </div>

            <div className="bg-card border-border/50 inline-flex items-center rounded-lg border p-1 text-xs">
              <span className="bg-primary/10 text-primary flex items-center gap-1 rounded-md px-3 py-1.5">
                <Hash className="h-3 w-3" /> 0-Index
              </span>
              <span className="text-muted-foreground flex items-center gap-1 px-3 py-1.5">
                <LetterText className="h-3 w-3" /> Label
              </span>
            </div>
          </ScrollReveal>
        </div>
      </ScrollReveal>
    </section>
  )
}
