import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/services/api"

export default function SalesApprovals() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const canAct = user?.role === "admin" || user?.role === "pricing_manager"

  useEffect(() => {
    api.salesQuotes({ manualOnly: "true" }).then(setRows).catch(() => undefined)
  }, [])

  return (
    <div className="mx-auto max-w-[960px] p-6 md:p-8">
      <h1 className="font-heading text-xl font-bold">Manual pricing</h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Frozen Book4 snapshots are not recalculated. Approve or resolve the commercial exception.
      </p>
      <ul className="mt-6 space-y-4">
        {rows.map((row) => (
          <li key={String(row.id)} className="rounded-lg border border-[var(--border)] p-4">
            <div className="flex items-center justify-between">
              <Link className="font-medium text-[var(--navy)]" to={`/sales/quotes/${row.id}`}>{String(row.number)}</Link>
              <span className="text-xs">{String(row.manualPricingStatus ?? "pending")}</span>
            </div>
            <div className="mt-1 text-sm">{String(row.customerName || row.company)}</div>
            {canAct && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={notes[String(row.id)] ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [String(row.id)]: event.target.value }))}
                  placeholder="Note"
                />
                <div className="flex gap-2">
                  <Button
                    className="bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]"
                    onClick={() =>
                      void api.salesManualPricing(String(row.id), "approved", notes[String(row.id)] ?? "").then(() =>
                        api.salesQuotes({ manualOnly: "true" }).then(setRows),
                      )
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void api.salesManualPricing(String(row.id), "resolved", notes[String(row.id)] ?? "").then(() =>
                        api.salesQuotes({ manualOnly: "true" }).then(setRows),
                      )
                    }
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
