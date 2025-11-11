"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-6 text-6xl font-bold text-primary">404</div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Page Not Found
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-muted-foreground text-pretty">
            Sorry, we couldn’t find the page you’re looking for. It might have been moved or doesn’t exist.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

