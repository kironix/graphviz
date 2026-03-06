"use client"

import { InstallAppPrompt } from "@/components/install-app-prompt"
import { CTA } from "@/components/pages/home/cta"
import { DemoArea } from "@/components/pages/home/demo-area"
import { FeaturesSection } from "@/components/pages/home/features-section"
import { Footer } from "@/components/pages/home/footer"
import { HeroGraph } from "@/components/pages/home/hero-graph"
import { Navbar } from "@/components/pages/home/navbar"
import { ScrollToTop } from "@/components/pages/home/scroll-to-top"
import { ToolbarPreview } from "@/components/pages/home/toolbar-preview"

export function Home() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <HeroGraph />
      <ToolbarPreview />
      <FeaturesSection />
      <DemoArea />
      <CTA />
      <Footer />
      <InstallAppPrompt />
      <ScrollToTop />
    </div>
  )
}
