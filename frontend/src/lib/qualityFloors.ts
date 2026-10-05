import type { QuoteSpecification } from "@/types/quote"

/** Plastene Standards — Quality Parameters for Sales.xlsx (Excel wins over frmBOM_NEW). */

export type HeightBand = "le75" | "le85" | "le100" | "le125" | "gt125"
export type LoadClass = "1000/5" | "1000/6+1250/5" | "1250/6+1500/5" | "1500/6+2000/5"

type L1Rule = { kind: "minus"; cm: number } | { kind: "pct"; pct: number } | { kind: "fixed"; cm: number }

export type SalesQualityRow = {
  gsmOffer: number
  gsmMin: number
  loopWidthMm: 40 | 50 | 70
  gpm: number
  l1: L1Rule
  l2: number
  loopConstruction: "Corner" | "Cross Corner"
  runningMinus10?: boolean
}

export type SalesQualityLookup = SalesQualityRow & {
  loopLength: number
  loopShortLeg: number
  loopGpm: number
  loopWidthCm: string
}

function parseNum(value: string | undefined, fallback = 0) {
  const n = Number.parseFloat(value ?? "")
  return Number.isFinite(n) ? n : fallback
}

function sfFiveOrSix(sf: string): 5 | 6 | null {
  if (sf.startsWith("8")) return null
  if (sf.startsWith("6")) return 6
  if (sf.startsWith("5")) return 5
  return null
}

/** Map any SWL onto the next Excel listed SWL (custom values use the same band). */
function catalogSwl(swl: number, sf: 5 | 6): 1000 | 1250 | 1500 | 2000 | null {
  if (!(swl > 0)) return null
  if (sf === 5) {
    if (swl <= 1000) return 1000
    if (swl <= 1250) return 1250
    if (swl <= 1500) return 1500
    if (swl <= 2000) return 2000
    return null
  }
  if (swl <= 1000) return 1000
  if (swl <= 1250) return 1250
  if (swl <= 1500) return 1500
  return null
}

export function loadClassFor(swl: string, sfRatio: string): LoadClass | null {
  const sf = sfFiveOrSix(sfRatio)
  if (!sf) return null
  const swlN = catalogSwl(parseNum(swl), sf)
  if (!swlN) return null
  if (sf === 5 && swlN === 1000) return "1000/5"
  if ((sf === 6 && swlN === 1000) || (sf === 5 && swlN === 1250)) return "1000/6+1250/5"
  if ((sf === 6 && swlN === 1250) || (sf === 5 && swlN === 1500)) return "1250/6+1500/5"
  if ((sf === 6 && swlN === 1500) || (sf === 5 && swlN === 2000)) return "1500/6+2000/5"
  return null
}

export function heightBandFor(heightCm: number): HeightBand {
  if (heightCm <= 75) return "le75"
  if (heightCm <= 85) return "le85"
  if (heightCm <= 100) return "le100"
  if (heightCm <= 125) return "le125"
  return "gt125"
}

function isCircular(construction: string) {
  return construction.replace(/\s/g, "").toLowerCase() === "circular"
}

function isUPanel(construction: string) {
  return construction.replace(/[-\s]/g, "").toLowerCase() === "upanel"
}

function isFourPanel(construction: string) {
  return construction.replace(/[-\s]/g, "").toLowerCase() === "4panel"
}

function isBuilder(style: string) {
  return style.replace(/\s/g, "").toLowerCase() === "builder"
}

function gsmPair(offer: number, min = offer): Pick<SalesQualityRow, "gsmOffer" | "gsmMin"> {
  return { gsmOffer: offer, gsmMin: min }
}

function row(
  gsmOffer: number,
  loopWidthMm: 40 | 50 | 70,
  gpm: number,
  l1: L1Rule,
  l2: number,
  extra?: Partial<SalesQualityRow> & { gsmMin?: number },
): SalesQualityRow {
  const min = extra?.gsmMin ?? gsmOffer
  return {
    ...gsmPair(gsmOffer, min),
    loopWidthMm,
    gpm,
    l1,
    l2,
    loopConstruction: extra?.loopConstruction ?? "Corner",
    runningMinus10: extra?.runningMinus10,
  }
}

const minus = (cm: number): L1Rule => ({ kind: "minus", cm })
const pct = (value: number): L1Rule => ({ kind: "pct", pct: value })
const fixed = (cm: number): L1Rule => ({ kind: "fixed", cm })

