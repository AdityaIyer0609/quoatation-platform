import { ArrowRight } from "lucide-react"

import { BagPreview3D } from "@/components/quote/BagPreview3D"
import { Button } from "@/components/ui/button"
import type { QuoteSpecification } from "@/types/quote"

export function QuoteSummary({
  specification,
  onProceed,
  onApplySample,
}: {
  specification: QuoteSpecification
  onProceed: () => void
  onApplySample?: () => void
}) {
  const rows = [
    { label: "Product", value: specification.productType },
    { label: "Construction", value: specification.constructionType },
    { label: "Size type", value: specification.sizeType === "OUTER" ? "Outer" : "Inner" },
    {
      label: "Dimensions",
      value: `${specification.length}×${specification.width}×${specification.height} cm`,
    },
    { label: "SWL", value: `${specification.swl} kg` },
    { label: "Body fabric", value: `${specification.bodyGsm} GSM` },
    { label: "Top", value: specification.topType },
    { label: "Bottom", value: specification.bottomType },
    { label: "Quantity", value: `${specification.quantity} bags` },
  ]

  return (
    <div className="overflow-hidden rounded-3xl bg-[var(--surface)] shadow-[var(--shadow-lg)]">
      <div className="border-b border-[var(--border)] bg-[var(--navy)] px-5 py-4">
        <div className="font-heading mb-0.5 text-xs font-semibold text-white/70">
          Configuration summary
        </div>
        <div className="text-[11px] text-white/50">Material list is calculated on the next step</div>
      </div>
      <div className="px-5 py-4">
        <div className="mb-4">
          <BagPreview3D specification={specification} compact onApplySample={onApplySample} />
        </div>
        <div className="mb-5 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <span className="shrink-0 text-xs text-[var(--text-muted)]">{row.label}</span>
              <span className="text-right text-xs font-medium">{row.value}</span>
            </div>
          ))}
        </div>
        <Button
          type="button"
          onClick={onProceed}
          className="font-heading mt-2 h-auto w-full gap-2 rounded-2xl bg-[var(--navy)] py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-navy)] hover:bg-[var(--navy-hover)]"
        >
          Continue to Review
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function MobilePriceBar({
  cta,
  onContinue,
}: {
  specification?: QuoteSpecification
  cta: string
  onContinue: () => void
}) {
  return (
    <div className="fixed right-0 bottom-[57px] left-0 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 lg:hidden">
      <div className="flex items-center justify-end">
        <Button
          type="button"
          onClick={onContinue}
          className="font-heading h-auto rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--navy-hover)]"
        >
          {cta}
        </Button>
      </div>
    </div>
  )
}
