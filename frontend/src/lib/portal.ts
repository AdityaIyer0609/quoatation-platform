import { useAuth } from "@/hooks/useAuth"

export function usePortalPaths() {
  const { user } = useAuth()
  const staff = user?.kind === "staff"
  return {
    staff,
    dashboard: staff ? "/sales" : "/dashboard",
    quotes: staff ? "/sales/quotes" : "/quotes",
    newQuote: staff ? "/sales/quotes/configure" : "/quotes/new",
    review: staff ? "/sales/quotes/review" : "/quotes/new/review",
    bom: staff ? "/sales/quotes/bom" : "/quotes/new/bom",
    quoteReady: (id: string) => (staff ? `/sales/quotes/${id}` : `/quotes/${id}/ready`),
  }
}
