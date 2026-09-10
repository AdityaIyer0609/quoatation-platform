import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { StatusBadge } from "@/components/common/StatusBadge"
import { BagPreview3D } from "@/components/quote/BagPreview3D"
import { PricingBreakdown } from "@/components/quote/PricingBreakdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/useAuth"
import { formatQuoteAmount, formatUsd, statusLabel } from "@/lib/format"
import { api } from "@/services/api"
import type { Quote, QuoteVersion } from "@/types/quote"

function money(value: unknown) {
  if (value == null || value === "") return "Manual pricing"
  const n = Number(value)
  return Number.isFinite(n) ? formatUsd(n) : "Manual pricing"
}

export default function SalesQuoteDetail() {
  const { id = "" } = useParams()
  const { user } = useAuth()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [reason, setReason] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [fromV, setFromV] = useState(1)
  const [toV, setToV] = useState(1)
  const [compare, setCompare] = useState<Record<string, { from: unknown; to: unknown }> | null>(null)
  const [working, setWorking] = useState(false)
  const canPrice = user?.role === "admin" || user?.role === "pricing_manager"
  const canIssue = user?.role === "admin" || user?.role === "sales_manager" || user?.role === "sales_executive"

  async function reload() {
    const body = await fetch(`/api/sales/quotes/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("quotecraft.token") ?? ""}` },
    }).then(async (response) => {
      if (!response.ok) throw new Error("Quote not found")
      return (await response.json()) as Record<string, unknown>
    })
    setRaw(body)
    setQuote(await api.salesQuote(id))
  }

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const versions = useMemo(() => quote?.versions ?? [], [quote])

  useEffect(() => {
    if (versions.length < 1) return
    setFromV(versions[0].version)
    setToV(versions[versions.length - 1].version)
  }, [versions])

  useEffect(() => {
    if (!quote) return
    const currentOffer = quote.versions.find((item) => item.isCurrent) ?? quote.versions.at(-1)
    if (currentOffer?.unitPrice != null) {
      setUnitPrice(String(currentOffer.unitPrice))
    }
    if (quote.status !== "revision_requested") return
    const request = quote.timeline.find((item) => item.event === "Revision requested")
    if (request?.detail) {
      setReason((prev) => prev || request.detail)
    }
  }, [quote])

  if (error) return <div className="p-8 text-sm text-[var(--error)]">{error}</div>
  if (!quote) return <div className="p-8 text-sm">Loading…</div>

  const reasons = (raw?.manualPricingReasons as string[]) ?? []
  const warnings = (raw?.manualPricingWarnings as string[]) ?? []
  const current = quote.currentVersion ?? Math.max(...versions.map((item) => item.version), 1)
  const canSend = quote.status === "quoted" || quote.status === "revision_requested"
  const canAccept = quote.status === "quoted"
  const canRevise = quote.status === "quoted" || quote.status === "revision_requested"
  const customerRequest = quote.timeline.find((item) => item.event === "Revision requested")
  const commercialOffer = Boolean(
    (quote.pricingSnapshot as { commercialOffer?: boolean } | null)?.commercialOffer,
  )

  async function createRevisedOffer() {
    if (!reason.trim()) {
      setActionError("Enter a negotiation reason before creating a revised offer.")
      return
    }
    const price = Number(unitPrice)
    if (!Number.isFinite(price) || price <= 0) {
      setActionError("Enter a commercial unit price greater than zero.")
      return
    }
    setWorking(true)
    setActionError(null)
    try {
      const next = await api.issueQuoteVersion(id, { reason: reason.trim(), unitPrice: price })
      setQuote(next)
      setReason("")
      await reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not issue a revised offer.")
    } finally {
      setWorking(false)
    }
  }

  async function runCompare() {
    setActionError(null)
    try {
      const result = await api.compareQuoteVersions(id, fromV, toV)
      setCompare(result.changes)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not compare versions.")
    }
  }

  return (
    <div className="mx-auto max-w-[960px] p-6 md:p-8">
      <Link to="/sales/quotes" className="text-xs text-[var(--navy)]">
        Back to quotations
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-xl font-bold">{quote.number}</h1>
        <StatusBadge status={quote.status} />
        <span className="rounded-full bg-[var(--navy-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--navy)]">
          V{current} current
        </span>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        {quote.company} · {quote.productName}
      </p>

      {actionError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{actionError}</div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void api.downloadSalesPdf(id)}>
          Download PDF
        </Button>
        <Button
          variant="outline"
          disabled={!canSend}
          onClick={() =>
            void api
              .sendSalesEmail(id)
              .catch((err: Error) => setActionError(err.message))
          }
        >
          Send quote
        </Button>
        {canAccept && (
          <Button
            className="bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]"
            onClick={() =>
              void fetch(`/api/sales/quotes/${id}/accept`, {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("quotecraft.token") ?? ""}` },
              }).then(() => reload())
            }
          >
            Accept
          </Button>
        )}
      </div>
      {!canSend && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Only the latest active version can be sent or accepted.
        </p>
      )}

      {quote.status === "revision_requested" && customerRequest && (
        <section className="mt-6 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4">
          <div className="font-heading text-sm font-semibold text-[var(--navy)]">Customer revision request</div>
          <p className="mt-1 text-sm text-[var(--text)]">{customerRequest.detail}</p>
          <p className="mt-1 font-quote-mono text-[10px] text-[var(--text-muted)]">{customerRequest.at}</p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            This is not a new version. Create a revised commercial offer on this same quotation, or ask the customer to raise a new quote if they need a different bag or quantity.
          </p>
        </section>
      )}

      <div className="mt-6">
        <BagPreview3D specification={quote.specification} />
      </div>

      {quote.pricingSnapshot && (
        <div className="mt-6">
          {commercialOffer && (
            <p className="mb-2 text-xs text-[var(--text-secondary)]">
              This is a negotiated commercial offer. Book4 material and conversion lines are copied from the previous freeze and were not recalculated.
            </p>
          )}
          <PricingBreakdown pricing={quote.pricingSnapshot} />
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] px-5 py-3.5">
          <h2 className="font-heading text-sm font-semibold">Version history</h2>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Each version is a frozen commercial offer. Create a revised offer for price negotiation; a different bag or quantity is a new quotation.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Version</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Qty</th>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Rules</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
                <th className="px-4 py-2.5 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((item: QuoteVersion) => (
                <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2.5 font-medium">
                    V{item.version}
                    {item.isCurrent ? <span className="ml-2 text-[10px] text-[var(--navy)]">current</span> : null}
                  </td>
                  <td className="px-4 py-2.5">{statusLabel[item.status] ?? item.status}</td>
                  <td className="px-4 py-2.5">{item.quantity ?? "—"}</td>
                  <td className="px-4 py-2.5">{item.requiresManualPricing ? "Manual pricing" : formatQuoteAmount(item.unitPrice)}</td>
                  <td className="px-4 py-2.5">{item.requiresManualPricing ? "Manual pricing" : formatQuoteAmount(item.totalAmount)}</td>
                  <td className="px-4 py-2.5 font-quote-mono text-xs">{item.ruleVersion}</td>
                  <td className="px-4 py-2.5 text-xs">
                    <div>{item.createdByName || "—"}</div>
                    <div className="text-[var(--text-muted)]">{item.createdAt}</div>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{item.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {quote.timeline.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-5 py-3.5">
            <h2 className="font-heading text-sm font-semibold">Quote history</h2>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Customer revision requests appear here. The Reason column above is only why a sales version was issued.
            </p>
          </div>
          <div className="space-y-5 px-5 py-4">
            {quote.timeline.map((item) => (
              <div key={`${item.at}-${item.event}`} className="flex items-start gap-4">
                <div
                  className="mt-0.5 size-2.5 shrink-0 rounded-full"
                  style={{
                    background:
                      item.type === "success"
                        ? "var(--success)"
                        : item.type === "warning"
                          ? "var(--warning)"
                          : item.type === "error"
                            ? "var(--error)"
                            : "var(--border-strong)",
                  }}
                />
                <div>
                  <div className="mb-0.5 text-sm font-medium">{item.event}</div>
                  <div className="mb-1 text-xs text-[var(--text-secondary)]">{item.detail}</div>
                  <div className="font-quote-mono text-[10px] text-[var(--text-muted)]">{item.at}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {versions.length > 1 && (
        <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="font-heading text-sm font-semibold">Compare versions</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-xs">
              From
              <select className="ml-2 rounded-md border border-[var(--border)] px-2 py-1" value={fromV} onChange={(e) => setFromV(Number(e.target.value))}>
                {versions.map((item) => (
                  <option key={item.id} value={item.version}>
                    V{item.version}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              To
              <select className="ml-2 rounded-md border border-[var(--border)] px-2 py-1" value={toV} onChange={(e) => setToV(Number(e.target.value))}>
                {versions.map((item) => (
                  <option key={item.id} value={item.version}>
                    V{item.version}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="outline" onClick={() => void runCompare()}>
              Compare
            </Button>
          </div>
          {compare && (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--text-muted)]">
                  <th className="py-1 font-medium">Field</th>
                  <th className="py-1 font-medium">V{fromV}</th>
                  <th className="py-1 font-medium">V{toV}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(compare).map(([field, change]) => (
                  <tr key={field} className="border-t border-[var(--border)]">
                    <td className="py-2 capitalize">{field.replace(/([A-Z])/g, " $1")}</td>
                    <td className="py-2">{field.toLowerCase().includes("price") || field === "totalAmount" ? money(change.from) : String(change.from ?? "—")}</td>
                    <td className="py-2 font-medium">{field.toLowerCase().includes("price") || field === "totalAmount" ? money(change.to) : String(change.to ?? "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {canIssue && canRevise && (
        <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="font-heading text-sm font-semibold">Create revised offer</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Issues V{current + 1} with a new commercial unit price on the same bag, quantity, and BOM.
            Previous versions stay auditable. Do not use this for a different specification — create a new quotation instead.
          </p>
          <label className="mt-3 block text-xs text-[var(--text-muted)]">
            Unit price (USD)
            <Input
              className="mt-1"
              type="number"
              min="0.01"
              step="0.01"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
            />
          </label>
          <Textarea
            className="mt-3"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Negotiation reason (required)"
          />
          <Button
            disabled={working}
            className="mt-3 bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]"
            onClick={() => void createRevisedOffer()}
          >
            {working ? "Issuing…" : "Create Revised Offer"}
          </Button>
        </section>
      )}

      {!commercialOffer && (reasons.length > 0 || quote.pricing.requiresManualPricing) && (
        <section className="mt-6 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-sm">
          <div className="font-heading font-semibold">Manual pricing</div>
          <div className="mt-1 text-xs">Status: {String(raw?.manualPricingStatus ?? "pending")}</div>
          <ul className="mt-2 list-disc pl-5">
            {reasons.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {canPrice && (
            <div className="mt-3 space-y-2">
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Approval note" />
              <div className="flex gap-2">
                <Button
                  className="bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]"
                  onClick={() => void api.salesManualPricing(id, "approved", note).then(() => reload())}
                >
                  Approve
                </Button>
                <Button variant="outline" onClick={() => void api.salesManualPricing(id, "resolved", note).then(() => reload())}>
                  Resolve
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
