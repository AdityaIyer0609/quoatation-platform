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

export type StaffRole = "sales_executive" | "sales_manager" | "pricing_manager" | "admin"
export type SessionKind = "customer" | "staff"

export type Session = {
  email: string
  firstName: string
  lastName: string
  initials: string
  kind: SessionKind
  role: StaffRole | "customer"
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

const AUTH_EXPIRED_EVENT = "quotecraft.auth-expired"

function readToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token || token === "undefined" || token === "null") return null
  return token
}

function clearAuthStorage() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

function authHeaders(json = false): Record<string, string> {
  const headers: Record<string, string> = {}
  if (json) headers["Content-Type"] = "application/json"
  const token = readToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function request(input: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init)
  if (response.status === 401 && !input.includes("/api/auth/login")) {
    clearAuthStorage()
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
  }
  return response
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
    currentVersion: typeof body.currentVersion === "number" ? body.currentVersion : undefined,
    customerId: body.customerId != null ? String(body.customerId) : undefined,
  }
}

function sessionFromProfile(me: CustomerProfile & { initials?: string; kind?: string; role?: string }): Session {
  return {
    email: me.email,
    firstName: me.firstName,
    lastName: me.lastName,
    initials: me.initials || `${me.firstName[0] ?? ""}${me.lastName[0] ?? ""}`.toUpperCase(),
    kind: me.kind === "staff" ? "staff" : "customer",
    role: (me.role as Session["role"]) || "customer",
  }
}

