/** Resolve fabric colour strings (names, #hex, rgb) to a preview hex for 3D. */

const NAMED_FABRIC: Record<string, string> = {
  "milky white": "#f4e2b8",
  white: "#f5f6f8",
  natural: "#c9a36a",
  beige: "#c9a36a",
  blue: "#5b92cc",
  green: "#6bb56e",
  black: "#5c5c5a",
  red: "#c62828",
  yellow: "#e6b800",
  orange: "#e67e22",
  purple: "#7e57c2",
  brown: "#8d6e63",
  grey: "#9e9e9e",
  gray: "#9e9e9e",
}

const DEFAULT_FABRIC = "#f5f6f8"

function expandShortHex(hex: string): string {
  const h = hex.slice(1)
  if (h.length === 3) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase()
  }
  if (h.length === 8) return `#${h.slice(0, 6)}`.toLowerCase()
  return `#${h}`.toLowerCase()
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

function parseRgbCss(value: string): string | null {
  const match = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
  if (!match) return null
  return rgbToHex(
    Math.round(Number(match[1])),
    Math.round(Number(match[2])),
    Math.round(Number(match[3])),
  )
}

/** Browser CSS named colours / any valid CSS colour string → #rrggbb. */
function resolveViaDom(raw: string): string | null {
  if (typeof document === "undefined") return null
  const el = document.createElement("span")
  el.style.color = ""
  el.style.color = raw
  if (!el.style.color) return null
  el.style.position = "absolute"
  el.style.visibility = "hidden"
  document.body.appendChild(el)
  const computed = getComputedStyle(el).color
  document.body.removeChild(el)
  return parseRgbCss(computed)
}

/**
 * Map a user colour string to a hex for 3D preview.
 * Accepts catalog names, CSS colour names (`red`), and `#hex`.
 */
export function resolveFabricHex(colour: string, fallback = DEFAULT_FABRIC): string {
  const raw = (colour || "").trim()
  if (!raw) return fallback

  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) {
    return expandShortHex(raw)
  }

  const key = raw.toLowerCase().replace(/\s+/g, " ")
  if (NAMED_FABRIC[key]) return NAMED_FABRIC[key]

  const viaDom = resolveViaDom(raw)
  if (viaDom) return viaDom

  // "Blue / PMS 286 C" style ERP strings — try the left part
  const left = raw.split(/[/,|]/)[0]?.trim()
  if (left && left !== raw) {
    const nested = resolveFabricHex(left, "")
    if (nested) return nested
  }

  return fallback
}

export function isResolvableFabricColour(colour: string): boolean {
  const raw = (colour || "").trim()
  if (!raw) return false
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) return true
  const key = raw.toLowerCase().replace(/\s+/g, " ")
  if (NAMED_FABRIC[key]) return true
  if (typeof document === "undefined") return false
  return resolveViaDom(raw) != null
}
