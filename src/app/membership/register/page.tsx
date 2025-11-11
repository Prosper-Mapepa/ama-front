import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { MembershipCheckoutForm } from "@/components/membership/membership-checkout-form"
import { Button } from "@/components/ui/button"
import type { MembershipPlan } from "@/lib/api"

type MembershipRegisterPageProps = {
  searchParams?: {
    plan?: string
  }
}

export default function MembershipRegisterPage({ searchParams }: MembershipRegisterPageProps) {
  const planParam = searchParams?.plan ?? ""
  const defaultPlan: MembershipPlan = planParam === "chapter" ? "chapter" : "chapter"

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 bg-gradient-to-b from-background via-background to-muted/30">
        <section className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-background px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="container mx-auto">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Membership checkout</div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Finalize your AMA CMU membership
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-foreground/75">
                  Complete the form below to secure your spot and unlock AMA experiences. No payment is collected on this
                  page—we&apos;ll send next steps right after you submit.
                </p>
              </div>
              <Button asChild variant="ghost" className="gap-2 text-sm text-foreground/80">
                <Link href="/membership">
                  <ArrowLeft className="h-4 w-4" />
                  Back to membership overview
                </Link>
              </Button>
            </div>

            <MembershipCheckoutForm defaultPlan={defaultPlan} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

