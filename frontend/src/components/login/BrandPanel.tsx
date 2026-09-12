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
          <QuoteCraftMark inverted className="size-9 rounded-2xl text-sm shadow-[0_10px_24px_rgba(0,0,0,0.2)]" />
          <span className="font-heading text-base font-semibold text-white">QuoteCraft</span>
        </div>
        <h1 className="font-heading mb-4 text-4xl font-bold leading-[1.15] text-white">
          Configure.
          <br />
          Quote.
          <br />
          Deliver.
        </h1>
        <p className="text-sm leading-relaxed text-white/60">
          Request accurate quotations for industrial packaging in minutes, not days.
        </p>
      </div>

      <div className="relative z-10 border-t border-white/10 pt-8">
        <p className="mb-4 text-sm leading-relaxed text-white/70 italic">
          &ldquo;What used to take three back-and-forth emails now takes under five minutes. Our procurement team saves hours every week.&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
            RV
          </div>
          <div>
            <div className="text-xs font-medium text-white">Rahul Verma</div>
            <div className="text-[11px] text-white/50">Procurement Manager, Agro Industries Ltd.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