/** U+2/4Panel Complicated */
const UPANEL: Record<LoadClass, Record<HeightBand, SalesQualityRow>> = {
  "1000/5": {
    le75: row(162, 40, 32, minus(5), 50),
    le85: row(162, 40, 32, minus(10), 50),
    le100: row(142, 40, 32, minus(15), 50),
    le125: row(142, 40, 32, pct(0.7), 50, { gsmMin: 132 }),
    gt125: row(142, 40, 32, pct(0.7), 50, { gsmMin: 132 }),
  },
  "1000/6+1250/5": {
    le75: row(172, 40, 42, minus(5), 50),
    le85: row(162, 40, 42, minus(10), 50),
    le100: row(162, 40, 42, minus(15), 50, { gsmMin: 152 }),
    le125: row(162, 40, 42, pct(0.75), 50, { gsmMin: 152 }),
    gt125: row(162, 40, 42, pct(0.75), 50, { gsmMin: 152 }),
  },
  "1250/6+1500/5": {
    le75: row(192, 50, 52, minus(5), 50),
    le85: row(192, 50, 52, minus(10), 50),
    le100: row(182, 50, 52, minus(15), 50),
    le125: row(182, 50, 52, pct(0.8), 50),
    gt125: row(182, 50, 52, pct(0.8), 50),
  },
  "1500/6+2000/5": {
    le75: row(242, 50, 62, minus(5), 55),
    le85: row(242, 50, 62, minus(5), 55),
    le100: row(242, 50, 62, minus(5), 55),
    le125: row(222, 50, 62, minus(10), 60),
    gt125: row(222, 50, 62, pct(0.85), 60),
  },
}

/** Circular Complicated — always X-corner 70 mm */
const x = (gsm: number, gpm: number, leg: number, extra?: Partial<SalesQualityRow> & { gsmMin?: number }) =>
  row(gsm, 70, gpm, fixed(leg), leg, { ...extra, loopConstruction: "Cross Corner" })

const CIRCULAR: Record<LoadClass, Record<HeightBand, SalesQualityRow>> = {
  "1000/5": {
    le75: x(182, 42, 35),
    le85: x(182, 42, 35),
    le100: x(152, 42, 35),
    le125: x(152, 42, 35),
    gt125: x(152, 42, 35),
  },
  "1000/6+1250/5": {
    le75: x(202, 42, 45),
    le85: x(182, 42, 45),
    le100: x(182, 42, 45),
    le125: x(172, 42, 45),
    gt125: x(172, 42, 45),
  },
  "1250/6+1500/5": {
    le75: x(242, 52, 50),
    le85: x(222, 52, 50),
    le100: x(192, 52, 50),
    le125: x(192, 52, 50),
    gt125: x(192, 52, 50),
  },
  "1500/6+2000/5": {
    le75: x(262, 62, 50, { runningMinus10: true }),
    le85: x(262, 62, 50, { runningMinus10: true }),
    le100: x(242, 62, 50, { runningMinus10: true }),
    le125: x(232, 62, 50, { runningMinus10: true }),
    gt125: x(232, 62, 50, { runningMinus10: true }),
  },
}

/** U+2 Panel Builder — three rows, height is a cap not a GSM ladder */
const BUILDER: Partial<Record<LoadClass, SalesQualityRow>> = {
  "1000/5": row(125, 40, 25, fixed(65), 35),
  "1250/6+1500/5": row(152, 40, 35, fixed(100), 55),
  "1500/6+2000/5": row(182, 50, 50, fixed(100), 70),
}

function computeL1(rule: L1Rule, heightCm: number) {
  if (rule.kind === "fixed") return rule.cm
  if (rule.kind === "minus") return Math.max(0, Math.round(heightCm - rule.cm))
  return Math.max(0, Math.round(heightCm * rule.pct))
}

export function lookupSalesQuality(spec: Pick<QuoteSpecification, "constructionType" | "bodyStyle" | "swl" | "sfRatio" | "height" | "loopTillBottom">): SalesQualityLookup | null {
  const load = loadClassFor(spec.swl, spec.sfRatio)
  if (!load) return null
  const height = parseNum(spec.height)
  const band = heightBandFor(height)

  let found: SalesQualityRow | undefined
  if (isCircular(spec.constructionType)) {
    if (isBuilder(spec.bodyStyle)) return null
    found = CIRCULAR[load][band]
  } else if (isBuilder(spec.bodyStyle) && isUPanel(spec.constructionType)) {
    found = BUILDER[load]
  } else if (isUPanel(spec.constructionType) || isFourPanel(spec.constructionType)) {
    if (isBuilder(spec.bodyStyle)) return null
    found = UPANEL[load][band]
  }
  if (!found) return null

  const loopGpm = found.runningMinus10 && spec.loopTillBottom ? found.gpm - 10 : found.gpm
  const loopLength = computeL1(found.l1, height)
  return {
    ...found,
    loopGpm,
    loopLength,
    loopShortLeg: found.l2,
    loopWidthCm: String(found.loopWidthMm / 10),
  }
}

