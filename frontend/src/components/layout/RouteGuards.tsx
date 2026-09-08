import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/hooks/useAuth"

export function ProtectedRoute() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  return <Outlet />
}

export function GuestRoute() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
