import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { GalleryPageClient } from "@/components/gallery/gallery-page-client"
import { getGalleryItems, getSiteConfig } from "@/lib/server-api"

export default async function GalleryPage() {
  const [galleryItems, siteConfig] = await Promise.all([getGalleryItems(), getSiteConfig()])

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 px-4 py-20 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />

          <div className="container relative mx-auto text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl text-balance">
              Our Story in{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-accent via-accent/90 to-accent bg-clip-text text-transparent">
                  Pictures
                </span>
                <span className="absolute inset-0 bg-accent/20 blur-xl" />
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl leading-relaxed text-primary-foreground/90 text-pretty">
              Explore the moments that define our community — from competitions and workshops to networking events and
              celebrations.
            </p>
          </div>
        </section>

        <GalleryPageClient images={galleryItems} />
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

