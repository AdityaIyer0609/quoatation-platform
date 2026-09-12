import { ClickRow } from "@/components/common/ClickRow"
import { formatUsd } from "@/lib/format"
import type { PricingPreview } from "@/types/quote"

function money(value: number | null | undefined) {
  if (value == null) return "—"
  return formatUsd(value)
}

export function PricingBreakdown({ pricing }: { pricing: PricingPreview }) {
  return (
    <div className="space-y-3">
      {pricing.requiresManualPricing && (
        <div className="rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-2 text-sm text-[var(--warning)]">
          Manual pricing required. Book4 could not complete an automatic commercial price. This quotation is still valid and awaiting review.
        </div>
      )}
      {pricing.errors.length > 0 && (
        <ul className="rounded-2xl border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-2 text-sm text-[var(--error)]">
          {pricing.errors.map((err) => (
            <li key={err.code}>{err.message}</li>
          ))}
        </ul>
      )}
      {pricing.warnings.length > 0 && (
        <div className="rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-2 text-sm text-[var(--warning)]">
          {pricing.warnings.join(" ")}
        </div>
      )}
      <div className="qc-card qc-table-card px-2 text-sm">
        <table className="qc-table">
          <tbody>
            <Section label="Material" />
            <Row label={`PP (${pricing.ppKg.toFixed(4)} kg)`} value={money(pricing.ppMaterialCost)} />
            <Row label={`PE / Liner (${pricing.peKg.toFixed(4)} kg)`} value={money(pricing.peMaterialCost)} />
            {pricing.unclassifiedKg ? (
              <Row label={`Unclassified (${pricing.unclassifiedKg.toFixed(4)} kg)`} value="—" />
            ) : null}
            <Section label="Conversion" />
            <Row
              label={
                pricing.conversionRatePerTon != null
                  ? `${pricing.bagDesign ?? "—"} · ${pricing.loops ?? "—"} · ${pricing.complication ?? "—"} · $${pricing.conversionRatePerTon}/t`
                  : "Conversion"
              }
              value={money(pricing.conversionCost)}
            />
            {pricing.surcharges.length > 0 && <Section label="Surcharges" />}
            {pricing.surcharges.map((line) => (
              <Row key={`${line.code}-${line.label}`} label={line.label} value={money(line.amountPerBag)} />
            ))}
            {pricing.addons.length > 0 && <Section label="Add-ons" />}
            {pricing.addons.map((line) => (
              <Row key={line.label} label={line.label} value={money(line.amountPerBag)} />
            ))}
            <Section label="Printing" />
            {pricing.printing ? (
              <Row label={pricing.printing.label} value={money(pricing.printing.amountPerBag)} />
            ) : (
              <Row label="Printing" value="—" />
            )}
            <Row label="Price / bag" value={pricing.requiresManualPricing ? "Manual pricing" : money(pricing.unitPrice)} strong />
            <Row
              label="Total quote"
              value={pricing.requiresManualPricing ? "Manual pricing" : money(pricing.totalAmount)}
              strong
            />
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Section({ label }: { label: string }) {
  return (
    <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
      <td className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]" colSpan={2}>
        {label}
      </td>
    </tr>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <ClickRow>
      <td className={`px-4 py-2.5 ${strong ? "font-semibold" : ""}`}>{label}</td>
      <td className={`font-quote-mono px-4 py-2.5 text-right ${strong ? "font-semibold" : ""}`}>{value}</td>
    </ClickRow>
  )
}
