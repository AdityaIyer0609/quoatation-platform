import { cn } from "@/lib/utils"

type QuoteCraftMarkProps = {
  className?: string
  inverted?: boolean
}

export function QuoteCraftMark({ className, inverted = false }: QuoteCraftMarkProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded font-heading font-bold text-white",
        inverted ? "bg-white/20" : "bg-[var(--navy)]",
        className
      )}
    >
      Q
    </div>
  )
}
