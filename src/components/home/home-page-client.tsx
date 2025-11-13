"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Award,
  Briefcase,
  Calendar,
  Handshake,
  Lightbulb,
  Linkedin,
  Mail,
  Megaphone,
  TrendingUp,
  Users,
} from "lucide-react"

import type { EventPayload, GalleryItemPayload, PageSectionPayload, TeamMemberPayload } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn, resolveMediaUrl } from "@/lib/utils"
import { UpcomingEvents } from "@/components/events/upcoming-events"
import cmuLogo from "../../../assets/cmulogo.png"
import amaLogo from "../../../assets/logo.png"

type HomePageClientProps = {
  sections: PageSectionPayload[]
  events: EventPayload[]
  galleryItems: GalleryItemPayload[]
  teamMembers: TeamMemberPayload[]
}

type ProcessedGalleryItem = {
  src: string
  alt: string
  caption: string
  isLocal: boolean
}

const benefitIcons = [Briefcase, Lightbulb, Users, TrendingUp, Award, Calendar]

const DEFAULT_HERO = {
  title: "Welcome to AMA CMU",
  heading: "Welcome to the American Marketing Association at Central Michigan University",
  description: [
    "The American Marketing Association (AMA) is one of the largest and most influential marketing organizations in the United States—headquartered in Chicago with a legacy of advancing marketing knowledge, practice, and leadership. With 30,000+ members, 76 professional chapters, and 250 collegiate chapters nationwide, AMA connects students and professionals to the highest levels of marketing education, industry trends, and career growth.",
    "After nearly a decade, AMA has been revitalized at Central Michigan University—re-establishing a dynamic platform for students to learn, grow, and engage with the marketing world inside and outside the classroom.",
  ],
}

const DEFAULT_MISSION =
  "To empower students to become innovative, industry-ready marketing leaders."

const DEFAULT_TEAM: TeamMemberPayload[] = [
  {
    id: "team-1",
    name: "Umme Aimen Khan",
    role: "President",
    major: "Marketing & Innovation",
    bio: "",
    email: "",
    linkedin: "",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
    displayOrder: 0,
  },
  {
    id: "team-2",
    name: "Sarah Mitchell",
    role: "Vice President",
    major: "Business Administration",
    bio: "",
    email: "",
    linkedin: "",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
    displayOrder: 1,
  },
  {
    id: "team-3",
    name: "Sydney Clark",
    role: "VP Membership",
    major: "Marketing & Communications",
    bio: "",
    email: "",
    linkedin: "",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    displayOrder: 2,
  },
  {
    id: "team-4",
    name: "Safwan Rahman",
    role: "Treasurer",
    major: "Finance & Marketing",
    bio: "",
    email: "",
    linkedin: "",
    imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80",
    displayOrder: 3,
  },
]

const DEFAULT_GALLERY: Array<GalleryItemPayload & { isLocal?: boolean }> = [
  {
    id: "placeholder-1",
    url: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1600&q=80",
    title: "Networking Conference",
    category: "Events",
    caption: "Building connections at our annual marketing conference",
  },
  {
    id: "placeholder-2",
    url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
    title: "Case Competition",
    category: "Competition",
    caption: "Our students presenting their winning case competition pitch",
  },
  {
    id: "placeholder-3",
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    title: "Community Impact",
    category: "Community",
    caption: "Giving back through community-focused marketing initiatives",
  },
]

const DEFAULT_EVENTS: EventPayload[] = [
  {
    id: "event-ama-kickoff",
    title: "AMA Kickoff Night",
    date: "2024-10-16",
    time: "6:00 PM - 8:00 PM",
    location: "Grawn Hall Atrium",
    description:
      "Celebrate the relaunch of AMA at CMU with interactive stations, giveaways, and a roadmap of fall programming.",
    category: "Kickoff",
    spots: 75,
    imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "event-ama-lazboy-comfort",
    title: "AMA × La-Z-Boy: Comfort Meets Strategy",
    date: "2024-11-13",
    time: "5:30 PM - 7:30 PM",
    location: "La-Z-Boy Innovation Center",
    description:
      "Behind-the-scenes collaboration with La-Z-Boy on storytelling through comfort, brand partnerships, and experiential marketing.",
    category: "Industry Trek",
    spots: 40,
    imageUrl: "https://images.unsplash.com/photo-1616628182501-cd3c5c39d4e5?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "event-ama-holiday-movie",
    title: "AMA Holiday Movie Night",
    date: "2024-11-24",
    time: "7:00 PM - 9:00 PM",
    location: "UC Auditorium",
    description:
      "Unwind with AMA friends over holiday classics, cozy snacks, and a giving-back spotlight before finals week.",
    category: "Community",
    spots: 120,
    imageUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1600&q=80",
  },
]

