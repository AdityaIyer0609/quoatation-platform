import type {
  CustomerProfile,
  DashboardData,
  BomPreview,
  PricingPreview,
  Quote,
  QuoteListItem,
  QuoteSpecification,
} from "@/types/quote"
import { pricingOptionsFromSpec } from "@/services/pricing"

const SESSION_KEY = "quotecraft.session"
const TOKEN_KEY = "quotecraft.token"

export type Session = {
  email: string
  firstName: string
  lastName: string
  initials: string
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function authHeaders(json = false): Record<string, string> {
  const headers: Record<string, string> = {}
  if (json) headers["Content-Type"] = "application/json"
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => ({}))
  const detail = (body as { detail?: unknown }).detail
  if (typeof detail === "string") return detail
  return fallback
}

function mapApiQuote(body: Record<string, unknown>): Quote {
  const pricingSnap = (body.pricingSnapshot ?? null) as PricingPreview | null
  const pricing = (body.pricing ?? {}) as Quote["pricing"]
  return {
    id: String(body.id),
    number: String(body.number),
    status: body.status as Quote["status"],
    productName: String(body.productName),
    createdAt: String(body.createdAt),
    validUntil: String(body.validUntil ?? ""),
    leadTime: String(body.leadTime ?? ""),
    paymentTerms: String(body.paymentTerms ?? ""),
    requestedBy: String(body.requestedBy ?? ""),
    company: String(body.company ?? ""),
    specification: body.specification as QuoteSpecification,
    bomSnapshot: (body.bomSnapshot as BomPreview | null) ?? null,
    pricingSnapshot: pricingSnap,
    pricing: {
      currency: pricing.currency || "USD",
      unitPrice: pricing.unitPrice ?? null,
      quantity: pricing.quantity,
      totalAmount: pricing.totalAmount ?? null,
      totalKg: pricing.totalKg,
      requiresManualPricing:
        pricing.requiresManualPricing ?? pricingSnap?.requiresManualPricing ?? pricing.unitPrice == null,
    },
    timeline: (body.timeline as Quote["timeline"]) ?? [],
    versions: (body.versions as Quote["versions"]) ?? [],
  }
}

function sessionFromProfile(me: CustomerProfile & { initials?: string }): Session {
  return {
    email: me.email,
    firstName: me.firstName,
    lastName: me.lastName,
    initials: me.initials || `${me.firstName[0] ?? ""}${me.lastName[0] ?? ""}`.toUpperCase(),
  }
}

export const api = {
  async login(email: string, password: string) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      throw new Error(await readError(response, "Invalid email or password"))
    }
    const body = (await response.json()) as { access_token: string }
    localStorage.setItem(TOKEN_KEY, body.access_token)
    const meRes = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${body.access_token}` },
    })
    if (!meRes.ok) {
      throw new Error(await readError(meRes, "Could not load your profile."))
    }
    const me = (await meRes.json()) as CustomerProfile
    const session = sessionFromProfile(me)
    writeJson(SESSION_KEY, session)
    return session
  },

  async logout() {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(TOKEN_KEY)
  },

  getSession(): Session | null {
    return readJson<Session | null>(SESSION_KEY, null)
  },

  async requestPasswordReset(email: string) {
    const response = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not send the reset email."))
    }
    return { sent: true as const }
  },

  async getDashboard(): Promise<DashboardData> {
    const response = await fetch("/api/dashboard", { headers: authHeaders() })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not load the dashboard."))
    }
    return (await response.json()) as DashboardData
  },

  async getQuotes(): Promise<QuoteListItem[]> {
    const response = await fetch("/api/quotes", { headers: authHeaders() })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not load quotations."))
    }
    return (await response.json()) as QuoteListItem[]
  },

  async getQuote(id: string): Promise<Quote> {
    const response = await fetch(`/api/quotes/${id}`, { headers: authHeaders() })
    if (!response.ok) {
      throw new Error(await readError(response, "Quote not found"))
    }
    return mapApiQuote((await response.json()) as Record<string, unknown>)
  },

  async createQuote(spec: QuoteSpecification, _bomSnapshot?: BomPreview | null) {
    void _bomSnapshot
    const options = pricingOptionsFromSpec(spec)
    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ specification: spec, options }),
    })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not create the quotation."))
    }
    return mapApiQuote((await response.json()) as Record<string, unknown>)
  },

  async downloadPdf(id: string) {
    const response = await fetch(`/api/quotes/${id}/pdf`, { headers: authHeaders() })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not download the PDF."))
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const disposition = response.headers.get("Content-Disposition") ?? ""
    const match = disposition.match(/filename="([^"]+)"/)
    link.href = url
    link.download = match?.[1] || `quote-${id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },

  async sendQuoteEmail(id: string) {
    const response = await fetch(`/api/quotes/${id}/email`, {
      method: "POST",
      headers: authHeaders(true),
    })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not send the quotation email."))
    }
    return (await response.json()) as { sent: boolean }
  },

  async acceptQuote(id: string) {
    const response = await fetch(`/api/quotes/${id}/accept`, {
      method: "POST",
      headers: authHeaders(true),
    })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not accept this quotation."))
    }
    return mapApiQuote((await response.json()) as Record<string, unknown>)
  },

  async rejectQuote(id: string, message: string) {
    const response = await fetch(`/api/quotes/${id}/reject`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ message }),
    })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not reject this quotation."))
    }
    return mapApiQuote((await response.json()) as Record<string, unknown>)
  },

  async requestRevision(id: string, message: string) {
    const response = await fetch(`/api/quotes/${id}/revision`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ message }),
    })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not request a revision."))
    }
    return mapApiQuote((await response.json()) as Record<string, unknown>)
  },

  async getProfile(): Promise<CustomerProfile> {
    const response = await fetch("/api/profile", { headers: authHeaders() })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not load your profile."))
    }
    return (await response.json()) as CustomerProfile
  },

  async saveProfile(profile: CustomerProfile) {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        designation: profile.designation,
        company: profile.company,
        gst: profile.gst,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
        country: profile.country,
      }),
    })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not save your profile."))
    }
    const saved = (await response.json()) as CustomerProfile
    const session = this.getSession()
    if (session) {
      writeJson(SESSION_KEY, {
        ...session,
        firstName: saved.firstName,
        lastName: saved.lastName,
        email: saved.email,
        initials: saved.initials || `${saved.firstName[0]}${saved.lastName[0]}`.toUpperCase(),
      })
    }
    return saved
  },
}
