import { Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

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
    <div className="mx-auto max-w-[960px] p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">My Quotes</h1>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            {loading ? "Loading…" : `${quotes.length} quotations total`}
          </p>
        </div>
        <CreateQuoteButton label="New quote" />
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by quote # or product"
            className="h-auto rounded-md border-[var(--border)] bg-[var(--surface)] py-2 pr-3 pl-9 text-sm focus-visible:border-[var(--navy)] focus-visible:ring-[3px] focus-visible:ring-[var(--navy-bg)]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className="font-heading rounded px-3 py-1.5 text-xs font-medium"
              style={{
                background: filter === item ? "var(--navy)" : "var(--surface)",
                color: filter === item ? "white" : "var(--text-secondary)",
                border: `1px solid ${filter === item ? "var(--navy)" : "var(--border)"}`,
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        {loading ? (
          <div className="px-5 py-16 text-center text-sm text-[var(--text-muted)]">
            Loading quotations…
          </div>
        ) : error ? (
          <div className="px-5 py-8 text-center text-sm text-red-800">{error}</div>
        ) : (
          <QuoteTable quotes={filtered} />
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div className="mt-3 text-center text-xs text-[var(--text-muted)]">
          Showing {filtered.length} of {quotes.length} quotations
        </div>
      )}
    </div>
  )
}
