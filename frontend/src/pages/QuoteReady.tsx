import { Check, Download, Loader2, Mail } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useQuoteDraft } from "@/hooks/useQuoteDraft"
import { formatQty, formatUsd } from "@/lib/format"
import { api } from "@/services/api"
import type { Quote } from "@/types/quote"
import { PricingBreakdown } from "@/components/quote/PricingBreakdown"

export default function QuoteReady() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { reset } = useQuoteDraft()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [emailed, setEmailed] = useState(false)

  useEffect(() => {
    let active = true
    api
      .getQuote(id)
      .then((result) => {
        if (active) setQuote(result)
      })
      .catch((err) => {
        if (active) setLoadError(err instanceof Error ? err.message : "Quote not found")
      })
    return () => {
      active = false
    }
  }, [id])

  if (loadError) {
    return (
      <div className="p-8 text-sm">
        {loadError}{" "}
        <button type="button" className="text-[var(--navy)]" onClick={() => navigate("/quotes")}>
          View all quotes
        </button>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="p-8 text-sm text-[var(--text-muted)]">Loading quotation…</div>
    )
  }

  const spec = quote.specification

  return (
    <div className="mx-auto max-w-[680px] p-6 md:p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-[var(--success-border)] bg-[var(--success-bg)]">
          <Check className="size-6 text-[var(--success)]" />
        </div>
        <h1 className="font-heading mb-1.5 text-2xl font-bold">
          {quote.pricing.requiresManualPricing || quote.pricing.unitPrice == null
            ? "Your quotation is stored"
            : "Your quotation is ready"}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Quote{" "}
          <span className="font-quote-mono font-medium">{quote.number}</span>
          {quote.pricing.requiresManualPricing || quote.pricing.unitPrice == null
            ? " has been saved for commercial review. Manual pricing is required."
            : ` has been prepared and is valid until ${quote.validUntil}`}
        </p>
      </div>

      <div className="mb-5 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] bg-[var(--navy)] px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-heading mb-1 text-xs text-white/60">QUOTATION</div>
              <div className="font-heading text-xl font-bold text-white">{quote.number}</div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-xs text-white/60">Valid until</div>
              <div className="text-sm font-medium text-white">{quote.validUntil}</div>
            </div>
          </div>
        </div>

        <div className="border-b border-[var(--border)] px-6 py-5">
          <div className="font-heading mb-3 text-xs font-semibold text-[var(--text-muted)]">
            PRODUCT
          </div>
          <div className="font-heading mb-1 text-base font-semibold">
            {spec.productType} — {spec.productCategory}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              spec.constructionType,
              `${spec.length}×${spec.width}×${spec.height} cm`,
              `${spec.swl} kg SWL`,
              spec.fabric,
            ].map((tag) => (
              <span
                key={tag}
                className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="border-b border-[var(--border)] px-6 py-5">
          <div className="font-heading mb-3 text-xs font-semibold text-[var(--text-muted)]">
            PRICING
          </div>
          {quote.pricingSnapshot ? (
            <PricingBreakdown pricing={quote.pricingSnapshot} />
          ) : quote.pricing.requiresManualPricing || quote.pricing.unitPrice == null ? (
            <p className="text-sm text-amber-800">Manual pricing required. No USD total is available.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Unit price</span>
                <span className="font-quote-mono">{formatUsd(quote.pricing.unitPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Quantity</span>
                <span className="font-quote-mono">{formatQty(quote.pricing.quantity)} units</span>
              </div>
              <div className="mt-5 flex items-end justify-between border-t border-[var(--border)] pt-4">
                <div>
                  <div className="mb-0.5 text-xs text-[var(--text-muted)]">Total quotation amount</div>
                  <div className="font-heading text-3xl font-bold text-[var(--navy)]">
                    {formatUsd(quote.pricing.totalAmount as number)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4">
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            This quotation is subject to final review. Prices exclude GST. Lead time of
            21–28 days from order confirmation. A 40% advance payment is required to
            commence production.
          </p>
        </div>
      </div>

        {actionError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {actionError}
          </div>
        )}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-auto flex-1 gap-2 rounded-md border-[1.5px] border-[var(--navy)] py-2.5 text-sm font-semibold text-[var(--navy)]"
          onClick={() => {
            void (async () => {
              setDownloading(true)
              setActionError(null)
              try {
                await api.downloadPdf(quote.id)
              } catch (err) {
                setActionError(err instanceof Error ? err.message : "Could not download the PDF.")
              } finally {
                setDownloading(false)
              }
            })()
          }}
        >
          {downloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          {downloading ? "Downloading…" : "Download PDF"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-auto flex-1 gap-2 rounded-md py-2.5 text-sm font-semibold"
          onClick={() => {
            void (async () => {
              setActionError(null)
              try {
                await api.sendQuoteEmail(quote.id)
                setEmailed(true)
                window.setTimeout(() => setEmailed(false), 3000)
              } catch (err) {
                setActionError(err instanceof Error ? err.message : "Could not send the quotation email.")
              }
            })()
          }}
        >
          {emailed ? <Check className="size-3.5" /> : <Mail className="size-3.5" />}
          {emailed ? "Sent to your email" : "Email quotation"}
        </Button>
      </div>

      <div className="flex gap-3">
        <Link
          to="/quotes"
          className="font-heading flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] py-2.5 text-center text-sm font-medium text-[var(--text-secondary)]"
        >
          View all quotes
        </Link>
        <button
          type="button"
          onClick={() => {
            reset()
            navigate("/quotes/new")
          }}
          className="font-heading flex-1 rounded-md bg-[var(--navy)] py-2.5 text-center text-sm font-semibold text-white hover:bg-[var(--navy-hover)]"
        >
          Create another quote
        </button>
      </div>
    </div>
  )
}
