"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ThemeSwitcherProps {
  className?: string
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { setTheme, resolvedTheme } = useTheme()

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }, [resolvedTheme, setTheme])

  return (
    <Button
      variant="ghost"
      className="group/toggle h-8 w-8 px-0"
      onClick={toggleTheme}
      tooltip="Toggle theme"
      tooltipProps={{ side: "bottom" }}
    >
      <SunIcon className={cn("hidden [html.dark_&]:block", className)} />
      <MoonIcon className={cn("hidden [html.light_&]:block", className)} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
