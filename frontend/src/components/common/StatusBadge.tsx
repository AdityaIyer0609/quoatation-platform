import { statusLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { QuoteStatus } from "@/types/quote"

const styles: Record<QuoteStatus, string> = {
  draft: "bg-[#F4F4F2] text-[#6B6B68]",
  quoted: "bg-[#EDF2F8] text-[#1A3C5E]",
  accepted: "bg-[#F0FDF4] text-[#16A34A]",
  expired: "bg-[#FEF2F2] text-[#DC2626]",
  rejected: "bg-[#FEF2F2] text-[#DC2626]",
  revision_requested: "bg-[#FFFBEB] text-[#D97706]",
}

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={cn(
        "font-heading inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {statusLabel[status]}
    </span>
  )
}
