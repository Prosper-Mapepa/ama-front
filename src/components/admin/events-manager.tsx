"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Plus, Trash2, Calendar, Clock, MapPin, Loader2 } from "lucide-react"
import { adminApi, EventPayload } from "@/lib/api"
import { cn, resolveMediaUrl, mediaPathForApi } from "@/lib/utils"
import { toast } from "sonner"

type ManagedEvent = EventPayload & {
  id?: string
  clientId: string
  isSaving?: boolean
  isDeleting?: boolean
  isNew?: boolean
  pendingFile?: File | null
  previewUrl?: string | null
}

const emptyEvent = (): ManagedEvent => ({
  clientId: crypto.randomUUID(),
  title: "",
  date: "",
  time: "",
  location: "",
  description: "",
  category: "Workshop",
  spots: 0,
  isNew: true,
  imageUrl: undefined,
  pendingFile: null,
  previewUrl: null,
})

export function EventsManager() {
  const [events, setEvents] = useState<ManagedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasEvents = useMemo(() => events.length > 0, [events])
  const blobUrlRegistry = useRef<Set<string>>(new Set())
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024

  const revokePreview = (url?: string | null) => {
    if (url && url.startsWith("blob:") && blobUrlRegistry.current.has(url)) {
      URL.revokeObjectURL(url)
      blobUrlRegistry.current.delete(url)
    }
  }

  useEffect(() => {
    let alive = true
    adminApi
      .getEvents()
      .then((data) => {
        if (!alive) return
        if (typeof window !== "undefined") {
          console.groupCollapsed("[EventsManager] raw image URLs from backend")
          data.forEach((event) => {
            console.log(event.id ?? "(new)", event.imageUrl)
          })
          console.groupEnd()
        }
        setEvents(
          data.map((event) => ({
            ...event,
            imageUrl: resolveMediaUrl(event.imageUrl) ?? event.imageUrl ?? undefined,
            clientId: event.id ?? crypto.randomUUID(),
            isNew: false,
            pendingFile: null,
            previewUrl: resolveMediaUrl(event.imageUrl) ?? event.imageUrl ?? null,
          })),
        )
        setError(null)
      })
      .catch((err) => {
        if (!alive) return
        const message = err instanceof Error ? err.message : "Failed to load events"
        setError(message)
        toast.error("Unable to load events", { description: message })
      })
      .finally(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const registry = blobUrlRegistry.current
    return () => {
      registry.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url)
        }
      })
      registry.clear()
    }
  }, [])

  const addEvent = () => {
    setEvents((prev) => [...prev, emptyEvent()])
    toast.info("Draft event added")
  }

  const updateField = (clientId: string, field: keyof EventPayload, value: string) => {
    setEvents((prev) =>
      prev.map((item) => {
        if (item.clientId !== clientId) return item
        if (field === "spots") {
          const parsed = Number(value)
          return { ...item, spots: Number.isNaN(parsed) ? 0 : parsed }
        }
        return { ...item, [field]: value }
      }),
    )
  }

  const handleImageSelection = (clientId: string, files: FileList | null) => {
    const file = files?.[0] ?? null

    if (file && file.size > MAX_IMAGE_SIZE) {
      toast.error("Image too large", {
        description: "Please choose an image under 10MB.",
      })
      return
    }

    setEvents((prev) =>
      prev.map((item) => {
        if (item.clientId !== clientId) return item
        if (item.pendingFile && item.previewUrl) {
          revokePreview(item.previewUrl)
        }

        if (!file) {
          return {
            ...item,
            pendingFile: null,
            previewUrl: resolveMediaUrl(item.imageUrl) ?? item.imageUrl ?? null,
          }
        }

        const previewUrl = URL.createObjectURL(file)
        blobUrlRegistry.current.add(previewUrl)
        return {
          ...item,
          pendingFile: file,
          previewUrl,
        }
      }),
    )

    if (file) {
      toast.success("Event cover image ready", {
        description: `${file.name} selected`,
      })
    }
  }

  const handleClearImage = (clientId: string) => {
    setEvents((prev) =>
      prev.map((item) => {
        if (item.clientId !== clientId) return item
        if (item.pendingFile && item.previewUrl) {
          revokePreview(item.previewUrl)
        }
        return {
          ...item,
          pendingFile: null,
          previewUrl: null,
          imageUrl: undefined,
        }
      }),
    )
    toast.info("Event cover image removed")
  }

  const handleDelete = async (eventRecord: ManagedEvent) => {
    setEvents((prev) =>
      prev.map((item) => (item.clientId === eventRecord.clientId ? { ...item, isDeleting: true } : item)),
    )

    try {
      if (eventRecord.id) {
        await adminApi.deleteEvent(eventRecord.id)
      }
      setEvents((prev) => {
        const target = prev.find((item) => item.clientId === eventRecord.clientId)
        if (target?.pendingFile && target.previewUrl) {
          revokePreview(target.previewUrl)
        }
        return prev.filter((item) => item.clientId !== eventRecord.clientId)
      })
      toast.success("Event removed")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete event"
      setError(message)
      toast.error("Unable to delete event", { description: message })
      setEvents((prev) =>
        prev.map((item) =>
          item.clientId === eventRecord.clientId ? { ...item, isDeleting: false } : item,
        ),
      )
    }
  }

  const handleSave = async (eventRecord: ManagedEvent) => {
    setEvents((prev) =>
      prev.map((item) =>
        item.clientId === eventRecord.clientId ? { ...item, isSaving: true } : item,
      ),
    )

    try {
      let uploadedUrl: string | undefined
      let uploadedPath: string | undefined
      if (eventRecord.pendingFile) {
        const { url, path } = await adminApi.uploadImage(eventRecord.pendingFile)
        uploadedUrl = url
        uploadedPath = path
      }

      const shouldClearImage =
        !eventRecord.pendingFile &&
        (eventRecord.previewUrl === null || eventRecord.previewUrl === undefined) &&
        !eventRecord.imageUrl
      const existingResolved = resolveMediaUrl(eventRecord.imageUrl) ?? eventRecord.imageUrl ?? null
      const imageUrlValue =
        uploadedPath != null
          ? `/uploads/${uploadedPath}`
          : uploadedUrl ?? (shouldClearImage ? null : existingResolved)
      const imageUrlForApi = mediaPathForApi(imageUrlValue)

      if (eventRecord.pendingFile && eventRecord.previewUrl) {
        revokePreview(eventRecord.previewUrl)
      }

      let saved: EventPayload
      if (eventRecord.id) {
        saved = await adminApi.updateEvent(eventRecord.id, {
          title: eventRecord.title,
          date: eventRecord.date,
          time: eventRecord.time,
          location: eventRecord.location,
          description: eventRecord.description,
          category: eventRecord.category,
          spots: eventRecord.spots,
          imageUrl: imageUrlForApi,
        })
      } else {
        saved = await adminApi.createEvent({
          title: eventRecord.title,
          date: eventRecord.date,
          time: eventRecord.time,
          location: eventRecord.location,
          description: eventRecord.description,
          category: eventRecord.category,
          spots: eventRecord.spots,
          imageUrl: imageUrlForApi,
        })
      }

      setEvents((prev) =>
        prev.map((item) =>
          item.clientId === eventRecord.clientId
            ? {
                ...item,
                ...saved,
                imageUrl: resolveMediaUrl(saved.imageUrl) ?? saved.imageUrl ?? undefined,
                clientId: item.clientId,
                isNew: false,
                isSaving: false,
                pendingFile: null,
                previewUrl: resolveMediaUrl(saved.imageUrl) ?? saved.imageUrl ?? null,
              }
            : item,
        ),
      )
      setError(null)
      toast.success(eventRecord.id ? "Event updated" : "Event created")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save event"
      setError(message)
      toast.error("Unable to save event", { description: message })
      setEvents((prev) =>
        prev.map((item) =>
          item.clientId === eventRecord.clientId ? { ...item, isSaving: false } : item,
        ),
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Events Management</h2>
          <p className="text-muted-foreground">Add, edit, or remove events from your calendar</p>
        </div>
        <Button onClick={addEvent} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading events...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !hasEvents && (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center text-muted-foreground">
          No events published yet. Add your first event to get started.
        </div>
      )}

      {events.map((event) => (
        <Card key={event.clientId} className={cn("transition-opacity", event.isDeleting && "opacity-50")}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-foreground">{event.title || "New Event"}</CardTitle>
                <CardDescription>Configure event details</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(event)}
                disabled={event.isSaving || event.isDeleting}
                className="text-destructive hover:text-destructive"
              >
                {event.isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`title-${event.clientId}`} className="text-foreground">
                  Event Title
                </Label>
                <Input
                  id={`title-${event.clientId}`}
                  value={event.title}
                  onChange={(e) => updateField(event.clientId, "title", e.target.value)}
                  placeholder="Enter event title"
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`category-${event.clientId}`} className="text-foreground">
                  Category
                </Label>
                <Input
                  id={`category-${event.clientId}`}
                  value={event.category}
                  onChange={(e) => updateField(event.clientId, "category", e.target.value)}
                  placeholder="Workshop, Networking, etc."
                  className="bg-background text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Cover Image</Label>
              <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                {event.previewUrl ? (
                  <img
                    src={event.previewUrl}
                    alt={`${event.title || "Event"} cover preview`}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No image selected</div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleImageSelection(event.clientId, e.target.files)
                    e.target.value = ""
                  }}
                  className="max-w-xs bg-background text-foreground"
                />
                {event.previewUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleClearImage(event.clientId)}
                    disabled={event.isSaving || event.isDeleting}
                  >
                    Remove Image
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">PNG or JPG up to 10MB.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`date-${event.clientId}`} className="text-foreground">
                  <Calendar className="mr-1 inline h-4 w-4" />
                  Date
                </Label>
                <Input
                  id={`date-${event.clientId}`}
                  type="date"
                  value={event.date}
                  onChange={(e) => updateField(event.clientId, "date", e.target.value)}
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`time-${event.clientId}`} className="text-foreground">
                  <Clock className="mr-1 inline h-4 w-4" />
                  Time
                </Label>
                <Input
                  id={`time-${event.clientId}`}
                  value={event.time}
                  onChange={(e) => updateField(event.clientId, "time", e.target.value)}
                  placeholder="6:00 PM - 8:00 PM"
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`spots-${event.clientId}`} className="text-foreground">
                  Available Spots
                </Label>
                <Input
                  id={`spots-${event.clientId}`}
                  type="number"
                  min={0}
                  value={event.spots ?? 0}
                  onChange={(e) => updateField(event.clientId, "spots", e.target.value)}
                  placeholder="30"
                  className="bg-background text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`location-${event.clientId}`} className="text-foreground">
                <MapPin className="mr-1 inline h-4 w-4" />
                Location
              </Label>
              <Input
                id={`location-${event.clientId}`}
                value={event.location}
                onChange={(e) => updateField(event.clientId, "location", e.target.value)}
                placeholder="Park Library Room 301"
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`description-${event.clientId}`} className="text-foreground">
                Description
              </Label>
              <Textarea
                id={`description-${event.clientId}`}
                value={event.description}
                onChange={(e) => updateField(event.clientId, "description", e.target.value)}
                placeholder="Enter event description"
                rows={4}
                className="bg-background text-foreground"
              />
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => handleSave(event)}
              disabled={event.isSaving || event.isDeleting}
            >
              {event.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {event.id ? "Update Event" : "Save Event"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
