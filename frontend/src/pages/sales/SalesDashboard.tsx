import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHero, PageShell } from "@/components/layout/PageChrome"
import { api } from "@/services/api"

type Dash = {
  greetingName: string
  role: string
  stats: Record<string, string>
  pendingQuotes: { id: string; number: string; productName: string; status: string; amount: number | null }[]
  manualPricingQuotes: { id: string; number: string; productName: string; status: string }[]
  recentActivity: { at: string; action: string; detail: string; actor: string }[]
}

export default function SalesDashboard() {
  const [data, setData] = useState<Dash | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.salesDashboard().then(setData).catch((err: Error) => setError(err.message))
  }, [])

  if (error) return <PageShell wide><div className="text-sm text-[var(--error)]">{error}</div></PageShell>
  if (!data) return <PageShell wide><div className="text-sm text-[var(--text-muted)]">Loading…</div></PageShell>

  const cards = [
    ["Quotations", data.stats.totalQuotes],
    ["Pending", data.stats.pendingActions],
    ["Manual pricing", data.stats.manualPricing],
    ["Accepted", data.stats.accepted],
    ["Rejected", data.stats.rejected],
  ]

  return (
    <PageShell wide>
      <PageHero kicker="Sales workspace" title={`Good morning, ${data.greetingName}`} subtitle="Pipeline, exceptions, and activity in one place." />
      <div className="qc-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="qc-stat">
            <div className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">{label}</div>
            <div className="font-heading mt-1 text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="qc-card p-5">
          <h2 className="font-heading mb-3 text-sm font-semibold">Pending actions</h2>
          <ul className="space-y-2">
            {data.pendingQuotes.length === 0 && (
              <li className="text-sm text-[var(--text-muted)]">No pending quotations.</li>
            )}
            {data.pendingQuotes.map((item) => (
              <li key={item.id}>
                <Link to={`/sales/quotes/${item.id}`} className="qc-row-card flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm">
                  <span>{item.number} · {item.productName}</span>
                  <StatusBadge status={item.status as never} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="qc-card p-5">
          <h2 className="font-heading mb-3 text-sm font-semibold">Manual pricing</h2>
          <ul className="space-y-2">
            {data.manualPricingQuotes.length === 0 && (
              <li className="text-sm text-[var(--text-muted)]">No manual-pricing quotations.</li>
            )}
            {data.manualPricingQuotes.map((item) => (
              <li key={item.id}>
                <Link to={`/sales/quotes/${item.id}`} className="qc-row-card flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm">
                  <span>{item.number}</span>
                  <span className="text-xs text-[var(--warning)]">Needs pricing</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="qc-card mt-8 p-5">
        <h2 className="font-heading mb-3 text-sm font-semibold">Recent activity</h2>
        <ul className="space-y-2 text-sm">
          {data.recentActivity.map((item, index) => (
            <li key={`${item.at}-${index}`} className="rounded-2xl border border-[var(--border)] px-3 py-2">
              <div className="text-xs text-[var(--text-muted)]">{item.at} · {item.actor}</div>
              <div>{item.action}{item.detail ? `: ${item.detail}` : ""}</div>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}
