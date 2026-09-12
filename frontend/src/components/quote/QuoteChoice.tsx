import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import type { QuoteSpecification } from "@/types/quote"

export const FABRIC_SWATCH: Record<string, string> = {
  "Milky White": "#f4e2b8",
  White: "#f5f6f8",
  Natural: "#c9a36a",
  Blue: "#5b92cc",
  Green: "#6bb56e",
  Black: "#5c5c5a",
}

export const BOM_NAV_SHORT: Record<string, string> = {
  loop: "Loop",
  top: "Top",
  bottom: "Bottom",
  bottomSpout: "Bottom Spout",
  bottomSpout2: "Botttm Spout 2",
  liner: "Liner/Label",
  rate: "Rate + Other",
  flap: "Flap/Hook/AncillaryLoop",
  rope: "Rope/Tie/Thread",
  doc: "Doc/Filler Cord/LoopProtector/InnerBox",
  extraLabel: "Extra Label/Inner",
  buffle: "Instruction/BuffleGSM",
  other: "Other",
  otherDoc: "Other Doc Pouch",
  otherBom: "Other Bom Component",
}

export function ChoiceCard({
  title,
  hint,
  selected,
  onSelect,
}: {
  title: string
  hint?: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden rounded-3xl border px-5 py-4 text-left transition-all duration-200 ease-out",
        selected
          ? "-translate-y-0.5 border-[var(--navy-border)] bg-[var(--navy-bg)] shadow-[var(--shadow-lg)]"
          : "border-transparent bg-[var(--surface)] shadow-[var(--shadow)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn("font-heading text-sm font-semibold tracking-tight", selected ? "text-[var(--navy)]" : "text-[var(--text)]")}>
            {title}
          </div>
          {hint ? <div className="mt-1.5 text-[12px] leading-4 text-[var(--text-muted)]">{hint}</div> : null}
        </div>
        <span
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full transition-all duration-200",
            selected ? "qc-check-pop bg-[var(--navy)] text-white shadow-sm" : "bg-[var(--bg)] text-transparent group-hover:text-[var(--text-muted)]",
          )}
        >
          <Check className="size-3.5" strokeWidth={2.5} />
        </span>
      </div>
    </button>
  )
}

export function ColourSwatches({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((colour) => {
        const selected = value === colour
        const fill = FABRIC_SWATCH[colour] || "#e4e4e2"
        return (
          <button
            key={colour}
            type="button"
            onClick={() => onChange(colour)}
            className="flex w-[72px] flex-col items-center gap-2"
          >
            <span
              className={cn(
                "size-12 rounded-full border border-black/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),0_8px_18px_rgba(17,17,16,0.12)] transition-transform duration-200",
                selected ? "qc-swatch-ring scale-110 ring-2 ring-[var(--navy)] ring-offset-2 ring-offset-[var(--surface)]" : "hover:scale-105",
              )}
              style={{ background: fill }}
            />
            <span className={cn("font-heading text-center text-[11px] font-semibold leading-4", selected ? "text-[var(--navy)]" : "text-[var(--text-secondary)]")}>
              {colour}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function SpecLine({ spec }: { spec: QuoteSpecification }) {
  const parts = [
    spec.constructionType,
    spec.topType,
    spec.bottomType,
    spec.length && spec.width && spec.height ? `${spec.length}×${spec.width}×${spec.height}` : "",
    spec.fabricColour,
  ].filter(Boolean)
  return <p className="mt-2 text-sm text-[var(--text-secondary)]">{parts.join(" · ")}</p>
}

export function BomCategoryNav({
  items,
  activeId,
  onChange,
}: {
  items: { id: string; label: string }[]
  activeId: string
  onChange: (id: string) => void
}) {
  return (
    <div className="lg:sticky lg:top-6 lg:w-[280px] lg:shrink-0">
      <div className="rounded-3xl bg-[var(--surface)] p-2.5 shadow-[var(--shadow-lg)]">
        <div className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.14em] text-[var(--text-muted)] uppercase">
          Categories
        </div>
        <div className="scrollbar-thin flex gap-1.5 overflow-x-auto p-1 lg:block lg:max-h-[min(70vh,640px)] lg:space-y-1 lg:overflow-y-auto">
          {items.map((item, index) => {
            const active = item.id === activeId
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={cn(
                  "font-heading flex min-w-max items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-[12px] leading-snug font-semibold transition-all duration-200 lg:w-full lg:min-w-0",
                  active
                    ? "bg-[var(--navy)] text-white shadow-[var(--shadow-navy)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--navy-bg)] hover:text-[var(--navy)]",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    active ? "bg-white/15 text-white" : "bg-[var(--bg)] text-[var(--text-muted)]",
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 whitespace-normal">{BOM_NAV_SHORT[item.id] || item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
