/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { api, type Session } from "@/services/api"

type AuthContextValue = {
  user: Session | null
  login: (email: string, password: string) => Promise<Session>
  logout: () => Promise<void>
  refresh: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(() => api.getSession())

  const login = useCallback(async (email: string, password: string) => {
    const session = await api.login(email, password)
    setUser(session)
    return session
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  const refresh = useCallback(() => {
    setUser(api.getSession())
  }, [])

  useEffect(() => api.onAuthExpired(() => setUser(null)), [])

  const value = useMemo(
    () => ({ user, login, logout, refresh }),
    [user, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
