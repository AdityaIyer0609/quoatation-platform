/** Exact pick-lists from frmBOM_NEW.Designer.cs — customer subset of the operator form. */

export const BAG_TYPES = ["Type A", "Type B", "Type C", "Type D"] as const

export const CONSTRUCTIONS = ["Circular", "UPanel", "4 Panel"] as const

export const BODY_STYLES = {
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
  ],
  "4 Panel": ["Non-Builder", "Ventilated", "Sulzer ", "Almatis [Std Fold]", "Almatis [Wider Fold]"],
} as const

export const BODY_GRADES = ["Std", "UN", "FDA", "UN+FDA"] as const

export const SIZE_TYPES = ["INNER", "OUTER"] as const

export const TOP_TYPES = ["Open", "Top Spout", "Duffle or Skrit"] as const

export const BOTTOM_TYPES = ["Flat", "Bottom Spout", "Conical Base"] as const

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

export const GSM_OPTIONS = ["70", "80", "90", "100", "120", "140", "160", "180", "200", "220", "240"]

export const LAMI_OPTIONS = ["0", "15", "18", "20", "25"]