const DEFAULT_TESTIMONIALS = [
  {
    quote:
      "Joining AMA was the best decision I made in college. The networking opportunities and real-world experience prepared me for my career in ways classes alone never could.",
    initials: "SK",
    name: "Sarah Kim",
    title: "Marketing Major, Class of 2024",
  },
  {
    quote:
      "The hands-on projects and competitions gave me tangible work to showcase in interviews. I landed my dream job before graduation thanks to AMA!",
    initials: "MJ",
    name: "Michael Johnson",
    title: "Business Major, Class of 2023",
  },
  {
    quote:
      "More than just a club, AMA became my community. I made lifelong friends and connections that continue to support my career today.",
    initials: "EP",
    name: "Emily Parker",
    title: "Communications Major, Class of 2024",
  },
]

const DEFAULT_STATS = [
  { value: "30,000+", label: "AMA Members Nationwide" },
  { value: "250+", label: "Collegiate Chapters" },
  { value: "76", label: "Professional AMA Chapters" },
]


type GalleryCardProps = {
  item: ProcessedGalleryItem
  priority?: boolean
}

function GalleryCard({ item, priority }: GalleryCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(false)
    const timer = window.setTimeout(() => setIsLoaded(true), 30)
    return () => window.clearTimeout(timer)
  }, [item.src])

  return (
    <Link
      href="/gallery"
      className={cn(
        "group relative aspect-[4/3] overflow-hidden rounded-[36px] border border-border/40 bg-background/70 shadow-[0_25px_55px_-30px_rgba(15,15,15,0.4)] transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_35px_85px_-35px_rgba(15,15,15,0.45)]",
        "before:absolute before:inset-0 before:bg-gradient-to-tr before:from-primary/10 before:via-transparent before:to-accent/20 before:opacity-0 before:transition-opacity before:duration-500 group-hover:before:opacity-100",
      )}
    >
      <div className="relative h-full w-full overflow-hidden">
        <Image
          src={item.src}
          alt={item.alt}
          fill
          priority={priority}
          unoptimized
          className={cn(
            "object-cover transition duration-500 ease-out group-hover:scale-[1.02]",
            isLoaded ? "opacity-100" : "opacity-85 blur-sm",
          )}
          onLoadingComplete={() => setIsLoaded(true)}
        />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-500 ease-out",
            isLoaded ? "opacity-80" : "opacity-0",
          )}
        />
      </div>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-6 transition-all duration-400 ease-out group-hover:translate-y-[-3px]",
          isLoaded ? "opacity-100 translate-y-0" : "opacity-60 translate-y-1",
        )}
      >
        <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-4 text-left shadow-[0_18px_35px_-18px_rgba(0,0,0,0.7)] backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">{item.caption}</div>
          <div className="mt-1 text-sm text-white/85">{item.alt}</div>
        </div>
      </div>
    </Link>
  )
}

