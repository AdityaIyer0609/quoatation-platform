import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/hooks/useAuth"
import type { StaffRole } from "@/services/api"

function homeFor(user: { kind?: string } | null) {
  return user?.kind === "staff" ? "/sales" : "/dashboard"
}

export function ProtectedRoute() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  return <Outlet />
}

export function GuestRoute() {
  const { user } = useAuth()
  if (user) return <Navigate to={homeFor(user)} replace />
  return <Outlet />
}

export function CustomerPortalRoute() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (user.kind === "staff") return <Navigate to="/sales" replace />
  return <Outlet />
}

export function StaffPortalRoute() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (user.kind !== "staff") return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export function StaffRoleRoute({ roles }: { roles: StaffRole[] }) {
  const { user } = useAuth()
  if (!user || user.kind !== "staff") return <Navigate to="/" replace />
  if (user.role !== "admin" && !roles.includes(user.role as StaffRole)) {
    return <Navigate to="/sales" replace />
  }
  return <Outlet />
}
