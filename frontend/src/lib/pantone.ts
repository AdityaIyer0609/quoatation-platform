/** Common FIBC fabric Pantone ↔ colour name reconciliation. */

export type PantoneEntry = {
  code: string
  colour: string
  aliases?: string[]
}

/** Canonical pantone codes used in mill / buyer specs. */
export const PANTONE_ENTRIES: PantoneEntry[] = [
  { code: "PMS White", colour: "White", aliases: ["White", "White C"] },
  { code: "PMS Milky White", colour: "Milky White", aliases: ["Milky White"] },
  { code: "PMS Natural", colour: "Natural", aliases: ["Natural", "Beige"] },
  { code: "PMS 286 C", colour: "Blue", aliases: ["PMS 286", "286 C", "286", "Process Blue"] },
  { code: "PMS 2935 C", colour: "Blue", aliases: ["PMS 2935", "2935 C", "2935"] },
  { code: "PMS 354 C", colour: "Green", aliases: ["PMS 354", "354 C", "354"] },
  { code: "PMS 355 C", colour: "Green", aliases: ["PMS 355", "355 C", "355"] },
  { code: "PMS Black C", colour: "Black", aliases: ["Black C", "Process Black", "Black"] },
]

export const PANTONE_OPTIONS = PANTONE_ENTRIES.map((entry) => entry.code)

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^pantone\s+/i, "pms ")
}

function entryMatches(entry: PantoneEntry, raw: string): boolean {
  const key = normalizeKey(raw)
  if (!key) return false
  const candidates = [entry.code, entry.colour, ...(entry.aliases ?? [])]
  return candidates.some((candidate) => normalizeKey(candidate) === key)
}

/** Resolve a typed pantone (or alias) to canonical code + colour name. */
export function reconcileFromPantone(raw: string): { pantone: string; colour: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const hit = PANTONE_ENTRIES.find((entry) => entryMatches(entry, trimmed))
  if (!hit) return null
  return { pantone: hit.code, colour: hit.colour }
}

/** Default pantone for a named colour (first matching entry). */
export function pantoneForColour(colour: string): string {
  const trimmed = colour.trim()
  if (!trimmed) return ""
  const hit = PANTONE_ENTRIES.find((entry) => normalizeKey(entry.colour) === normalizeKey(trimmed))
  return hit?.code ?? ""
}

/** Known mill Pantone → fill colour name (preview follows colour / #hex). */
export function isKnownPantone(raw: string): boolean {
  return reconcileFromPantone(raw) != null
}

/** Format ERP FabColor including pantone when present. */
export function formatFabricColour(colour: string, pantone?: string): string {
  const c = colour.trim() || "White"
  const p = (pantone || "").trim()
  if (!p) return c
  if (c.toLowerCase().includes(p.toLowerCase())) return c
  return `${c} / ${p}`
}

