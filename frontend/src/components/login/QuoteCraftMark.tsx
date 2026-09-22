import { cn } from "@/lib/utils"

type QuoteCraftMarkProps = {
  className?: string
  inverted?: boolean
}

export function QuoteCraftMark({ className }: QuoteCraftMarkProps) {
  return (
    <img
      src="/logo.png"
      alt="HCP Plastene Bulkpack Limited"
      className={cn("size-8 object-contain", className)}
    />
  )
}
