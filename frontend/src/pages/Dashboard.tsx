import { FileText, LayoutGrid, Plus, UserRound } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { PageHero, PageShell } from "@/components/layout/PageChrome"
import { CreateQuoteButton, QuoteTable } from "@/components/quote/QuoteTable"
import { useAuth } from "@/hooks/useAuth"
import { formatQuoteAmount, formatQty } from "@/lib/format"
import { api } from "@/services/api"
import type { DashboardData } from "@/types/quote"

const quickActions = [
  { label: "New Quote", to: "/quotes/new", icon: Plus },
  { label: "My Quotes", to: "/quotes", icon: FileText },
  { label: "Quote Template", to: "/quotes/new", icon: LayoutGrid },
  { label: "My Profile", to: "/profile", icon: UserRound },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .getDashboard()
      .then((result) => {
        if (active) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load the dashboard.")
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <PageShell>
        <div className="text-sm text-[var(--text-muted)]">Loading dashboard…</div>
      </PageShell>
    )
  }

  if (error || !data) {
    return (
      <PageShell>
        <div className="qc-card border-[var(--error-border)] bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
          {error || "Could not load the dashboard."}
        </div>
      </PageShell>
    )
  }

  const stats = [
    {
      label: "Quotes this month",
      value: data.stats.quotesThisMonth,
      delta: data.stats.quotesThisMonthDelta,
    },
    {
      label: "Quotes in progress",
      value: data.stats.inProgress,
      delta: data.stats.inProgressDelta,
    },
    {
      label: "Total spent (YTD)",
      value: data.stats.totalSpentYtd,
      delta: data.stats.totalSpentDelta,
    },
  ]

  return (
    <PageShell>
      <PageHero
        kicker="Customer portal"
        title={`Good morning, ${data.greetingName || user?.firstName}`}
        subtitle={data.dateLabel}
        action={<CreateQuoteButton onDark />}
      />

      <div className="qc-stagger mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="qc-stat">
            <div className="font-heading mb-2 text-[11px] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
              {stat.label}
            </div>
            <div className="font-heading mb-1 text-2xl font-bold tracking-tight">{stat.value}</div>
            <div className="text-xs text-[var(--text-muted)]">{stat.delta}</div>
          </div>
        ))}
      </div>

      <div className="qc-stagger mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.label} to={action.to} className="qc-card qc-card-hover font-heading flex flex-col items-center gap-2.5 px-3 py-5 text-sm font-semibold text-[var(--text-secondary)]">
            <span className="qc-icon-pop flex size-10 items-center justify-center rounded-2xl bg-[var(--navy-bg)] text-[var(--navy)]">
              <action.icon className="size-5" />
            </span>
            <span>{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="qc-card qc-table-card">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-heading text-sm font-semibold">Recent Quotations</h2>
          <Link to="/quotes" className="qc-link-draw text-xs font-semibold text-[var(--navy)]">
            View all →
          </Link>
        </div>
        {data.recentQuotes.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--text-muted)]">
            No quotations yet. Create your first quote to get started.
          </div>
        ) : (
          <QuoteTable quotes={data.recentQuotes} />
        )}
      </div>

      {data.pendingQuote && (
        <div className="qc-card mt-4 flex items-start gap-3 border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-3.5">
          <div className="mt-0.5 size-4 shrink-0 rounded-full border-[1.5px] border-[var(--warning)]" />
          <div className="flex-1">
            <div className="font-heading mb-0.5 text-xs font-semibold text-[var(--warning)]">
              Quotation {data.pendingQuote.number} awaiting your acceptance
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Valid until {data.pendingQuote.validUntil || "see quotation"} ·{" "}
              {formatQuoteAmount(data.pendingQuote.amount)} · {formatQty(data.pendingQuote.quantity)} units{" "}
              {data.pendingQuote.productName}
            </div>
          </div>
          <Link
            to={`/quotes/${data.pendingQuote.id}`}
            className="font-heading shrink-0 rounded-full bg-[var(--warning)] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Review
          </Link>
        </div>
      )}
    </PageShell>
  )
}
