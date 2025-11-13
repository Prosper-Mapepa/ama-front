import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").trim()
const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim() ??
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim() ??
  process.env.MEDIA_BASE_URL?.trim()

const ASSET_ORIGIN = (() => {
  const base = ASSET_BASE || API_BASE
  try {
    const parsed = new URL(base)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return undefined
  }
})()

const LOCALHOST_REGEX = /^https?:\/\/localhost(?::\d+)?/

function collapseUploadSegments(value: string): string {
  return value.replace(/\/uploads\/(?:uploads\/)+/g, "/uploads/")
}

function ensureLeadingSlash(path: string): string {
  if (path.startsWith("/")) return path
  return `/${path}`
}

export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined

  const normalized = collapseUploadSegments(url.trim())
  if (normalized === "") return undefined

  if (normalized.startsWith("http")) {
    if (LOCALHOST_REGEX.test(normalized) && ASSET_ORIGIN) {
      return collapseUploadSegments(normalized.replace(LOCALHOST_REGEX, ASSET_ORIGIN))
    }
    return normalized
  }

  if (!ASSET_ORIGIN) return collapseUploadSegments(normalized)

  const relative = normalized.startsWith("/") ? normalized : `/${normalized}`
  return collapseUploadSegments(`${ASSET_ORIGIN}${relative}`)
}

export function mediaPathForApi(url?: string | null): string | null {
  if (url == null) return null
  const trimmed = collapseUploadSegments(url.trim())
  if (trimmed === "") return null

  try {
    const parsed = new URL(trimmed)
    if (ASSET_ORIGIN && parsed.origin === ASSET_ORIGIN) {
      return collapseUploadSegments(ensureLeadingSlash(parsed.pathname))
    }
    if (LOCALHOST_REGEX.test(trimmed)) {
      return collapseUploadSegments(ensureLeadingSlash(parsed.pathname))
    }
  } catch {
    // not an absolute URL, fall through
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed)
      return collapseUploadSegments(ensureLeadingSlash(parsed.pathname))
    } catch {
      // ignore parse errors and fall through
    }
  }

  return collapseUploadSegments(ensureLeadingSlash(trimmed))
}
