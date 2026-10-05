import { bodyStylesFor } from "@/lib/erpCatalog"
import { openingFabricFloor, salesQualityReset } from "@/lib/qualityFloors"
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

export function isCircular(construction: string) {
  return construction.replace(/\s/g, "").toLowerCase() === "circular"
}

export function isUPanel(construction: string) {
  const n = construction.replace(/[-\s]/g, "").toLowerCase()
  return n === "upanel"
}

export function isFourPanel(construction: string) {
  return construction.replace(/[-\s]/g, "").toLowerCase() === "4panel"
}

/** U-panel / 4-panel / baffle bottom is the same fabric as the body. */
export function bottomGsmLockedToBody(construction: string) {
  return isUPanel(construction) || isFourPanel(construction) || construction === "Buffle"
}

function emptyOrZero(value: string | undefined) {
  return !value || value.trim() === "" || value.trim() === "0"
}

/** Defaults from frmBOM_NEW checkBoxLoop / check_bottom / comboTopType handlers. */
export function constructionDefaults(construction: string, spec: QuoteSpecification): Partial<QuoteSpecification> {
  const swl = Number.parseFloat(spec.swl) || 1000
  const styles = bodyStylesFor(construction)
  const patch: Partial<QuoteSpecification> = {
    constructionType: construction,
    bodyStyle: styles.includes(spec.bodyStyle) ? spec.bodyStyle : styles[0],
  }

  if (isCircular(construction)) {
    patch.loopConstruction = "Cross Corner"
    patch.loopWidth = "7"
    const loop = circularLoopGrm(swl, spec.sfRatio)
    patch.loopGsm = loop.gsm
    patch.loopLength = loop.length
    patch.bodyStyle = "Non-Builder"
  } else if (isUPanel(construction) || isFourPanel(construction) || construction === "Buffle") {
    patch.loopConstruction = "Corner"
    patch.loopWidth =
      spec.bodyStyle === "Builder" || spec.bodyStyle === "Tunnel" ? "4" : "5"
    patch.loopGsm = panelLoopGrm(swl, spec.sfRatio)
    patch.loopLength = "30"
    if (!spec.bodyStyle || spec.bodyStyle === "Standard") patch.bodyStyle = styles[0] || "Non-Builder"
  }

  if (spec.bodyGrade === "Standard" || !spec.bodyGrade) patch.bodyGrade = "Std"

  const withConstruction = { ...spec, ...patch }
  const sales = salesQualityReset(withConstruction)
  const merged: Partial<QuoteSpecification> = { ...patch, ...sales }
  const bodyGsm = merged.bodyGsm || spec.bodyGsm
  if (bodyGsm) {
    Object.assign(merged, syncBodyLinkedGsm({ ...spec, ...merged }, bodyGsm, spec.bodyLami))
  }
  if (spec.sameFabricForPanels && merged.bodyGsm) {
    Object.assign(merged, sameFabricPatch({ ...spec, ...merged }, merged.bodyGsm, spec.bodyLami))
  }
  return merged
}

export function topTypeDefaults(topType: string, spec: QuoteSpecification): Partial<QuoteSpecification> {
  const length = Number.parseFloat(spec.length) || 0
  const width = Number.parseFloat(spec.width) || 0
  const duffle = String(Math.max(0, (length + width) / 2 - 10))
  const opening = openingFabricFloor(spec)
  if (topType === "Top Spout") {
    return {
      topType,
      duffleHeight: "",
      topSpoutType: "Simple",
      topSpoutDia: spec.topSpoutDia || "35",
      topSpoutHeight: spec.topSpoutHeight || "50",
      topSpoutTie: true,
      ...(!spec.sameFabricForPanels
        ? {
            topGsm: spec.topGsm || String(opening.gsm),
            topLami: spec.topLami || String(opening.lami),
            topSpoutGsm: spec.topSpoutGsm || String(opening.spoutGsm),
            topSpoutLami: spec.topSpoutLami || String(opening.spoutLami),
          }
        : {}),
      ...topSpoutTieFill(spec),
    }
  }
  if (topType === "Duffle or Skrit" || topType === "Top + Skrit" || topType === "Oversize Duffle or Skrit" || topType === "Leno" || topType === "Drawstring Skirt" || topType === "Jute Skirt") {
    return {
      topType,
      duffleHeight: spec.duffleHeight || duffle,
      ...(spec.sameFabricForPanels
        ? {}
        : { topGsm: spec.topGsm || String(opening.gsm), topLami: spec.topLami || String(opening.lami) }),
    }
  }
  if (topType === "Conical Top" || topType === "Conical PlateTop") {
    return {
      topType,
      duffleHeight: "",
      topSpoutType: "None",
      topSpoutGsm: "0",
      topSpoutLami: "0",
      topSpoutDia: spec.topSpoutDia || "0",
      topSpoutHeight: spec.topSpoutHeight || "0",
      topSpoutRope: false,
      topSpoutTie: false,
    }
  }
  // Open / other: clear skirt height so preview never builds a giant collar.
  if (topType === "Open") {
    return { topType, duffleHeight: "" }
  }
  return { topType, duffleHeight: "" }
}

