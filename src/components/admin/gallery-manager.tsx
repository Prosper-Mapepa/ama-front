"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Save, Plus, Trash2, Loader2 } from "lucide-react"
import { adminApi, GalleryItemPayload } from "@/lib/api"
import { cn, resolveMediaUrl, mediaPathForApi } from "@/lib/utils"
import { toast } from "sonner"

type ManagedImage = GalleryItemPayload & {
  id?: string
  clientId: string
  isSaving?: boolean
  isDeleting?: boolean
  isNew?: boolean
  pendingFile?: File | null
  previewUrl?: string | null
}

const categories = ["Events", "Competitions", "Networking", "Workshops", "Social", "Community Service"]

const createImage = (): ManagedImage => ({
  clientId: crypto.randomUUID(),
  url: "",
  title: "",
  category: categories[0],
  caption: "",
  displayOrder: 0,
  isNew: true,
  pendingFile: null,
  previewUrl: null,
})

export function GalleryManager() {
  const [images, setImages] = useState<ManagedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasImages = useMemo(() => images.length > 0, [images])
  const blobUrlRegistry = useRef<Set<string>>(new Set())
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024

  const revokePreview = (url?: string | null) => {
    if (url && url.startsWith("blob:") && blobUrlRegistry.current.has(url)) {
      URL.revokeObjectURL(url)
      blobUrlRegistry.current.delete(url)
    }
  }

  useEffect(() => {
    let mounted = true
    adminApi
      .getGallery()
      .then((data) => {
        if (!mounted) return
        if (typeof window !== "undefined") {
          console.groupCollapsed("[GalleryManager] raw image URLs from backend")
          data.forEach((item) => {
            console.log(item.id ?? "(new)", item.url)
          })
          console.groupEnd()
        }
        setImages(
          data.map((image) => {
            const normalized = resolveMediaUrl(image.url) ?? image.url ?? undefined
            return {
              ...image,
              url: normalized ?? "",
              clientId: image.id ?? crypto.randomUUID(),
              isNew: false,
              pendingFile: null,
              previewUrl: normalized ?? null,
            }
          }),
        )
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        const message = err instanceof Error ? err.message : "Failed to load gallery"
        setError(message)
        toast.error("Unable to load gallery", { description: message })
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
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

  const addImage = () => {
    setImages((prev) => [...prev, createImage()])
    toast.info("Draft gallery item added")
  }

  const updateField = (clientId: string, field: keyof GalleryItemPayload, value: string) => {
    setImages((prev) =>
      prev.map((image) => {
        if (image.clientId !== clientId) return image
        if (field === "displayOrder") {
          const parsed = Number(value)
          return { ...image, displayOrder: Number.isNaN(parsed) ? 0 : parsed }
        }
        return { ...image, [field]: value }
      }),
    )
  }

  const updateCategory = (clientId: string, category: string) => {
    setImages((prev) =>
      prev.map((image) =>
        image.clientId === clientId ? { ...image, category } : image,
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

    setImages((prev) =>
      prev.map((image) => {
        if (image.clientId !== clientId) return image
        if (image.pendingFile && image.previewUrl) {
          revokePreview(image.previewUrl)
        }
        if (!file) {
          const normalized = resolveMediaUrl(image.url) ?? image.url ?? null
          return {
            ...image,
            pendingFile: null,
            previewUrl: normalized,
          }
        }
        const previewUrl = URL.createObjectURL(file)
        blobUrlRegistry.current.add(previewUrl)
        return {
          ...image,
          pendingFile: file,
          previewUrl,
        }
      }),
    )

    if (file) {
      toast.success("Gallery image ready", {
        description: `${file.name} selected`,
      })
    }
  }

  const handleClearImage = (clientId: string) => {
    setImages((prev) =>
      prev.map((image) => {
        if (image.clientId !== clientId) return image
        if (image.pendingFile && image.previewUrl) {
          revokePreview(image.previewUrl)
        }
        return {
          ...image,
          pendingFile: null,
          previewUrl: null,
          url: "",
        }
      }),
    )
    toast.info("Gallery image removed")
  }

  const handleDelete = async (imageRecord: ManagedImage) => {
    setImages((prev) =>
      prev.map((image) =>
        image.clientId === imageRecord.clientId ? { ...image, isDeleting: true } : image,
      ),
    )

    try {
      if (imageRecord.id) {
        await adminApi.deleteGalleryItem(imageRecord.id)
      }
      setImages((prev) => {
        const target = prev.find((image) => image.clientId === imageRecord.clientId)
        if (target?.pendingFile && target.previewUrl) {
          revokePreview(target.previewUrl)
        }
        return prev.filter((image) => image.clientId !== imageRecord.clientId)
      })
      toast.success("Gallery item removed")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete image"
      setError(message)
      toast.error("Unable to delete image", { description: message })
      setImages((prev) =>
        prev.map((image) =>
          image.clientId === imageRecord.clientId ? { ...image, isDeleting: false } : image,
        ),
      )
    }
  }

  const handleSave = async (imageRecord: ManagedImage) => {
    setImages((prev) =>
      prev.map((image) =>
        image.clientId === imageRecord.clientId ? { ...image, isSaving: true } : image,
      ),
    )

    try {
      let uploadedUrl: string | undefined
      if (imageRecord.pendingFile) {
        const { url } = await adminApi.uploadImage(imageRecord.pendingFile)
        uploadedUrl = url
      }

      const shouldClearImage =
        !imageRecord.pendingFile &&
        (imageRecord.previewUrl === null || imageRecord.previewUrl === undefined) &&
        !imageRecord.url
      const normalizedExisting = resolveMediaUrl(imageRecord.url) ?? imageRecord.url ?? null
      const urlValue = uploadedUrl ?? (shouldClearImage ? null : normalizedExisting)
      const urlForApi =
        urlValue && urlValue.startsWith("http") ? urlValue : mediaPathForApi(urlValue ?? null)

      if (!urlValue) {
        throw new Error("Please upload an image before saving.")
      }

      if (!urlForApi) {
        throw new Error("Unable to resolve uploaded image URL.")
      }

      if (imageRecord.pendingFile && imageRecord.previewUrl) {
        revokePreview(imageRecord.previewUrl)
      }

      let saved: GalleryItemPayload
      if (imageRecord.id) {
        saved = await adminApi.updateGalleryItem(imageRecord.id, {
          url: urlForApi,
          title: imageRecord.title,
          category: imageRecord.category,
          caption: imageRecord.caption,
          displayOrder: imageRecord.displayOrder,
        })
      } else {
        saved = await adminApi.createGalleryItem({
          url: urlForApi,
          title: imageRecord.title,
          category: imageRecord.category,
          caption: imageRecord.caption,
          displayOrder: imageRecord.displayOrder ?? images.length,
        })
      }

      setImages((prev) =>
        prev.map((image) =>
          image.clientId === imageRecord.clientId
            ? {
                ...image,
                ...saved,
                url: resolveMediaUrl(saved.url) ?? saved.url ?? "",
                clientId: image.clientId,
                isNew: false,
                isSaving: false,
                pendingFile: null,
                previewUrl: resolveMediaUrl(saved.url) ?? saved.url ?? null,
              }
            : image,
        ),
      )
      setError(null)
      toast.success(imageRecord.id ? "Gallery item updated" : "Gallery item created")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save image"
      setError(message)
      toast.error("Unable to save image", { description: message })
      setImages((prev) =>
        prev.map((image) =>
          image.clientId === imageRecord.clientId ? { ...image, isSaving: false } : image,
        ),
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gallery Management</h2>
          <p className="text-muted-foreground">Add, edit, or remove images from your gallery</p>
        </div>
        <Button onClick={addImage} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Image
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading gallery...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !hasImages && (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center text-muted-foreground">
          No gallery items yet. Add visuals from your latest events.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <Card key={image.clientId} className={cn("transition-opacity", image.isDeleting && "opacity-50")}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm text-foreground">{image.title || "New Image"}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(image)}
                  disabled={image.isSaving || image.isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  {image.isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`file-${image.clientId}`} className="text-foreground">
                  Gallery Image
                </Label>
                <div className="relative aspect-video overflow-hidden rounded-lg border border-dashed border-border bg-muted/50">
                  {image.previewUrl || image.url ? (
                    <Image
                      src={image.previewUrl ?? image.url ?? "/placeholder.svg"}
                      alt={image.title ?? "Gallery image preview"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={image.previewUrl?.startsWith("blob:")}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No image selected
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    id={`file-${image.clientId}`}
                    type="file"
                    accept="image/*"
                    disabled={image.isSaving || image.isDeleting}
                    className="cursor-pointer bg-background text-foreground file:mr-4 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
                    onChange={(event) => {
                      handleImageSelection(image.clientId, event.target.files)
                      event.target.value = ""
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Upload JPG, PNG, or WEBP up to 10MB.</p>
                  {(image.previewUrl ?? image.url) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleClearImage(image.clientId)}
                      disabled={image.isSaving || image.isDeleting}
                    >
                      Remove image
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`title-${image.clientId}`} className="text-foreground">
                  Title
                </Label>
                <Input
                  id={`title-${image.clientId}`}
                  value={image.title}
                  onChange={(event) => updateField(image.clientId, "title", event.target.value)}
                  placeholder="Image title"
                  className="bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`caption-${image.clientId}`} className="text-foreground">
                  Caption
                </Label>
                <Input
                  id={`caption-${image.clientId}`}
                  value={image.caption ?? ""}
                  onChange={(event) => updateField(image.clientId, "caption", event.target.value)}
                  placeholder="Short caption"
                  className="bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Category</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge
                      key={cat}
                      variant={image.category === cat ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => updateCategory(image.clientId, cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`order-${image.clientId}`} className="text-foreground">
                  Display Order
                </Label>
                <Input
                  id={`order-${image.clientId}`}
                  type="number"
                  min={0}
                  value={image.displayOrder ?? 0}
                  onChange={(event) => updateField(image.clientId, "displayOrder", event.target.value)}
                  className="bg-background text-foreground"
                />
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => handleSave(image)}
                disabled={image.isSaving || image.isDeleting}
              >
                {image.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {image.id ? "Update Image" : "Save Image"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
