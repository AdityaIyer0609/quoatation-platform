export type QuoteStatus =
  | "draft"
  | "quoted"
  | "accepted"
  | "expired"
  | "rejected"
  | "revision_requested"

export type QuoteSpecification = {
  productType: string
  productCategory: string
  constructionType: string
  bodyStyle: string
  bodyGrade: string
  sizeType: string
  length: string
  width: string
  height: string
  swl: string
  sfRatio: string
  fabricColour: string
  bodyGsm: string
  bodyLami: string
  sameFabricForPanels: boolean
  topGsm: string
  topLami: string
  sideGsm: string
  sideLami: string
  topSpoutGsm: string
  topSpoutLami: string
  bottomGsm: string
  bottomLami: string
  topType: string
  bottomType: string
  duffleHeight: string
  conicalTop: string
  bottomConicalHeight: string
  topSpoutType: string
  topSpoutDia: string
  topSpoutHeight: string
  topSpoutCount: string
  topSpoutEdgeHemming: boolean
  bottomSpoutType: string
  bottomSpoutDia: string
  bottomSpoutHeight: string
  bottomSpoutGsm: string
  bottomSpoutLami: string
  bottomSpoutCount: string
  bottomSpoutEdgeHemming: boolean
  topSpoutTieGsm: string
  topSpoutTieSize: string
  topSpoutTieCount: string
  topSpoutTieRemarks: string
  bottomSpoutTie: boolean
  bottomSpoutTieGsm: string
  bottomSpoutTieSize: string
  bottomSpoutTieCount: string
  bottomSpoutTieRemarks: string
  topIrisTieCount: string
  bottomIrisTieCount: string
  loopEnabled: boolean
  loopType: string
  loopConstruction: string
  loopGsm: string
  loopLength: string
  loopWidth: string
  loopCount: string
  loopTillBottom: boolean
  dropLoop: boolean
  dropLoopLength: string
  linerEnabled: boolean
  linerMaterial: string
  linerType: string
  linerMicron: string
  bLock: boolean
  bLockCount: string
  labelCount: string
  docPouch: boolean
  docType: string
  docOpening: string
  docLength: string
  docWidth: string
  docMicron: string
  docUnit: string
  docCount: string
  label: boolean
  labelLength: string
  labelWidth: string
  labelMicron: string
  printing: string
  quantity: string
  deliveryLocation: string
  notes: string
  doubleFoldBody: boolean
  doubleFoldTop: boolean
  doubleFoldBottom: boolean
  tunnel: boolean
  tunnelDesign: string
  tunnelGsm: string
  tunnelLami: string
  fillerCord: boolean
  fillerCordGpm: string
  fillerCordTop: boolean
  fillerCordBottom: boolean
  fillerCordBody: boolean
  fillerCordTopSpout: boolean
  fillerCordBottomSpout: boolean
  fillerCordBuffle: boolean
  fillerCordTopType: string
  fillerCordBottomType: string
  fillerCordBodyType: string
  fillerCordTopSpoutType: string
  fillerCordBottomSpoutType: string
  fillerCordBuffleType: string
  threadEnabled: boolean
  threadColour: string
  threadType: string
  threadBuffleSeam: string
  threadNeedle: string
  threadDenier: string
  hiracle: boolean
  hiracleTop: boolean
  hiracleBottom: boolean
  labelTyvac: boolean
  topRope: boolean
  topRopeType: string
  topRopeGsm: string
  topRopeSize: string
  topRopeCut: string
  topRopeColor: string
  topRopeCount: string
  bottomRope: boolean
  bottomRopeType: string
  bottomRopeGsm: string
  bottomRopeSize: string
  bottomRopeCut: string
  bottomRopeColor: string
  bottomRopeCount: string
  topSpoutRope: boolean
  topSpoutRopeType: string
  topSpoutRopeGsm: string
  topSpoutRopeSize: string
  topSpoutRopeColor: string
  topSpoutRopeCount: string
  topSpoutRopeRemarks: string
  bottomSpoutRope: boolean
  bottomSpoutRopeType: string
  bottomSpoutRopeGsm: string
  bottomSpoutRopeSize: string
  bottomSpoutRopeColor: string
  bottomSpoutRopeCount: string
  bottomSpoutRopeRemarks: string
  topTie: boolean
  topTieGsm: string
  topTieSize: string
  topTieCut: string
  topTieColor: string
  topTieCount: string
  bottomTie: boolean
  bottomTieGsm: string
  bottomTieSize: string
  bottomTieCut: string
  bottomTieColor: string
  bottomTieCount: string
  topFlap: boolean
  topFlapGsm: string
  topFlapLami: string
  topFlapColor: string
  topFlapCount: string
  bottomFlap: boolean
  bottomFlapGsm: string
  bottomFlapLami: string
  bottomFlapColor: string
  bottomFlapCount: string
  topHook: boolean
  topHookGsm: string
  topHookSize: string
  topHookCut: string
  topHookColor: string
  topHookCount: string
  bottomHook: boolean
  bottomHookGsm: string
  bottomHookSize: string
  bottomHookCut: string
  bottomHookColor: string
  bottomHookCount: string
  bottomLoop: boolean
  bottomLoopGsm: string
  bottomLoopLength: string
  bottomLoopWidth: string
  bottomLoopCount: string
  loopProtector: boolean
  loopProtectorType: string
  loopProtectorGsm: string
  loopProtectorLami: string
  loopProtectorSize: string
  loopCover: boolean
  loopCoverGsm: string
  loopCoverLami: string
  loopCoverSize: string
  loopCoverCut: string
  loopCoverCount: string
  felt: boolean
  feltTop: boolean
  feltBottom: boolean
  feltBody: boolean
  feltTopSpout: boolean
  feltBottomSpout: boolean
  mfWeb: boolean
  mfWebTop: boolean
  mfWebBottom: boolean
  mfWebBody: boolean
  mfWebTopSpout: boolean
  mfWebBottomSpout: boolean
  mfWebBuffle: boolean
  buffleGsm: string
  buffleKind: string
  buffleSingleCoatedGsm: string
  buffleDoubleCoatedGsm: string
  loopRemarks: string
  innerSkin: boolean
  innerSkinGsm: string
  innerSkinLami: string
  innerSkinExtraCut: string
  innerBox: boolean
  innerBoxGsm: string
  innerBoxLami: string
  topBand: boolean
  topBandGsm: string
  topBandSize: string
  stevedore: boolean
  stevedoreGsm: string
  stevedoreSize: string
  stevedoreCount: string
  stevedorePortion: string
  ancerie: boolean
  ancerieType: string
  ancerieGsm: string
  ancerieSize: string
  ancerieAtt: string
  ancerieCount: string
  ancerieColor: string
  hoseSlider: boolean
  hoseSliderCount: string
  topPetalFlapGsm: string
  topPetalFlapLami: string
  bottomPetalFlapGsm: string
  bottomPetalFlapLami: string
  bellyBand1: boolean
  bellyBand1Gsm: string
  bellyBand1Size: string
  bellyBand2: boolean
  bellyBand2Gsm: string
  bellyBand2Size: string
  topBottomBand: boolean
  topBottomBandGsm: string
  topBottomBandSize: string
  safetyBand: boolean
  steveCover: boolean
  steveCoverSize: string
  steveCoverLength: string
  steveCoverGsm: string
  steveCoverLami: string
  steveCoverCount: string
  fabricPatch: boolean
  fabricPatchGsm: string
  fabricPatchLami: string
  innerTop: boolean
  innerTopGsm: string
  innerTopLami: string
  innerTopExtra: string
  innerTopDia: string
  innerBottom: boolean
  innerBottomGsm: string
  innerBottomLami: string
  innerBottomExtra: string
  innerBottomDia: string
  docPouch1: boolean
  doc1Type: string
  doc1Opening: string
  doc1Length: string
  doc1Width: string
  doc1Micron: string
  doc1Unit: string
  doc1Count: string
  docPouch2: boolean
  doc2Type: string
  doc2Opening: string
  doc2Length: string
  doc2Width: string
  doc2Micron: string
  doc2Unit: string
  doc2Count: string
  extraLabel: boolean
  extraLabelLength: string
  extraLabelWidth: string
  extraLabelMicron: string
  extraLabelCount: string
  extraLabel1: boolean
  extraLabel1Length: string
  extraLabel1Width: string
  extraLabel1Micron: string
  extraLabel2: boolean
  extraLabel2Length: string
  extraLabel2Width: string
  extraLabel2Micron: string
  extraLabel3: boolean
  extraLabel3Length: string
  extraLabel3Width: string
  extraLabel3Micron: string
  bottomSpout2: boolean
  bottomSpout2Dia: string
  bottomSpout2Height: string
  bottomSpout2Gsm: string
  bottomSpout2Lami: string
  bottomSpout3: boolean
  bottomSpout3Dia: string
  bottomSpout3Height: string
  bottomSpout3Gsm: string
  bottomSpout3Lami: string
  packing: string
  transport: string
  partyName: string
  cableTie: boolean
  cableTieCount: string
  topVelcro: boolean
  bottomVelcro: boolean
  /** Legacy fields kept for existing saved quotes */
  bottomConstruction?: string
  topConstruction?: string
  fabric?: string
  gsm?: string
  liner?: string
  loops?: string
  accessories?: string[]
  book4Complication?: string
}

