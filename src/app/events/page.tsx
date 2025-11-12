import Image from "next/image"
import { Calendar, Clock, MapPin, Users, ArrowRight } from "lucide-react"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getEvents, getSiteConfig } from "@/lib/server-api"
import { UpcomingEvents } from "@/components/events/upcoming-events"
import { resolveMediaUrl } from "@/lib/utils"

function formatDate(dateString: string | undefined) {
  if (!dateString) return "TBA"
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return dateString
  }
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function splitEvents() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (events: Awaited<ReturnType<typeof getEvents>>) => {
    const upcoming = []
    const past = []

    for (const event of events) {
      const eventDate = new Date(event.date)
      if (!Number.isNaN(eventDate.getTime()) && eventDate < today) {
        past.push(event)
      } else {
        upcoming.push(event)
      }
    }

    return {
      upcoming,
      past: past.reverse(), // show most recent first
    }
  }
}

export default async function EventsPage() {
  const [events, siteConfig] = await Promise.all([getEvents(), getSiteConfig()])
  const { upcoming, past } = splitEvents()(events)

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-br from-muted/50 to-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="container mx-auto">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Events & Activities
              </h1>
              <p className="text-lg leading-relaxed text-foreground/80 sm:text-xl">
                Join us for workshops, networking events, competitions, and social gatherings designed to enhance your
                marketing skills and expand your professional network.
              </p>
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="container mx-auto">
            <div className="mb-12">
              <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Upcoming Events</h2>
              <p className="text-lg text-foreground/70">
                Mark your calendar and don’t miss these exciting opportunities.
              </p>
            </div>

            <UpcomingEvents
              events={upcoming.map((event) => ({
                ...event,
                imageUrl: event.imageUrl ? resolveMediaUrl(event.imageUrl) : undefined,
              }))}
            />
          </div>
        </section>

        {/* Past Events */}
        <section className="border-y border-border bg-gradient-to-br from-muted/30 to-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="container mx-auto">
            <div className="mb-12">
              <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Past Highlights</h2>
              <p className="text-lg text-foreground/70">
                A look back at the experiences that shaped our chapter.
              </p>
            </div>

            {past.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-12 text-center text-muted-foreground">
                No past events recorded yet. Once events have concluded, they will appear here automatically.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {past.map((event) => {
                  const resolvedImage = event.imageUrl ? resolveMediaUrl(event.imageUrl) : undefined

                  return (
                    <Card
                      key={event.id}
                      className="overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                    >
                      {resolvedImage ? (
                        <div className="relative h-44 w-full overflow-hidden bg-muted">
                          <Image
                            src={resolvedImage}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                            sizes="(max-width: 1024px) 100vw, 400px"
                            unoptimized
                          />
                        </div>
                      ) : null}
                      <CardContent className="pt-6">
                        <div className="mb-3 inline-block rounded-full bg-gradient-to-r from-primary/15 to-primary/5 px-3 py-1 text-base font-medium text-primary">
                          {formatDate(event.date)}
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-foreground">{event.title}</h3>
                        <p className="text-sm text-foreground/70">{event.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl animate-float" />
          <div
            className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent/15 blur-3xl animate-float"
            style={{ animationDelay: "3s" }}
          />

          <div className="container relative mx-auto text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Don’t Miss Out on Our Events
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-primary-foreground/90">
              Become a member to get early access to event registrations, exclusive member-only events, and much more.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="group bg-gradient-to-r from-accent to-accent/90 text-accent-foreground transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                Join AMA Today
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground transition-all duration-300 hover:scale-105 hover:border-primary-foreground/50 hover:bg-primary-foreground/20"
              >
                Add to Calendar
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer
        aboutSummary={siteConfig.footer.blurb}
        contactEmail={siteConfig.contact.email}
        locationLines={siteConfig.contact.locationLines}
        socials={siteConfig.socials}
      />
    </div>
  )
}

