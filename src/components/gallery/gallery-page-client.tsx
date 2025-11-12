"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"

import type { GalleryItemPayload } from "@/lib/api"
import { cn, resolveMediaUrl } from "@/lib/utils"

type GalleryPageClientProps = {
  images: GalleryItemPayload[]
}

export function GalleryPageClient({ images }: GalleryPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const categories = useMemo(() => {
    const unique = new Set<string>()
    images.forEach((item) => {
      if (item.category) {
        unique.add(item.category)
      }
    })
    return ["All", ...Array.from(unique.values())]
  }, [images])

  const filteredImages = useMemo(() => {
    if (!images.length) return []
    if (selectedCategory === "All") return images
    return images.filter((item) => item.category === selectedCategory)
  }, [images, selectedCategory])

  const activeImage = selectedIndex !== null ? filteredImages[selectedIndex] : null

  return (
    <>
      {/* Category Filter */}
      <section className="sticky top-16 z-10 border-b border-border bg-background/95 backdrop-blur-lg px-4 py-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "rounded-full px-4 py-2 text-base font-medium transition-all duration-300",
                  selectedCategory === category
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg scale-105"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105",
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          {filteredImages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-16 text-center text-muted-foreground">
              No gallery items yet. Add photos in the admin dashboard to bring this page to life.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredImages.map((image, index) => (
                <div
                  key={image.id ?? `${image.url}-${index}`}
                  className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                  onClick={() => setSelectedIndex(index)}
                  style={{
                    animation: "fadeInUp 0.6s ease-out forwards",
                    animationDelay: `${index * 50}ms`,
                    opacity: 0,
                  }}
                >
                  <Image
                    src={resolveMediaUrl(image.url) ?? image.url ?? "/placeholder.svg"}
                    alt={image.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 translate-y-full p-4 transition-transform duration-300 group-hover:translate-y-0">
                    <p className="text-sm font-medium text-white text-balance">{image.title}</p>
                    {image.category ? <p className="text-xs text-white/80">{image.category}</p> : null}
                  </div>
                  {image.category ? (
                    <div className="absolute right-2 top-2 rounded-full bg-accent/90 px-3 py-1 text-xs font-medium text-accent-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {image.category}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {activeImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-110"
            onClick={() => setSelectedIndex(null)}
            aria-label="Close image preview"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-h-[90vh] max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <Image
              src={resolveMediaUrl(activeImage.url) ?? activeImage.url ?? "/placeholder.svg"}
              alt={activeImage.title}
              width={1200}
              height={800}
              className="h-auto w-auto max-h-[90vh] rounded-lg object-contain"
            />
            <div className="mt-4 text-center text-white">
              <p className="text-lg font-medium">{activeImage.title}</p>
              {activeImage.caption ? <p className="text-sm text-white/70">{activeImage.caption}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}