export type BomLine = {
  heading: string
  gsm: string
  lamination: string
  colour: string
  fabricSize: string
  cutSize: string
  totalMtr: number | null
  totalKg: number | null
  remarks: string
}

export type BomPreview = {
  lines: BomLine[]
  totalKgPerBag: number
  totalMaterialKg: number
  quantity: number
  construction: string
  sizeType: string
  dimensions: string
  warnings: string[]
  source: string
}

export type PricingLine = {
  code: string
  label: string
  amountPerBag: number | null
  amountTotal?: number | null
  unit: string
  rate: number | null
  kg?: number | null
  note: string
}

export type PricingIssue = {
  code: string
  message: string
}

export type PricingOptions = {
  complication?: string
}

export type ComplicationCandidate = {
  complication: string
  ratePerTon: number
}

export type ComplicationPicker = {
  bagDesign: string | null
  loops: string | null
  lookupDesign: string | null
  lookupLoops: string | null
  usesCircularXCornerPlus75: boolean
  needsPicker: boolean
  autoMapped: string | null
  candidates: ComplicationCandidate[]
}

export type PricingPreview = {
  currency: "USD" | string
  source: string
  ruleVersion?: string
  ppRmRate?: number
  peRmRate?: number
  quantity: number
  totalKgPerBag: number
  ppKg: number
  peKg: number
  unclassifiedKg?: number
  materialLines?: { heading: string; category: string; kg: number }[]
  bagDesign: string | null
  loops: string | null
  complication: string | null
  conversionRatePerTon: number | null
  ppMaterialCost: number | null
  peMaterialCost: number | null
  conversionCost: number | null
  surcharges: PricingLine[]
  addons: PricingLine[]
  printing: PricingLine | null
  unitPrice: number | null
  totalAmount: number | null
  warnings: string[]
  errors: PricingIssue[]
  requiresManualPricing: boolean
  priced: boolean
}

