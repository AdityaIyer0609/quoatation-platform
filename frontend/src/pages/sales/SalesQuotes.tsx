import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { StatusBadge } from "@/components/common/StatusBadge"
import { Input } from "@/components/ui/input"
import { formatQuoteAmount } from "@/lib/format"
import { api } from "@/services/api"

export default function SalesQuotes() {
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState<string | null>(null)
  const search = params.get("search") ?? ""
  const status = params.get("status") ?? ""
  const manualOnly = params.get("manualOnly") === "true"

  useEffect(() => {
    const query: Record<string, string> = {}
    if (search) query.search = search
    if (status) query.status = status
    if (manualOnly) query.manualOnly = "true"
    api.salesQuotes(query).then(setRows).catch((err: Error) => setError(err.message))
  }, [search, status, manualOnly])

  return (
    <div className="mx-auto max-w-[1100px] p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">Quotations</h1>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{rows.length} quotations total</p>
        </div>
        <Link
          to="/sales/quotes/new"
          className="font-heading inline-flex h-auto shrink-0 items-center rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--navy-hover)]"
        >
          New quote
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Input
          value={search}
          placeholder="Search number or product"
          className="max-w-xs"
          onChange={(event) => {
            params.set("search", event.target.value)
            setParams(params)
          }}
        />
        <select
          value={status}
          className="rounded-md border border-[var(--border)] px-2 py-2 text-sm"
          onChange={(event) => {
            params.set("status", event.target.value)
            setParams(params)
          }}
        >
          <option value="">All statuses</option>
          <option value="quoted">Quoted</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="revision_requested">Revision</option>
        </select>
      </div>
      {error && <p className="mt-3 text-sm text-[var(--error)]">{error}</p>}
      <table className="mt-4 w-full text-left text-sm">
        <thead className="text-xs text-[var(--text-muted)]">
          <tr>
            <th className="py-2">Number</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.id)} className="border-t border-[var(--border)]">
              <td className="py-2">
                <Link className="text-[var(--navy)]" to={`/sales/quotes/${row.id}`}>{String(row.number)}</Link>
              </td>
              <td>{String(row.customerName || row.company || "")}</td>
              <td>{formatQuoteAmount(row.requiresManualPricing ? null : ((row.amount as number | null) ?? null))}</td>
              <td><StatusBadge status={row.status as never} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