/** frmBOM_NEW comboBoxbottomtype / comboBoxbottomdia / petal subtype remarks */
export function bottomPunchRemarks(bottomType: string, bottomSpoutType: string, dia: string): string | undefined {
  const n = Number.parseInt(dia, 10)
  if (!Number.isFinite(n)) return undefined
  if (bottomSpoutType.toLowerCase().includes("petal")) return `CROSS PUNCH - ${n - 5}`
  if (bottomType === "Bottom Spout") return `ROUND PUNCH - ${n - 5}`
  return undefined
}

/** frmBOM_NEW comboBoxbottomtype_SelectedIndexChanged */
export function bottomTypeDefaults(bottomType: string, spec: QuoteSpecification): Partial<QuoteSpecification> {
  const tieOn =
    bottomType === "Bottom Spout" ||
    bottomType === "Square Bottom" ||
    bottomType === "Star Bottom" ||
    bottomType === "Bottom + Skirt"
  const patch: Partial<QuoteSpecification> = {
    bottomType,
    bottomSpoutTie: tieOn,
  }
  if (tieOn) {
    Object.assign(patch, bottomSpoutTieFill(spec))
  }
  if (bottomType === "Bottom Spout") {
    const dia = spec.bottomSpoutDia || "35"
    patch.bottomSpoutType = "Simple"
    patch.bottomSpoutDia = dia
    patch.bottomSpoutHeight = spec.bottomSpoutHeight || "40"
    const punch = bottomPunchRemarks(bottomType, "Simple", dia)
    if (punch) patch.bottomRemarks = punch
  }
  if (bottomType === "Bottom + Skirt") {
    patch.bottomSkirtHeight = spec.bottomSkirtHeight || "80"
  }
  return patch
}

export function bottomGsmFromBody(construction: string, bodyGsm: string): string {
  const gsm = Number.parseInt(bodyGsm, 10) || 0
  if (isCircular(construction) && gsm > 0) return String(gsm + 10)
  return bodyGsm
}

/** Keep U-panel / 4-panel / baffle bottom (and sides) on the same GSM as body. Circular bottom = body + 10. */
export function syncBodyLinkedGsm(
  spec: Pick<QuoteSpecification, "constructionType">,
  bodyGsm: string,
  bodyLami?: string,
): Partial<QuoteSpecification> {
  const patch: Partial<QuoteSpecification> = {
    bottomGsm: bottomGsmFromBody(spec.constructionType, bodyGsm),
  }
  if (bottomGsmLockedToBody(spec.constructionType)) {
    patch.sideGsm = bodyGsm
    if (bodyLami != null) patch.sideLami = bodyLami
  }
  return patch
}

export function topSpoutTieFill(spec: QuoteSpecification): Partial<QuoteSpecification> {
  return {
    topSpoutTie: true,
    topSpoutTieGsm: emptyOrZero(spec.topSpoutTieGsm) ? "6" : spec.topSpoutTieGsm,
    topSpoutTieSize: spec.topSpoutTieSize || "15",
    topSpoutTieCount: spec.topSpoutTieCount || "1",
    topSpoutTieRemarks: spec.topSpoutTieRemarks || "Size: 60",
  }
}

export function bottomSpoutTieFill(spec: QuoteSpecification): Partial<QuoteSpecification> {
  return {
    bottomSpoutTie: true,
    bottomSpoutTieGsm: emptyOrZero(spec.bottomSpoutTieGsm) ? "6" : spec.bottomSpoutTieGsm,
    bottomSpoutTieSize: spec.bottomSpoutTieSize || "15",
    bottomSpoutTieCount: spec.bottomSpoutTieCount || "1",
    bottomSpoutTieRemarks: spec.bottomSpoutTieRemarks || "Size: 60",
  }
}

export function bottomSpoutRopeFill(spec: QuoteSpecification): Partial<QuoteSpecification> {
  return {
    bottomSpoutRope: true,
    bottomSpoutRopeGsm: emptyOrZero(spec.bottomSpoutRopeGsm) ? "8" : spec.bottomSpoutRopeGsm,
    bottomSpoutRopeSize: spec.bottomSpoutRopeSize || "6",
  }
}

