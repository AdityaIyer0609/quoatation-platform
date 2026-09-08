import { QuoteCraftMark } from "@/components/login/QuoteCraftMark"

export function BrandPanel() {
  return (
    <div className="hidden w-[440px] shrink-0 flex-col justify-between bg-[var(--navy)] p-12 lg:flex">
      <div>
        <div className="mb-16 flex items-center gap-3">
          <QuoteCraftMark inverted className="size-8 text-sm" />
          <span className="font-heading text-base font-semibold text-white">
            QuoteCraft
          </span>
        </div>
        <h1 className="font-heading mb-4 text-4xl font-bold leading-tight text-white">
          Configure.
          <br />
          Quote.
          <br />
          Deliver.
        </h1>
        <p className="text-sm leading-relaxed text-white/60">
          Request accurate quotations for industrial packaging in minutes, not
          days.
        </p>
      </div>

      <div className="border-t border-white/10 pt-8">
        <p className="mb-4 text-sm leading-relaxed text-white/70 italic">
          &ldquo;What used to take three back-and-forth emails now takes under
          five minutes. Our procurement team saves hours every week.&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
            RV
          </div>
          <div>
            <div className="text-xs font-medium text-white">Rahul Verma</div>
            <div className="text-[11px] text-white/50">
              Procurement Manager, Agro Industries Ltd.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
