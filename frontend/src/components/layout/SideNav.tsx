import { FileText, LayoutGrid, Plus, UserRound } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid, highlight: false },
  { to: "/quotes/new", label: "New Quote", icon: Plus, highlight: true },
  { to: "/quotes", label: "My Quotes", icon: FileText, highlight: false },
  { to: "/profile", label: "Profile", icon: UserRound, highlight: false },
]

function navIsActive(pathname: string, to: string) {
  if (to === "/quotes/new") return pathname.startsWith("/quotes/new")
  if (to === "/quotes") {
    return (
      pathname === "/quotes" ||
      (/^\/quotes\/[^/]+/.test(pathname) && !pathname.startsWith("/quotes/new"))
    )
  }
  return pathname === to
}

export function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {items.map((item) => {
        const active = navIsActive(pathname, item.to)
        return (
          <NavLink key={item.to} to={item.to} onClick={onNavigate}>
            {item.highlight ? (
              <span
                className={cn(
                  "font-heading flex w-full items-center gap-2.5 rounded px-3 py-2 text-sm font-medium text-white",
                  active
                    ? "bg-[var(--navy-hover)]"
                    : "bg-[var(--navy)] hover:bg-[var(--navy-hover)]",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </span>
            ) : (
              <span
                className={cn(
                  "font-heading flex w-full items-center gap-2.5 rounded px-3 py-2 text-sm",
                  active
                    ? "bg-[var(--navy-bg)] font-semibold text-[var(--navy)]"
                    : "font-medium text-[var(--text-secondary)] hover:bg-[var(--bg)]",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="flex border-t border-[var(--border)] bg-[var(--surface)] md:hidden">
      {items.map((item) => {
        const active = navIsActive(pathname, item.to)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-1 flex-col items-center gap-1 py-2.5"
          >
            <span
              className={cn(
                "font-heading flex flex-col items-center gap-1 text-[10px] font-medium",
                active ? "text-[var(--navy)]" : "text-[var(--text-muted)]",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
