import { Menu, X } from "lucide-react"
import { useState } from "react"
import { Outlet } from "react-router-dom"

import { AppLogo } from "@/components/layout/AppLogo"
import { SalesBottomNav, SalesSideNav } from "@/components/layout/SalesSideNav"
import { useAuth } from "@/hooks/useAuth"

export function SalesLayout() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-full">
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] md:flex">
        <div className="border-b border-[var(--border)] px-6 py-5">
          <AppLogo />
        </div>
        <SalesSideNav />
        <div className="border-t border-[var(--border)] px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--navy-muted)] text-xs font-semibold text-white">
              {user?.initials ?? "QC"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-[var(--text)]">
                {user ? `${user.firstName} ${user.lastName}` : ""}
              </div>
              <div className="truncate text-[10px] text-[var(--text-muted)]">
                {user?.email ?? ""}
              </div>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:hidden">
          <AppLogo compact />
          <button
            type="button"
            className="rounded p-1.5 text-[var(--text-secondary)]"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
          </button>
        </header>
        {mobileOpen && (
          <div className="space-y-0.5 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2 md:hidden">
            <SalesSideNav onNavigate={() => setMobileOpen(false)} />
          </div>
        )}
        <main className="scrollbar-thin flex-1 overflow-auto">
          <Outlet />
        </main>
        <SalesBottomNav />
      </div>
    </div>
  )
}
