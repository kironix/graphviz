"use client"

import * as React from "react"
import { ChevronUpIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

export function ScrollToTop() {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 20 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          className="bg-primary text-primary-foreground fixed right-6 bottom-6 z-50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border shadow-lg transition-all duration-300 hover:shadow-xl sm:right-8 sm:bottom-8 sm:h-10 sm:w-10"
        >
          <motion.div
            initial={{ y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            <ChevronUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
