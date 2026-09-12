import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function PageShell({
  children,
  wide,
  className,
}: {
  children: ReactNode
  wide?: boolean
  className?: string
}) {
  return (
    <div className={cn("qc-page", wide ? "max-w-[1100px]" : "max-w-[960px]", className)}>
      {children}
    </div>
  )
}

export function PageHero({
  kicker,
  title,
  subtitle,
  action,
}: {
  kicker?: string
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="qc-hero mb-8">
      <div className="qc-hero-orb" />
      <div className="qc-hero-orb-2" />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {kicker ? <div className="mb-1 text-[10px] font-semibold tracking-[0.16em] text-white/55 uppercase">{kicker}</div> : null}
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
          {subtitle ? <div className="mt-2 max-w-xl text-sm leading-6 text-white/70">{subtitle}</div> : null}
        </div>
        {action ? <div className="relative z-10 shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}
