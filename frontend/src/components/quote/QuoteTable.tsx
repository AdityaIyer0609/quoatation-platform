import { Plus } from "lucide-react"
import { Link } from "react-router-dom"

import { StatusBadge } from "@/components/common/StatusBadge"
import { formatQuoteAmount, formatQty } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { QuoteListItem } from "@/types/quote"

export function QuoteTable({ quotes }: { quotes: QuoteListItem[] }) {
  if (quotes.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="font-heading mb-1 text-sm font-medium">No quotes found</div>
        <p className="text-xs text-[var(--text-muted)]">
          Try a different search or clear your filters
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {["Quote #", "Product", "Date", "Qty", "Amount", "Status", ""].map((heading) => (
                <th
                  key={heading}
                  className="font-heading px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr
                key={quote.id}
                className="cursor-pointer border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg)]"
              >
                <td className="px-5 py-3.5">
                  <Link
                    to={`/quotes/${quote.id}`}
                    className="font-quote-mono text-xs font-medium text-[var(--navy)]"
                  >
                    {quote.number}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-sm">{quote.productName}</td>
                <td className="px-5 py-3.5 text-xs whitespace-nowrap text-[var(--text-secondary)]">
                  {quote.date}
                </td>
                <td className="px-5 py-3.5 text-sm">{formatQty(quote.quantity)}</td>
                <td className="font-quote-mono px-5 py-3.5 text-sm font-medium">
                  {formatQuoteAmount(quote.amount)}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={quote.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link to={`/quotes/${quote.id}`} className="text-xs text-[var(--text-muted)]">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[var(--border)] sm:hidden">
        {quotes.map((quote) => (
          <Link key={quote.id} to={`/quotes/${quote.id}`} className="block px-4 py-4">
            <div className="mb-1.5 flex items-start justify-between">
              <span className="font-quote-mono text-xs font-medium text-[var(--navy)]">
                {quote.number}
              </span>
              <StatusBadge status={quote.status} />
            </div>
            <div className="mb-1 text-sm font-medium">{quote.productName}</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                {quote.date} · {formatQty(quote.quantity)} units
              </span>
              <span className="font-quote-mono text-sm font-medium">
                {formatQuoteAmount(quote.amount)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

export function CreateQuoteButton({ label = "Create new quote" }: { label?: string }) {
  return (
    <Link
      to="/quotes/new"
      className={cn(
        "font-heading inline-flex h-auto shrink-0 items-center gap-2 rounded-md bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--navy-hover)]",
      )}
    >
      <Plus className="size-3.5" />
      {label}
    </Link>
  )
}
