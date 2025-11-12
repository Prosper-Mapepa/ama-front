import "server-only"

import type {
  EventPayload,
  GalleryItemPayload,
  PageSectionPayload,
  SettingPayload,
  TeamMemberPayload,
} from "@/lib/api"
import { resolveMediaUrl } from "@/lib/utils"

const DEFAULT_API_BASE = "http://localhost:4000/api"
const API_BASE =
  process.env.API_BASE_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  DEFAULT_API_BASE

const DEFAULT_REVALIDATE_SECONDS = Number(process.env.CONTENT_REVALIDATE_SECONDS ?? "60")

type FetchConfig = {
  revalidate?: number
  tags?: string[]
}

function logFetchError(resource: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  console.warn(`[server-api] Failed to fetch ${resource}: ${message}`)
}

async function fetchApi<T>(path: string, config: FetchConfig = {}): Promise<T> {
  const revalidate =
    typeof config.revalidate === "number" && config.revalidate >= 0
      ? config.revalidate
      : DEFAULT_REVALIDATE_SECONDS
  const init: RequestInit & {
    next?: {
      revalidate: number
      tags?: string[]
    }
  } = {
    headers: {
      Accept: "application/json",
    },
  }

  if (revalidate === 0) {
    init.cache = "no-store"
  } else {
    init.next = {
      revalidate,
      ...(config.tags ? { tags: config.tags } : {}),
    }
  }

  const url = `${API_BASE}${path}`
  const response = await fetch(url, init)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request to ${url} failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

function normalizeSection(section: PageSectionPayload): PageSectionPayload {
  return {
    ...section,
    imageUrl: resolveMediaUrl(section.imageUrl) ?? section.imageUrl ?? undefined,
  }
}

function normalizeEvent(event: EventPayload): EventPayload {
  return {
    ...event,
    imageUrl: resolveMediaUrl(event.imageUrl) ?? event.imageUrl ?? undefined,
  }
}

function normalizeTeamMember(member: TeamMemberPayload): TeamMemberPayload {
  return {
    ...member,
    imageUrl: resolveMediaUrl(member.imageUrl) ?? member.imageUrl ?? undefined,
  }
}

function normalizeGalleryItem(item: GalleryItemPayload): GalleryItemPayload {
  return {
    ...item,
    url: resolveMediaUrl(item.url) ?? item.url,
  }
}

export async function getPageSections(page: "home" | "about", config?: FetchConfig) {
  try {
    const sections = await fetchApi<PageSectionPayload[]>(`/page-sections?page=${page}`, {
      tags: ["page-sections", page, ...(config?.tags ?? [])],
      revalidate: config?.revalidate,
    })
    return sections.map(normalizeSection)
  } catch (error) {
    logFetchError(`page sections for "${page}"`, error)
    return []
  }
}

export async function getEvents(config?: FetchConfig) {
  try {
    const events = await fetchApi<EventPayload[]>(`/events`, {
      tags: ["events", ...(config?.tags ?? [])],
      revalidate: config?.revalidate,
    })

    return events
      .map((event) => ({
        ...normalizeEvent(event),
        date: event.date,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date ?? "").getTime()
        const dateB = new Date(b.date ?? "").getTime()
        return dateA - dateB
      })
  } catch (error) {
    logFetchError("events", error)
    return []
  }
}

export async function getTeamMembers(config?: FetchConfig) {
  try {
    const members = await fetchApi<TeamMemberPayload[]>(`/team`, {
      tags: ["team", ...(config?.tags ?? [])],
      revalidate: config?.revalidate,
    })

    return members.map(normalizeTeamMember).sort((a, b) => {
      const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER
      const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER
      return orderA - orderB
    })
  } catch (error) {
    logFetchError("team members", error)
    return []
  }
}

export async function getGalleryItems(config?: FetchConfig) {
  try {
    const items = await fetchApi<GalleryItemPayload[]>(`/gallery`, {
      tags: ["gallery", ...(config?.tags ?? [])],
      revalidate: config?.revalidate,
    })

    return items.map(normalizeGalleryItem).sort((a, b) => {
      const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER
      const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER
      return orderA - orderB
    })
  } catch (error) {
    logFetchError("gallery items", error)
    return []
  }
}

export async function getSettings(config?: FetchConfig) {
  try {
    return await fetchApi<SettingPayload[]>(`/settings`, {
      tags: ["settings", ...(config?.tags ?? [])],
      revalidate: config?.revalidate,
    })
  } catch (error) {
    logFetchError("settings", error)
    return []
  }
}

export type ContactConfig = {
  email: string
  phone?: string
  officeHours?: string
  locationLines: string[]
}

export type SocialConfig = {
  instagram?: string
  linkedin?: string
  facebook?: string
  twitter?: string
  youtube?: string
  tiktok?: string
  website?: string
}

export type FooterConfig = {
  blurb: string
}

export type AdvisorConfig = {
  name?: string
  role?: string
  title?: string
  bio?: string
  email?: string
  office?: string
  imageUrl?: string
}

export type SiteConfig = {
  contact: ContactConfig
  socials: SocialConfig
  footer: FooterConfig
  advisor?: AdvisorConfig
}

const DEFAULT_SITE_CONFIG: SiteConfig = {
  contact: {
    email: "ama@cmich.edu",
    locationLines: ["Central Michigan University", "Mount Pleasant, MI 48859"],
    officeHours: "Monday - Friday · 9:00 AM - 5:00 PM EST",
  },
  socials: {
    instagram: "https://www.instagram.com",
    linkedin: "https://www.linkedin.com",
    facebook: "https://www.facebook.com",
  },
  footer: {
    blurb:
      "The American Marketing Association at Central Michigan University — empowering the next generation of marketing leaders through hands-on experience, mentorship, and community.",
  },
  advisor: undefined,
}

function coerceString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") {
    return value
  }
  return undefined
}

function coerceStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const cleaned = value.map((item) => coerceString(item)).filter(Boolean) as string[]
    if (cleaned.length > 0) {
      return cleaned
    }
  }

  if (typeof value === "string" && value.trim() !== "") {
    return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  }

  return undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

export async function getSiteConfig(config?: FetchConfig): Promise<SiteConfig> {
  const settings = await getSettings(config)
  const map = new Map<string, Record<string, unknown>>()

  settings.forEach((setting) => {
    const record = asRecord(setting.value)
    if (record) {
      map.set(setting.key, record)
    }
  })

  const contactValue = map.get("contact")
  const socialsValue = map.get("socials")
  const footerValue = map.get("footer")
  const advisorValue = map.get("advisor")

  const contact: ContactConfig = {
    email: coerceString(contactValue?.email) ?? DEFAULT_SITE_CONFIG.contact.email,
    phone: coerceString(contactValue?.phone),
    officeHours: coerceString(contactValue?.officeHours) ?? DEFAULT_SITE_CONFIG.contact.officeHours,
    locationLines: coerceStringArray(contactValue?.locationLines) ??
      coerceStringArray(contactValue?.location) ??
      DEFAULT_SITE_CONFIG.contact.locationLines,
  }

  const socials: SocialConfig = {
    instagram: coerceString(socialsValue?.instagram) ?? DEFAULT_SITE_CONFIG.socials.instagram,
    linkedin: coerceString(socialsValue?.linkedin) ?? DEFAULT_SITE_CONFIG.socials.linkedin,
    facebook: coerceString(socialsValue?.facebook) ?? DEFAULT_SITE_CONFIG.socials.facebook,
    twitter: coerceString(socialsValue?.twitter),
    youtube: coerceString(socialsValue?.youtube),
    tiktok: coerceString(socialsValue?.tiktok),
    website: coerceString(socialsValue?.website),
  }

  const footer: FooterConfig = {
    blurb: coerceString(footerValue?.blurb) ?? DEFAULT_SITE_CONFIG.footer.blurb,
  }

  const advisor: AdvisorConfig | undefined = advisorValue
    ? {
        name: coerceString(advisorValue.name),
        role: coerceString(advisorValue.role),
        title: coerceString(advisorValue.title),
        bio: coerceString(advisorValue.bio),
        email: coerceString(advisorValue.email),
        office: coerceString(advisorValue.office),
        imageUrl: resolveMediaUrl(coerceString(advisorValue.imageUrl)) ?? coerceString(advisorValue.imageUrl),
      }
    : undefined

  return {
    contact,
    socials,
    footer,
    advisor,
  }
}

