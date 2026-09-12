import { Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { PageHero, PageShell } from "@/components/layout/PageChrome"
import { CreateQuoteButton, QuoteTable } from "@/components/quote/QuoteTable"
import { Input } from "@/components/ui/input"
import { api } from "@/services/api"
import type { QuoteListItem, QuoteStatus } from "@/types/quote"

const filters = ["All", "Draft", "Quoted", "Accepted", "Expired"] as const

const filterMap: Record<(typeof filters)[number], QuoteStatus | "all"> = {
  All: "all",
  Draft: "draft",
  Quoted: "quoted",
  Accepted: "accepted",
  Expired: "expired",
}

export default function MyQuotes() {
  const [quotes, setQuotes] = useState<QuoteListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<(typeof filters)[number]>("All")

  useEffect(() => {
    let active = true
    api
      .getQuotes()
      .then((items) => {
        if (active) {
          setQuotes(items)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load quotations.")
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const status = filterMap[filter]
    return quotes.filter((quote) => {
      const haystack = `${quote.number} ${quote.productName}`.toLowerCase()
      const matchSearch = haystack.includes(search.toLowerCase())
      const matchFilter = status === "all" || quote.status === status
      return matchSearch && matchFilter
    })
  }, [quotes, search, filter])

  return (
    <PageShell>
      <PageHero
        kicker="Library"
        title="My Quotes"
        subtitle={loading ? "Loading…" : `${quotes.length} quotations total`}
        action={<CreateQuoteButton label="New quote" onDark />}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by quote # or product"
            className="h-auto rounded-2xl border-[var(--border)] bg-[var(--surface)] py-2.5 pr-3 pl-9 text-sm shadow-[var(--shadow)] focus-visible:border-[var(--navy)] focus-visible:ring-[3px] focus-visible:ring-[var(--navy-bg)]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={filter === item ? "qc-chip qc-chip-on" : "qc-chip"}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="qc-card qc-table-card">
        {loading ? (
          <div className="px-5 py-16 text-center text-sm text-[var(--text-muted)]">Loading quotations…</div>
        ) : error ? (
          <div className="px-5 py-8 text-center text-sm text-[var(--error)]">{error}</div>
        ) : (
          <QuoteTable quotes={filtered} />
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div className="mt-3 text-center text-xs text-[var(--text-muted)]">
          Showing {filtered.length} of {quotes.length} quotations
        </div>
      )}
    </PageShell>
  )
}
