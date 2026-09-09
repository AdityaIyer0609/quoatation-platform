import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/services/api"

const ROLES = [
  ["sales_executive", "Sales Executive"],
  ["sales_manager", "Sales Manager"],
  ["pricing_manager", "Pricing Manager"],
  ["admin", "Admin"],
] as const

type StaffRow = {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
}

export default function AdminUsers() {
  const [rows, setRows] = useState<StaffRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("sales_executive")

  async function reload() {
    const list = (await api.adminUsers()) as StaffRow[]
    setRows(list)
  }

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message))
  }, [])

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.createAdminUser({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
      })
      setFirstName("")
      setLastName("")
      setEmail("")
      setPassword("")
      setRole("sales_executive")
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the user.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-[960px] p-6 md:p-8">
      <h1 className="font-heading text-xl font-bold">Users & roles</h1>
      {error && <p className="mt-2 text-sm text-[var(--error)]">{error}</p>}
      <form className="mt-6 grid gap-2 sm:grid-cols-2" onSubmit={(event) => void onCreate(event)}>
        <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" required />
        <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" required />
        <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" required />
        <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" required />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
        >
          {ROLES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          disabled={saving}
          className="bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]"
        >
          {saving ? "Creating…" : "Create user"}
        </Button>
      </form>
      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-xs text-[var(--text-muted)]">
          <tr>
            <th className="py-2">Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--border)]">
              <td className="py-2">
                {row.firstName} {row.lastName}
              </td>
              <td>{row.email}</td>
              <td>
                <select
                  className="rounded border border-[var(--border)] px-2 py-1 text-sm"
                  value={row.role}
                  onChange={(event) =>
                    void api
                      .updateAdminUser(row.id, { role: event.target.value })
                      .then(() => reload())
                      .catch((err: Error) => setError(err.message))
                  }
                >
                  {ROLES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td>{row.isActive ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
