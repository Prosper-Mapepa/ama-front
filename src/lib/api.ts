const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api"

const ADMIN_TOKEN_STORAGE_KEY = "ama_admin_token"

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
}

export function setAdminToken(token: string | null) {
  if (typeof window === "undefined") return
  if (!token) {
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
  } else {
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? getAdminToken() : null

  const headers = new Headers(init?.headers ?? undefined)

  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      setAdminToken(null)
    }
    const text = await response.text()
    let message = text
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed?.message)) {
        message = parsed.message.join(", ")
      } else if (typeof parsed?.message === "string") {
        message = parsed.message
      }
    } catch {
      // ignore JSON parse errors and fall back to raw text
    }
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return response.json()
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const token = typeof window !== "undefined" ? getAdminToken() : null
  const headers = new Headers()
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Upload failed with status ${response.status}`)
  }

  return response.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
}

export type PageSectionPayload = {
  id?: string
  page: "home" | "about"
  title: string
  heading: string
  description?: string
  imageUrl?: string | null
  displayOrder?: number
}

export type EventPayload = {
  id?: string
  title: string
  date: string
  time: string
  location: string
  description: string
  category: string
  spots?: number
  imageUrl?: string | null
  rsvpCount?: number
}

export type TeamMemberPayload = {
  id?: string
  name: string
  role: string
  major?: string
  bio?: string
  email?: string
  linkedin?: string
  imageUrl?: string | null
  displayOrder?: number
}

export type GalleryItemPayload = {
  id?: string
  url: string
  title: string
  category: string
  caption?: string
  displayOrder?: number
}

export type SettingPayload = {
  key: string
  value: Record<string, unknown>
}

export type MembershipPlan = "chapter"

export type MembershipStatus = "pending" | "paid" | "cancelled"
export type MembershipPaymentMethod = "card" | "paypal" | "cash"

export type MembershipRegistration = {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  planType: MembershipPlan
  paymentMethod: MembershipPaymentMethod
  amount: number
  status?: MembershipStatus
  checkoutCompletedAt?: string | null
  transactionReference?: string | null
  notes?: string | null
  createdAt?: string
}

export type CreateMembershipInput = Pick<
  MembershipRegistration,
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "planType"
  | "paymentMethod"
  | "amount"
  | "notes"
  | "transactionReference"
>

export type EventRsvpPayload = {
  id?: string
  eventId: string
  name: string
  email: string
  phone?: string
  guestCount: number
  notes?: string | null
  createdAt?: string
}

export type CreateEventRsvpInput = Pick<EventRsvpPayload, "eventId" | "name" | "email" | "phone" | "guestCount" | "notes">

export type UploadResponse = {
  path: string
  url: string
  originalName: string
  size: number
  mimetype: string
}

export const adminApi = {
  async login(email: string, password: string) {
    return api.post<{ accessToken: string; user: { id: string; email: string; name?: string } }>(
      "/auth/login",
      { email, password },
    )
  },
  async uploadImage(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    return upload<UploadResponse>("/uploads", formData)
  },
  async getSections(page: "home" | "about") {
    return api.get<PageSectionPayload[]>(`/page-sections?page=${page}`)
  },
  async createSection(payload: PageSectionPayload) {
    return api.post<PageSectionPayload>("/page-sections", payload)
  },
  async updateSection(id: string, payload: Partial<PageSectionPayload>) {
    return api.patch<PageSectionPayload>(`/page-sections/${id}`, payload)
  },
  async deleteSection(id: string) {
    return api.delete<{ deleted: boolean }>(`/page-sections/${id}`)
  },
  async getEvents() {
    return api.get<EventPayload[]>("/events")
  },
  async createEvent(payload: EventPayload) {
    return api.post<EventPayload>("/events", payload)
  },
  async updateEvent(id: string, payload: Partial<EventPayload>) {
    return api.patch<EventPayload>(`/events/${id}`, payload)
  },
  async deleteEvent(id: string) {
    return api.delete<{ deleted: boolean }>(`/events/${id}`)
  },
  async getTeam() {
    return api.get<TeamMemberPayload[]>("/team")
  },
  async createTeamMember(payload: TeamMemberPayload) {
    return api.post<TeamMemberPayload>("/team", payload)
  },
  async updateTeamMember(id: string, payload: Partial<TeamMemberPayload>) {
    return api.patch<TeamMemberPayload>(`/team/${id}`, payload)
  },
  async deleteTeamMember(id: string) {
    return api.delete<{ deleted: boolean }>(`/team/${id}`)
  },
  async getGallery() {
    return api.get<GalleryItemPayload[]>("/gallery")
  },
  async createGalleryItem(payload: GalleryItemPayload) {
    return api.post<GalleryItemPayload>("/gallery", payload)
  },
  async updateGalleryItem(id: string, payload: Partial<GalleryItemPayload>) {
    return api.patch<GalleryItemPayload>(`/gallery/${id}`, payload)
  },
  async deleteGalleryItem(id: string) {
    return api.delete<{ deleted: boolean }>(`/gallery/${id}`)
  },
  async getSettings() {
    return api.get<SettingPayload[]>("/settings")
  },
  async upsertSetting(payload: SettingPayload) {
    return api.post<SettingPayload>("/settings", payload)
  },
  async deleteSetting(key: string) {
    return api.delete<{ deleted: boolean }>(`/settings/${key}`)
  },
  async getMemberships() {
    return api.get<MembershipRegistration[]>("/memberships")
  },
  async updateMembershipStatus(id: string, status: MembershipStatus, transactionReference?: string) {
    return api.patch<MembershipRegistration>(`/memberships/${id}/status`, {
      status,
      transactionReference,
    })
  },
  async getEventRsvps(eventId: string) {
    return api.get<EventRsvpPayload[]>(`/events/${eventId}/rsvps`)
  },
}

export function submitMembershipRegistration(payload: CreateMembershipInput) {
  return api.post<MembershipRegistration>("/memberships", payload)
}

export function submitEventRsvp(payload: CreateEventRsvpInput) {
  const { eventId, ...body } = payload
  return api.post<EventRsvpPayload>(`/events/${eventId}/rsvps`, body)
}

