import { Link } from "react-router-dom"

import { QuoteCraftMark } from "@/components/login/QuoteCraftMark"
import { cn } from "@/lib/utils"

export function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <QuoteCraftMark className={cn(compact ? "size-6 text-xs" : "size-7 text-xs")} />
      <div className={compact ? undefined : "leading-tight"}>
        <div className="font-heading text-sm font-semibold text-[var(--text)]">
          QuoteCraft
        </div>
        {!compact && (
          <div className="text-[10px] font-semibold text-[var(--navy-muted)]">Manufacturing</div>
        )}
      </div>
    </Link>
  )
}