export type PricingSummary = {
  currency: "USD" | "INR" | string
  unitPrice: number | null
  quantity: number
  totalAmount: number | null
  totalKg: number
  requiresManualPricing?: boolean
}

export type QuoteTimelineEvent = {
  at: string
  event: string
  detail: string
  type: "success" | "neutral" | "warning" | "error"
}

export type QuoteVersion = {
  id: string
  version: number
  status: QuoteStatus
  createdAt: string
  note?: string
  quantity?: number | null
  unitPrice?: number | null
  totalAmount?: number | null
  ruleVersion?: string
  createdByName?: string
  isCurrent?: boolean
  requiresManualPricing?: boolean
  specification?: Record<string, unknown>
}

export type Quote = {
  id: string
  number: string
  status: QuoteStatus
  productName: string
  createdAt: string
  validUntil: string
  leadTime: string
  paymentTerms: string
  requestedBy: string
  company: string
  specification: QuoteSpecification
  bomSnapshot?: BomPreview | null
  pricingSnapshot?: PricingPreview | null
  pricing: PricingSummary
  timeline: QuoteTimelineEvent[]
  versions: QuoteVersion[]
  currentVersion?: number
  customerId?: string | null
}

export type QuoteListItem = {
  id: string
  number: string
  productName: string
  date: string
  quantity: number
  amount: number | null
  status: QuoteStatus
  validUntil?: string | null
}

