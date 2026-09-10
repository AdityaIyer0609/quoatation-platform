import type { QuoteSpecification } from "@/types/quote"

/** Visual demo only — does not change BOM formulas. */
export const PREVIEW_SAMPLE_PATCH: Partial<QuoteSpecification> = {
  constructionType: "Circular",
  bodyStyle: "Non-Builder",
  bodyGrade: "Std",
  sizeType: "INNER",
  length: "90",
  width: "90",
  height: "120",
  swl: "1000",
  sfRatio: "5:1",
  fabricColour: "Blue",
  bodyGsm: "180",
  topType: "Top Spout",
  bottomType: "Bottom Spout",
  topSpoutType: "Simple",
  topSpoutDia: "40",
  topSpoutHeight: "50",
  bottomSpoutType: "Simple",
  bottomSpoutDia: "35",
  bottomSpoutHeight: "40",
  loopEnabled: true,
  loopConstruction: "Corner",
  loopCount: "4",
  loopTillBottom: false,
  dropLoop: false,
  linerEnabled: true,
  docPouch: true,
}

export const PREVIEW_SAMPLE_STEPS = [
  { step: "1 · Construction", detail: "Circular · Non-Builder · 90 × 90 × 120 cm · White or Blue" },
  { step: "2 · Top / bottom", detail: "Top Spout (Ø40 × 50) and Bottom Spout (Ø35 × 40)" },
  { step: "3 · Loops", detail: "Loops on · Corner · count 4 (not Cross Corner)" },
  { step: "4 · Extras", detail: "Document pouch on, liner on — then click the preview to enlarge" },
]
