"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Plus, Trash2, Loader2 } from "lucide-react"
import { adminApi, PageSectionPayload } from "@/lib/api"
import { cn, resolveMediaUrl } from "@/lib/utils"
import { toast } from "sonner"

type ManagedSection = PageSectionPayload & {
  id?: string
  clientId: string
  isSaving?: boolean
  isDeleting?: boolean
  isNew?: boolean
  pendingFile?: File | null
  previewUrl?: string | null
}

type SectionEditableField = "title" | "heading" | "description" | "displayOrder"

interface ContentEditorProps {
  section: "home" | "about"
}

export function ContentEditor({ section }: ContentEditorProps) {
  const [sections, setSections] = useState<ManagedSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasSections = useMemo(() => sections.length > 0, [sections])
  const blobUrlRegistry = useRef<Set<string>>(new Set())
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024

  const revokePreview = (url?: string | null) => {
    if (url && url.startsWith("blob:") && blobUrlRegistry.current.has(url)) {
      URL.revokeObjectURL(url)
      blobUrlRegistry.current.delete(url)
    }
  }

  useEffect(() => {
    let isMounted = true
    adminApi
      .getSections(section)
      .then((data) => {
        if (!isMounted) return
        setSections(
          data.map((item) => ({
            ...item,
            imageUrl: resolveMediaUrl(item.imageUrl) ?? item.imageUrl ?? undefined,
            clientId: item.id ?? crypto.randomUUID(),
            isNew: false,
            pendingFile: null,
            previewUrl: resolveMediaUrl(item.imageUrl) ?? item.imageUrl ?? null,
          })),
        )
        setError(null)
      })
      .catch((err: Error) => {
        if (!isMounted) return
        const message = err.message || "Failed to load sections"
        setError(message)
        toast.error(`Unable to load ${section} sections`, {
          description: message,
        })
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [section])

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

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        clientId: crypto.randomUUID(),
        page: section,
        title: "New Section",
        heading: "",
        description: "",
        imageUrl: undefined,
        isNew: true,
        pendingFile: null,
        previewUrl: null,
      },
    ])
    toast.info("Draft section added")
  }

  const handleChange = (clientId: string, field: SectionEditableField, value: string) => {
    const parsedValue =
      field === "displayOrder" ? Number.isNaN(Number(value)) ? 0 : Number(value) : value
    setSections((prev) =>
      prev.map((item) =>
        item.clientId === clientId
          ? {
              ...item,
              [field]: parsedValue,
            }
          : item,
      ),
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

    setSections((prev) =>
      prev.map((item) => {
        if (item.clientId !== clientId) return item
        if (item.pendingFile && item.previewUrl) {
          revokePreview(item.previewUrl)
        }
        if (!file) {
          return {
            ...item,
            pendingFile: null,
            previewUrl: item.imageUrl ?? null,
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
      toast.success("Image ready", {
        description: `${file.name} selected`,
      })
    }
  }

  const handleClearImage = (clientId: string) => {
    setSections((prev) =>
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
    toast.info("Image removed from section")
  }

  const handleDelete = async (sectionId: string | undefined, clientId: string) => {
    setSections((prev) =>
      prev.map((item) => (item.clientId === clientId ? { ...item, isDeleting: true } : item)),
    )

    try {
      if (sectionId) {
        await adminApi.deleteSection(sectionId)
      }
      setSections((prev) => {
        const target = prev.find((item) => item.clientId === clientId)
        if (target?.pendingFile && target.previewUrl) {
          revokePreview(target.previewUrl)
        }
        return prev.filter((item) => item.clientId !== clientId)
      })
      toast.success("Section removed")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete section"
      setError(message)
      toast.error("Unable to delete section", { description: message })
      setSections((prev) =>
        prev.map((item) =>
          item.clientId === clientId ? { ...item, isDeleting: false } : item,
        ),
      )
    }
  }

  const handleSave = async (sectionData: ManagedSection) => {
    setSections((prev) =>
      prev.map((item) =>
        item.clientId === sectionData.clientId ? { ...item, isSaving: true } : item,
      ),
    )

    try {
      let uploadedUrl: string | undefined
      if (sectionData.pendingFile) {
        const { url } = await adminApi.uploadImage(sectionData.pendingFile)
        uploadedUrl = url
      }

      const shouldClearImage =
        !sectionData.pendingFile && (sectionData.previewUrl === null || sectionData.previewUrl === undefined) && !sectionData.imageUrl
      const imageUrlValue = uploadedUrl ?? (shouldClearImage ? null : sectionData.imageUrl ?? null)

      if (sectionData.pendingFile && sectionData.previewUrl) {
        revokePreview(sectionData.previewUrl)
      }

      if (sectionData.id) {
        const updated = await adminApi.updateSection(sectionData.id, {
          title: sectionData.title,
          heading: sectionData.heading,
          description: sectionData.description,
          imageUrl: imageUrlValue,
          displayOrder: sectionData.displayOrder,
        })
        setSections((prev) =>
          prev.map((item) =>
            item.clientId === sectionData.clientId
              ? {
                  ...item,
                  ...updated,
                  imageUrl: resolveMediaUrl(updated.imageUrl) ?? updated.imageUrl ?? undefined,
                  clientId: item.clientId,
                  isSaving: false,
                  isNew: false,
                  pendingFile: null,
                  previewUrl: resolveMediaUrl(updated.imageUrl) ?? updated.imageUrl ?? null,
                }
              : item,
          ),
        )
        toast.success("Section updated")
      } else {
        const created = await adminApi.createSection({
          page: section,
          title: sectionData.title,
          heading: sectionData.heading,
          description: sectionData.description,
          imageUrl: imageUrlValue,
          displayOrder: sectionData.displayOrder ?? sections.length,
        })
        setSections((prev) =>
          prev.map((item) =>
            item.clientId === sectionData.clientId
              ? {
                  ...item,
                  ...created,
                  imageUrl: resolveMediaUrl(created.imageUrl) ?? created.imageUrl ?? undefined,
                  clientId: item.clientId,
                  isSaving: false,
                  isNew: false,
                  pendingFile: null,
                  previewUrl: resolveMediaUrl(created.imageUrl) ?? created.imageUrl ?? null,
                }
              : item,
          ),
        )
        toast.success("Section created")
      }
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save section"
      setError(message)
      toast.error("Save failed", { description: message })
      setSections((prev) =>
        prev.map((item) =>
          item.clientId === sectionData.clientId
            ? { ...item, isSaving: false }
            : item,
        ),
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground capitalize">{section} Page Content</h2>
          <p className="text-muted-foreground">Edit text, images, and layout for the {section} page</p>
        </div>
        <Button onClick={addSection} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading sections...
        </div>
      )}

      {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}

      {!loading && !hasSections && (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center text-muted-foreground">
          No sections created yet. Start by adding a new section.
        </div>
      )}

      {sections.map((s) => (
        <Card key={s.clientId} className={cn("transition-opacity", s.isDeleting && "opacity-50")}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-foreground">{s.title || "New Section"}</CardTitle>
                <CardDescription>Configure this section&apos;s content</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(s.id, s.clientId)}
                disabled={s.isSaving || s.isDeleting}
                className="text-destructive hover:text-destructive"
              >
                {s.isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-2">
                <Label htmlFor={`title-${s.clientId}`} className="text-foreground">
                  Section Title
                </Label>
                <Input
                  id={`title-${s.clientId}`}
                  value={s.title}
                  onChange={(event) => handleChange(s.clientId, "title", event.target.value)}
                  placeholder="Hero Section"
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2 md:w-32">
                <Label htmlFor={`order-${s.clientId}`} className="text-foreground">
                  Display Order
                </Label>
                <Input
                  id={`order-${s.clientId}`}
                  type="number"
                  min={0}
                  value={s.displayOrder ?? 0}
                  onChange={(event) => handleChange(s.clientId, "displayOrder", event.target.value)}
                  className="bg-background text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`heading-${s.clientId}`} className="text-foreground">
                Heading
              </Label>
              <Input
                id={`heading-${s.clientId}`}
                value={s.heading}
                onChange={(event) => handleChange(s.clientId, "heading", event.target.value)}
                placeholder="Enter section heading"
                className="bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`description-${s.clientId}`} className="text-foreground">
                Description
              </Label>
              <Textarea
                id={`description-${s.clientId}`}
                value={s.description ?? ""}
                onChange={(event) => handleChange(s.clientId, "description", event.target.value)}
                placeholder="Enter section description"
                rows={4}
                className="bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`image-${s.clientId}`} className="text-foreground">
                Section Image
              </Label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-32 w-full overflow-hidden rounded-lg border border-dashed border-border bg-muted/50 sm:w-48">
                  {s.previewUrl || s.imageUrl ? (
                    <div
                      className="flex h-full w-full items-center justify-center bg-cover bg-center text-xs text-muted-foreground"
                      style={{ backgroundImage: `url(${s.previewUrl ?? s.imageUrl ?? ""})` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No image selected
                    </div>
                  )}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                  <Input
                    id={`image-${s.clientId}`}
                    type="file"
                    accept="image/*"
                    className="cursor-pointer bg-background text-foreground file:mr-4 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
                    disabled={s.isSaving || s.isDeleting}
                    onChange={(event) => {
                      handleImageSelection(s.clientId, event.target.files)
                      event.target.value = ""
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload JPG, PNG, or WEBP up to 10MB.
                  </p>
                  {(s.previewUrl ?? s.imageUrl) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleClearImage(s.clientId)}
                      disabled={s.isSaving || s.isDeleting}
                    >
                      Remove image
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => handleSave(s)}
              disabled={s.isSaving || s.isDeleting}
            >
              {s.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {s.id ? "Update Section" : "Save Section"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
