import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/services/api"

export default function SalesCustomerNew() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [company, setCompany] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const created = await api.createSalesCustomer({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim(),
      })
      navigate(`/sales/customers/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the customer.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-md p-6 md:p-8">
      <h1 className="font-heading text-xl font-bold">New customer</h1>
      <form className="mt-6 space-y-3" onSubmit={(event) => void onSubmit(event)}>
        <Input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company" required />
        <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" required />
        <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" required />
        <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" required />
        <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Portal password" required />
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        <Button
          type="submit"
          disabled={saving}
          className="bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]"
        >
          {saving ? "Saving…" : "Create customer"}
        </Button>
      </form>
    </div>
  )
}
