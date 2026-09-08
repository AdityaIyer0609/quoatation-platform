import type { QuoteSpecification } from "@/types/quote"

function sfIndex(sf: string) {
  if (sf.startsWith("8")) return 2
  if (sf.startsWith("6")) return 1
  return 0
}

/** frmBOM_NEW.LoopGRMTable — Circular (_BodyIndex1 == 1) */
function circularLoopGrm(swl: number, sf: string): { gsm: string; length: string } {
  const idx = sfIndex(sf)
  if (swl <= 500) return { gsm: "45", length: "30" }
  if ((idx === 0 || idx === 1) && swl <= 1000) return { gsm: "45", length: "30" }
  if (idx === 0 && swl <= 1250) return { gsm: "45", length: "35" }
  if ((idx === 1 && swl <= 1250) || (idx === 0 && swl <= 1500)) return { gsm: "55", length: "40" }
  if ((idx === 1 && swl <= 1500) || (idx === 0 && swl <= 1750)) return { gsm: "60", length: "45" }
  if (idx === 2 && swl <= 1000) return { gsm: "55", length: "30" }
  if (idx === 2 && swl <= 1250) return { gsm: "65", length: "30" }
  if (idx === 0 && swl <= 1500) return { gsm: "55", length: "45" }
  if (idx === 1 && swl <= 1500) return { gsm: "65", length: "30" }
  if (idx === 2 && swl <= 1500) return { gsm: "75", length: "30" }
  if (idx === 0 && swl <= 2000) return { gsm: "65", length: "30" }
  if (idx === 1 && swl <= 2000) return { gsm: "75", length: "30" }
  if (idx === 2 && swl <= 2000) return { gsm: "85", length: "30" }
  return { gsm: "45", length: "30" }
}

/** frmBOM_NEW.LoopGRMTable — UPanel / 4 Panel / Buffle */
function panelLoopGrm(swl: number, sf: string): string {
  const idx = sfIndex(sf)
  if (swl <= 750) return idx === 2 ? "35" : "25"
  if (swl <= 1000) return idx === 0 ? "35" : "45"
  if (swl <= 1250) return idx === 0 ? "45" : idx === 1 ? "50" : "55"
  if (swl <= 1500) return idx === 0 ? "50" : idx === 1 ? "55" : "65"
  if (swl <= 1750) return idx === 0 ? "55" : idx === 1 ? "65" : "75"
  if (swl <= 2000) return idx === 0 ? "65" : idx === 1 ? "75" : "85"
  return "35"
}

function isCircular(construction: string) {
  return construction.replace(/\s/g, "").toLowerCase() === "circular"
}

function isUPanel(construction: string) {
  const n = construction.replace(/[-\s]/g, "").toLowerCase()
  return n === "upanel"
}

function isFourPanel(construction: string) {
  return construction.replace(/[-\s]/g, "").toLowerCase() === "4panel"
}

/** Defaults from frmBOM_NEW checkBoxLoop / check_bottom / comboTopType handlers. */
export function constructionDefaults(construction: string, spec: QuoteSpecification): Partial<QuoteSpecification> {
  const swl = Number.parseFloat(spec.swl) || 1000
  const patch: Partial<QuoteSpecification> = { constructionType: construction }

  if (isCircular(construction)) {
    patch.loopConstruction = "Cross Corner"
    patch.loopWidth = "7"
    const loop = circularLoopGrm(swl, spec.sfRatio)
    patch.loopGsm = loop.gsm
    patch.loopLength = loop.length
    patch.bodyStyle = "Non-Builder"
  } else if (isUPanel(construction) || isFourPanel(construction)) {
    patch.loopConstruction = "Corner"
    patch.loopWidth =
      spec.bodyStyle === "Builder" || spec.bodyStyle === "Tunnel" ? "4" : "5"
    patch.loopGsm = panelLoopGrm(swl, spec.sfRatio)
    patch.loopLength = "30"
    if (!spec.bodyStyle || spec.bodyStyle === "Standard") patch.bodyStyle = "Non-Builder"
  }

  if (spec.bodyGrade === "Standard" || !spec.bodyGrade) patch.bodyGrade = "Std"
  return patch
}

export function topTypeDefaults(topType: string, spec: QuoteSpecification): Partial<QuoteSpecification> {
  const length = Number.parseFloat(spec.length) || 0
  const width = Number.parseFloat(spec.width) || 0
  const duffle = String(Math.max(0, (length + width) / 2 - 10))
  if (topType === "Top Spout") {
    return {
      topType,
      topSpoutType: "Simple",
      topSpoutDia: spec.topSpoutDia || "35",
      topSpoutHeight: spec.topSpoutHeight || "50",
      topGsm: "70",
      topLami: "25",
      topSpoutGsm: "70",
      topSpoutLami: "25",
    }
  }
  if (topType === "Duffle or Skrit" || topType === "Top + Skrit") {
    return { topType, duffleHeight: spec.duffleHeight || duffle, topGsm: "70", topLami: "25" }
  }
  return { topType }
}

export function bottomGsmFromBody(construction: string, bodyGsm: string): string {
  const gsm = Number.parseInt(bodyGsm, 10) || 0
  if (isCircular(construction) && gsm > 0) return String(gsm + 10)
  return bodyGsm
}