/** Copies body GSM/lami onto panels and spouts, matching mapper.same_fabric_for_panels. */
export function sameFabricPatch(
  spec: QuoteSpecification,
  bodyGsm: string,
  bodyLami: string,
): Partial<QuoteSpecification> {
  return {
    bodyGsm,
    bodyLami,
    topGsm: bodyGsm,
    topLami: bodyLami,
    sideGsm: bodyGsm,
    sideLami: bodyLami,
    bottomGsm: bottomGsmFromBody(spec.constructionType, bodyGsm),
    bottomLami: bodyLami,
    topSpoutGsm: bodyGsm,
    topSpoutLami: bodyLami,
    bottomSpoutGsm: bodyGsm,
    bottomSpoutLami: bodyLami,
  }
}

function bagInner(spec: Pick<QuoteSpecification, "sizeType">) {
  return spec.sizeType !== "OUTER"
}

/** frmBOM_NEW TopFlapWtFormula / BottomFlapWtFormula from bag L × W. */
export function flapSizesFromBag(spec: Pick<QuoteSpecification, "length" | "width" | "sizeType">): {
  topFlapFabricSize: string
  topFlapCutLength: string
  bottomFlapFabricSize: string
  bottomFlapCutLength: string
} {
  const length = Number.parseFloat(spec.length) || 0
  const width = Number.parseFloat(spec.width) || 0
  const inner = bagInner(spec)
  return {
    topFlapFabricSize: String(Math.max(0, inner ? length + 5 : length - 5)),
    topFlapCutLength: String(Math.max(0, inner ? width + 15 : width + 10)),
    bottomFlapFabricSize: String(Math.max(0, inner ? width + 5 : width - 5)),
    bottomFlapCutLength: String(Math.max(0, inner ? length + 15 : length + 10)),
  }
}

export function bagDimensionLinkedPatch(spec: QuoteSpecification): Partial<QuoteSpecification> {
  const sizes = flapSizesFromBag(spec)
  const patch: Partial<QuoteSpecification> = {}
  if (spec.topFlap) {
    patch.topFlapFabricSize = sizes.topFlapFabricSize
    patch.topFlapCutLength = sizes.topFlapCutLength
  }
  if (spec.bottomFlap) {
    patch.bottomFlapFabricSize = sizes.bottomFlapFabricSize
    patch.bottomFlapCutLength = sizes.bottomFlapCutLength
  }
  return patch
}

export function topFlapFill(spec: QuoteSpecification): Partial<QuoteSpecification> {
  const sizes = flapSizesFromBag(spec)
  return {
    topFlap: true,
    topFlapGsm: spec.topFlapGsm || spec.bodyGsm,
    topFlapCount: spec.topFlapCount || "1",
    topFlapFabricSize: sizes.topFlapFabricSize,
    topFlapCutLength: sizes.topFlapCutLength,
  }
}

export function bottomFlapFill(spec: QuoteSpecification): Partial<QuoteSpecification> {
  const sizes = flapSizesFromBag(spec)
  return {
    bottomFlap: true,
    bottomFlapGsm: spec.bottomFlapGsm || spec.bodyGsm,
    bottomFlapCount: spec.bottomFlapCount || "1",
    bottomFlapFabricSize: sizes.bottomFlapFabricSize,
    bottomFlapCutLength: sizes.bottomFlapCutLength,
  }
}

/** Lid cover in bag cm: along length (X) and width (Z). Mill fabric/cut axes differ for bottom. */
export function flapCoverCm(
  spec: Pick<
    QuoteSpecification,
    | "length"
    | "width"
    | "sizeType"
    | "topFlapFabricSize"
    | "topFlapCutLength"
    | "bottomFlapFabricSize"
    | "bottomFlapCutLength"
  >,
  which: "top" | "bottom",
): { alongLength: number; alongWidth: number } {
  const sizes = flapSizesFromBag(spec)
  const parse = (value: string, fallback: string) => Number.parseFloat(value) || Number.parseFloat(fallback) || 0
  if (which === "top") {
    return {
      alongLength: parse(spec.topFlapFabricSize, sizes.topFlapFabricSize),
      alongWidth: parse(spec.topFlapCutLength, sizes.topFlapCutLength),
    }
  }
  return {
    alongLength: parse(spec.bottomFlapCutLength, sizes.bottomFlapCutLength),
    alongWidth: parse(spec.bottomFlapFabricSize, sizes.bottomFlapFabricSize),
  }
}
