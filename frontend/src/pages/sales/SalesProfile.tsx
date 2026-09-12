import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { AppearancePicker } from "@/components/layout/ThemeToggle"
import { useAuth } from "@/hooks/useAuth"

const ROLE_LABEL: Record<string, string> = {
  sales_executive: "Sales Executive",
  sales_manager: "Sales Manager",
  pricing_manager: "Pricing Manager",
  admin: "Admin",
}

export default function SalesProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await logout()
    navigate("/", { replace: true })
  }

  if (!user) return null

  return (
    <div className="qc-page max-w-[720px]">
      <h1 className="font-heading mb-1 text-xl font-bold">Profile</h1>
      <p className="mb-7 text-sm text-[var(--text-secondary)]">Your sales portal account</p>
      <section className="qc-card mb-6 overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-3.5">
          <h2 className="font-heading text-sm font-semibold">Appearance</h2>
        </div>
        <div className="px-5 py-5">
          <AppearancePicker />
        </div>
      </section>
      <div className="qc-card flex items-center gap-4 p-5">
        <div className="font-heading flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--navy-muted)] text-lg font-semibold text-white">
          {user.initials}
        </div>
        <div>
          <div className="font-heading text-sm font-semibold">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">{user.email}</div>
          <div className="mt-1 text-xs text-[var(--navy)]">{ROLE_LABEL[user.role] ?? user.role}</div>
        </div>
      </div>
      <div className="qc-card mt-6 border-[var(--error-border)] bg-[var(--error-bg)] p-5">
        <div className="font-heading mb-1 text-sm font-semibold text-[var(--error)]">Account actions</div>
        <Button
          type="button"
          variant="outline"
          className="mt-3 h-auto rounded-md border-[var(--error-border)] px-3.5 py-2 text-xs text-[var(--error)]"
          onClick={() => void handleSignOut()}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}
