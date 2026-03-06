"use client"

import { HOME_FEATURES } from "@/utils"

import { ScrollReveal } from "@/components/scroll-reveal"

export function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden py-24">
      <div className="from-primary/10 via-primary/5 to-primary/10 pointer-events-none absolute inset-0 bg-linear-to-r" />
      <div className="from-primary/15 pointer-events-none absolute -top-24 -left-28 h-72 w-72 rounded-full bg-radial to-transparent blur-3xl" />
      <div className="from-primary/15 pointer-events-none absolute -right-24 -bottom-28 h-72 w-72 rounded-full bg-radial to-transparent blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-8">
        <ScrollReveal className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Everything you need
          </h2>
          <p className="text-muted-foreground mx-auto max-w-md">
            A complete toolkit for graph visualization and exploration.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_FEATURES.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 0.08}>
              <div className="group bg-card/50 border-border/40 hover:border-primary/20 relative h-full rounded-xl border p-6 transition-all duration-300 hover:shadow-sm">
                <div className="bg-primary/10 group-hover:bg-primary/15 mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                  <feature.icon className="text-primary h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
