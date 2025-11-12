import { ArrowRight, Linkedin, Mail } from "lucide-react"

import Image from "next/image"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getPageSections, getTeamMembers, getSiteConfig } from "@/lib/server-api"
import { resolveMediaUrl } from "@/lib/utils"
import Jeffrey from "../../../assets/jeffrey.jpg"

const DEFAULT_HERO = {
  title: "About AMA at CMU",
  heading: "Building the Next Generation of Marketing Leaders",
  description:
    "We are Central Michigan University’s premier marketing organization, preparing students with hands-on experience, mentorship, and a community of peers committed to excellence.",
}

const DEFAULT_ADVISOR = {
  name: "Faculty Advisor",
  role: "",
  title: "",
  bio: "",
  email: "",
  office: "",
  imageUrl: "",
}

export default async function AboutPage() {
  const [sections, teamMembers, siteConfig] = await Promise.all([
    getPageSections("about"),
    getTeamMembers(),
    getSiteConfig(),
  ])

  const heroSection = sections[0]
  const hero = {
    title: heroSection?.title?.trim() || DEFAULT_HERO.title,
    heading: heroSection?.heading?.trim() || DEFAULT_HERO.heading,
    description: heroSection?.description?.trim() || DEFAULT_HERO.description,
  }

  const contentSections = sections.slice(1)
  const leadership = teamMembers
  const advisor = siteConfig.advisor ?? DEFAULT_ADVISOR

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="container mx-auto">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground text-balance sm:text-5xl">
                {hero.heading}
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground text-pretty sm:text-xl">{hero.description}</p>
            </div>
          </div>
        </section>

        {/* Dynamic Sections */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="container mx-auto">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {hero.title || "Our Story"}
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Discover the pillars that make AMA at CMU a launchpad for marketing careers.
              </p>
            </div>

            {contentSections.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-16 text-center text-muted-foreground">
                No custom sections have been added for the About page yet. Use the admin dashboard to publish your story.
              </div>
            ) : (
              <div className="space-y-10">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {contentSections.map((section, index) => (
                    <Card
                      key={section.id ?? `about-section-${index}`}
                      className="overflow-hidden border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                    >
                      {section.imageUrl ? (
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          <Image
                            src={resolveMediaUrl(section.imageUrl) ?? section.imageUrl}
                            alt={section.title || section.heading}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      ) : null}
                      <CardContent className="pt-6">
                        <h3 className="mb-2 text-xl font-semibold text-foreground">
                          {section.heading || section.title}
                        </h3>
                        <p className="leading-relaxed text-base text-muted-foreground">{section.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="text-center mt-20">
                  <Button size="lg" className="rounded-full px-8 py-5 text-base font-semibold" asChild>
                    <Link href="/membership">
                      Become a Member
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Leadership & Team */}
        <section id="team" className="border-y border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="container mx-auto">
            <div className="mb-12 text-center">
              <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Meet the Team Behind AMA CMU
              </h2>
              <p className="text-lg text-muted-foreground">
                A collaborative board of strategists, storytellers, and builders driving our chapter forward.
              </p>
            </div>

            {leadership.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-12 text-center text-muted-foreground">
                Publish team members in the admin dashboard to highlight your leadership here.
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {leadership.map((member) => (
                  <Card
                    key={member.id ?? member.name}
                    className="group overflow-hidden border border-border/70 bg-background/80 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                      <Image
                        src={resolveMediaUrl(member.imageUrl) ?? member.imageUrl ?? "/placeholder.svg"}
                        alt={member.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>
                    <CardContent className="flex flex-col gap-4 pt-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                        <div className="text-sm font-medium uppercase tracking-[0.25em] text-primary/80">
                          {member.role}
                        </div>
                        {member.major ? (
                          <div className="mt-1 text-base text-muted-foreground">{member.major}</div>
                        ) : null}
                      </div>
                      {member.bio ? (
                        <p className="text-base leading-relaxed text-muted-foreground">{member.bio}</p>
                      ) : null}

                      <div className="flex gap-2">
                        {member.email ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-background/60 transition-all duration-300 hover:bg-background"
                            asChild
                          >
                            <a href={`mailto:${member.email}`} aria-label={`Email ${member.name}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                        {member.linkedin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-background/60 transition-all duration-300 hover:bg-background"
                            asChild
                          >
                            <a
                              href={member.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${member.name} on LinkedIn`}
                            >
                              <Linkedin className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

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

