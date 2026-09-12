import { statusLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { QuoteStatus } from "@/types/quote"

const styles: Record<QuoteStatus, string> = {
  draft: "bg-[var(--bg)] text-[var(--text-secondary)]",
  quoted: "bg-[var(--navy-bg)] text-[var(--navy)]",
  accepted: "bg-[var(--success-bg)] text-[var(--success)]",
  expired: "bg-[var(--error-bg)] text-[var(--error)]",
  rejected: "bg-[var(--error-bg)] text-[var(--error)]",
  revision_requested: "bg-[var(--warning-bg)] text-[var(--warning)]",
}

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={cn(
        "font-heading inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {statusLabel[status]}
    </span>
  )
}
