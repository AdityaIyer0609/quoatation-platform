import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import { BrandPanel } from "@/components/login/BrandPanel"
import { ForgotPasswordForm } from "@/components/login/ForgotPasswordForm"
import { LoginForm } from "@/components/login/LoginForm"
import { QuoteCraftMark } from "@/components/login/QuoteCraftMark"
import { ResetSent } from "@/components/login/ResetSent"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/services/api"

type LoginView = "sign-in" | "forgot" | "inbox"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("arjun@packtech.in")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<LoginView>("sign-in")

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.")
      return
    }
    setLoading(true)
    try {
      const session = await login(email, password)
      navigate(session.kind === "staff" ? "/sales" : "/dashboard", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    await api.requestPasswordReset(email)
    setLoading(false)
    setView("inbox")
  }

  return (
    <div className="flex min-h-screen">
      <BrandPanel />
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-[360px]">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <QuoteCraftMark className="size-7 text-xs" />
            <span className="font-heading text-sm font-semibold">QuoteCraft</span>
          </div>

          {view === "sign-in" ? (
            <>
              <LoginForm
                email={email}
                password={password}
                loading={loading}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onForgotPassword={() => setView("forgot")}
                onSubmit={handleSubmit}
              />
              {error && (
                <p className="mt-3 text-center text-xs text-[var(--error)]">{error}</p>
              )}
            </>
          ) : view === "inbox" ? (
            <ResetSent
              email={email}
              onBack={() => {
                setView("sign-in")
                setLoading(false)
              }}
            />
          ) : (
            <ForgotPasswordForm
              email={email}
              loading={loading}
              onBack={() => setView("sign-in")}
              onEmailChange={setEmail}
              onSubmit={handleForgot}
            />
          )}

          <div className="mt-12 flex items-center gap-4 border-t border-[var(--border)] pt-6">
            <span className="text-[11px] text-[var(--text-muted)]">
              © 2025 QuoteCraft Manufacturing
            </span>
            <a href="#" className="text-[11px] text-[var(--text-muted)]">
              Privacy
            </a>
            <a href="#" className="text-[11px] text-[var(--text-muted)]">
              Terms
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