export const api = {
  async login(email: string, password: string) {
    const response = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      throw new Error(await readError(response, "Invalid email or password"))
    }
    const body = (await response.json()) as { access_token: string }
    localStorage.setItem(TOKEN_KEY, body.access_token)
    const meRes = await request("/api/auth/me", {
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
    clearAuthStorage()
  },

  onAuthExpired(callback: () => void) {
    const handler = () => callback()
    window.addEventListener(AUTH_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler)
  },

  getSession(): Session | null {
    const token = readToken()
    const session = readJson<Session | null>(SESSION_KEY, null)
    if (!token || !session) return null
    return {
      ...session,
      kind: session.kind ?? "customer",
      role: session.role ?? "customer",
    }
  },

  async requestPasswordReset(email: string) {
    const response = await request("/api/auth/password-reset", {
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
    const response = await request("/api/dashboard", { headers: authHeaders() })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not load the dashboard."))
    }
    return (await response.json()) as DashboardData
  },

  async getQuotes(): Promise<QuoteListItem[]> {
    const response = await request("/api/quotes", { headers: authHeaders() })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not load quotations."))
    }
    return (await response.json()) as QuoteListItem[]
  },

  async getQuote(id: string): Promise<Quote> {
    const response = await request(`/api/quotes/${id}`, { headers: authHeaders() })
    if (!response.ok) {
      throw new Error(await readError(response, "Quote not found"))
    }
    return mapApiQuote((await response.json()) as Record<string, unknown>)
  },

  async createQuote(spec: QuoteSpecification, _bomSnapshot?: BomPreview | null) {
    const options = pricingOptionsFromSpec(spec)
    const session = this.getSession()
    const customerId = sessionStorage.getItem("quotecraft.salesCustomerId")
    const isStaff = session?.kind === "staff"
    const response = await request(isStaff ? "/api/sales/quotes" : "/api/quotes", {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(
        isStaff
          ? { specification: spec, options, customerId: Number(customerId), bomSnapshot: _bomSnapshot }
          : { specification: spec, options, bomSnapshot: _bomSnapshot },
      ),
    })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not create the quotation."))
    }
    return mapApiQuote((await response.json()) as Record<string, unknown>)
  },

  async downloadPdf(id: string) {
    const response = await request(`/api/quotes/${id}/pdf`, { headers: authHeaders() })
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
    const response = await request(`/api/quotes/${id}/email`, {
      method: "POST",
      headers: authHeaders(true),
    })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not send the quotation email."))
    }
    return (await response.json()) as { sent: boolean }
  },

  async acceptQuote(id: string) {
    const response = await request(`/api/quotes/${id}/accept`, {
      method: "POST",
      headers: authHeaders(true),
    })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not accept this quotation."))
    }
    return mapApiQuote((await response.json()) as Record<string, unknown>)
  },

  async rejectQuote(id: string, message: string) {
    const response = await request(`/api/quotes/${id}/reject`, {
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
    const response = await request(`/api/quotes/${id}/revision`, {
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
    const response = await request("/api/profile", { headers: authHeaders() })
    if (!response.ok) {
      throw new Error(await readError(response, "Could not load your profile."))
    }
    return (await response.json()) as CustomerProfile
  },

  async saveProfile(profile: CustomerProfile) {
    const response = await request("/api/profile", {
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

  async salesDashboard() {
    const response = await request("/api/sales/dashboard", { headers: authHeaders() })
    if (!response.ok) throw new Error(await readError(response, "Could not load the sales dashboard."))
    return response.json()
  },
  async salesCustomers(search = "") {
    const response = await request(`/api/sales/customers?search=${encodeURIComponent(search)}`, {
      headers: authHeaders(),
    })
    if (!response.ok) throw new Error(await readError(response, "Could not load customers."))
    return response.json()
  },
  async salesCustomer(id: string) {
    const response = await request(`/api/sales/customers/${id}`, { headers: authHeaders() })
    if (!response.ok) throw new Error(await readError(response, "Customer not found"))
    return response.json()
  },
  async salesCustomerQuotes(id: string) {
    const response = await request(`/api/sales/customers/${id}/quotes`, { headers: authHeaders() })
    if (!response.ok) throw new Error(await readError(response, "Could not load quotations."))
    return response.json()
  },
  async createSalesCustomer(payload: Record<string, unknown>) {
    const response = await request("/api/sales/customers", {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(await readError(response, "Could not create the customer."))
    return response.json()
  },
  async assignCustomer(customerId: string, staffId: number | null) {
    const response = await request(`/api/sales/customers/${customerId}/assign`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ staffId }),
    })
    if (!response.ok) throw new Error(await readError(response, "Could not assign the customer."))
    return response.json()
  },
  async salesAssignees() {
    const response = await request("/api/sales/assignees", { headers: authHeaders() })
    if (!response.ok) throw new Error(await readError(response, "Could not load sales users."))
    return response.json()
  },
  async salesQuotes(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await request(`/api/sales/quotes${query ? `?${query}` : ""}`, { headers: authHeaders() })
    if (!response.ok) throw new Error(await readError(response, "Could not load quotations."))
    return response.json()
  },
  async salesQuote(id: string) {
    const response = await request(`/api/sales/quotes/${id}`, { headers: authHeaders() })
    if (!response.ok) throw new Error(await readError(response, "Quote not found"))
    return mapApiQuote((await response.json()) as Record<string, unknown>)
  },
  async downloadSalesPdf(id: string) {
    const response = await request(`/api/sales/quotes/${id}/pdf`, { headers: authHeaders() })
    if (!response.ok) throw new Error(await readError(response, "Could not download the PDF."))
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `quote-${id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
  async issueQuoteVersion(id: string, payload: { reason: string; unitPrice: number }) {
    const response = await request(`/api/sales/quotes/${id}/versions`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ reason: payload.reason, unitPrice: payload.unitPrice }),
    })
    if (!response.ok) throw new Error(await readError(response, "Could not issue a revised offer."))
    return mapApiQuote((await response.json()) as Record<string, unknown>)
  },
  async compareQuoteVersions(id: string, fromVersion: number, toVersion: number) {
    const query = new URLSearchParams({ from: String(fromVersion), to: String(toVersion) })
    const response = await request(`/api/sales/quotes/${id}/versions/compare?${query}`, {
      headers: authHeaders(),
    })
    if (!response.ok) throw new Error(await readError(response, "Could not compare versions."))
    return response.json() as Promise<{
      from: Record<string, unknown>
      to: Record<string, unknown>
      changes: Record<string, { from: unknown; to: unknown }>
    }>
  },
  async sendSalesEmail(id: string) {
    const response = await request(`/api/sales/quotes/${id}/email`, {
      method: "POST",
      headers: authHeaders(true),
    })
    if (!response.ok) throw new Error(await readError(response, "Could not send the quotation email."))
    return response.json()
  },
  async salesManualPricing(id: string, action: string, note: string) {
    const response = await request(`/api/sales/quotes/${id}/manual-pricing`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ action, note }),
    })
    if (!response.ok) throw new Error(await readError(response, "Could not update manual pricing."))
    return response.json()
  },
  async adminUsers() {
    const response = await request("/api/admin/users", { headers: authHeaders() })
    if (!response.ok) throw new Error(await readError(response, "Could not load users."))
    return response.json()
  },
  async createAdminUser(payload: Record<string, unknown>) {
    const response = await request("/api/admin/users", {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(await readError(response, "Could not create the user."))
    return response.json()
  },
  async updateAdminUser(id: number, payload: Record<string, unknown>) {
    const response = await request(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(await readError(response, "Could not update the user."))
    return response.json()
  },
}
