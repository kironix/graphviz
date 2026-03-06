"use client"

import * as React from "react"
import Link from "next/link"
import type { HeroGraphEdge as Edge, HeroGraphNode as Node } from "@/types"
import { ArrowUpRight } from "lucide-react"
import { motion, useScroll, useTransform } from "motion/react"

import { useAnchorScroll } from "@/hooks/use-anchor-scroll"

export function HeroGraph() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const animRef = React.useRef<number>(0)
  const sectionRef = React.useRef<HTMLElement>(null)
  const { scrollToId } = useAnchorScroll()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const textY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    let w = canvas.offsetWidth
    let h = canvas.offsetHeight

    const nodes: Node[] = []
    const edges: Edge[] = []

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const newW = rect.width
      const newH = rect.height

      if (nodes.length > 0 && w > 0 && h > 0) {
        const scaleX = newW / w
        const scaleY = newH / h
        for (const node of nodes) {
          node.x *= scaleX
          node.y *= scaleY
        }
      }

      w = newW
      h = newH
    }
    resize()
    window.addEventListener("resize", resize)

    const nodeCount = 22
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: i,
        x: w * 0.1 + Math.random() * w * 0.8,
        y: h * 0.1 + Math.random() * h * 0.8,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: 3 + Math.random() * 5,
      })
    }

    for (let i = 0; i < nodeCount; i++) {
      const connections = 1 + Math.floor(Math.random() * 2)
      for (let c = 0; c < connections; c++) {
        const target = Math.floor(Math.random() * nodeCount)
        if (
          target !== i &&
          !edges.some(
            (e) =>
              (e.from === i && e.to === target) ||
              (e.from === target && e.to === i)
          )
        ) {
          edges.push({ from: i, to: target })
        }
      }
    }

    let time = 0
    const draw = () => {
      time += 0.004
      const cw = canvas.offsetWidth
      const ch = canvas.offsetHeight
      ctx.clearRect(0, 0, cw, ch)

      const styles = getComputedStyle(document.documentElement)
      const primaryRaw = styles.getPropertyValue("--primary").trim()

      const hslMatch = primaryRaw.match(/hsla?\(\s*([^)]+)\)/i)
      const oklchMatch = primaryRaw.match(/oklch\(\s*([^)]+)\)/i)

      const colorWithAlpha = (alpha: number): string => {
        if (hslMatch) {
          const body = hslMatch[1].trim().replace(/\s*,\s*/g, ", ")
          return `hsla(${body}, ${alpha})`
        }
        if (oklchMatch) {
          const body = oklchMatch[1].trim()
          return `oklch(${body} / ${alpha})`
        }
        return `hsla(210, 70%, 50%, ${alpha})`
      }

      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy
        if (node.x < 30 || node.x > cw - 30) node.vx *= -1
        if (node.y < 30 || node.y > ch - 30) node.vy *= -1
      }

      for (const edge of edges) {
        const a = nodes[edge.from]
        const b = nodes[edge.to]
        const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
        const alpha = 0.16 + Math.sin(time * 2 + edge.from) * 0.08
        gradient.addColorStop(0, colorWithAlpha(alpha))
        gradient.addColorStop(1, colorWithAlpha(alpha * 0.4))
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1
        ctx.stroke()
      }

      for (const node of nodes) {
        const pulse = 0.7 + Math.sin(time * 3 + node.id) * 0.3
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2)
        const glow = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.radius * 3
        )
        glow.addColorStop(0, colorWithAlpha(0.16 * pulse))
        glow.addColorStop(1, colorWithAlpha(0))
        ctx.fillStyle = glow
        ctx.fill()

        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = colorWithAlpha(0.6 + pulse * 0.4)
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
    >
      <motion.canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ opacity: 0.6, y: bgY }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,hsl(var(--background))_70%)]" />
      <motion.div
        className="relative z-10 max-w-3xl px-4 text-center"
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
        style={{ y: textY, opacity }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.25,
            ease: [0.25, 0.4, 0.25, 1],
          }}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="bg-primary/10 border-primary/20 text-primary mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
          >
            <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
            Interactive graph visualization tool
          </motion.div>
          <motion.h1
            className="from-foreground via-foreground to-muted-foreground mb-6 bg-linear-to-b bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-7xl"
            initial={{ y: 30 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.5 }}
          >
            Visualize Graphs,
            <br />
            <span className="text-primary">Beautifully</span>
          </motion.h1>
          <motion.p
            className="text-muted-foreground mx-auto max-w-xl text-base leading-relaxed sm:text-lg md:text-xl"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            Create, edit, and explore graph structures with force-directed
            layouts, real-time simulation, and instant export — all in your
            browser.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
            initial={{ y: 15 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
          >
            <Link
              href="/editor"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-center text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-sm sm:w-auto"
            >
              Open Editor
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => scrollToId("features")}
              className="border-primary/40 hover:bg-primary hover:text-primary-foreground text-primary bg-background/60 flex w-full items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors duration-300 sm:w-auto"
            >
              Learn More
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
      <motion.div className="absolute bottom-20 z-10" style={{ opacity }}>
        <div className="border-primary/70 flex h-8 w-5 justify-center rounded-full border-2">
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="bg-primary/70 mt-1.5 h-2 w-1 rounded-full"
          />
        </div>
      </motion.div>
    </section>
  )
}
