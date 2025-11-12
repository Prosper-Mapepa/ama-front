import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").trim()
const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim()

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

export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined

  const normalized = url.trim()
  if (normalized === "") return undefined

  if (normalized.startsWith("http")) {
    if (LOCALHOST_REGEX.test(normalized) && ASSET_ORIGIN) {
      return normalized.replace(LOCALHOST_REGEX, ASSET_ORIGIN)
    }
    return normalized
  }

  if (!ASSET_ORIGIN) return normalized

  if (normalized.startsWith("/")) {
    return `${ASSET_ORIGIN}${normalized}`
  }

  return `${ASSET_ORIGIN}/${normalized}`
}
