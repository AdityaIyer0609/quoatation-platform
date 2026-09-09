import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { formatQuoteAmount } from "@/lib/format"
import { api } from "@/services/api"

export default function SalesCustomerDetail() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null)
  const [quotes, setQuotes] = useState<Record<string, unknown>[]>([])
  const [assignees, setAssignees] = useState<{ id: number; firstName: string; lastName: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const canAssign = user?.role === "admin" || user?.role === "sales_manager"
  const canQuote = user?.role !== "pricing_manager"

  useEffect(() => {
    Promise.all([api.salesCustomer(id), api.salesCustomerQuotes(id)])
      .then(([cust, list]) => {
        setCustomer(cust)
        setQuotes(list)
      })
      .catch((err: Error) => setError(err.message))
    if (canAssign) {
      api.salesAssignees().then(setAssignees).catch(() => undefined)
    }
  }, [id, canAssign])

  async function assign(staffId: string) {
    await api.assignCustomer(id, staffId ? Number(staffId) : null)
    setCustomer(await api.salesCustomer(id))
  }

  if (error) return <div className="p-8 text-sm text-[var(--error)]">{error}</div>
  if (!customer) return <div className="p-8 text-sm">Loading…</div>

  return (
    <div className="mx-auto max-w-[960px] p-6 md:p-8">
      <Link to="/sales/customers" className="text-xs text-[var(--navy)]">Back to customers</Link>
      <h1 className="font-heading mt-2 text-xl font-bold">{String(customer.company || customer.email)}</h1>
      <p className="text-sm text-[var(--text-secondary)]">
        {String(customer.firstName)} {String(customer.lastName)} · {String(customer.email)}
      </p>
      {canAssign && (
        <div className="mt-4">
          <label className="text-xs text-[var(--text-muted)]">Assigned salesperson</label>
          <select
            className="mt-1 block rounded-md border border-[var(--border)] px-3 py-2 text-sm"
            value={String(customer.assignedStaffId ?? "")}
            onChange={(event) => void assign(event.target.value)}
          >
            <option value="">Unassigned</option>
            {assignees.map((item) => (
              <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>
            ))}
          </select>
        </div>
      )}
      {canQuote && (
        <Button
          className="mt-4 bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]"
          onClick={() => {
            sessionStorage.setItem("quotecraft.salesCustomerId", id)
            navigate("/sales/quotes/new")
          }}
        >
          Create quote
        </Button>
      )}
      <h2 className="font-heading mt-8 mb-3 text-sm font-semibold">Quote history</h2>
      <ul className="space-y-2">
        {quotes.map((item) => (
          <li key={String(item.id)}>
            <Link to={`/sales/quotes/${item.id}`} className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2 text-sm">
              <span>{String(item.number)} · {formatQuoteAmount(item.requiresManualPricing ? null : (item.amount as number | null))}</span>
              <StatusBadge status={item.status as never} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
