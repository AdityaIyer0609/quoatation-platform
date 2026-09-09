import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/services/api"

type Row = {
  id: string
  email: string
  firstName: string
  lastName: string
  company: string
  assignedStaffName: string | null
  quoteCount: number
}

export default function SalesCustomers() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)
  const canCreate = user?.role === "admin" || user?.role === "sales_manager"

  useEffect(() => {
    const handle = window.setTimeout(() => {
      api.salesCustomers(search).then(setRows).catch((err: Error) => setError(err.message))
    }, 200)
    return () => window.clearTimeout(handle)
  }, [search])

  return (
    <div className="mx-auto max-w-[1100px] p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold">Customers</h1>
        {canCreate && (
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]" onClick={() => navigate("/sales/customers/new")}>
            Add customer
          </Button>
        )}
      </div>
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, name or email" className="mb-4 max-w-sm" />
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg)] text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Assigned</th>
              <th className="px-3 py-2">Quotes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2">
                  <Link className="font-medium text-[var(--navy)]" to={`/sales/customers/${row.id}`}>
                    {row.company || row.email}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.firstName} {row.lastName}</td>
                <td className="px-3 py-2">{row.assignedStaffName || "—"}</td>
                <td className="px-3 py-2">{row.quoteCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
