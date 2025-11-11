import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { HomePageClient } from "@/components/home/home-page-client"
import { getEvents, getGalleryItems, getPageSections, getSiteConfig, getTeamMembers } from "@/lib/server-api"

export default async function HomePage() {
  const [sections, events, galleryItems, teamMembers, siteConfig] = await Promise.all([
    getPageSections("home"),
    getEvents(),
    getGalleryItems(),
    getTeamMembers(),
    getSiteConfig(),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <HomePageClient sections={sections} events={events} galleryItems={galleryItems} teamMembers={teamMembers} />
      <Footer
        aboutSummary={siteConfig.footer.blurb}
        contactEmail={siteConfig.contact.email}
        locationLines={siteConfig.contact.locationLines}
        socials={siteConfig.socials}
      />
    </div>
  )
}

