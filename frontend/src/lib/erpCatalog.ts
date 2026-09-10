/** Exact pick-lists from frmBOM_NEW.Designer.cs. */

export const BAG_TYPES = ["Type A", "Type B", "Type C", "Type D"] as const

export const CONSTRUCTIONS = [
  "Circular",
  "UPanel",
  "Buffle",
  "4 Panel",
  "Tube + Corner",
  "Single Loop",
  "Double Loop",
  "Single + 4 Loop",
  "Double + 4 Loop",
  "4 Panel + Conical Bag(Three Piece)",
  "4 Panel + Conical Bag(Single Piece)",
  "Hood Bag-Covered Bag",
  "Double Layer Tunnel Lift Loop Bag",
  "Double Layer Circular Inner Skin Bag",
  "Bag Cover",
  "Sling Bag",
  "Sleeve Bag",
  "Drum Bag",
] as const

export const BODY_STYLES_ALL = [
  "Non-Builder",
  "Conductive-TypeC",
  "Dissipative -TypeD",
  "Wider Fold",
  "Builder",
  "Tunnel",
  "Ventilated",
  "Sulzer ",
  "TUNNEL CENTER JOINT",
  "Sleeve Bag",
  "Hood UPanel",
  "Hood 4Panel",
  "Almatis [Wider Fold]",
  "Almatis [Std Fold]",
] as const

export const BODY_STYLES: Record<string, readonly string[]> = {
  Circular: ["Non-Builder"],
  UPanel: [
    "Non-Builder",
    "Builder",
    "Tunnel",
    "Ventilated",
    "Wider Fold",
    "Sulzer ",
    "TUNNEL CENTER JOINT",
    "Sleeve Bag",
    "Hood UPanel",
  ],
  "4 Panel": ["Non-Builder", "Ventilated", "Sulzer ", "Almatis [Std Fold]", "Almatis [Wider Fold]", "Hood 4Panel"],
  Buffle: BODY_STYLES_ALL,
}

export function bodyStylesFor(construction: string): string[] {
  return [...(BODY_STYLES[construction] ?? BODY_STYLES_ALL)]
}

export const BODY_GRADES = ["Std", "UN", "FDA", "UN+FDA"] as const

export const SIZE_TYPES = ["INNER", "OUTER"] as const

export const TOP_TYPES = [
  "Open",
  "Top Spout",
  "Duffle or Skrit",
  "Conical PlateTop",
  "Conical Top",
  "Top + Skrit",
  "Leno",
  "Oversize Duffle or Skrit",
  "Drawstring Skirt",
  "Jute Skirt",
] as const

export const BOTTOM_TYPES = [
  "Flat",
  "Conical Plate Base",
  "Conical Base",
  "Bottom Spout",
  "Square Bottom",
  "Star Bottom",
  "Flat & Sewn",
  "Closed",
  "Bottom + Skirt",
] as const

export const TOP_SPOUT_TYPES = [
  "Simple",
  "Petal/Bonnet Closure",
  "Iris/Pyjama Closure",
  "Tube",
] as const

export const BOTTOM_SPOUT_TYPES = [
  "Simple",
  "Petal Closure",
  "Iris/Pyjama/Bonnet Closure",
  "Tube",
] as const

export const LOOP_CONSTS = ["None", "Corner", "Cross Corner", "Full Loop + Cross Corner"] as const

export const LOOP_MATERIALS = ["PP", "MultiFilament", "Seal belt", "PP Stiff "] as const

export const LINER_MATERIALS = ["None", "LD", "HD", "LLD", "ALU"] as const

export const LINER_TYPES = [
  "None",
  "Form Fit Liner",
  "Form Fit Flenze Liner",
  "Gusseted Liner",
  "Suspended",
  "Tray Liner",
] as const

export const PRINT_TYPES = ["UnPrinted", "1S1C", "1S2C", "2S1C", "2S2C"] as const

export const COLOURS = ["Milky White", "White", "Natural", "Blue", "Green", "Black"] as const

export const SF_RATIOS = ["5:1", "6:1", "8:1"] as const

export const THREAD_TYPES = ["PP", "MF"] as const

export const FILLER_CORD_TYPES = ["None", "Single", "Double"] as const

export const DOC_TYPES = ["Simple", "Zip Lock", "PP + PE "] as const

export const DOC_OPENINGS = [
  "RHS Open(Top Seam)",
  "Verical(Back Side Open/Top Seam)",
  "Upside Open(Belt Vertical Seam)",
  "Horizontal Open",
  "Vertical Open",
] as const

export const DOC_UNITS = ["CMS", "INCH"] as const

export const TUNNEL_DESIGNS = ["Flexcon", "Store", "Plastene", "Wickes", "Greif", "Beef Bag  "] as const

/** comboBodyGSM: 0–250 in steps of 5 */
export const GSM_OPTIONS = Array.from({ length: 51 }, (_, index) => String(index * 5))

export const LAMI_OPTIONS = ["0", "15", "18", "20", "25"]

/** comboTopTieGrm / comboBottomSpoutTieGrm */
export const TIE_GSM_OPTIONS = Array.from({ length: 20 }, (_, index) => String(index))

export const LOOP_PROTECTOR_TYPES = ["None", "Webbing / Reinforcement", "Fabric Wear Pade / Sleeve"] as const

export const BUFFLE_KINDS = ["Standard", "Net Buffle", "Rectangular", "Special"] as const

export const STEVEDORE_PORTIONS = ["Length", "Width", "Diagonal"] as const

export const PACKING = ["Bale", "Pallet 2 Way", "Pallet 4 Way"] as const

export const TRANSPORT = ["20 ft", "40 ft"] as const

export const ROPE_TYPES = ["Braided Rope", "PP Rope"] as const

export const GRM_0_20 = Array.from({ length: 21 }, (_, index) => String(index))

export const ROPE_SIZE_10_25 = Array.from({ length: 16 }, (_, index) => String(index + 10))

export const CUT_0_20 = Array.from({ length: 21 }, (_, index) => String(index))

export const HOOK_CUTS = [...CUT_0_20, "7.5"]

export const ANCILLARY_LOOP_TYPES = ["PP", "MultiFilament", "Seal belt", "PP Stiff "] as const

export const THREAD_NEEDLES = ["Single", "Double"] as const

export const THREAD_BUFFLE_SEAMS = ["All Seam (12)", "Eight Seam", "Four Seam"] as const

export const ROPE_SIZES = Array.from({ length: 16 }, (_, index) => String(index + 5))

export const WEB_GSM = ["0", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55", "60"]
