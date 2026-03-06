import type { Metadata } from "next"
import localFont from "next/font/local"
import { Config } from "@/config"
import { Providers } from "@/providers"

import { cn } from "@/lib/utils"

import "@/styles/globals.css"

const raleway = localFont({
  src: [
    { path: "../public/fonts/Raleway-400.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Raleway-500.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/Raleway-600.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/Raleway-700.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      template: `%s | ${Config.title}`,
      absolute: `${Config.title} - ${Config.tagLine}`,
    },
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      shortcut: "/favicon-16x16.png",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(raleway.className, "antialiased")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
