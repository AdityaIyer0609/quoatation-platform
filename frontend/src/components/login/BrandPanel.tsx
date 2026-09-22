import { QuoteCraftMark } from "@/components/login/QuoteCraftMark"

export function BrandPanel() {
  return (
    <div className="relative hidden w-[440px] shrink-0 flex-col justify-between overflow-hidden bg-[var(--brand-panel)] p-12 lg:flex">
      <div className="qc-login-orbs" aria-hidden>
        <span />
        <span />
      </div>
      <div className="relative z-10">
        <div className="mb-16 flex items-center gap-3">
          <QuoteCraftMark className="size-10" />
          <span className="font-heading text-base font-semibold text-[var(--on-brand)]">
            HCP Plastene Bulkpack Limited
          </span>
        </div>
        <h1 className="font-heading mb-4 text-4xl font-bold leading-[1.15] text-[var(--on-brand)]">
          Configure.
          <br />
          Quote.
          <br />
          Deliver.
        </h1>
        <p className="text-sm leading-relaxed text-[var(--on-brand-muted)]">
          Request accurate quotations for industrial packaging in minutes, not days.
        </p>
      </div>

      <div className="relative z-10 border-t border-[color-mix(in_srgb,var(--on-brand)_16%,transparent)] pt-8">
        <p className="mb-4 text-sm leading-relaxed text-[var(--on-brand-muted)] italic">
          &ldquo;What used to take three back-and-forth emails now takes under five minutes. Our procurement team saves hours every week.&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--on-brand)_14%,transparent)] text-xs font-semibold text-[var(--on-brand)]">
            RV
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--on-brand)]">Rahul Verma</div>
            <div className="text-[11px] text-[var(--on-brand-muted)]">Procurement Manager, Agro Industries Ltd.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
