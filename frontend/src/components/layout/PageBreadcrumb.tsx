import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

export function PageBreadcrumb({
  items,
}: {
  items: { label: string; to?: string; onClick?: () => void }[]
}) {
  return (
    <nav className="qc-crumb mb-3" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const last = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="contents">
            {index > 0 ? <ChevronRight className="size-3.5 shrink-0 text-[var(--navy-muted)]" /> : null}
            {last || (!item.to && !item.onClick) ? (
              <span className="qc-crumb-now">{item.label}</span>
            ) : item.to ? (
              <Link to={item.to} className="qc-crumb-link">
                {item.label}
              </Link>
            ) : (
              <button type="button" className="qc-crumb-link" onClick={item.onClick}>
                {item.label}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}
