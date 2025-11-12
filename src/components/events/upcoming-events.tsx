"use client"

import { useMemo, useState } from "react"
import { Calendar, Clock, MapPin, Users, ArrowRight, CheckCircle2 } from "lucide-react"

import type { EventPayload } from "@/lib/api"
import { submitEventRsvp } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { resolveMediaUrl } from "@/lib/utils"
type UpcomingEventsProps = {
  events: EventPayload[]
}

type RsvpFormValues = {
  name: string
  email: string
  phone: string
  guestCount: number
  notes: string
}

const DEFAULT_FORM: RsvpFormValues = {
  name: "",
  email: "",
  phone: "",
  guestCount: 1,
  notes: "",
}

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

function parseTimeComponent(date: Date, timeString?: string | null) {
  if (!timeString) return new Date(date.getTime())

  const match = timeString
    .trim()
    .match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i)

  if (!match) {
    return new Date(date.getTime())
  }

  const hours = Number.parseInt(match[1] ?? "0", 10)
  const minutes = Number.parseInt(match[2] ?? "0", 10)
  const meridiem = match[3]?.toUpperCase()

  const result = new Date(date.getTime())
  let resolvedHours = hours % 12
  if (meridiem === "PM") {
    resolvedHours += 12
  } else if (meridiem === undefined && hours === 12) {
    // treat 12 (no meridiem) as noon
    resolvedHours = 12
  }

  result.setHours(resolvedHours, minutes, 0, 0)
  return result
}

function resolveEventTimeRange(event: EventPayload) {
  const baseDate = new Date(event.date)
  if (Number.isNaN(baseDate.getTime())) {
    const fallbackStart = new Date()
    const fallbackEnd = new Date(fallbackStart.getTime() + 60 * 60 * 1000)
    return { start: fallbackStart, end: fallbackEnd }
  }

  const [startString, endString] = (event.time ?? "").split("-").map((part) => part.trim())
  const start = parseTimeComponent(baseDate, startString || event.time)
  let end = parseTimeComponent(baseDate, endString ?? "")

  if (end <= start) {
    end = new Date(start.getTime() + 60 * 60 * 1000)
  }

  return { start, end }
}

