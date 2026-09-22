import { Link } from "react-router-dom"

import { QuoteCraftMark } from "@/components/login/QuoteCraftMark"
import { cn } from "@/lib/utils"

export function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <QuoteCraftMark className={cn(compact ? "size-8" : "size-9")} />
      <div className={compact ? "min-w-0" : "min-w-0 leading-tight"}>
        <div className="font-heading text-sm font-semibold text-[var(--text)]">HPBL</div>
        {!compact && (
          <div className="text-[10px] font-semibold leading-snug text-[var(--navy-muted)]">
            HCP Plastene Bulkpack Limited
          </div>
        )}
      </div>
    </Link>
  )
}
