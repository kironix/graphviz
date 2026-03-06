import { ThemeProvider } from "@/providers/theme-provider"

import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
    >
      <TooltipProvider>
        <main>{children}</main>
      </TooltipProvider>
    </ThemeProvider>
  )
}
