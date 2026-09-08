import type { BomPreview, QuoteSpecification } from "@/types/quote"

export async function previewBom(specification: QuoteSpecification): Promise<BomPreview> {
  const response = await fetch("/api/quotes/bom/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ specification }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = body.detail
    throw new Error(typeof detail === "string" ? detail : "Could not calculate the material list.")
  }
  return body as BomPreview
}