function HeroEventsSpotlight({
  isVisible,
  upcomingEvents,
  heroEventIndex,
  setHeroEventIndex,
}: {
  isVisible: boolean
  upcomingEvents: EventPayload[]
  heroEventIndex: number
  setHeroEventIndex: (index: number) => void
}) {
  if (!upcomingEvents.length) {
    return null
  }

  const activeEvent = upcomingEvents[heroEventIndex]
  const heroImage = activeEvent?.imageUrl ? resolveMediaUrl(activeEvent.imageUrl) : undefined

  const goTo = (index: number) => {
    const total = upcomingEvents.length
    const nextIndex = ((index % total) + total) % total
    setHeroEventIndex(nextIndex)
  }

  return (
    <div
      className={cn(
        "relative hidden w-full justify-center lg:flex",
        isVisible ? "translate-y-0 opacity-100 transition-all duration-1000 delay-200" : "translate-y-10 opacity-0",
      )}
    >
      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6">
        <div className="absolute inset-0 translate-y-[12%] rounded-[40px] bg-gradient-to-br from-primary/35 via-accent/25 to-transparent blur-[160px] opacity-70" />

        <div className="relative w-full overflow-hidden rounded-[44px] border border-[#f3c969] bg-gradient-to-br from-[#f9d976] via-[#f4bf3d] to-[#c47f1d] shadow-[0_55px_110px_-45px_rgba(196,127,29,0.5)] backdrop-blur-xl">
          <div className="relative">
            {heroImage ? (
              <div className="relative flex h-[320px] items-center justify-center overflow-hidden bg-[#5c1024]/85 sm:h-[340px] lg:h-[390px]">
                <Image
                  src={heroImage}
                  alt={activeEvent.title}
                  fill
                  unoptimized
                  className="object-contain transition-transform duration-700 ease-out"
                />
              </div>
            ) : (
              <div className="h-[320px] sm:h-[340px] lg:h-[360px] bg-gradient-to-br from-primary/55 via-accent/35 to-transparent" />
            )}

            <div className="absolute left-8 top-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fbe9a5] via-[#f4bf3d] to-[#c47f1d] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#3f2400] shadow-[0_18px_36px_-20px_rgba(0,0,0,0.45)] ring-1 ring-white/35 backdrop-blur">
              <span>Next Event</span>
              <span>· {String(heroEventIndex + 1).padStart(2, "0")}</span>
            </div>
          </div>

          <div className="px-5 pb-5 pt-3 sm:px-7 sm:pb-7 sm:pt-5">
            <div className="rounded-3xl border border-[#ffe7a8]/60 bg-[#fff2c9]/90 px-5 py-5 text-[#2d1c05] shadow-[0_28px_70px_-40px_rgba(0,0,0,0.4)] backdrop-blur">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f9d976]/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#3f2400]">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(activeEvent.date)}
              </div>

              <h3 className="text-[22px] font-semibold leading-tight text-[#2d1c05] sm:text-[24px]">
                {activeEvent.title}
              </h3>
              <p className="mt-1 text-xs text-[#4a3110]/85 sm:text-sm">
                {[activeEvent.time, activeEvent.location].filter(Boolean).join(" · ")}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#4a3110]/90 sm:text-[12px]">
                <span className="rounded-full border border-[#f7d47d]/70 bg-[#f7d47d]/40 px-2.5 py-1 uppercase tracking-[0.18em]">
                  {activeEvent.category}
                </span>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f4bf3d] px-3.5 py-1.5 text-xs font-semibold text-[#2d1c05] transition hover:bg-[#f2ad07]"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => goTo(heroEventIndex - 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/22 bg-white/12 text-white transition hover:border-white/35 hover:bg-white/20"
            aria-label="Previous event"
          >
            ‹
          </button>

          <div className="flex items-center gap-2">
            {upcomingEvents.map((event, index) => (
              <button
                key={event.id ?? `${event.title}-${index}`}
                type="button"
                onClick={() => goTo(index)}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  index === heroEventIndex ? "w-7 bg-white" : "w-3 bg-white/35 hover:bg-white/60",
                )}
                aria-label={`Show event ${event.title}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goTo(heroEventIndex + 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/22 bg-white/12 text-white transition hover:border-white/35 hover:bg-white/20"
            aria-label="Next event"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
const normalizedRoleKey = (role?: string | null) =>
  role
    ?.toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()

const ROLE_SUMMARIES: Record<string, string> = {
  president:
    "Leads AMA CMU’s strategic direction, partnerships, and campus presence while championing member growth and impact.",
  "vice president":
    "Drives chapter operations, board coordination, and execution so every initiative delivers value to members.",
  treasurer:
    "Oversees budgets, fundraising, and sponsorship outreach to keep AMA CMU financially strong and opportunity-ready.",
  "vp membership":
    "Designs recruitment, onboarding, and engagement experiences that help every member plug in and thrive.",
  "vp social media and marketing":
    "Builds AMA CMU’s brand voice, campaigns, and storytelling across digital channels to grow awareness and engagement.",
  "faculty advisor":
    "Provides guidance, mentorship, and university alignment to ensure AMA CMU scales with purpose and academic excellence.",
}

const summarizeBio = (bio?: string | null) => {
  if (!bio) return ""
  const sentences = bio
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)

  if (sentences.length === 0) {
    return bio.trim()
  }

  return sentences.slice(0, Math.min(2, sentences.length)).join(" ")
}

const getRoleSummary = (role?: string | null) => {
  if (!role) return ""
  const key = normalizedRoleKey(role)
  if (!key) return ""
  return ROLE_SUMMARIES[key] ?? ""
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return "TBA"
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return dateString
  }
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function HomePageClient({ sections, events, galleryItems, teamMembers }: HomePageClientProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => setIsVisible(true))

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in")
          }
        })
      },
      { threshold: 0.1 },
    )

    document.querySelectorAll(".fade-in-up").forEach((el) => observer.observe(el))

    return () => {
      window.cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [])

  const heroSection = sections[0]

  const heroDescriptionSource = heroSection?.description?.trim() ?? ""
  const hero = {
    title: heroSection?.title?.trim() || DEFAULT_HERO.title,
    heading: heroSection?.heading?.trim() || DEFAULT_HERO.heading,
    description:
      heroDescriptionSource.length > 0
        ? heroDescriptionSource.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)
        : DEFAULT_HERO.description,
    imageUrl: heroSection?.imageUrl?.trim(),
  }

  const highlightSections = sections.slice(1)
  const defaultBenefits = [
    {
      id: "default-benefit-0",
      icon: Users,
      title: "Network & Connections",
      description:
        "Build relationships with marketing professionals, industry leaders, recruiters, guest speakers, and fellow students nationwide.",
      displayOrder: 0,
    },
    {
      id: "default-benefit-1",
      icon: Lightbulb,
      title: "Develop Real Marketing Skills",
      description:
        "Gain hands-on experience in branding, market research, digital strategy, content creation, analytics, consumer insights, and more.",
      displayOrder: 1,
    },
    {
      id: "default-benefit-2",
      icon: TrendingUp,
      title: "Professional Growth",
      description:
        "Level up with workshops, resume building, mentorship, conferences, certifications, and speaker sessions that build confidence and professionalism.",
      displayOrder: 2,
    },
    {
      id: "default-benefit-3",
      icon: Briefcase,
      title: "Access to Opportunities",
      description:
        "Tap into internships, job leads, collaborative projects, company spotlights, and exclusive AMA student experiences across the marketing field.",
      displayOrder: 3,
    },
    {
      id: "default-benefit-4",
      icon: Award,
      title: "National AMA Network",
      description:
        "Connect with 30,000+ members across 250 collegiate chapters shaping the brands, products, and campaigns that impact the world.",
      displayOrder: 4,
    },
    {
      id: "default-benefit-5",
      icon: Calendar,
      title: "Events That Inspire",
      description:
        "Experience high-impact programs including conferences, competitions, company treks, and creative showcases led by AMA.",
      displayOrder: 5,
    },
  ] as Array<{
    id: string
    icon: typeof Users
    title: string
    description: string
    displayOrder: number
  }>

  const additionalBenefits = highlightSections.map((section, index) => {
    const Icon = benefitIcons[(defaultBenefits.length + index) % benefitIcons.length]
    return {
      id: section.id ?? `highlight-benefit-${index}`,
      icon: Icon,
      title: section.title || section.heading || "Program Highlight",
      description: section.description ?? "",
      displayOrder: section.displayOrder ?? defaultBenefits.length + index,
    }
  })

  const benefits = [...defaultBenefits, ...additionalBenefits].slice(0, 6)

  const curatedGallery: ProcessedGalleryItem[] = useMemo(() => {
    const source = galleryItems.length ? galleryItems : DEFAULT_GALLERY
    return source.map((item) => {
      const resolvedSrc = resolveMediaUrl(item.url) ?? item.url
      return {
        src: resolvedSrc,
        alt: item.title,
        caption: item.caption ?? item.title,
        isLocal: !!item.url && !/^https?:/i.test(item.url),
      }
    })
  }, [galleryItems])

  const featuredTeam = useMemo(() => {
    const source = teamMembers.length ? teamMembers : DEFAULT_TEAM
    return [...source]
      .filter((member) => member.name?.toLowerCase() !== "paris green")
      .sort((a, b) => {
        const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER
        const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER
        return orderA - orderB
      })
      .slice(0, 8)
  }, [teamMembers])

  const [galleryIndex, setGalleryIndex] = useState(0)

  useEffect(() => {
    if (curatedGallery.length <= 4) {
      return () => {}
    }

    const interval = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % curatedGallery.length)
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [curatedGallery.length])

  const upcomingEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const source = events.length ? events : DEFAULT_EVENTS

    return source
      .filter((event) => {
        const date = new Date(event.date)
        if (Number.isNaN(date.getTime())) return true
        date.setHours(0, 0, 0, 0)
        return date >= today
      })
      .slice(0, 3)
  }, [events])

  const heroHeadingParts = useMemo(() => hero.heading.split(/(CMU Chapter)/i), [hero.heading])

  const [heroEventIndex, setHeroEventIndex] = useState(0)

  useEffect(() => {
    if (!upcomingEvents.length) {
      setHeroEventIndex(0)
      return
    }
    setHeroEventIndex((prev) => Math.min(prev, upcomingEvents.length - 1))
    const interval = window.setInterval(() => {
      setHeroEventIndex((prev) => (prev + 1) % upcomingEvents.length)
    }, 6000)
    return () => window.clearInterval(interval)
  }, [upcomingEvents.length])

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8 lg:py-12">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: hero.imageUrl ? `url(${resolveMediaUrl(hero.imageUrl)})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.65)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,22,48,0.45),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(124,22,48,0.3),transparent_60%)] mix-blend-overlay opacity-80" />
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="pointer-events-none absolute -left-32 top-[-15%] h-[420px] w-[420px] rounded-full bg-accent/25 blur-[140px] opacity-70 animate-[pulse_10s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute right-[-18%] top-[20%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[180px] opacity-60 animate-[pulse_14s_ease-in-out_infinite]" />
        </div>

        <div className="container relative mx-auto">
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div
              className={cn(
                "relative max-w-2xl space-y-7 text-primary-foreground transition-all duration-1000",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
              )}
            >
              <div className="inline-flex items-center justify-center">
                <Image src={cmuLogo} alt="Central Michigan University" className="h-20 w-auto sm:h-24" priority />
              </div>

              <h1
                className={cn(
                  "text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl transition-all duration-1000 delay-100",
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
                )}
              >
                {heroHeadingParts.map((part, index) =>
                  part.toLowerCase() === "cmu chapter" ? (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-[var(--color-cmu-gold)] via-[var(--color-cmu-gold)] to-[var(--color-cmu-gold)] bg-clip-text text-transparent drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                    >
                      {part}
                    </span>
                  ) : (
                    <span key={index}>{part}</span>
                  ),
                )}
              </h1>

              <div className="space-y-4 text-primary-foreground/85 max-w-xl">
                {hero.description.map((paragraph, index) => (
                  <p
                    key={paragraph}
                    className={cn(
                      "text-lg leading-relaxed text-pretty sm:text-xl transition-all duration-1000",
                      isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
                    )}
                    style={{ transitionDelay: `${200 + index * 80}ms` }}
                  >
                    {paragraph}
                  </p>
                ))}

                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border border-primary/25 bg-black/30 p-4 text-primary-foreground shadow-[0_18px_45px_-30px_rgba(0,0,0,0.8)] transition-all duration-1000 backdrop-blur",
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
                  )}
                  style={{ transitionDelay: `${200 + hero.description.length * 80}ms` }}
                >
                  <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-cmu-gold)]">
                    Our Mission
                  </div>
                  <p className="mt-2 text-base leading-relaxed text-primary-foreground/80">{DEFAULT_MISSION}</p>
                </div>
              </div>

              <div
                className={cn(
                  "flex flex-col items-center gap-4 pt-1 sm:flex-row sm:items-stretch",
                  isVisible ? "translate-y-0 opacity-100 transition-all duration-1000 delay-300" : "translate-y-6 opacity-0",
                )}
              >
                <Button
                  size="lg"
                  className="group w-full gap-2 rounded-lg bg-[var(--color-cmu-gold)] px-7 py-3 text-base font-semibold text-black shadow-[0_20px_40px_-25px_rgba(0,0,0,0.6)] transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_30px_55px_-30px_rgba(0,0,0,0.65)] sm:w-auto hover:bg-[var(--color-cmu-gold)]/90"
                  asChild
                >
                  <Link href="membership/register">
                    Join AMA
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="group w-full border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground backdrop-blur-md transition-all duration-300 hover:translate-y-[-2px] hover:border-primary-foreground/70 hover:bg-primary-foreground/20 sm:w-auto hover:text-primary-foreground/80"
                >
                  <Link href="/events">
                    Explore Upcoming Events
                    <Calendar className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  </Link>
                </Button>
              </div>
            </div>

            <HeroEventsSpotlight
              isVisible={isVisible}
              upcomingEvents={upcomingEvents}
              heroEventIndex={heroEventIndex}
              setHeroEventIndex={setHeroEventIndex}
            />
          </div>
        </div>
      </section>

      {/* Sponsor CTA Section */}
      <section className="border-b border-border bg-gradient-to-br from-background via-muted/40 to-background px-4 py-14 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 shadow-[0_30px_60px_-45px_rgba(124,22,48,0.65)] backdrop-blur-md">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/80">
                  Sponsors
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Celebrate our partners & grow new sponsorships
                </h2>
                <p className="text-base leading-relaxed text-foreground/75 sm:text-base">
                  We spotlight the brands that invest in CMU AMA and cultivate new relationships that fuel student innovation. Select an option below to recognize current supporters or start a new partnership conversation.
                </p>
                <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-white/75 p-4 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.5)]">
                  <Image src={amaLogo} alt="American Marketing Association" className="h-10 w-auto sm:h-12" priority />
                  <div className="text-sm text-foreground/75 sm:text-base">
                    Official collegiate chapter of the
                    <Link
                      href="https://www.ama.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 font-semibold text-primary underline-offset-4 transition-colors duration-200 hover:text-primary/80 hover:underline"
                    >
                      American Marketing Association (ama.org)
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="group flex flex-col gap-3 rounded-2xl border border-transparent bg-white/80 p-5 shadow-[0_18px_35px_-28px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-primary/40 hover:shadow-[0_28px_60px_-35px_rgba(124,22,48,0.45)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Handshake className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Sponsor Recognition</h3>
                  <p className="text-base leading-relaxed text-foreground/70">
                    Submit logos, brand assets, or impact stories so we can highlight your organization across our channels and events.
                  </p>
                  <Button asChild variant="outline" className="mt-auto border-primary/40 text-primary hover:bg-primary/10">
                    <Link href="/contact?sponsor=recognition#form">Share Materials</Link>
                  </Button>
                </div>

                <div className="group flex flex-col gap-3 rounded-2xl border border-transparent bg-white/80 p-5 shadow-[0_18px_35px_-28px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-primary/40 hover:shadow-[0_28px_60px_-35px_rgba(124,22,48,0.45)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-cmu-gold)]/20 text-[var(--color-cmu-gold)]">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Sponsorship Acquisition</h3>
                  <p className="text-base leading-relaxed text-foreground/70">
                    Explore tailored sponsorship bundles, on-campus activations, and custom collaborations with our executive board.
                  </p>
                  <Button asChild className="mt-auto bg-[var(--color-cmu-gold)] text-black hover:bg-[var(--color-cmu-gold)]/90">
                    <Link href="/contact?sponsor=partnership#form">Schedule a Call</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border bg-gradient-to-br from-muted/50 to-muted/30 px-4 py-12 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid gap-8 md:grid-cols-3">
            {DEFAULT_STATS.map((stat, index) => (
              <div
                key={stat.label}
                className="fade-in-up group text-center opacity-0 transition-all duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-4xl font-bold text-transparent transition-transform duration-300 group-hover:scale-110">
                  {stat.value}
                </div>
                <div className="text-base font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Advantages */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="container mx-auto">
          <div className="fade-in-up mb-12 text-center opacity-0">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Strategic Advantages That Set Us Apart
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              We pair investor-grade execution with student ingenuity. These pillars keep industry partners, sponsors, and
              top recruiters coming back.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <Card
                  key={benefit.id}
                  className="fade-in-up group overflow-hidden border border-border/60 bg-background/80 opacity-0 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_60px_-30px_rgba(0,0,0,0.25)]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="flex h-full flex-col gap-5 p-7">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                      <Icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:rotate-12" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                      {benefit.title}
                    </h3>
                    <p className="text-base leading-relaxed text-foreground/80 group-hover:text-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Leadership Highlights */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="container mx-auto">
          <div className="fade-in-up mb-12 flex flex-col gap-4 opacity-0 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Meet Our Leadership Team
              </h2>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                A collaborative board of creatives, strategists, and builders guiding AMA CMU&apos;s relaunch and growth.
              </p>
            </div>
            <Button asChild variant="outline" className="self-start">
              <Link href="/about#team">
                View Our Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredTeam.map((member, index) => {
              const resolvedSrc = resolveMediaUrl(member.imageUrl) ?? "/placeholder.svg"

              return (
                <Card
                  key={member.id ?? `${member.name}-${index}`}
                  className="fade-in-up group overflow-hidden border border-border/70 bg-background/70 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.4)] opacity-0 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_70px_-35px_rgba(0,0,0,0.5)]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-64 w-full overflow-hidden bg-muted sm:h-72 lg:h-80">
                    <Image
                      src={resolvedSrc}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.12]"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                      unoptimized
                    />
                  </div>
                  <CardContent className="flex flex-col gap-3 pt-6">
                    <div>
                      <div className=" font-semibold uppercase tracking-[0.10em] text-primary/75">
                        {member.role}
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">{member.name}</h3>
                      {member.major ? <p className="text-sm text-foreground/80 font-medium">{member.major}</p> : null}
                    </div>
                    {summarizeBio(member.bio) || getRoleSummary(member.role) ? (
                      <p className="text-base leading-relaxed text-foreground/80 ">
                        {summarizeBio(member.bio) || getRoleSummary(member.role)}
                      </p>
                    ) : null}
                    <div className="flex gap-2 pt-3">
                      {member.email ? (
                        <Link
                          href={`mailto:${member.email}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                          aria-label={`Email ${member.name}`}
                        >
                          <Mail className="h-4 w-4" />
                        </Link>
                      ) : null}
                      {member.linkedin ? (
                        <Link
                          href={member.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                          aria-label={`LinkedIn profile for ${member.name}`}
                        >
                          <Linkedin className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Broken Grid Gallery */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24 bg-gradient-to-br from-background to-muted/30">
        <div className="container mx-auto">
          <div className="fade-in-up mb-12 text-center opacity-0">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Our Community in Action
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Experience the energy, passion, and connection that defines AMA at CMU. These moments capture our journey
              together.
            </p>
          </div>

          <div className="relative mx-auto max-w-6xl px-2 sm:px-4 lg:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-10">
              {[0, 1, 2, 3].map((offset, index) => {
                const item = curatedGallery[(galleryIndex + offset) % curatedGallery.length]

                return <GalleryCard key={`${item.src}-${index}`} item={item} priority={index === 0} />
              })}
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button
              asChild
              className="group bg-gradient-to-r from-primary to-accent text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <Link href="/gallery">
                View Full Gallery
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      <section className="border-y border-border bg-gradient-to-br from-muted/30 to-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="container mx-auto">
          <div className="fade-in-up mb-12 flex flex-col items-start justify-between gap-4 opacity-0 sm:flex-row sm:items-center">
            <div>
              <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Upcoming Events</h2>
              <p className="text-lg text-muted-foreground">
                Don’t miss out—reserve your spot and add these experiences to your calendar.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="group bg-transparent transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-lg"
            >
              <Link href="/events">
                View All Events
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <UpcomingEvents
            events={upcomingEvents.slice(0, 4).map((event) => ({
              ...event,
              imageUrl: event.imageUrl ? resolveMediaUrl(event.imageUrl) : undefined,
            }))}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl animate-float" />
        <div
          className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent/15 blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        />

        <div className="container relative mx-auto text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl text-balance">
            Become Part of a National Marketing Movement
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-primary-foreground/90 text-pretty">
            Joining AMA at CMU means you’re not just joining a student organization—you’re becoming part of a network of
            marketers who shape the brands, products, innovations, and campaigns that impact the world every day.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="group text-base w-full bg-gradient-to-r from-accent to-accent/90 text-accent-foreground transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-accent/50 sm:w-auto"
              asChild
            >
              <Link href="/membership">
                Join AMA · Learn · Network · Lead · Grow
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="group w-full text-base border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary-foreground/50 hover:bg-primary-foreground/20 sm:w-auto"
            >
              <Link href="/contact">
                Contact Us
                <Users className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

