import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const steps = [
  { id: 1, label: "Product" },
  { id: 2, label: "Construction" },
  { id: 3, label: "Specifications" },
  { id: 4, label: "Components" },
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
    <div className="mb-8 flex items-center justify-between">
      {steps.map((step, index) => {
        const done = step.id < current
        const active = step.id === current
        return (
          <div key={step.id} className="relative flex flex-1 flex-col items-center">
            {index < steps.length - 1 && (
              <div
                className="absolute top-[15px] right-[calc(-50%+18px)] left-[calc(50%+18px)] h-px"
                style={{ background: done ? "var(--navy)" : "var(--border)" }}
              />
            )}
            <button
              type="button"
              onClick={() => {
                if (done || active) onStepClick(step.id)
              }}
              className={cn(
                "font-heading relative z-10 mb-1.5 flex size-8 items-center justify-center rounded-full text-xs font-semibold",
                done || active
                  ? "border-[1.5px] border-[var(--navy)] bg-[var(--navy)] text-white"
                  : "border-[1.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]",
              )}
            >
              {done ? <Check className="size-3" /> : step.id}
            </button>
            <span
              className={cn(
                "font-heading hidden text-[10px] font-medium sm:block",
                active
                  ? "text-[var(--navy)]"
                  : done
                    ? "text-[var(--text-secondary)]"
                    : "text-[var(--text-muted)]",
              )}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
