import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ContactPageClient } from "@/components/contact/contact-page-client"
import { getSiteConfig } from "@/lib/server-api"

export default async function ContactPage() {
  const siteConfig = await getSiteConfig()

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <ContactPageClient contact={siteConfig.contact} socials={siteConfig.socials} />
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