function formatDateAsCalendarString(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

function downloadIcsFile(event: EventPayload) {
  const { start, end } = resolveEventTimeRange(event)
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AMA CMU//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id ?? `${event.title}-${event.date}`}`,
    `DTSTAMP:${formatDateAsCalendarString(new Date())}`,
    `DTSTART:${formatDateAsCalendarString(start)}`,
    `DTEND:${formatDateAsCalendarString(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description?.replace(/\r?\n/g, "\\n") ?? ""}`,
    `LOCATION:${event.location ?? ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]

  const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const tempLink = document.createElement("a")
  tempLink.href = url
  tempLink.download = `${event.title.replace(/\s+/g, "-").toLowerCase()}.ics`
  tempLink.style.display = "none"
  document.body.appendChild(tempLink)
  tempLink.click()
  document.body.removeChild(tempLink)

  URL.revokeObjectURL(url)
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<RsvpFormValues>(DEFAULT_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successEventId, setSuccessEventId] = useState<string | null>(null)
  const [rsvpTotals, setRsvpTotals] = useState<Record<string, number>>(() =>
    events.reduce<Record<string, number>>((acc, event) => {
      if (event.id) {
        acc[event.id] = event.rsvpCount ?? 0
      }
      return acc
    }, {}),
  )

  const resetForm = () => {
    setFormValues(DEFAULT_FORM)
    setError(null)
  }

  const handleOpenForm = (eventId: string) => {
    if (activeEventId === eventId) {
      setActiveEventId(null)
      setError(null)
      return
    }
    setActiveEventId(eventId)
    setSuccessEventId(null)
    resetForm()
  }

  const handleSubmit = async (eventId: string) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      await submitEventRsvp({
        eventId,
        name: formValues.name,
        email: formValues.email,
        phone: formValues.phone || undefined,
        guestCount: formValues.guestCount,
        notes: formValues.notes || undefined,
      })
      setSuccessEventId(eventId)
      setRsvpTotals((prev) => ({
        ...prev,
        [eventId]: (prev[eventId] ?? 0) + formValues.guestCount,
      }))
      resetForm()
      setActiveEventId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t save your RSVP. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRsvpTotal = (eventId?: string) => {
    if (!eventId) {
      return 0
    }

    const stored = rsvpTotals[eventId]
    if (typeof stored === "number") {
      return stored
    }

    const matchingEvent = events.find((event) => event.id === eventId)
    return matchingEvent?.rsvpCount ?? 0
  }

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events],
  )

  if (sortedEvents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-16 text-center text-muted-foreground">
        No upcoming events have been scheduled yet. Check back soon or subscribe to our newsletter for updates.
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {sortedEvents.map((event) => {
        const eventId = event.id ?? event.title
        const resolvedImage = resolveMediaUrl(event.imageUrl) ?? event.imageUrl ?? undefined
        const isActive = activeEventId === eventId
        const isSuccess = successEventId === eventId
        const totalRsvps = getRsvpTotal(event.id)

        return (
          <Card
            key={eventId}
            className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            {resolvedImage ? (
              <div className="relative h-52 w-full overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvedImage}
                  alt={event.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              </div>
            ) : null}
            <CardContent className="space-y-5 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <Badge variant="secondary" className="shrink-0">
                  {event.category}
                </Badge>
                <div className="flex flex-col items-end gap-1 text-right text-sm text-foreground/70">
                  {typeof event.spots === "number" && event.spots > 0 ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Users className="h-3.5 w-3.5" />
                      {event.spots} spots
                    </span>
                  ) : null}
                  <span className="text-xs text-foreground/60">
                    {totalRsvps > 0 ? `${totalRsvps} RSVP${totalRsvps === 1 ? "" : "s"} confirmed` : "Be the first to RSVP"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                  {event.title}
                </h3>
                <div className="space-y-2 text-base text-foreground/70">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-primary" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  {event.time ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-primary" />
                      <span>{event.time}</span>
                    </div>
                  ) : null}
                  {event.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {event.description ? (
                <p className="leading-relaxed text-foreground/70 text-base">{event.description}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="flex-1 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                  onClick={() => handleOpenForm(eventId)}
                >
                  {isActive ? "Close RSVP" : "RSVP Now"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => downloadIcsFile(event)}
                >
                  Add to Calendar
                </Button>
              </div>

              {isActive ? (
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <div className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-foreground/70">
                    RSVP Details
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`name-${eventId}`}>Full name</Label>
                      <Input
                        id={`name-${eventId}`}
                        value={formValues.name}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="Taylor Jordan"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`email-${eventId}`}>Email</Label>
                      <Input
                        id={`email-${eventId}`}
                        type="email"
                        value={formValues.email}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))}
                        required
                        placeholder="you@cmich.edu"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`phone-${eventId}`}>Phone (optional)</Label>
                      <Input
                        id={`phone-${eventId}`}
                        value={formValues.phone}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="(989) 555-0123"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`guests-${eventId}`}>Guests</Label>
                      <Input
                        id={`guests-${eventId}`}
                        type="number"
                        min={1}
                        max={10}
                        value={formValues.guestCount}
                        onChange={(e) => {
                          const parsed = Number.parseInt(e.target.value ?? "1", 10)
                          const safeValue = Number.isNaN(parsed) ? 1 : Math.min(10, Math.max(1, parsed))
                          setFormValues((prev) => ({
                            ...prev,
                            guestCount: safeValue,
                          }))
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label htmlFor={`notes-${eventId}`}>Notes (optional)</Label>
                    <Textarea
                      id={`notes-${eventId}`}
                      rows={3}
                      value={formValues.notes}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any accessibility needs or questions?"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    {error ? <div className="text-sm text-destructive">{error}</div> : <span />}
                    <Button
                      type="button"
                      className="rounded-full px-6 py-2 text-sm font-semibold"
                      disabled={isSubmitting}
                      onClick={() => handleSubmit(eventId)}
                    >
                      {isSubmitting ? "Saving..." : "Confirm RSVP"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {isSuccess ? (
                <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  RSVP received! We just sent a confirmation email. See you at the event.
                </div>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

