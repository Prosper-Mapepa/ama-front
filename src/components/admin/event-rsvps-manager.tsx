"use client"

import { useEffect, useState } from "react"
import { Calendar, Loader2, MapPin, Users } from "lucide-react"

import { adminApi, type EventPayload, type EventRsvpPayload } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type LoadingState = "loading" | "idle" | "error"

export function EventRsvpsManager() {
  const [events, setEvents] = useState<EventPayload[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [rsvps, setRsvps] = useState<EventRsvpPayload[]>([])
  const [loadingEvents, setLoadingEvents] = useState<LoadingState>("loading")
  const [loadingRsvps, setLoadingRsvps] = useState<LoadingState>("idle")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadEvents()
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    void loadRsvps(selectedEventId)
  }, [selectedEventId])

  async function loadEvents() {
    setLoadingEvents("loading")
    setError(null)
    try {
      const data = await adminApi.getEvents()
      setEvents(data)
      setSelectedEventId((prev) => prev ?? data[0]?.id ?? null)
      setLoadingEvents("idle")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load events.")
      setLoadingEvents("error")
    }
  }

  async function loadRsvps(eventId: string) {
    setLoadingRsvps("loading")
    setError(null)
    try {
      const data = await adminApi.getEventRsvps(eventId)
      setRsvps(data)
      setLoadingRsvps("idle")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load RSVPs.")
      setLoadingRsvps("error")
    }
  }

  const selectedEvent = events.find((event) => event.id === selectedEventId)

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
      <Card className="h-fit border-border/60 bg-background/80 shadow-lg">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Events</h2>
              <p className="text-sm text-muted-foreground">Select an event to review RSVP submissions.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void loadEvents()}>
              Refresh
            </Button>
          </div>

          {loadingEvents === "loading" ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
              Loading events…
            </div>
          ) : loadingEvents === "error" ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-6 text-sm text-destructive">
              {error}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              No events have been published yet.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const isActive = event.id === selectedEventId
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEventId(event.id ?? null)}
                    className={[
                      "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                      isActive
                        ? "border-primary bg-primary/15 shadow-sm"
                        : "border-border/60 hover:border-primary/40 hover:bg-primary/10",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{event.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(event.date)}
                          </span>
                          {event.location ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {event.location}
                            </span>
                          ) : null}
                          {typeof event.spots === "number" && event.spots > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {event.spots} spots
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.rsvpCount ?? 0} RSVP
                        {event.rsvpCount === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-background/90 shadow-lg">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {selectedEvent ? selectedEvent.title : "Select an event"}
              </h2>
              {selectedEvent ? (
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedEvent.date)} · {selectedEvent.time || "Time TBA"}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Choose an event to view RSVP responses.</p>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              {rsvps.length} RSVP{rsvps.length === 1 ? "" : "s"}
            </Badge>
          </div>

          {loadingRsvps === "loading" ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
              Loading RSVPs…
            </div>
          ) : loadingRsvps === "error" ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-6 text-sm text-destructive">
              {error}
            </div>
          ) : selectedEvent ? (
            <>
              {rsvps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  No RSVPs submitted yet. Share the event link to start collecting responses.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Attendee</th>
                        <th className="px-4 py-3 text-left font-semibold">Guests</th>
                        <th className="px-4 py-3 text-left font-semibold">Notes</th>
                        <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rsvps.map((rsvp) => (
                        <tr key={rsvp.id} className="align-top transition hover:bg-muted/30">
                          <td className="px-4 py-4">
                            <div className="font-medium text-foreground">{rsvp.name}</div>
                            <div className="text-xs text-muted-foreground">{rsvp.email}</div>
                            {rsvp.phone ? (
                              <div className="text-xs text-muted-foreground">{rsvp.phone}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">{rsvp.guestCount}</td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {rsvp.notes ? (
                              <div className="max-w-xs rounded-lg bg-muted/70 p-2 text-xs text-muted-foreground">
                                {rsvp.notes}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/70">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-xs text-muted-foreground">
                            {rsvp.createdAt
                              ? new Date(rsvp.createdAt).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return "Date TBA"
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

