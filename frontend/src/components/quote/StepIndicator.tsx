import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const steps = [
  { id: 1, label: "Product" },
  { id: 2, label: "Construction" },
  { id: 3, label: "Specifications" },
  { id: 4, label: "BOM" },
  { id: 5, label: "Review" },
]

export function StepIndicator({
  current,
  onStepClick,
}: {
  current: number
  onStepClick: (step: number) => void
}) {
  return (
    <div className="mb-8 rounded-3xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] p-2 shadow-[var(--shadow-md)] backdrop-blur-md">
      <div className="flex items-center gap-1">
        {steps.map((step) => {
          const done = step.id < current
          const active = step.id === current
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                if (done || active) onStepClick(step.id)
              }}
              className={cn(
                "font-heading flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-2 py-2.5 text-left transition-all duration-200 sm:px-3",
                active
                  ? "bg-[var(--navy)] text-white shadow-[var(--shadow-navy)]"
                  : done
                    ? "bg-[var(--navy-bg)] text-[var(--navy)] hover:-translate-y-px hover:shadow-[var(--shadow)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg)]",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                  active
                    ? "bg-white/20 text-white ring-1 ring-white/30"
                    : done
                      ? "bg-[var(--navy)] text-white"
                      : "border border-[var(--navy-border)] bg-[var(--navy-bg)] text-[var(--navy)]",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={2.5} /> : step.id}
              </span>
              <span className={cn("hidden truncate text-xs font-bold sm:block", !active && !done && "font-semibold")}>
                {step.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
