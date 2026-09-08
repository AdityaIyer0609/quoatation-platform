export function formatUsd(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatQuoteAmount(amount: number | null | undefined) {
  if (amount == null) return "Manual pricing"
  return formatUsd(amount)
}

export function formatQty(qty: number) {
  return qty.toLocaleString("en-IN")
}

export function productDisplayName(productType: string, category: string) {
  return `${productType} — ${category}`
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export const statusLabel: Record<string, string> = {
  draft: "Draft",
  quoted: "Quoted",
  accepted: "Accepted",
  expired: "Expired",
  rejected: "Rejected",
  revision_requested: "Revision",
}
