import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { ClickRow } from "@/components/common/ClickRow"
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
    <div className="qc-page max-w-[1100px]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">Quotations</h1>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{rows.length} quotations total</p>
        </div>
        <Link
          to="/sales/quotes/new"
          className="qc-btn h-auto px-4 py-2.5 text-sm"
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
      <div className="qc-card qc-table-card mt-4 px-3">
      <table className="qc-table text-left text-sm">
        <thead className="text-xs text-[var(--text-muted)]">
          <tr>
            <th className="px-3 py-2">Number</th>
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Amount</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ClickRow key={String(row.id)} to={`/sales/quotes/${row.id}`}>
              <td className="px-3 py-2.5 font-medium text-[var(--navy)]">{String(row.number)}</td>
              <td className="px-3 py-2.5">{String(row.customerName || row.company || "")}</td>
              <td className="px-3 py-2.5">{formatQuoteAmount(row.requiresManualPricing ? null : ((row.amount as number | null) ?? null))}</td>
              <td className="px-3 py-2.5"><StatusBadge status={row.status as never} /></td>
            </ClickRow>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
