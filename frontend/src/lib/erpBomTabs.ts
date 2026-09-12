/** Tab order and labels from frmBOM_NEW tabControl1. Approval is plant-only. */

export const ERP_BOM_TABS = [
  { id: "loop", label: "Loop" },
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
  { id: "bottomSpout", label: "Bottom Spout" },
  { id: "bottomSpout2", label: "Botttm Spout 2" },
  { id: "liner", label: "Liner/Label" },
  { id: "rate", label: "Rate + Other" },
  { id: "flap", label: "Flap/Hook/AncillaryLoop" },
  { id: "rope", label: "Rope/Tie/Thread" },
  { id: "doc", label: "Doc/Filler Cord/LoopProtector/InnerBox" },
  { id: "extraLabel", label: "Extra Label/Inner" },
  { id: "buffle", label: "Instruction/BuffleGSM" },
  { id: "other", label: "Other" },
  { id: "otherDoc", label: "Other Doc Pouch" },
  { id: "otherBom", label: "Other Bom Component" },
] as const

export type ErpBomTabId = (typeof ERP_BOM_TABS)[number]["id"]
