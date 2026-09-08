import type {
  BomPreview,
  ComplicationPicker,
  PricingOptions,
  PricingPreview,
  QuoteSpecification,
} from "@/types/quote"

export function pricingOptionsFromSpec(specification: QuoteSpecification): PricingOptions | undefined {
  const complication = specification.book4Complication?.trim()
  if (!complication) return undefined
  return { complication }
}

export async function previewPricing(
  specification: QuoteSpecification,
  bom?: BomPreview,
): Promise<PricingPreview> {
  const options = pricingOptionsFromSpec(specification)
  const response = await fetch("/api/quotes/pricing/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ specification, bom, options }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = body.detail
    throw new Error(typeof detail === "string" ? detail : "Could not calculate pricing.")
  }
  return body as PricingPreview
}

export async function fetchComplicationPicker(
  specification: QuoteSpecification,
): Promise<ComplicationPicker> {
  const response = await fetch("/api/quotes/pricing/complications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ specification }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = body.detail
    throw new Error(typeof detail === "string" ? detail : "Could not load conversion types.")
  }
  return body as ComplicationPicker
}
