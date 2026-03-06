import { ThemeProvider } from "@/providers/theme-provider"

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
      <main>{children}</main>
    </ThemeProvider>
  )
}
