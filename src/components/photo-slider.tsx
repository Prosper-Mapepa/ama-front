"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface SliderImage {
  src: string
  alt: string
  caption?: string
}

interface PhotoSliderProps {
  images: SliderImage[]
  autoPlayInterval?: number
}

export function PhotoSlider({ images, autoPlayInterval = 5000 }: PhotoSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const nextSlide = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setTimeout(() => setIsAnimating(false), 500)
  }

  const prevSlide = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setTimeout(() => setIsAnimating(false), 500)
  }

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return
    setIsAnimating(true)
    setCurrentIndex(index)
    setTimeout(() => setIsAnimating(false), 500)
  }

  useEffect(() => {
    if (images.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, autoPlayInterval)
    return () => clearInterval(interval)
  }, [autoPlayInterval, images.length])

  return (
    <div className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5">
      {/* Main Slider */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {images.map((image, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-in-out",
              index === currentIndex
                ? "translate-x-0 opacity-100 scale-100"
                : index < currentIndex
                  ? "-translate-x-full opacity-0 scale-95"
                  : "translate-x-full opacity-0 scale-95",
            )}
          >
            <Image
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-lg font-semibold text-balance">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/90 text-primary opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 group-hover:opacity-100"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/90 text-primary opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 group-hover:opacity-100"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === currentIndex ? "w-8 bg-white shadow-lg" : "w-2 bg-white/50 hover:bg-white/75",
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