export function openingFabricFloor(spec: Pick<QuoteSpecification, "bodyGrade" | "productCategory">): {
  gsm: number
  lami: number
  spoutGsm: number
  spoutLami: number
} {
  const un = spec.bodyGrade === "UN" || spec.bodyGrade === "UN+FDA"
  const ds = spec.productCategory === "Type D"
  if (un) return { gsm: 140, lami: 30, spoutGsm: 90, spoutLami: 15 }
  if (ds) return { gsm: 90, lami: 15, spoutGsm: 90, spoutLami: 15 }
  return { gsm: 60, lami: 15, spoutGsm: 60, spoutLami: 15 }
}

export function atLeast(value: string, min: number): string {
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n) || value.trim() === "") return String(min)
  return String(Math.max(min, n))
}

function setIfBelow(value: string | undefined, min: number, offer: number) {
  const n = Number.parseFloat(value ?? "")
  if (!Number.isFinite(n) || (value ?? "").trim() === "") return String(offer)
  return String(Math.max(min, n))
}

/** On SWL / construction / height / style change: fill Excel offer (loops always, body GSM). */
export function salesQualityReset(spec: QuoteSpecification): Partial<QuoteSpecification> {
  const found = lookupSalesQuality(spec)
  if (!found) return {}
  return {
    bodyGsm: String(found.gsmOffer),
    loopGsm: String(found.loopGpm),
    loopWidth: found.loopWidthCm,
    loopLength: String(found.loopLength),
    loopLongLeg: String(found.loopLength),
    loopShortLeg: String(found.loopShortLeg),
    loopConstruction: found.loopConstruction,
  }
}

/** Raise opening fabric to Excel min when panels are not locked to body. */
export function openingFabricReset(spec: QuoteSpecification): Partial<QuoteSpecification> {
  if (spec.sameFabricForPanels) return {}
  const floor = openingFabricFloor(spec)
  return {
    topGsm: String(floor.gsm),
    topLami: String(floor.lami),
    topSpoutGsm: String(floor.spoutGsm),
    topSpoutLami: String(floor.spoutLami),
  }
}

export function clampOpeningFabric(spec: QuoteSpecification, patch: Partial<QuoteSpecification>): Partial<QuoteSpecification> {
  if (spec.sameFabricForPanels) return {}
  const floor = openingFabricFloor({ ...spec, ...patch })
  const next = { ...spec, ...patch }
  const out: Partial<QuoteSpecification> = {}
  if (patch.topGsm !== undefined) out.topGsm = atLeast(next.topGsm, floor.gsm)
  if (patch.topLami !== undefined) out.topLami = atLeast(next.topLami, floor.lami)
  if (patch.topSpoutGsm !== undefined) out.topSpoutGsm = atLeast(next.topSpoutGsm, floor.spoutGsm)
  if (patch.topSpoutLami !== undefined) out.topSpoutLami = atLeast(next.topSpoutLami, floor.spoutLami)
  return out
}

export function clampBodyFabric(spec: QuoteSpecification, bodyGsm: string, bodyLami: string): { bodyGsm: string; bodyLami: string } {
  const found = lookupSalesQuality(spec)
  return {
    bodyGsm: found ? atLeast(bodyGsm, found.gsmMin) : bodyGsm,
    bodyLami,
  }
}

export function clampLoopFields(spec: QuoteSpecification, patch: Partial<QuoteSpecification>): Partial<QuoteSpecification> {
  const found = lookupSalesQuality({ ...spec, ...patch })
  if (!found) return {}
  const next = { ...spec, ...patch }
  const out: Partial<QuoteSpecification> = {}
  if (patch.loopGsm !== undefined) out.loopGsm = atLeast(next.loopGsm, found.loopGpm)
  if (patch.loopWidth !== undefined) out.loopWidth = atLeast(next.loopWidth, Number(found.loopWidthCm))
  if (patch.loopLength !== undefined) out.loopLength = atLeast(next.loopLength, found.loopLength)
  if (patch.loopLongLeg !== undefined) out.loopLongLeg = atLeast(next.loopLongLeg, found.loopLength)
  if (patch.loopShortLeg !== undefined) out.loopShortLeg = atLeast(next.loopShortLeg, found.loopShortLeg)
  return out
}

/** Keep a value the user already raised; never drop below the new Excel min. */
export function retainOrFloor(value: string, min: number, offer: number) {
  return setIfBelow(value, min, offer)
}
