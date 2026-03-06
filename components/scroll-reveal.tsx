"use client"

import * as React from "react"
import { motion, useScroll, useTransform } from "motion/react"

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  y = 40,
}: Props) {
  const ref = React.useRef(null)
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function useParallax(offset = 50) {
  const ref = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLDivElement>,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset])
  return { ref, y }
}
