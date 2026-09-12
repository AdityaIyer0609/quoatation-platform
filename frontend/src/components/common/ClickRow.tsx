import type { KeyboardEvent, ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { cn } from "@/lib/utils"

export function ClickRow({
  to,
  children,
  className,
}: {
  to?: string
  children: ReactNode
  className?: string
}) {
  const navigate = useNavigate()

  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (!to) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      navigate(to)
    }
  }

  return (
    <tr
      className={cn("qc-row", !to && "qc-row-static", className)}
      tabIndex={to ? 0 : undefined}
      onClick={to ? () => navigate(to) : undefined}
      onKeyDown={to ? onKeyDown : undefined}
    >
      {children}
    </tr>
  )
}
