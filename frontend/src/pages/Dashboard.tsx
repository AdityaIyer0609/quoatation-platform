import { FileText, LayoutGrid, Plus, UserRound } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

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
      <div className="mx-auto max-w-[960px] p-6 md:p-8">
        <div className="text-sm text-[var(--text-muted)]">Loading dashboard…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-[960px] p-6 md:p-8">
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error || "Could not load the dashboard."}
        </div>
      </div>
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
    <div className="mx-auto max-w-[960px] p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading mb-1 text-2xl font-bold">
            Good morning, {data.greetingName || user?.firstName}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{data.dateLabel}</p>
        </div>
        <CreateQuoteButton />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <div className="font-heading mb-2 text-xs font-medium text-[var(--text-muted)]">
              {stat.label}
            </div>
            <div className="font-heading mb-1 text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-[var(--text-muted)]">{stat.delta}</div>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="font-heading flex flex-col items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--navy-border)] hover:bg-[var(--navy-bg)] hover:text-[var(--navy)]"
          >
            <action.icon className="size-5" />
            <span>{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-heading text-sm font-semibold">Recent Quotations</h2>
          <Link to="/quotes" className="text-xs font-medium text-[var(--navy)]">
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
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-3.5">
          <div className="mt-0.5 size-4 shrink-0 rounded-full border-[1.5px] border-[var(--warning)]" />
          <div className="flex-1">
            <div className="font-heading mb-0.5 text-xs font-semibold text-[var(--warning)]">
              Quotation {data.pendingQuote.number} awaiting your acceptance
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Valid until {data.pendingQuote.validUntil || "see quotation"} ·{" "}
              {formatQuoteAmount(data.pendingQuote.amount)} ·{" "}
              {formatQty(data.pendingQuote.quantity)} units{" "}
              {data.pendingQuote.productName}
            </div>
          </div>
          <Link
            to={`/quotes/${data.pendingQuote.id}`}
            className="font-heading shrink-0 rounded bg-[var(--warning)] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Review
          </Link>
        </div>
      )}
    </div>
  )
}