export type DashboardStats = {
  quotesThisMonth: string
  quotesThisMonthDelta: string
  inProgress: string
  inProgressDelta: string
  totalSpentYtd: string
  totalSpentDelta: string
}

export type DashboardData = {
  greetingName: string
  dateLabel: string
  stats: DashboardStats
  recentQuotes: QuoteListItem[]
  pendingQuote?: QuoteListItem | null
}

export type CustomerProfile = {
  firstName: string
  lastName: string
  email: string
  phone: string
  designation: string
  company: string
  gst: string
  address: string
  city: string
  state: string
  pincode: string
  country: string
  initials?: string
  kind?: "customer" | "staff"
  role?: string
}

export type SessionUser = {
  email: string
  firstName: string
  lastName: string
  initials: string
}

export const defaultSpecification: QuoteSpecification = {
  productType: "FIBC Bulk Bag",
  productCategory: "Type A",
  constructionType: "Circular",
  bodyStyle: "Non-Builder",
  bodyGrade: "Std",
  sizeType: "INNER",
  length: "90",
  width: "90",
  height: "120",
  swl: "1000",
  sfRatio: "5:1",
  fabricColour: "White",
  bodyGsm: "180",
  bodyLami: "0",
  sameFabricForPanels: true,
  topGsm: "",
  topLami: "",
  sideGsm: "",
  sideLami: "",
  topSpoutGsm: "",
  topSpoutLami: "",
  bottomGsm: "",
  bottomLami: "",
  topType: "Open",
  bottomType: "Flat",
  duffleHeight: "80",
  conicalTop: "",
  bottomConicalHeight: "",
  topSpoutType: "Simple",
  topSpoutDia: "35",
  topSpoutHeight: "50",
  topSpoutCount: "1",
  topSpoutEdgeHemming: false,
  bottomSpoutType: "Simple",
  bottomSpoutDia: "35",
  bottomSpoutHeight: "40",
  bottomSpoutGsm: "",
  bottomSpoutLami: "",
  bottomSpoutCount: "1",
  bottomSpoutEdgeHemming: false,
  topSpoutTieGsm: "",
  topSpoutTieSize: "",
  topSpoutTieCount: "",
  topSpoutTieRemarks: "",
  bottomSpoutTie: false,
  bottomSpoutTieGsm: "",
  bottomSpoutTieSize: "",
  bottomSpoutTieCount: "",
  bottomSpoutTieRemarks: "",
  topIrisTieCount: "",
  bottomIrisTieCount: "",
  loopEnabled: true,
  loopType: "PP",
  loopConstruction: "Cross Corner",
  loopGsm: "40",
  loopLength: "30",
  loopWidth: "5",
  loopCount: "4",
  loopTillBottom: false,
  dropLoop: false,
  dropLoopLength: "",
  linerEnabled: false,
  linerMaterial: "LD",
  linerType: "Gusseted Liner",
  linerMicron: "70",
  bLock: false,
  bLockCount: "1",
  labelCount: "1",
  docPouch: false,
  docType: "Simple",
  docOpening: "Vertical Open",
  docLength: "30",
  docWidth: "22",
  docMicron: "100",
  docUnit: "CMS",
  docCount: "1",
  label: false,
  labelLength: "10",
  labelWidth: "8",
  labelMicron: "100",
  printing: "UnPrinted",
  quantity: "100",
  deliveryLocation: "Mumbai, Maharashtra",
  notes: "",
  doubleFoldBody: false,
  doubleFoldTop: false,
  doubleFoldBottom: false,
  tunnel: false,
  tunnelDesign: "",
  tunnelGsm: "",
  tunnelLami: "0",
  fillerCord: false,
  fillerCordGpm: "",
  fillerCordTop: false,
  fillerCordBottom: false,
  fillerCordBody: false,
  fillerCordTopSpout: false,
  fillerCordBottomSpout: false,
  fillerCordBuffle: false,
  fillerCordTopType: "single",
  fillerCordBottomType: "single",
  fillerCordBodyType: "single",
  fillerCordTopSpoutType: "single",
  fillerCordBottomSpoutType: "single",
  fillerCordBuffleType: "single",
  threadEnabled: false,
  threadColour: "Milky White",
  threadType: "PP",
  threadBuffleSeam: "",
  threadNeedle: "Single",
  threadDenier: "3600",
  hiracle: false,
  hiracleTop: false,
  hiracleBottom: false,
  labelTyvac: false,
  topRope: false,
  topRopeType: "Braided Rope",
  topRopeGsm: "10",
  topRopeSize: "10",
  topRopeCut: "",
  topRopeColor: "Milky White",
  topRopeCount: "1",
  bottomRope: false,
  bottomRopeType: "Braided Rope",
  bottomRopeGsm: "10",
  bottomRopeSize: "10",
  bottomRopeCut: "",
  bottomRopeColor: "Milky White",
  bottomRopeCount: "1",
  topSpoutRope: false,
  topSpoutRopeType: "Braided Rope",
  topSpoutRopeGsm: "",
  topSpoutRopeSize: "5",
  topSpoutRopeColor: "Milky White",
  topSpoutRopeCount: "1",
  topSpoutRopeRemarks: "",
  bottomSpoutRope: false,
  bottomSpoutRopeType: "Braided Rope",
  bottomSpoutRopeGsm: "",
  bottomSpoutRopeSize: "5",
  bottomSpoutRopeColor: "Milky White",
  bottomSpoutRopeCount: "1",
  bottomSpoutRopeRemarks: "",
  topTie: false,
  topTieGsm: "6",
  topTieSize: "15",
  topTieCut: "50",
  topTieColor: "Milky White",
  topTieCount: "1",
  bottomTie: false,
  bottomTieGsm: "6",
  bottomTieSize: "15",
  bottomTieCut: "50",
  bottomTieColor: "Milky White",
  bottomTieCount: "1",
  topFlap: false,
  topFlapGsm: "",
  topFlapLami: "0",
  topFlapColor: "Milky White",
  topFlapCount: "1",
  bottomFlap: false,
  bottomFlapGsm: "",
  bottomFlapLami: "0",
  bottomFlapColor: "Milky White",
  bottomFlapCount: "1",
  topHook: false,
  topHookGsm: "",
  topHookSize: "",
  topHookCut: "7.5",
  topHookColor: "Milky White",
  topHookCount: "1",
  bottomHook: false,
  bottomHookGsm: "",
  bottomHookSize: "",
  bottomHookCut: "7.5",
  bottomHookColor: "Milky White",
  bottomHookCount: "1",
  bottomLoop: false,
  bottomLoopGsm: "",
  bottomLoopLength: "",
  bottomLoopWidth: "",
  bottomLoopCount: "1",
  loopProtector: false,
  loopProtectorType: "None",
  loopProtectorGsm: "",
  loopProtectorLami: "0",
  loopProtectorSize: "",
  loopCover: false,
  loopCoverGsm: "",
  loopCoverLami: "0",
  loopCoverSize: "",
  loopCoverCut: "",
  loopCoverCount: "1",
  felt: false,
  feltTop: false,
  feltBottom: false,
  feltBody: false,
  feltTopSpout: false,
  feltBottomSpout: false,
  mfWeb: false,
  mfWebTop: false,
  mfWebBottom: false,
  mfWebBody: false,
  mfWebTopSpout: false,
  mfWebBottomSpout: false,
  mfWebBuffle: false,
  buffleGsm: "",
  buffleKind: "Standard",
  buffleSingleCoatedGsm: "",
  buffleDoubleCoatedGsm: "",
  loopRemarks: "",
  innerSkin: false,
  innerSkinGsm: "",
  innerSkinLami: "0",
  innerSkinExtraCut: "0",
  innerBox: false,
  innerBoxGsm: "",
  innerBoxLami: "0",
  topBand: false,
  topBandGsm: "",
  topBandSize: "",
  stevedore: false,
  stevedoreGsm: "",
  stevedoreSize: "",
  stevedoreCount: "1",
  stevedorePortion: "Length",
  ancerie: false,
  ancerieType: "PP",
  ancerieGsm: "",
  ancerieSize: "",
  ancerieAtt: "0",
  ancerieCount: "1",
  ancerieColor: "Milky White",
  hoseSlider: false,
  hoseSliderCount: "1",
  topPetalFlapGsm: "",
  topPetalFlapLami: "0",
  bottomPetalFlapGsm: "",
  bottomPetalFlapLami: "0",
  bellyBand1: false,
  bellyBand1Gsm: "",
  bellyBand1Size: "",
  bellyBand2: false,
  bellyBand2Gsm: "",
  bellyBand2Size: "",
  topBottomBand: false,
  topBottomBandGsm: "",
  topBottomBandSize: "",
  safetyBand: false,
  steveCover: false,
  steveCoverSize: "",
  steveCoverLength: "",
  steveCoverGsm: "",
  steveCoverLami: "0",
  steveCoverCount: "1",
  fabricPatch: false,
  fabricPatchGsm: "",
  fabricPatchLami: "0",
  innerTop: false,
  innerTopGsm: "",
  innerTopLami: "0",
  innerTopExtra: "0",
  innerTopDia: "",
  innerBottom: false,
  innerBottomGsm: "",
  innerBottomLami: "0",
  innerBottomExtra: "0",
  innerBottomDia: "",
  docPouch1: false,
  doc1Type: "Simple",
  doc1Opening: "Vertical Open",
  doc1Length: "30",
  doc1Width: "22",
  doc1Micron: "80",
  doc1Unit: "CMS",
  doc1Count: "1",
  docPouch2: false,
  doc2Type: "Simple",
  doc2Opening: "Vertical Open",
  doc2Length: "30",
  doc2Width: "22",
  doc2Micron: "80",
  doc2Unit: "CMS",
  doc2Count: "1",
  extraLabel: false,
  extraLabelLength: "10",
  extraLabelWidth: "8",
  extraLabelMicron: "100",
  extraLabelCount: "1",
  extraLabel1: false,
  extraLabel1Length: "10",
  extraLabel1Width: "8",
  extraLabel1Micron: "100",
  extraLabel2: false,
  extraLabel2Length: "10",
  extraLabel2Width: "8",
  extraLabel2Micron: "100",
  extraLabel3: false,
  extraLabel3Length: "10",
  extraLabel3Width: "8",
  extraLabel3Micron: "100",
  bottomSpout2: false,
  bottomSpout2Dia: "",
  bottomSpout2Height: "",
  bottomSpout2Gsm: "",
  bottomSpout2Lami: "0",
  bottomSpout3: false,
  bottomSpout3Dia: "",
  bottomSpout3Height: "",
  bottomSpout3Gsm: "",
  bottomSpout3Lami: "0",
  packing: "",
  transport: "",
  partyName: "",
  cableTie: false,
  cableTieCount: "",
  topVelcro: false,
  bottomVelcro: false,
  fabric: "Virgin PP Woven",
  gsm: "180",
  liner: "",
  loops: "PP",
  accessories: [],
  bottomConstruction: "Flat",
  topConstruction: "Open",
  book4Complication: "",
}
