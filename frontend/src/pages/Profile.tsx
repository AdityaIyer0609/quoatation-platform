import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fieldClassName } from "@/components/login/fieldStyles"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/services/api"
import type { CustomerProfile } from "@/types/quote"

export default function Profile() {
  const { logout, refresh } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getProfile()
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load your profile."))
  }, [])

  function update<K extends keyof CustomerProfile>(key: K, value: CustomerProfile[K]) {
    if (!profile) return
    setProfile({ ...profile, [key]: value })
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!profile) return
    setSaving(true)
    setError(null)
    try {
      await api.saveProfile(profile)
      refresh()
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await logout()
    navigate("/", { replace: true })
  }

  if (error && !profile) {
    return (
      <div className="mx-auto max-w-[720px] p-6 md:p-8 text-sm text-red-800">
        {error}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-[720px] p-6 md:p-8 text-sm text-[var(--text-muted)]">
        Loading profile…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[720px] p-6 md:p-8">
      <h1 className="font-heading mb-1 text-xl font-bold">Profile & Company</h1>
      <p className="mb-7 text-sm text-[var(--text-secondary)]">
        Your account and company information used in quotations
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="font-heading flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--navy-muted)] text-lg font-semibold text-white">
            {profile.firstName[0]}
            {profile.lastName[0]}
          </div>
          <div className="flex-1">
            <div className="font-heading mb-0.5 text-sm font-semibold">
              {profile.firstName} {profile.lastName}
            </div>
            <div className="mb-2 text-xs text-[var(--text-secondary)]">
              {profile.designation} · {profile.company}
            </div>
            <button type="button" className="text-xs font-medium text-[var(--navy)]">
              Change photo
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-5 py-3.5">
            <h2 className="font-heading text-sm font-semibold">Personal Information</h2>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First name">
                <Input
                  className={fieldClassName}
                  value={profile.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
              </Field>
              <Field label="Last name">
                <Input
                  className={fieldClassName}
                  value={profile.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
              </Field>
              <Field label="Email address">
                <Input
                  type="email"
                  className={fieldClassName}
                  value={profile.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field label="Phone number">
                <Input
                  type="tel"
                  className={fieldClassName}
                  value={profile.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Designation">
              <Input
                className={fieldClassName}
                value={profile.designation}
                onChange={(e) => update("designation", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-5 py-3.5">
            <h2 className="font-heading text-sm font-semibold">Company Information</h2>
          </div>
          <div className="space-y-4 px-5 py-5">
            <Field label="Company name">
              <Input
                className={fieldClassName}
                value={profile.company}
                onChange={(e) => update("company", e.target.value)}
              />
            </Field>
            <Field label="GST number">
              <Input
                className={`${fieldClassName} font-quote-mono text-[13px]`}
                value={profile.gst}
                onChange={(e) => update("gst", e.target.value)}
              />
            </Field>
            <Field label="Street address">
              <Input
                className={fieldClassName}
                value={profile.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2 sm:col-span-1">
                <Field label="City">
                  <Input
                    className={fieldClassName}
                    value={profile.city}
                    onChange={(e) => update("city", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="State">
                <Input
                  className={fieldClassName}
                  value={profile.state}
                  onChange={(e) => update("state", e.target.value)}
                />
              </Field>
              <Field label="Pincode">
                <Input
                  className={fieldClassName}
                  value={profile.pincode}
                  onChange={(e) => update("pincode", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <div>
            {saved && (
              <div className="text-xs text-[var(--success)]">Changes saved</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-auto rounded-md px-4 py-2.5 text-sm"
              onClick={() => api.getProfile().then(setProfile)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="font-heading h-auto rounded-md bg-[var(--navy)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--navy-hover)]"
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] p-5">
          <div className="font-heading mb-1 text-sm font-semibold text-[var(--error)]">
            Account actions
          </div>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto rounded-md border-[var(--error-border)] px-3.5 py-2 text-xs text-[var(--error)]"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto rounded-md border-[var(--error-border)] px-3.5 py-2 text-xs text-[var(--error)]"
            >
              Change password
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <Label className="font-heading mb-1.5 text-xs text-[var(--text-secondary)]">
        {label}
      </Label>
      {children}
    </div>
  )
}
