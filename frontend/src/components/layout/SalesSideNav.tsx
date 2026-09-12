import {
  CheckSquare,
  FileText,
  LayoutGrid,
  Plus,
  Shield,
  UserRound,
  Users,
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import type { StaffRole } from "@/services/api"

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutGrid
  highlight?: boolean
  roles?: StaffRole[]
}

const allItems: NavItem[] = [
  { to: "/sales", label: "Dashboard", icon: LayoutGrid },
  { to: "/sales/quotes/new", label: "New Quote", icon: Plus, highlight: true, roles: ["sales_executive", "sales_manager", "admin"] },
  { to: "/sales/quotes", label: "Quotations", icon: FileText },
  { to: "/sales/customers", label: "Customers", icon: Users, roles: ["sales_executive", "sales_manager", "admin"] },
  { to: "/sales/approvals", label: "Manual pricing", icon: CheckSquare, roles: ["pricing_manager", "sales_manager", "admin"] },
  { to: "/sales/admin/users", label: "Users & roles", icon: Shield, roles: ["admin"] },
  { to: "/sales/profile", label: "Profile", icon: UserRound },
]

function allowed(role: string, item: NavItem) {
  if (!item.roles) return true
  if (role === "admin") return true
  return item.roles.includes(role as StaffRole)
}

function navIsActive(pathname: string, to: string) {
  if (to === "/sales") return pathname === "/sales"
  if (to === "/sales/quotes/new") {
    return pathname.startsWith("/sales/quotes/new") || pathname.startsWith("/sales/quotes/configure")
  }
  if (to === "/sales/quotes") {
    return (
      pathname === "/sales/quotes" ||
      (/^\/sales\/quotes\/[^/]+/.test(pathname) &&
        !pathname.startsWith("/sales/quotes/new") &&
        !pathname.startsWith("/sales/quotes/configure"))
    )
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function SalesSideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const role = user?.role ?? "sales_executive"
  const items = allItems.filter((item) => allowed(role, item))

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {items.map((item) => {
        const active = navIsActive(pathname, item.to)
        return (
          <NavLink key={item.to} to={item.to} onClick={onNavigate}>
            {item.highlight ? (
              <span className={cn("qc-nav qc-nav-cta", active && "bg-[var(--navy-hover)]")}>
                <item.icon className="size-4" />
                {item.label}
              </span>
            ) : (
              <span className={cn("qc-nav", active && "qc-nav-active")}>
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

export function SalesBottomNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const role = user?.role ?? "sales_executive"
  const visible = allItems.filter((item) => allowed(role, item))
  const preferred = ["/sales", "/sales/quotes/new", "/sales/quotes", "/sales/profile"]
  const items = preferred
    .map((to) => visible.find((item) => item.to === to))
    .filter((item): item is NavItem => Boolean(item))

  return (
    <nav className="flex border-t border-[var(--border)] bg-[var(--surface)] md:hidden">
      {items.map((item) => {
        const active = navIsActive(pathname, item.to)
        return (
          <NavLink key={item.to} to={item.to} className="flex flex-1 flex-col items-center gap-1 py-2.5">
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
