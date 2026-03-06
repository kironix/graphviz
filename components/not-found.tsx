"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

export function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <Image
          src="/not-found.webp"
          alt="Not Found"
          width={563}
          height={450}
          className="w-96 select-none"
          priority={true}
          draggable={false}
        />
        <p className="mt-3 px-4 text-center text-base md:px-0 md:text-lg">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className={buttonVariants({
            className: "mt-5 flex items-center gap-2 text-xs",
          })}
        >
          <ArrowLeft />
          Go home
        </Link>
      </div>
    </div>
  )
}
