import type { Metadata } from "next"
import { Config } from "@/config"

import { NotFound } from "@/components/not-found"

export function generateMetadata(): Metadata {
  return {
    title: `Not Found | ${Config.title}`,
    description:
      "Hey, this page does not exist. Please check the URL and try again.",
  }
}

export default function Page() {
  return <NotFound />
}
