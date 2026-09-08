import { ArrowLeft } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { PricingBreakdown } from "@/components/quote/PricingBreakdown"
import { Button } from "@/components/ui/button"
import { useQuoteDraft } from "@/hooks/useQuoteDraft"
import { formatQty } from "@/lib/format"
import { api } from "@/services/api"
import { previewPricing } from "@/services/pricing"
import type { BomPreview, PricingPreview } from "@/types/quote"

const BOM_KEY = "quotecraft.bom.preview"

export default function BomReport() {
  const navigate = useNavigate()
  const { specification, reset } = useQuoteDraft()
  const [submitting, setSubmitting] = useState(false)
  const [pricing, setPricing] = useState<PricingPreview | null>(null)
  const [pricingError, setPricingError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const preview = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(BOM_KEY)
      return raw ? (JSON.parse(raw) as BomPreview) : null
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!preview) return
    let cancelled = false
    previewPricing(specification, preview)
      .then((result) => {
        if (!cancelled) setPricing(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setPricingError(err instanceof Error ? err.message : "Could not calculate pricing.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [preview, specification])

  async function submit() {
    if (!preview) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const quote = await api.createQuote(specification, preview)
      reset()
      sessionStorage.removeItem(BOM_KEY)
      navigate(`/quotes/${quote.id}/ready`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not create the quotation.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!preview) {
    return (
      <div className="p-8 text-sm">
        No material list yet.{" "}
        <button type="button" className="text-[var(--navy)]" onClick={() => navigate("/quotes/new/review")}>
          Go back to review
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[960px] p-6 md:p-8">
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <button type="button" onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
          <span>/</span>
          <button type="button" onClick={() => navigate("/quotes/new/review")}>
            Review
          </button>
          <span>/</span>
          <span>Material list</span>
        </div>
        <h1 className="font-heading text-xl font-bold">Material list</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {preview.construction} · {preview.sizeType === "OUTER" ? "Outer" : "Inner"} size · {preview.dimensions}
        </p>
      </div>

      {preview.warnings?.length > 0 && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {preview.warnings.join(" ")}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Component</th>
              <th className="px-4 py-3 font-medium">GSM</th>
              <th className="px-4 py-3 font-medium">Lami</th>
              <th className="px-4 py-3 font-medium">Fabric</th>
              <th className="px-4 py-3 font-medium">Cut</th>
              <th className="px-4 py-3 font-medium text-right">kg / bag</th>
            </tr>
          </thead>
          <tbody>
            {preview.lines.map((line) => (
              <tr key={line.heading} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-2.5 font-medium">{line.heading}</td>
                <td className="px-4 py-2.5">{line.gsm || "—"}</td>
                <td className="px-4 py-2.5">{line.lamination || "—"}</td>
                <td className="px-4 py-2.5">{line.fabricSize || "—"}</td>
                <td className="px-4 py-2.5">{line.cutSize || "—"}</td>
                <td className="font-quote-mono px-4 py-2.5 text-right">
                  {line.totalKg != null ? line.totalKg.toFixed(4) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <TotalCard label="Quantity" value={`${formatQty(preview.quantity)} bags`} />
        <TotalCard label="Weight per bag" value={`${preview.totalKgPerBag.toFixed(4)} kg`} />
        <TotalCard label="Total material" value={`${preview.totalMaterialKg.toFixed(4)} kg`} />
      </div>

      <div className="mt-8">
        <h2 className="font-heading text-lg font-bold">Pricing (Book4)</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Material and conversion from the material list. Gaps in Book4 are flagged instead of guessed.
        </p>
        {pricingError && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {pricingError}
          </div>
        )}
        {pricing && <div className="mt-3"><PricingBreakdown pricing={pricing} /></div>}
      </div>

      {submitError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {submitError}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button type="button" variant="outline" className="gap-1.5" onClick={() => navigate("/quotes/new/review")}>
          <ArrowLeft className="size-3.5" />
          Back
        </Button>
        <Button
          type="button"
          disabled={submitting}
          onClick={submit}
          className="font-heading h-auto rounded-md bg-[var(--navy)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--navy-hover)]"
        >
          {submitting ? "Submitting…" : "Submit quotation request"}
        </Button>
      </div>
    </div>
  )
}

function TotalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
      <div className="font-heading mt-1 text-lg font-bold text-[var(--navy)]">{value}</div>
    </div>
  )
}

