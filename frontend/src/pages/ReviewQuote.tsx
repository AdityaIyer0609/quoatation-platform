import { ArrowLeft, ArrowRight, Pencil } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useQuoteDraft } from "@/hooks/useQuoteDraft"
import { usePortalPaths } from "@/lib/portal"
import { previewBom } from "@/services/bom"

const BOM_KEY = "quotecraft.bom.preview"

export default function ReviewQuote() {
  const navigate = useNavigate()
  const paths = usePortalPaths()
  const { specification, setStep } = useQuoteDraft()
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function edit(step: number) {
    setStep(step)
    navigate(paths.newQuote)
  }

  async function calculate() {
    setWorking(true)
    setError(null)
    try {
      const preview = await previewBom(specification)
      sessionStorage.setItem(BOM_KEY, JSON.stringify(preview))
      navigate(paths.bom)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate the material list.")
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="mx-auto max-w-[760px] p-6 pb-32 md:p-8 md:pb-8">
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <button type="button" onClick={() => navigate(paths.dashboard)}>
            Dashboard
          </button>
          <span>/</span>
          <button type="button" onClick={() => navigate(paths.newQuote)}>
            New Quote
          </button>
          <span>/</span>
          <span>Review</span>
        </div>
        <h1 className="font-heading text-xl font-bold">Review your requirements</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Check everything looks right, then calculate the material list. Pricing follows after the material weights.
        </p>
      </div>

      <div className="space-y-4">
        <Section title="Product" onEdit={() => edit(1)}>
          <Row label="Product type" value={specification.productType} />
          <Row label="Category" value={specification.productCategory} />
        </Section>
        <Section title="Construction" onEdit={() => edit(2)}>
          <Row label="Construction" value={specification.constructionType} />
          <Row label="Body style" value={specification.bodyStyle} />
          <Row label="Grade" value={specification.bodyGrade} />
          <Row label="Size type" value={specification.sizeType} />
          <Row label="Top" value={specification.topType} />
          <Row label="Bottom" value={specification.bottomType} />
        </Section>
        <Section title="Specifications" onEdit={() => edit(3)}>
          <Row
            label="Dimensions"
            value={`${specification.length} × ${specification.width} × ${specification.height} cm`}
          />
          <Row label="Safe working load" value={`${specification.swl} kg`} />
          <Row label="Safety factor" value={specification.sfRatio} />
          <Row label="Body GSM" value={`${specification.bodyGsm} g/m²`} />
          <Row label="Lamination" value={`${specification.bodyLami} g/m²`} />
        </Section>
        <Section title="Components" onEdit={() => edit(4)}>
          <Row label="Loops" value={specification.loopEnabled ? specification.loopType : "None"} />
          {specification.book4Complication ? (
            <Row label="Book4 conversion type" value={specification.book4Complication} />
          ) : null}
          <Row
            label="Liner"
            value={
              specification.linerEnabled
                ? `${specification.linerType} (${specification.linerMicron} µ)`
                : "None"
            }
          />
          <Row label="Printing" value={specification.printing || "None"} />
          <Row label="Quantity" value={`${specification.quantity} bags`} />
        </Section>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button type="button" variant="outline" onClick={() => navigate(paths.newQuote)} className="gap-1.5">
          <ArrowLeft className="size-3.5" />
          Back
        </Button>
        <Button
          type="button"
          onClick={calculate}
          disabled={working}
          className="font-heading h-auto gap-2 rounded-md bg-[var(--navy)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--navy-hover)]"
        >
          {working ? "Calculating…" : "Calculate material list"}
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function Section({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <h2 className="font-heading text-sm font-semibold">{title}</h2>
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-xs text-[var(--navy)]">
          <Pencil className="size-3" />
          Edit
        </button>
      </div>
      <div className="space-y-2 px-5 py-4">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
