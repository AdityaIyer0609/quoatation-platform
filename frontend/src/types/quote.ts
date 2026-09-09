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
  topSpoutGsm: string
  topSpoutLami: string
  bottomGsm: string
  bottomLami: string
  topType: string
  bottomType: string
  duffleHeight: string
  topSpoutType: string
  topSpoutDia: string
  topSpoutHeight: string
  bottomSpoutType: string
  bottomSpoutDia: string
  bottomSpoutHeight: string
  loopEnabled: boolean
  loopType: string
  loopConstruction: string
  loopGsm: string
  loopLength: string
  loopWidth: string
  loopCount: string
  loopTillBottom: boolean
  linerEnabled: boolean
  linerMaterial: string
  linerType: string
  linerMicron: string
  docPouch: boolean
  label: boolean
  printing: string
  quantity: string
  deliveryLocation: string
  notes: string
  doubleFoldBody: boolean
  doubleFoldTop: boolean
  doubleFoldBottom: boolean
  tunnelDesign: string
  tunnelGsm: string
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
  topSpoutGsm: "70",
  topSpoutLami: "25",
  bottomGsm: "",
  bottomLami: "",
  topType: "Open",
  bottomType: "Flat",
  duffleHeight: "80",
  topSpoutType: "Simple",
  topSpoutDia: "35",
  topSpoutHeight: "50",
  bottomSpoutType: "Simple",
  bottomSpoutDia: "35",
  bottomSpoutHeight: "40",
  loopEnabled: true,
  loopType: "PP",
  loopConstruction: "Cross Corner",
  loopGsm: "40",
  loopLength: "30",
  loopWidth: "5",
  loopCount: "4",
  loopTillBottom: false,
  linerEnabled: false,
  linerMaterial: "LD",
  linerType: "Gusseted Liner",
  linerMicron: "70",
  docPouch: false,
  label: false,
  printing: "UnPrinted",
  quantity: "100",
  deliveryLocation: "Mumbai, Maharashtra",
  notes: "",
  doubleFoldBody: false,
  doubleFoldTop: false,
  doubleFoldBottom: false,
  tunnelDesign: "",
  tunnelGsm: "",
  fabric: "Virgin PP Woven",
  gsm: "180",
  liner: "",
  loops: "PP",
  accessories: [],
  bottomConstruction: "Flat",
  topConstruction: "Open",
  book4Complication: "",
}
