import { Download } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb"
import { StatusBadge } from "@/components/common/StatusBadge"
import { BagPreview3D } from "@/components/quote/BagPreview3D"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { formatQty, formatQuoteAmount, formatUsd } from "@/lib/format"
import { api } from "@/services/api"
import type { Quote } from "@/types/quote"
import { PricingBreakdown } from "@/components/quote/PricingBreakdown"

export default function QuoteDetails() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [working, setWorking] = useState(false)
  const [pdfWorking, setPdfWorking] = useState(false)
  const [emailWorking, setEmailWorking] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    let active = true
    api
      .getQuote(id)
      .then((result) => {
        if (active) setQuote(result)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Quotation not found.")
      })
    return () => {
      active = false
    }
  }, [id])

  async function downloadPdf() {
    if (!quote) return
    setPdfWorking(true)
    setActionError(null)
    try {
      await api.downloadPdf(quote.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not download the PDF.")
    } finally {
      setPdfWorking(false)
    }
  }

  async function sendEmail() {
    if (!quote) return
    setEmailWorking(true)
    setActionError(null)
    try {
      await api.sendQuoteEmail(quote.id)
      setEmailSent(true)
      window.setTimeout(() => setEmailSent(false), 4000)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not send the quotation email.")
    } finally {
      setEmailWorking(false)
    }
  }

  async function accept() {
    if (!quote) return
    setWorking(true)
    setActionError(null)
    try {
      const next = await api.acceptQuote(quote.id)
      setQuote(next)
      setAcceptOpen(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not accept this quotation.")
    } finally {
      setWorking(false)
    }
  }

  async function requestRevision() {
    if (!quote || !message.trim()) return
    setWorking(true)
    setActionError(null)
    try {
      const next = await api.requestRevision(quote.id, message.trim())
      setQuote(next)
      setRevisionOpen(false)
      setMessage("")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not request a revision.")
    } finally {
      setWorking(false)
    }
  }

  async function reject() {
    if (!quote || !message.trim()) return
    setWorking(true)
    setActionError(null)
    try {
      const next = await api.rejectQuote(quote.id, message.trim())
      setQuote(next)
      setRejectOpen(false)
      setMessage("")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not reject this quotation.")
    } finally {
      setWorking(false)
    }
  }

  if (error) {
    return (
      <div className="p-8 text-sm">
        {error}{" "}
        <button type="button" className="text-[var(--navy)]" onClick={() => navigate("/quotes")}>
          Back to My Quotes
        </button>
      </div>
    )
  }

  if (!quote) {
    return <div className="p-8 text-sm text-[var(--text-muted)]">Loading quotation…</div>
  }

  const spec = quote.specification
  const specRows = [
    { label: "Product type", value: spec.productType },
    { label: "Category", value: spec.productCategory },
    { label: "Construction", value: spec.constructionType },
    { label: "Body style", value: spec.bodyStyle },
    {
      label: "Dimensions",
      value: `${spec.length} × ${spec.width} × ${spec.height} cm`,
    },
    { label: "Safe working load", value: `${spec.swl} kg` },
    { label: "Fabric GSM", value: `${spec.bodyGsm || spec.gsm || "—"} g/m²` },
    { label: "Lamination", value: spec.bodyLami ? `${spec.bodyLami} g/m²` : "—" },
    { label: "Top", value: spec.topType || spec.topConstruction || "—" },
    { label: "Bottom", value: spec.bottomType || spec.bottomConstruction || "—" },
    { label: "Loops", value: spec.loopEnabled === false ? "None" : spec.loopType || spec.loops || "—" },
    { label: "Liner", value: spec.linerEnabled ? `${spec.linerType} (${spec.linerMicron} µ)` : spec.liner || "None" },
    { label: "Document pouch", value: spec.docPouch ? `${spec.docType || "Yes"}` : "None" },
    { label: "Label", value: spec.label ? `${spec.labelLength}×${spec.labelWidth}` : "None" },
    { label: "Printing", value: spec.printing || "—" },
    ...(spec.partyName ? [{ label: "Party", value: spec.partyName }] : []),
    ...(spec.packing ? [{ label: "Packing", value: spec.packing }] : []),
    ...(spec.transport ? [{ label: "Transport", value: spec.transport }] : []),
    ...(spec.bellyBand1 ? [{ label: "Belly band 1", value: `${spec.bellyBand1Gsm} GPM` }] : []),
    ...(spec.safetyBand ? [{ label: "Safety band", value: "Yes" }] : []),
    ...(spec.fabricPatch ? [{ label: "Fabric patch", value: `${spec.fabricPatchGsm} GSM` }] : []),
    ...(spec.docPouch1 ? [{ label: "Extra doc pouch 1", value: `${spec.doc1Length}×${spec.doc1Width}` }] : []),
    ...(spec.extraLabel ? [{ label: "Extra label", value: `${spec.extraLabelCount}` }] : []),
    ...(spec.bottomSpout2 ? [{ label: "2nd discharge spout", value: `${spec.bottomSpout2Dia} × ${spec.bottomSpout2Height}` }] : []),
    ...(spec.cableTie ? [{ label: "Cable tie", value: spec.cableTieCount || "Yes" }] : []),
  ]

  const canAct = quote.status === "quoted"
  const canSend = quote.status === "quoted" || quote.status === "revision_requested"
  const currentVersion = quote.currentVersion ?? quote.versions.at(-1)?.version ?? 1

  return (
    <div className="qc-page max-w-[960px]">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "My Quotes", to: "/quotes" },
          { label: quote.number },
        ]}
      />

      {actionError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {actionError}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h1 className="font-heading text-xl font-bold">{quote.number}</h1>
            <StatusBadge status={quote.status} />
            <span className="rounded-full bg-[var(--navy-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--navy)]">
              V{currentVersion}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {quote.productName} · Created {quote.createdAt}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pdfWorking}
            className="h-auto gap-1.5 rounded-md border-[1.5px] border-[var(--navy)] px-3.5 py-2 text-sm font-medium text-[var(--navy)]"
            onClick={() => void downloadPdf()}
          >
            <Download className="size-3" />
            {pdfWorking ? "Preparing PDF…" : "Download PDF"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={emailWorking || !canSend}
            className="h-auto gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium"
            onClick={() => void sendEmail()}
          >
            {emailWorking ? "Sending…" : emailSent ? "Email sent" : "Send quote"}
          </Button>
          {canAct && (
            <Button
              type="button"
              variant="navy"
              onClick={() => setAcceptOpen(true)}
              className="font-heading h-auto rounded-md px-3.5 py-2 text-sm font-semibold"
            >
              Accept Quote
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <BagPreview3D specification={spec} />
          <div className="qc-card overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-3.5">
              <h2 className="font-heading text-sm font-semibold">Product Configuration</h2>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {specRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-2 last:border-b-0"
                  >
                    <span className="text-xs text-[var(--text-muted)]">{row.label}</span>
                    <span className="text-right text-xs font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="qc-card overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-3.5">
              <h2 className="font-heading text-sm font-semibold">Quote History</h2>
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
                    <div className="mb-1 text-xs text-[var(--text-secondary)]">
                      {item.detail}
                    </div>
                    <div className="font-quote-mono text-[10px] text-[var(--text-muted)]">
                      {item.at}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {quote.versions.length > 0 && (
            <div className="qc-card overflow-hidden">
              <div className="border-b border-[var(--border)] px-5 py-3.5">
                <h2 className="font-heading text-sm font-semibold">Versions</h2>
              </div>
              <div className="divide-y divide-[var(--border)] px-5 py-2">
                {quote.versions.map((item) => (
                  <div key={item.id} className="qc-row-card flex items-center justify-between px-2 py-2.5 text-sm">
                    <div>
                      <span className="font-medium">V{item.version}</span>
                      {item.isCurrent ? (
                        <span className="ml-2 text-[10px] text-[var(--navy)]">current</span>
                      ) : null}
                      <div className="text-xs text-[var(--text-muted)]">{item.createdAt}</div>
                    </div>
                    <div className="text-right text-xs">
                      {item.requiresManualPricing ? "Manual pricing" : formatQuoteAmount(item.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="overflow-hidden rounded-3xl bg-[var(--navy)] shadow-[var(--shadow-navy)]">
            <div className="px-5 py-5">
              <div className="font-heading mb-3 text-xs text-white/60">TOTAL QUOTATION</div>
              {quote.pricing.requiresManualPricing || quote.pricing.unitPrice == null ? (
                <>
                  <div className="font-heading mb-1 text-2xl font-bold text-white">Manual pricing</div>
                  <div className="text-xs text-white/50">Book4 could not complete an automatic USD price.</div>
                </>
              ) : (
                <>
                  <div className="font-heading mb-1 text-3xl font-bold text-white">
                    {formatUsd(quote.pricing.totalAmount as number)}
                  </div>
                  <div className="text-xs text-white/50">
                    {formatQty(quote.pricing.quantity)} units · {formatUsd(quote.pricing.unitPrice as number)}/unit
                  </div>
                </>
              )}
              <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Est. weight</span>
                  <span className="font-quote-mono font-medium text-white">
                    {formatQty(quote.pricing.totalKg)} kg
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Delivery</span>
                  <span className="font-medium text-white">{spec.deliveryLocation}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Valid until</span>
                  <span className="font-medium text-white">{quote.validUntil}</span>
                </div>
              </div>
              {canAct && (
                <Button
                  type="button"
                  onClick={() => setAcceptOpen(true)}
                  className="font-heading mt-5 h-auto w-full rounded-md bg-[var(--knob)] py-2.5 text-sm font-semibold text-[var(--navy)] hover:opacity-90"
                >
                  Accept this quotation
                </Button>
              )}
            </div>
          </div>

          {quote.pricingSnapshot && (
            <div className="qc-card p-5">
              <h3 className="font-heading mb-3 text-xs font-semibold text-[var(--text-muted)]">
                PRICING
              </h3>
              <PricingBreakdown pricing={quote.pricingSnapshot} />
            </div>
          )}

          <div className="qc-card p-5">
            <h3 className="font-heading mb-3 text-xs font-semibold text-[var(--text-muted)]">
              QUOTE INFORMATION
            </h3>
            <div className="space-y-2.5">
              {[
                { label: "Quote number", value: quote.number, mono: true },
                { label: "Requested by", value: quote.requestedBy },
                { label: "Company", value: quote.company },
                { label: "Lead time", value: quote.leadTime },
                { label: "Payment terms", value: quote.paymentTerms },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-3">
                  <span className="text-xs text-[var(--text-muted)]">{row.label}</span>
                  <span
                    className={`text-right text-xs font-medium ${row.mono ? "font-quote-mono" : ""}`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {canAct && (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full rounded-md py-2.5 text-sm font-medium"
                onClick={() => setRevisionOpen(true)}
              >
                Ask for a better price
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full rounded-md border-[var(--error-border)] py-2.5 text-sm font-medium text-[var(--error)]"
                onClick={() => setRejectOpen(true)}
              >
                Reject quotation
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accept this quotation?</DialogTitle>
            <DialogDescription>
              You are accepting {quote.number}
              {quote.pricing.unitPrice == null
                ? " (manual pricing — no automatic USD total)."
                : ` for ${formatUsd(quote.pricing.totalAmount as number)}.`}
              This confirms the commercial terms shown on this page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptOpen(false)}>
              Cancel
            </Button>
            <Button variant="navy" disabled={working} onClick={accept}>
              {working ? "Accepting…" : "Accept quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ask for a better price</DialogTitle>
            <DialogDescription>
              Use this to negotiate the current offer. Sales will issue a revised price on this
              same quotation. If you need a different bag or quantity, create a new quotation
              instead of requesting a revision.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="e.g. Please review the unit price"
            className="min-h-24"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="navy"
              disabled={working || !message.trim()}
              onClick={requestRevision}
            >
              {working ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject this quotation?</DialogTitle>
            <DialogDescription>
              Please share a short reason. This quotation will be marked as rejected.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Reason for rejection…"
            className="min-h-24"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={working || !message.trim()}
              className="bg-[var(--error)] text-white hover:bg-[var(--error)]/90"
              onClick={reject}
            >
              {working ? "Rejecting…" : "Reject quotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
