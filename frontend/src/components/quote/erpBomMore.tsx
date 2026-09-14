import { fieldClassName } from "@/components/login/fieldStyles"
import {
  CheckRow,
  CompactCheck,
  FieldLabel,
  FormSelect,
  GsmLamiFields,
} from "@/components/quote/FormControls"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ANCILLARY_LOOP_TYPES,
  BUFFLE_KINDS,
  COLOURS,
  CUT_0_20,
  DOC_COLORS,
  DOC_OPENINGS,
  DOC_TYPES,
  DOC_UNITS,
  EXTRA_LABEL_TYPES,
  FILLER_CORD_TYPES,
  GSM_OPTIONS,
  HOOK_CUTS,
  LAMI_OPTIONS,
  LOOP_CONSTS,
  LOOP_MATERIALS,
  LOOP_PROTECTOR_TYPES,
  MILL_CURRENCIES,
  PACKING,
  PAPER_SIZES,
  PRINT_TYPES,
  ROPE_SIZE_10_25,
  ROPE_SIZES,
  ROPE_TYPES,
  STEVEDORE_PORTIONS,
  SUPPLY_TYPES,
  THREAD_BUFFLE_SEAMS,
  THREAD_NEEDLES,
  THREAD_TYPES,
  TRANSPORT,
  TUNNEL_DESIGNS,
} from "@/lib/erpCatalog"
import type { ComplicationPicker, OtherBomRow, QuoteSpecification } from "@/types/quote"

type Draft = {
  spec: QuoteSpecification
  update: <K extends keyof QuoteSpecification>(key: K, value: QuoteSpecification[K]) => void
  patch: (partial: Partial<QuoteSpecification>) => void
}

const emptyBomRow = (): OtherBomRow => ({
  name: "",
  gsm: "",
  lami: "0",
  color: "Milky White",
  fabricSize: "",
  cutLength: "",
  totalMtr: "",
  totalKg: "",
  remarks: "",
  category: "",
})

function fillerType(value: string) {
  return value.toLowerCase() === "double" ? "double" : "single"
}

function fillerSelect(enabled: boolean, type: string) {
  if (!enabled) return "None"
  return type.toLowerCase() === "double" ? "Double" : "Single"
}

function Fields({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-end gap-3">{children}</div>
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 rounded-2xl border border-[var(--border)] p-4">{children}</div>
}

export function LoopBomPanel({ spec, update, picker }: Draft & { picker: ComplicationPicker | null }) {
  return (
    <>
      <CheckRow checked={spec.loopEnabled} onChange={(checked) => update("loopEnabled", checked)}>
        Loop
      </CheckRow>
      {spec.loopEnabled ? (
        <Box>
          <Fields>
            <div className="min-w-[180px] flex-1 basis-[180px]">
              <FieldLabel>Const</FieldLabel>
              <FormSelect value={spec.loopConstruction} onChange={(value) => update("loopConstruction", value)} options={[...LOOP_CONSTS]} />
            </div>
            <div className="min-w-[160px] flex-1 basis-[160px]">
              <FieldLabel>Type</FieldLabel>
              <FormSelect value={spec.loopType} onChange={(value) => update("loopType", value)} options={[...LOOP_MATERIALS]} />
            </div>
            <CompactCheck checked={spec.dropLoop} onChange={(checked) => update("dropLoop", checked)}>
              Drop Loop
            </CompactCheck>
            {spec.dropLoop ? (
              <div className="w-[88px] shrink-0">
                <FieldLabel>Lenght</FieldLabel>
                <Input value={spec.dropLoopLength} onChange={(event) => update("dropLoopLength", event.target.value)} className={fieldClassName} />
              </div>
            ) : null}
            <div className="w-[88px] shrink-0">
              <FieldLabel>Grm</FieldLabel>
              <Input value={spec.loopGsm} onChange={(event) => update("loopGsm", event.target.value)} className={fieldClassName} />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>L</FieldLabel>
              <Input value={spec.loopLength} onChange={(event) => update("loopLength", event.target.value)} className={fieldClassName} />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>W</FieldLabel>
              <Input value={spec.loopWidth} onChange={(event) => update("loopWidth", event.target.value)} className={fieldClassName} />
            </div>
            <div className="min-w-[140px] flex-1 basis-[140px]">
              <FieldLabel>Color</FieldLabel>
              <FormSelect value={spec.loopColour || "Milky White"} onChange={(value) => update("loopColour", value)} options={[...COLOURS]} />
            </div>
            <div className="w-[72px] shrink-0">
              <FieldLabel>No of Loop:</FieldLabel>
              <Input value={spec.loopCount} onChange={(event) => update("loopCount", event.target.value)} className={fieldClassName} />
            </div>
            <CompactCheck checked={spec.loopTillBottom} onChange={(checked) => update("loopTillBottom", checked)}>
              Till The Bottom
            </CompactCheck>
            <div className="w-[88px] shrink-0">
              <FieldLabel>Short Leg</FieldLabel>
              <Input value={spec.loopShortLeg} onChange={(event) => update("loopShortLeg", event.target.value)} className={fieldClassName} />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>Long Leg</FieldLabel>
              <Input value={spec.loopLongLeg} onChange={(event) => update("loopLongLeg", event.target.value)} className={fieldClassName} />
            </div>
            <CompactCheck checked={spec.fabricPatch} onChange={(checked) => update("fabricPatch", checked)}>
              Fabric Patch
            </CompactCheck>
            {spec.fabricPatch ? (
              <>
                <div className="w-[88px] shrink-0">
                  <FieldLabel>GSM</FieldLabel>
                  <FormSelect value={spec.fabricPatchGsm || "0"} onChange={(value) => update("fabricPatchGsm", value)} options={[...GSM_OPTIONS]} />
                </div>
                <CompactCheck
                  checked={Boolean(spec.fabricPatchLami) && spec.fabricPatchLami !== "0"}
                  onChange={(checked) => update("fabricPatchLami", checked ? spec.fabricPatchLami && spec.fabricPatchLami !== "0" ? spec.fabricPatchLami : "25" : "0")}
                >
                  LAM
                </CompactCheck>
              </>
            ) : null}
          </Fields>
        </Box>
      ) : null}

      {picker?.needsPicker ? (
        <div>
          <FieldLabel>Book4 conversion type</FieldLabel>
          <p className="mb-2 text-xs text-[var(--text-muted)]">
            Book4 has several conversion rows for {picker.lookupDesign} / {picker.lookupLoops}. Choose the exact sheet label.
          </p>
          <select
            value={spec.book4Complication || ""}
            onChange={(event) => update("book4Complication", event.target.value)}
            className="w-full appearance-none rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 pr-8 text-sm outline-none focus:border-[var(--navy)] focus:ring-[3px] focus:ring-[var(--navy-bg)]"
          >
            <option value="">Select a Book4 conversion type</option>
            {picker.candidates.map((row) => (
              <option key={row.complication} value={row.complication}>
                {row.complication} (${row.ratePerTon}/t)
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <CheckRow checked={spec.loopCover} onChange={(checked) => update("loopCover", checked)}>
        Loop Cover
      </CheckRow>
      {spec.loopCover ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>GSM:</FieldLabel>
            <Input value={spec.loopCoverGsm} onChange={(event) => update("loopCoverGsm", event.target.value)} className={fieldClassName} />
          </div>
          <CompactCheck
            checked={Boolean(spec.loopCoverLami) && spec.loopCoverLami !== "0"}
            onChange={(checked) => update("loopCoverLami", checked ? spec.loopCoverLami && spec.loopCoverLami !== "0" ? spec.loopCoverLami : "25" : "0")}
          >
            Lam
          </CompactCheck>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size:</FieldLabel>
            <Input value={spec.loopCoverSize} onChange={(event) => update("loopCoverSize", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Cut Size:</FieldLabel>
            <Input value={spec.loopCoverCut} onChange={(event) => update("loopCoverCut", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[72px] shrink-0">
            <FieldLabel>No:</FieldLabel>
            <Input value={spec.loopCoverCount} onChange={(event) => update("loopCoverCount", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.loopCoverColor || "Milky White"} onChange={(value) => update("loopCoverColor", value)} options={[...COLOURS]} />
          </div>
        </Fields>
      ) : null}

      <CheckRow checked={spec.stevedore} onChange={(checked) => update("stevedore", checked)}>
        Stevdore
      </CheckRow>
      {spec.stevedore ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.stevedoreGsm} onChange={(event) => update("stevedoreGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.stevedoreSize} onChange={(event) => update("stevedoreSize", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[160px] flex-1 basis-[160px]">
            <FieldLabel>Portion</FieldLabel>
            <FormSelect value={spec.stevedorePortion} onChange={(value) => update("stevedorePortion", value)} options={[...STEVEDORE_PORTIONS]} />
          </div>
          <div className="w-[72px] shrink-0">
            <FieldLabel>No:</FieldLabel>
            <Input value={spec.stevedoreCount} onChange={(event) => update("stevedoreCount", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.stevedoreColor || "Milky White"} onChange={(value) => update("stevedoreColor", value)} options={[...COLOURS]} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Lenght:</FieldLabel>
            <Input value={spec.stevedoreLength} onChange={(event) => update("stevedoreLength", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}

      <CheckRow checked={spec.steveCover} onChange={(checked) => update("steveCover", checked)}>
        Stevdore Cover
      </CheckRow>
      {spec.steveCover ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>GSM:</FieldLabel>
            <Input value={spec.steveCoverGsm} onChange={(event) => update("steveCoverGsm", event.target.value)} className={fieldClassName} />
          </div>
          <CompactCheck
            checked={Boolean(spec.steveCoverLami) && spec.steveCoverLami !== "0"}
            onChange={(checked) => update("steveCoverLami", checked ? spec.steveCoverLami && spec.steveCoverLami !== "0" ? spec.steveCoverLami : "25" : "0")}
          >
            Lam
          </CompactCheck>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size</FieldLabel>
            <FormSelect value={spec.steveCoverSize || "0"} onChange={(value) => update("steveCoverSize", value)} options={["0", "15", "20", "25", "30", "35", "40", "45", "50"]} />
          </div>
          <div className="w-[72px] shrink-0">
            <FieldLabel>No:</FieldLabel>
            <Input value={spec.steveCoverCount} onChange={(event) => update("steveCoverCount", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.steveCoverColor || "Milky White"} onChange={(value) => update("steveCoverColor", value)} options={[...COLOURS]} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Lenght:</FieldLabel>
            <Input value={spec.steveCoverLength} onChange={(event) => update("steveCoverLength", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}

      <CheckRow checked={spec.tunnel} onChange={(checked) => update("tunnel", checked)}>
        Tunnel
      </CheckRow>
      {spec.tunnel ? (
        <Fields>
          <div className="min-w-[160px] flex-1 basis-[160px]">
            <FieldLabel>Oswal Design:</FieldLabel>
            <FormSelect value={spec.tunnelDesign} onChange={(value) => update("tunnelDesign", value)} options={[...TUNNEL_DESIGNS]} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>GSM</FieldLabel>
            <FormSelect value={spec.tunnelGsm || "0"} onChange={(value) => update("tunnelGsm", value)} options={[...GSM_OPTIONS]} />
          </div>
          <CompactCheck
            checked={Boolean(spec.tunnelLami) && spec.tunnelLami !== "0"}
            onChange={(checked) => update("tunnelLami", checked ? spec.tunnelLami && spec.tunnelLami !== "0" ? spec.tunnelLami : "25" : "0")}
          >
            Lam
          </CompactCheck>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Free Len</FieldLabel>
            <Input value={spec.tunnelLength} onChange={(event) => update("tunnelLength", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Width</FieldLabel>
            <Input value={spec.tunnelWidth} onChange={(event) => update("tunnelWidth", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.tunnelColor || "Milky White"} onChange={(value) => update("tunnelColor", value)} options={[...COLOURS]} />
          </div>
        </Fields>
      ) : null}

      <CheckRow checked={spec.bottomLoop} onChange={(checked) => update("bottomLoop", checked)}>
        Bottom Loop
      </CheckRow>
      {spec.bottomLoop ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.bottomLoopGsm} onChange={(event) => update("bottomLoopGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.bottomLoopWidth} onChange={(event) => update("bottomLoopWidth", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[72px] shrink-0">
            <FieldLabel>No:</FieldLabel>
            <Input value={spec.bottomLoopCount} onChange={(event) => update("bottomLoopCount", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.bottomLoopColor || "Milky White"} onChange={(value) => update("bottomLoopColor", value)} options={[...COLOURS]} />
          </div>
          <div className="w-[100px] shrink-0">
            <FieldLabel>Total Lenght:</FieldLabel>
            <Input value={spec.bottomLoopLength} onChange={(event) => update("bottomLoopLength", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[100px] shrink-0">
            <FieldLabel>Fabric Sze:</FieldLabel>
            <Input value={spec.bottomLoopFabricSize} onChange={(event) => update("bottomLoopFabricSize", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}

      <CheckRow checked={spec.bellyBand1} onChange={(checked) => update("bellyBand1", checked)}>
        Belly Band 1
      </CheckRow>
      {spec.bellyBand1 ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.bellyBand1Gsm} onChange={(event) => update("bellyBand1Gsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.bellyBand1Size} onChange={(event) => update("bellyBand1Size", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.bellyBand1Color || "Milky White"} onChange={(value) => update("bellyBand1Color", value)} options={[...COLOURS]} />
          </div>
        </Fields>
      ) : null}

      <CheckRow checked={spec.bellyBand2} onChange={(checked) => update("bellyBand2", checked)}>
        Belly Band 2
      </CheckRow>
      {spec.bellyBand2 ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.bellyBand2Gsm} onChange={(event) => update("bellyBand2Gsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.bellyBand2Size} onChange={(event) => update("bellyBand2Size", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.bellyBand2Color || "Milky White"} onChange={(value) => update("bellyBand2Color", value)} options={[...COLOURS]} />
          </div>
        </Fields>
      ) : null}
    </>
  )
}

export function RateBomPanel({ spec, update }: Draft) {
  return (
    <>
      <Box>
        <FieldLabel>Raw Material Rate</FieldLabel>
        <Fields>
          <div className="min-w-[120px] flex-1 basis-[120px]">
            <FieldLabel>Type</FieldLabel>
            <Input value={spec.millRmType} onChange={(event) => update("millRmType", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[120px] flex-1 basis-[120px]">
            <FieldLabel>Material</FieldLabel>
            <Input value={spec.millRmMaterial} onChange={(event) => update("millRmMaterial", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[120px] flex-1 basis-[120px]">
            <FieldLabel>StdConv</FieldLabel>
            <Input value={spec.millRmStdConv} onChange={(event) => update("millRmStdConv", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      </Box>
      <Box>
        <FieldLabel>Liner</FieldLabel>
        <Fields>
          <div className="min-w-[120px] flex-1 basis-[120px]">
            <FieldLabel>Type</FieldLabel>
            <Input value={spec.millLinerRateType} onChange={(event) => update("millLinerRateType", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[120px] flex-1 basis-[120px]">
            <FieldLabel>Material</FieldLabel>
            <Input value={spec.millLinerMaterial} onChange={(event) => update("millLinerMaterial", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[120px] flex-1 basis-[120px]">
            <FieldLabel>StdConv</FieldLabel>
            <Input value={spec.millLinerStdConv} onChange={(event) => update("millLinerStdConv", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      </Box>
      <Box>
        <FieldLabel>Dust Proof</FieldLabel>
        <Fields>
          <div className="min-w-[120px] flex-1 basis-[120px]">
            <FieldLabel>DustProof</FieldLabel>
            <Input value={spec.millDustProof} onChange={(event) => update("millDustProof", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[120px] flex-1 basis-[120px]">
            <FieldLabel>Felt</FieldLabel>
            <Input value={spec.millFeltRate} onChange={(event) => update("millFeltRate", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      </Box>
      <Box>
        <FieldLabel>Loop</FieldLabel>
        <div className="w-[160px]">
          <FieldLabel>StdConv</FieldLabel>
          <Input value={spec.millLoopStdConv} onChange={(event) => update("millLoopStdConv", event.target.value)} className={fieldClassName} />
        </div>
      </Box>
      <Box>
        <FieldLabel>Addons Rate</FieldLabel>
        <Fields>
          <div className="w-[120px] shrink-0">
            <FieldLabel>Doc</FieldLabel>
            <Input value={spec.millAddonDoc} onChange={(event) => update("millAddonDoc", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[120px] shrink-0">
            <FieldLabel>Pallets</FieldLabel>
            <Input value={spec.millAddonPallets} onChange={(event) => update("millAddonPallets", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[120px] shrink-0">
            <FieldLabel>Printing</FieldLabel>
            <Input value={spec.millAddonPrinting} onChange={(event) => update("millAddonPrinting", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[120px] shrink-0">
            <FieldLabel>B-Lock</FieldLabel>
            <Input value={spec.millAddonBLock} onChange={(event) => update("millAddonBLock", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[140px] shrink-0">
            <FieldLabel>Hose - Slider</FieldLabel>
            <Input value={spec.millAddonHoseSlider} onChange={(event) => update("millAddonHoseSlider", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[120px] shrink-0">
            <FieldLabel>Velcro</FieldLabel>
            <Input value={spec.millAddonVelcro} onChange={(event) => update("millAddonVelcro", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      </Box>
      <Box>
        <FieldLabel>Currency Conversion</FieldLabel>
        <Fields>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Currency</FieldLabel>
            <FormSelect value={spec.millCurrency} onChange={(value) => update("millCurrency", value)} options={[...MILL_CURRENCIES]} />
          </div>
          <div className="w-[120px] shrink-0">
            <FieldLabel>1 USD INR</FieldLabel>
            <Input value={spec.millUsdInr} onChange={(event) => update("millUsdInr", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[120px] shrink-0">
            <FieldLabel>1 USD GBP</FieldLabel>
            <Input value={spec.millUsdGbp} onChange={(event) => update("millUsdGbp", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[120px] shrink-0">
            <FieldLabel>1 USD EURO</FieldLabel>
            <Input value={spec.millUsdEuro} onChange={(event) => update("millUsdEuro", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[120px] shrink-0">
            <FieldLabel>Freight</FieldLabel>
            <Input value={spec.millFreight} onChange={(event) => update("millFreight", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[120px] shrink-0">
            <FieldLabel>Discount</FieldLabel>
            <Input value={spec.millDiscount} onChange={(event) => update("millDiscount", event.target.value)} className={fieldClassName} />
          </div>
          <CompactCheck checked={spec.millOrderConfirmed} onChange={(checked) => update("millOrderConfirmed", checked)}>
            Order Confirmed
          </CompactCheck>
        </Fields>
        <p className="text-sm text-[var(--text-secondary)]">Please Put All Rate Value in USD Currency expect Discount can be in any currency</p>
      </Box>
      <div>
        <FieldLabel optional>Printing</FieldLabel>
        <FormSelect value={spec.printing} onChange={(value) => update("printing", value)} options={[...PRINT_TYPES]} />
      </div>
      <Fields>
        <div className="min-w-[140px] flex-1 basis-[140px]">
          <FieldLabel>Quantity (bags)</FieldLabel>
          <Input type="number" min={1} value={spec.quantity} onChange={(event) => update("quantity", event.target.value)} className={fieldClassName} />
        </div>
        <div className="min-w-[180px] flex-1 basis-[180px]">
          <FieldLabel>Delivery location</FieldLabel>
          <Input value={spec.deliveryLocation} onChange={(event) => update("deliveryLocation", event.target.value)} className={fieldClassName} />
        </div>
        <div className="min-w-[160px] flex-1 basis-[160px]">
          <FieldLabel optional>Party name</FieldLabel>
          <Input value={spec.partyName} onChange={(event) => update("partyName", event.target.value)} className={fieldClassName} placeholder="Also set on step 1" />
        </div>
      </Fields>
    </>
  )
}

export function FlapBomPanel({ spec, update }: Draft) {
  return (
    <>
      <CheckRow checked={spec.topFlap} onChange={(checked) => update("topFlap", checked)}>
        Top flap
      </CheckRow>
      {spec.topFlap ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>GSM</FieldLabel>
            <Input value={spec.topFlapGsm} onChange={(event) => update("topFlapGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Lami</FieldLabel>
            <FormSelect value={spec.topFlapLami || "0"} onChange={(value) => update("topFlapLami", value)} options={[...LAMI_OPTIONS]} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.topFlapColor} onChange={(value) => update("topFlapColor", value)} options={[...COLOURS]} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Nos {"{flap}"}</FieldLabel>
            <Input value={spec.topFlapCount} onChange={(event) => update("topFlapCount", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}
      <CheckRow checked={spec.bottomFlap} onChange={(checked) => update("bottomFlap", checked)}>
        Bottom Flap
      </CheckRow>
      {spec.bottomFlap ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>GSM</FieldLabel>
            <Input value={spec.bottomFlapGsm} onChange={(event) => update("bottomFlapGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Lami</FieldLabel>
            <FormSelect value={spec.bottomFlapLami || "0"} onChange={(value) => update("bottomFlapLami", value)} options={[...LAMI_OPTIONS]} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.bottomFlapColor} onChange={(value) => update("bottomFlapColor", value)} options={[...COLOURS]} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Nos {"{flap}"}</FieldLabel>
            <Input value={spec.bottomFlapCount} onChange={(event) => update("bottomFlapCount", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}
      <CheckRow checked={spec.topHook} onChange={(checked) => update("topHook", checked)}>
        Top Hook
      </CheckRow>
      {spec.topHook ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.topHookGsm} onChange={(event) => update("topHookGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.topHookSize} onChange={(event) => update("topHookSize", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Cut</FieldLabel>
            <FormSelect value={spec.topHookCut} onChange={(value) => update("topHookCut", value)} options={[...HOOK_CUTS]} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.topHookColor} onChange={(value) => update("topHookColor", value)} options={[...COLOURS]} />
          </div>
          <div className="w-[100px] shrink-0">
            <FieldLabel>Nos {"{Hook}"}</FieldLabel>
            <Input value={spec.topHookCount} onChange={(event) => update("topHookCount", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}
      <CheckRow checked={spec.bottomHook} onChange={(checked) => update("bottomHook", checked)}>
        Bottom Hook
      </CheckRow>
      {spec.bottomHook ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.bottomHookGsm} onChange={(event) => update("bottomHookGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.bottomHookSize} onChange={(event) => update("bottomHookSize", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Cut</FieldLabel>
            <FormSelect value={spec.bottomHookCut} onChange={(value) => update("bottomHookCut", value)} options={[...HOOK_CUTS]} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.bottomHookColor} onChange={(value) => update("bottomHookColor", value)} options={[...COLOURS]} />
          </div>
          <div className="w-[100px] shrink-0">
            <FieldLabel>Nos {"{Hook}"}</FieldLabel>
            <Input value={spec.bottomHookCount} onChange={(event) => update("bottomHookCount", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}
      <CheckRow checked={spec.ancerie} onChange={(checked) => update("ancerie", checked)}>
        Ancillary Loop
      </CheckRow>
      {spec.ancerie ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.ancerieGsm} onChange={(event) => update("ancerieGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size:</FieldLabel>
            <Input value={spec.ancerieSize} onChange={(event) => update("ancerieSize", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.ancerieColor} onChange={(value) => update("ancerieColor", value)} options={[...COLOURS]} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>W</FieldLabel>
            <Input value={spec.ancerieWidth} onChange={(event) => update("ancerieWidth", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[100px] shrink-0">
            <FieldLabel>Nos {"{Loop}"}</FieldLabel>
            <Input value={spec.ancerieCount} onChange={(event) => update("ancerieCount", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[72px] shrink-0">
            <FieldLabel>Attch</FieldLabel>
            <Input value={spec.ancerieAtt} onChange={(event) => update("ancerieAtt", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[160px] flex-1 basis-[160px]">
            <FieldLabel>Type</FieldLabel>
            <FormSelect value={spec.ancerieType} onChange={(value) => update("ancerieType", value)} options={[...ANCILLARY_LOOP_TYPES]} />
          </div>
        </Fields>
      ) : null}
    </>
  )
}

export function RopeBomPanel({ spec, update }: Draft) {
  return (
    <>
      <CheckRow checked={spec.topTie} onChange={(checked) => update("topTie", checked)}>
        TopTie
      </CheckRow>
      {spec.topTie ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Grm:</FieldLabel>
            <Input value={spec.topTieGsm} onChange={(event) => update("topTieGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size</FieldLabel>
            <FormSelect value={spec.topTieSize} onChange={(value) => update("topTieSize", value)} options={[...ROPE_SIZE_10_25]} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Cut</FieldLabel>
            <FormSelect value={spec.topTieCut} onChange={(value) => update("topTieCut", value)} options={[...CUT_0_20]} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.topTieColor} onChange={(value) => update("topTieColor", value)} options={[...COLOURS]} />
          </div>
          <div className="w-[100px] shrink-0">
            <FieldLabel>No of Tie:</FieldLabel>
            <Input value={spec.topTieCount} onChange={(event) => update("topTieCount", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}
      <CheckRow checked={spec.topRope} onChange={(checked) => update("topRope", checked)}>
        Top Rope
      </CheckRow>
      {spec.topRope ? (
        <Fields>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Type:</FieldLabel>
            <FormSelect value={spec.topRopeType} onChange={(value) => update("topRopeType", value)} options={[...ROPE_TYPES]} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Grm:</FieldLabel>
            <Input value={spec.topRopeGsm} onChange={(event) => update("topRopeGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size</FieldLabel>
            <FormSelect value={spec.topRopeSize} onChange={(value) => update("topRopeSize", value)} options={[...ROPE_SIZES]} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.topRopeColor} onChange={(value) => update("topRopeColor", value)} options={[...COLOURS]} />
          </div>
          <div className="w-[100px] shrink-0">
            <FieldLabel>No{"{Rope}"}:</FieldLabel>
            <Input value={spec.topRopeCount} onChange={(event) => update("topRopeCount", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}
      <CheckRow checked={spec.bottomTie} onChange={(checked) => update("bottomTie", checked)}>
        Bottom Tie
      </CheckRow>
      {spec.bottomTie ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Grm:</FieldLabel>
            <Input value={spec.bottomTieGsm} onChange={(event) => update("bottomTieGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size</FieldLabel>
            <FormSelect value={spec.bottomTieSize} onChange={(value) => update("bottomTieSize", value)} options={[...ROPE_SIZE_10_25]} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.bottomTieColor} onChange={(value) => update("bottomTieColor", value)} options={[...COLOURS]} />
          </div>
          <div className="w-[100px] shrink-0">
            <FieldLabel>No of Tie:</FieldLabel>
            <Input value={spec.bottomTieCount} onChange={(event) => update("bottomTieCount", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}
      <CheckRow checked={spec.bottomRope} onChange={(checked) => update("bottomRope", checked)}>
        Bottom Rope
      </CheckRow>
      {spec.bottomRope ? (
        <Fields>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Type:</FieldLabel>
            <FormSelect value={spec.bottomRopeType} onChange={(value) => update("bottomRopeType", value)} options={[...ROPE_TYPES]} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Grm:</FieldLabel>
            <Input value={spec.bottomRopeGsm} onChange={(event) => update("bottomRopeGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size</FieldLabel>
            <FormSelect value={spec.bottomRopeSize} onChange={(value) => update("bottomRopeSize", value)} options={[...ROPE_SIZES]} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.bottomRopeColor} onChange={(value) => update("bottomRopeColor", value)} options={[...COLOURS]} />
          </div>
          <div className="w-[100px] shrink-0">
            <FieldLabel>No{"{Rope}"}:</FieldLabel>
            <Input value={spec.bottomRopeCount} onChange={(event) => update("bottomRopeCount", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}
      <CheckRow checked={spec.threadEnabled} onChange={(checked) => update("threadEnabled", checked)}>
        Thread
      </CheckRow>
      {spec.threadEnabled ? (
        <Box>
          <Fields>
            <div className="min-w-[160px] flex-1 basis-[160px]">
              <FieldLabel>Buffle Seam</FieldLabel>
              <FormSelect value={spec.threadBuffleSeam || "All Seam (12)"} onChange={(value) => update("threadBuffleSeam", value)} options={[...THREAD_BUFFLE_SEAMS]} />
            </div>
            <div className="min-w-[120px] flex-1 basis-[120px]">
              <FieldLabel>Needle</FieldLabel>
              <FormSelect value={spec.threadNeedle || "Single"} onChange={(value) => update("threadNeedle", value)} options={[...THREAD_NEEDLES]} />
            </div>
            <CompactCheck checked={spec.hiracle} onChange={(checked) => update("hiracle", checked)}>
              Hiracle
            </CompactCheck>
            {spec.hiracle ? (
              <>
                <CompactCheck checked={spec.hiracleTop} onChange={(checked) => update("hiracleTop", checked)}>
                  Top
                </CompactCheck>
                <CompactCheck checked={spec.hiracleBottom} onChange={(checked) => update("hiracleBottom", checked)}>
                  Bottom
                </CompactCheck>
              </>
            ) : null}
            <div className="min-w-[140px] flex-1 basis-[140px]">
              <FieldLabel>Color</FieldLabel>
              <FormSelect value={spec.threadColour} onChange={(value) => update("threadColour", value)} options={[...COLOURS]} />
            </div>
            <div className="min-w-[120px] flex-1 basis-[120px]">
              <FieldLabel>Type</FieldLabel>
              <FormSelect value={spec.threadType} onChange={(value) => update("threadType", value)} options={[...THREAD_TYPES]} />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>Denier</FieldLabel>
              <Input value={spec.threadDenier} onChange={(event) => update("threadDenier", event.target.value)} className={fieldClassName} />
            </div>
          </Fields>
        </Box>
      ) : null}
    </>
  )
}

export function DocBomPanel({ spec, update, patch }: Draft) {
  function setFiller(enabledKey: keyof QuoteSpecification, typeKey: keyof QuoteSpecification, value: string) {
    if (value === "None") {
      patch({ [enabledKey]: false } as Partial<QuoteSpecification>)
      return
    }
    patch({ [enabledKey]: true, [typeKey]: fillerType(value) } as Partial<QuoteSpecification>)
  }

  return (
    <>
      <CheckRow checked={spec.docPouch} onChange={(checked) => update("docPouch", checked)}>
        Doc Pouch
      </CheckRow>
      {spec.docPouch ? (
        <Box>
          <Fields>
            <div className="min-w-[140px] flex-1 basis-[140px]">
              <FieldLabel>Type</FieldLabel>
              <FormSelect value={spec.docType} onChange={(value) => update("docType", value)} options={[...DOC_TYPES]} />
            </div>
            <div className="min-w-[220px] flex-[2] basis-[220px]">
              <FieldLabel>Opening</FieldLabel>
              <FormSelect value={spec.docOpening} onChange={(value) => update("docOpening", value)} options={[...DOC_OPENINGS]} />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>Size</FieldLabel>
              <FormSelect value={spec.docSubtype} onChange={(value) => update("docSubtype", value)} options={[...PAPER_SIZES]} />
            </div>
            <div className="min-w-[140px] flex-1 basis-[140px]">
              <FieldLabel>Remarks</FieldLabel>
              <Input value={spec.docRemarks} onChange={(event) => update("docRemarks", event.target.value)} className={fieldClassName} />
            </div>
          </Fields>
          <Fields>
            <div className="w-[72px] shrink-0">
              <FieldLabel>Nos</FieldLabel>
              <Input value={spec.docCount} onChange={(event) => update("docCount", event.target.value)} className={fieldClassName} />
            </div>
            <div className="w-[72px] shrink-0">
              <FieldLabel>L</FieldLabel>
              <Input value={spec.docLength} onChange={(event) => update("docLength", event.target.value)} className={fieldClassName} />
            </div>
            <div className="w-[72px] shrink-0">
              <FieldLabel>W</FieldLabel>
              <Input value={spec.docWidth} onChange={(event) => update("docWidth", event.target.value)} className={fieldClassName} />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>Micron</FieldLabel>
              <Input value={spec.docMicron} onChange={(event) => update("docMicron", event.target.value)} className={fieldClassName} />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>Unit</FieldLabel>
              <FormSelect value={spec.docUnit} onChange={(value) => update("docUnit", value)} options={[...DOC_UNITS]} />
            </div>
            <CompactCheck checked={spec.docFlap} onChange={(checked) => update("docFlap", checked)}>
              Flap
            </CompactCheck>
            {spec.docFlap ? (
              <div className="w-[72px] shrink-0">
                <FieldLabel>Size</FieldLabel>
                <Input value={spec.docFlapSize} onChange={(event) => update("docFlapSize", event.target.value)} className={fieldClassName} />
              </div>
            ) : null}
            <div className="min-w-[140px] flex-1 basis-[140px]">
              <FieldLabel>Color</FieldLabel>
              <FormSelect value={spec.docColor} onChange={(value) => update("docColor", value)} options={[...DOC_COLORS]} />
            </div>
          </Fields>
        </Box>
      ) : null}

      <CheckRow checked={spec.fillerCord} onChange={(checked) => update("fillerCord", checked)}>
        Filler Cord
      </CheckRow>
      {spec.fillerCord ? (
        <Box>
          <div className="w-[88px]">
            <FieldLabel>GPM</FieldLabel>
            <Input value={spec.fillerCordGpm} onChange={(event) => update("fillerCordGpm", event.target.value)} className={fieldClassName} />
          </div>
          <Fields>
            {(
              [
                ["Top", "fillerCordTop", "fillerCordTopType"],
                ["Bottom", "fillerCordBottom", "fillerCordBottomType"],
                ["Top Spout", "fillerCordTopSpout", "fillerCordTopSpoutType"],
                ["Bottom Spout", "fillerCordBottomSpout", "fillerCordBottomSpoutType"],
                ["Body", "fillerCordBody", "fillerCordBodyType"],
                ["Buffle", "fillerCordBuffle", "fillerCordBuffleType"],
              ] as const
            ).map(([label, enabledKey, typeKey]) => (
              <div key={enabledKey} className="w-[140px] shrink-0">
                <FieldLabel>{label}</FieldLabel>
                <FormSelect
                  value={fillerSelect(Boolean(spec[enabledKey]), String(spec[typeKey]))}
                  onChange={(value) => setFiller(enabledKey, typeKey, value)}
                  options={[...FILLER_CORD_TYPES]}
                />
              </div>
            ))}
          </Fields>
        </Box>
      ) : null}

      <CheckRow checked={spec.innerBox} onChange={(checked) => update("innerBox", checked)}>
        Inner Box
      </CheckRow>
      {spec.innerBox ? (
        <GsmLamiFields
          gsm={spec.innerBoxGsm || spec.bodyGsm}
          lami={spec.innerBoxLami || "0"}
          onGsm={(value) => update("innerBoxGsm", value)}
          onLami={(value) => update("innerBoxLami", value)}
          gsmOptions={[...GSM_OPTIONS]}
          lamiOptions={[...LAMI_OPTIONS]}
        />
      ) : null}

      <CheckRow checked={spec.loopProtector} onChange={(checked) => update("loopProtector", checked)}>
        Loop Proctector
      </CheckRow>
      {spec.loopProtector ? (
        <Fields>
          <div className="min-w-[220px] flex-[2] basis-[220px]">
            <FieldLabel>Loop Protector:</FieldLabel>
            <FormSelect value={spec.loopProtectorType} onChange={(value) => update("loopProtectorType", value)} options={[...LOOP_PROTECTOR_TYPES]} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>GSM</FieldLabel>
            <Input value={spec.loopProtectorGsm} onChange={(event) => update("loopProtectorGsm", event.target.value)} className={fieldClassName} />
          </div>
          <CompactCheck
            checked={Boolean(spec.loopProtectorLami) && spec.loopProtectorLami !== "0"}
            onChange={(checked) => update("loopProtectorLami", checked ? spec.loopProtectorLami && spec.loopProtectorLami !== "0" ? spec.loopProtectorLami : "25" : "0")}
          >
            Lam
          </CompactCheck>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.loopProtectorSize} onChange={(event) => update("loopProtectorSize", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}

      <CheckRow checked={spec.felt} onChange={(checked) => update("felt", checked)}>
        Felt
      </CheckRow>
      {spec.felt ? (
        <Fields>
          <CompactCheck checked={spec.feltTop} onChange={(checked) => update("feltTop", checked)}>Top</CompactCheck>
          <CompactCheck checked={spec.feltBottom} onChange={(checked) => update("feltBottom", checked)}>Bottom</CompactCheck>
          <CompactCheck checked={spec.feltBody} onChange={(checked) => update("feltBody", checked)}>Body</CompactCheck>
          <CompactCheck checked={spec.feltTopSpout} onChange={(checked) => update("feltTopSpout", checked)}>Top Spout</CompactCheck>
          <CompactCheck checked={spec.feltBottomSpout} onChange={(checked) => update("feltBottomSpout", checked)}>Bottom Spout</CompactCheck>
        </Fields>
      ) : null}

      <CheckRow checked={spec.mfWeb} onChange={(checked) => update("mfWeb", checked)}>
        MF Webbing
      </CheckRow>
      {spec.mfWeb ? (
        <Fields>
          <CompactCheck checked={spec.mfWebTop} onChange={(checked) => update("mfWebTop", checked)}>Top</CompactCheck>
          <CompactCheck checked={spec.mfWebBottom} onChange={(checked) => update("mfWebBottom", checked)}>Bottom</CompactCheck>
          <CompactCheck checked={spec.mfWebTopSpout} onChange={(checked) => update("mfWebTopSpout", checked)}>Top Spout</CompactCheck>
          <CompactCheck checked={spec.mfWebBottomSpout} onChange={(checked) => update("mfWebBottomSpout", checked)}>Bottom Spout</CompactCheck>
          <CompactCheck checked={spec.mfWebBody} onChange={(checked) => update("mfWebBody", checked)}>Body</CompactCheck>
          <CompactCheck checked={spec.mfWebBuffle} onChange={(checked) => update("mfWebBuffle", checked)}>Buffle</CompactCheck>
        </Fields>
      ) : null}
    </>
  )
}

export function ExtraLabelBomPanel({ spec, update }: Draft) {
  return (
    <>
      <CheckRow checked={spec.extraLabel} onChange={(checked) => update("extraLabel", checked)}>
        Extra Label
      </CheckRow>
      {spec.extraLabel ? (
        <Box>
          <Fields>
            <div className="w-[72px] shrink-0">
              <FieldLabel>Nos</FieldLabel>
              <Input value={spec.extraLabelCount} onChange={(event) => update("extraLabelCount", event.target.value)} className={fieldClassName} />
            </div>
            <div className="w-[72px] shrink-0">
              <FieldLabel>L</FieldLabel>
              <Input value={spec.extraLabelLength} onChange={(event) => update("extraLabelLength", event.target.value)} className={fieldClassName} />
            </div>
            <div className="w-[72px] shrink-0">
              <FieldLabel>W</FieldLabel>
              <Input value={spec.extraLabelWidth} onChange={(event) => update("extraLabelWidth", event.target.value)} className={fieldClassName} />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>Micron</FieldLabel>
              <Input value={spec.extraLabelMicron} onChange={(event) => update("extraLabelMicron", event.target.value)} className={fieldClassName} />
            </div>
            <CompactCheck
              checked={Boolean(spec.extraLabelLami) && spec.extraLabelLami !== "0"}
              onChange={(checked) => update("extraLabelLami", checked ? spec.extraLabelLami && spec.extraLabelLami !== "0" ? spec.extraLabelLami : "25" : "0")}
            >
              Lam
            </CompactCheck>
            <div className="min-w-[120px] flex-1 basis-[120px]">
              <FieldLabel>Type</FieldLabel>
              <FormSelect value={spec.extraLabelType} onChange={(value) => update("extraLabelType", value)} options={[...EXTRA_LABEL_TYPES]} />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>Subtype</FieldLabel>
              <FormSelect value={spec.extraLabelSubtype} onChange={(value) => update("extraLabelSubtype", value)} options={[...PAPER_SIZES]} />
            </div>
          </Fields>
          {(
            [
              ["1", "extraLabel1", "extraLabel1Length", "extraLabel1Width", "extraLabel1Micron"],
              ["2", "extraLabel2", "extraLabel2Length", "extraLabel2Width", "extraLabel2Micron"],
              ["3", "extraLabel3", "extraLabel3Length", "extraLabel3Width", "extraLabel3Micron"],
            ] as const
          ).map(([n, onKey, lKey, wKey, mKey]) => (
            <Fields key={n}>
              <CompactCheck checked={Boolean(spec[onKey])} onChange={(checked) => update(onKey, checked)}>
                Lam
              </CompactCheck>
              <div className="w-[72px] shrink-0">
                <FieldLabel>L</FieldLabel>
                <Input value={String(spec[lKey])} onChange={(event) => update(lKey, event.target.value)} className={fieldClassName} />
              </div>
              <div className="w-[72px] shrink-0">
                <FieldLabel>W</FieldLabel>
                <Input value={String(spec[wKey])} onChange={(event) => update(wKey, event.target.value)} className={fieldClassName} />
              </div>
              <div className="w-[88px] shrink-0">
                <FieldLabel>Micron</FieldLabel>
                <Input value={String(spec[mKey])} onChange={(event) => update(mKey, event.target.value)} className={fieldClassName} />
              </div>
            </Fields>
          ))}
        </Box>
      ) : null}

      <CheckRow checked={spec.innerSkin} onChange={(checked) => update("innerSkin", checked)}>
        Inner Skin
      </CheckRow>
      {spec.innerSkin ? (
        <Box>
          <GsmLamiFields
            gsm={spec.innerSkinGsm || spec.bodyGsm}
            lami={spec.innerSkinLami || "0"}
            onGsm={(value) => update("innerSkinGsm", value)}
            onLami={(value) => update("innerSkinLami", value)}
            gsmOptions={[...GSM_OPTIONS]}
            lamiOptions={[...LAMI_OPTIONS]}
          />
          <div className="w-[140px]">
            <FieldLabel>Extra cut</FieldLabel>
            <Input value={spec.innerSkinExtraCut} onChange={(event) => update("innerSkinExtraCut", event.target.value)} className={fieldClassName} />
          </div>
        </Box>
      ) : null}

      <CheckRow checked={spec.innerTop} onChange={(checked) => update("innerTop", checked)}>
        Inner Top
      </CheckRow>
      {spec.innerTop ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>GSM</FieldLabel>
            <Input value={spec.innerTopGsm} onChange={(event) => update("innerTopGsm", event.target.value)} className={fieldClassName} />
          </div>
          <CompactCheck
            checked={Boolean(spec.innerTopLami) && spec.innerTopLami !== "0"}
            onChange={(checked) => update("innerTopLami", checked ? spec.innerTopLami && spec.innerTopLami !== "0" ? spec.innerTopLami : "25" : "0")}
          >
            Lam
          </CompactCheck>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Dia</FieldLabel>
            <Input value={spec.innerTopDia} onChange={(event) => update("innerTopDia", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Extra</FieldLabel>
            <Input value={spec.innerTopExtra} onChange={(event) => update("innerTopExtra", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}

      <CheckRow checked={spec.innerBottom} onChange={(checked) => update("innerBottom", checked)}>
        Inner Bottom
      </CheckRow>
      {spec.innerBottom ? (
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>GSM</FieldLabel>
            <Input value={spec.innerBottomGsm} onChange={(event) => update("innerBottomGsm", event.target.value)} className={fieldClassName} />
          </div>
          <CompactCheck
            checked={Boolean(spec.innerBottomLami) && spec.innerBottomLami !== "0"}
            onChange={(checked) => update("innerBottomLami", checked ? spec.innerBottomLami && spec.innerBottomLami !== "0" ? spec.innerBottomLami : "25" : "0")}
          >
            Lam
          </CompactCheck>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Dia</FieldLabel>
            <Input value={spec.innerBottomDia} onChange={(event) => update("innerBottomDia", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Extra</FieldLabel>
            <Input value={spec.innerBottomExtra} onChange={(event) => update("innerBottomExtra", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      ) : null}
    </>
  )
}

export function InstructionBomPanel({ spec, update }: Draft) {
  return (
    <>
      <div>
        <FieldLabel>Instruction</FieldLabel>
        <Textarea
          value={spec.notes}
          onChange={(event) => update("notes", event.target.value)}
          rows={6}
          className="min-h-[140px] resize-none rounded-2xl border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
        />
        <p className="mt-2 text-sm text-[var(--text-secondary)]">For New Line starts with {"<br>"} and end with {"</br>"}</p>
        <p className="text-sm text-[var(--text-secondary)]">For Bold starts with {"<b>"} and end with {"</b>"}</p>
      </div>
      <Box>
        <FieldLabel>Buffle</FieldLabel>
        <Fields>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Buffle GSM</FieldLabel>
            <Input value={spec.buffleGsm} onChange={(event) => update("buffleGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[140px] shrink-0">
            <FieldLabel>Single Coated GSM</FieldLabel>
            <Input value={spec.buffleSingleCoatedGsm} onChange={(event) => update("buffleSingleCoatedGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[140px] shrink-0">
            <FieldLabel>Double Coated GSM</FieldLabel>
            <Input value={spec.buffleDoubleCoatedGsm} onChange={(event) => update("buffleDoubleCoatedGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[120px] shrink-0">
            <FieldLabel>Buffle Cut Lenght</FieldLabel>
            <Input value={spec.buffleCutLength} onChange={(event) => update("buffleCutLength", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Buffle Type</FieldLabel>
            <FormSelect value={spec.buffleKind} onChange={(value) => update("buffleKind", value)} options={[...BUFFLE_KINDS]} />
          </div>
          <div className="min-w-[160px] flex-1 basis-[160px]">
            <FieldLabel>Remarks</FieldLabel>
            <Input value={spec.buffleRemarks} onChange={(event) => update("buffleRemarks", event.target.value)} className={fieldClassName} />
          </div>
        </Fields>
      </Box>
      <Box>
        <FieldLabel>Remarks</FieldLabel>
        <div className="min-w-[180px]">
          <FieldLabel>Loop Remarks</FieldLabel>
          <Input value={spec.loopRemarks} onChange={(event) => update("loopRemarks", event.target.value)} className={fieldClassName} />
        </div>
      </Box>
    </>
  )
}

export function OtherBomPanel({ spec, update }: Draft) {
  return (
    <>
      <div>
        <FieldLabel>Transport</FieldLabel>
        <FormSelect value={spec.transport} onChange={(value) => update("transport", value)} options={[...TRANSPORT]} placeholder="Select transport" />
      </div>
      <div>
        <FieldLabel>Type of Supply</FieldLabel>
        <FormSelect value={spec.typeOfSupply} onChange={(value) => update("typeOfSupply", value)} options={[...SUPPLY_TYPES]} />
      </div>
      <Fields>
        <div className="min-w-[160px] flex-1 basis-[160px]">
          <FieldLabel>Packing</FieldLabel>
          <FormSelect value={spec.packing} onChange={(value) => update("packing", value)} options={[...PACKING]} placeholder="Select packing" />
        </div>
        <div className="w-[88px] shrink-0">
          <FieldLabel>PCS Per Pack</FieldLabel>
          <Input value={spec.packingPcs} onChange={(event) => update("packingPcs", event.target.value)} className={fieldClassName} />
        </div>
      </Fields>
    </>
  )
}

export function OtherDocBomPanel({ spec, update }: Draft) {
  return (
    <>
      <CheckRow checked={spec.docPouch1} onChange={(checked) => update("docPouch1", checked)}>
        Doc Pouch 1
      </CheckRow>
      {spec.docPouch1 ? (
        <Fields>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Type</FieldLabel>
            <FormSelect value={spec.doc1Type} onChange={(value) => update("doc1Type", value)} options={[...DOC_TYPES]} />
          </div>
          <div className="min-w-[200px] flex-[2] basis-[200px]">
            <FieldLabel>Opening</FieldLabel>
            <FormSelect value={spec.doc1Opening} onChange={(value) => update("doc1Opening", value)} options={[...DOC_OPENINGS]} />
          </div>
          <div className="w-[72px] shrink-0">
            <FieldLabel>L</FieldLabel>
            <Input value={spec.doc1Length} onChange={(event) => update("doc1Length", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[72px] shrink-0">
            <FieldLabel>W</FieldLabel>
            <Input value={spec.doc1Width} onChange={(event) => update("doc1Width", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Micron</FieldLabel>
            <Input value={spec.doc1Micron} onChange={(event) => update("doc1Micron", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Unit</FieldLabel>
            <FormSelect value={spec.doc1Unit} onChange={(value) => update("doc1Unit", value)} options={[...DOC_UNITS]} />
          </div>
        </Fields>
      ) : null}
      <CheckRow checked={spec.docPouch2} onChange={(checked) => update("docPouch2", checked)}>
        Doc Pouch 2
      </CheckRow>
      {spec.docPouch2 ? (
        <Fields>
          <div className="min-w-[140px] flex-1 basis-[140px]">
            <FieldLabel>Type</FieldLabel>
            <FormSelect value={spec.doc2Type} onChange={(value) => update("doc2Type", value)} options={[...DOC_TYPES]} />
          </div>
          <div className="min-w-[200px] flex-[2] basis-[200px]">
            <FieldLabel>Opening</FieldLabel>
            <FormSelect value={spec.doc2Opening} onChange={(value) => update("doc2Opening", value)} options={[...DOC_OPENINGS]} />
          </div>
          <div className="w-[72px] shrink-0">
            <FieldLabel>L</FieldLabel>
            <Input value={spec.doc2Length} onChange={(event) => update("doc2Length", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[72px] shrink-0">
            <FieldLabel>W</FieldLabel>
            <Input value={spec.doc2Width} onChange={(event) => update("doc2Width", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Micron</FieldLabel>
            <Input value={spec.doc2Micron} onChange={(event) => update("doc2Micron", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Unit</FieldLabel>
            <FormSelect value={spec.doc2Unit} onChange={(value) => update("doc2Unit", value)} options={[...DOC_UNITS]} />
          </div>
        </Fields>
      ) : null}
    </>
  )
}

export function OtherBomGridPanel({ spec, update }: Draft) {
  const rows = spec.otherBomRows ?? []

  function setRow(index: number, patch: Partial<OtherBomRow>) {
    update(
      "otherBomRows",
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
  }

  return (
    <>
      <p className="text-sm text-[var(--text-secondary)]">Other Bom Component</p>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-[var(--navy-bg)] text-[11px] font-semibold tracking-wide text-[var(--navy)] uppercase">
            <tr>
              {["Component Name", "GSM", "Lami/UL", "Color", "Fabricsize", "CutLenght", "TotalMtr", "totalkg", "Remarks", "Category", ""].map((h) => (
                <th key={h} className="px-2 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-[var(--border)]">
                <td className="p-1"><Input value={row.name} onChange={(event) => setRow(index, { name: event.target.value })} className={fieldClassName} /></td>
                <td className="p-1 w-[72px]"><Input value={row.gsm} onChange={(event) => setRow(index, { gsm: event.target.value })} className={fieldClassName} /></td>
                <td className="p-1 w-[72px]"><Input value={row.lami} onChange={(event) => setRow(index, { lami: event.target.value })} className={fieldClassName} /></td>
                <td className="p-1 w-[120px]"><FormSelect value={row.color} onChange={(value) => setRow(index, { color: value })} options={[...COLOURS]} /></td>
                <td className="p-1 w-[88px]"><Input value={row.fabricSize} onChange={(event) => setRow(index, { fabricSize: event.target.value })} className={fieldClassName} /></td>
                <td className="p-1 w-[88px]"><Input value={row.cutLength} onChange={(event) => setRow(index, { cutLength: event.target.value })} className={fieldClassName} /></td>
                <td className="p-1 w-[88px]"><Input value={row.totalMtr} onChange={(event) => setRow(index, { totalMtr: event.target.value })} className={fieldClassName} /></td>
                <td className="p-1 w-[88px]"><Input value={row.totalKg} onChange={(event) => setRow(index, { totalKg: event.target.value })} className={fieldClassName} /></td>
                <td className="p-1"><Input value={row.remarks} onChange={(event) => setRow(index, { remarks: event.target.value })} className={fieldClassName} /></td>
                <td className="p-1 w-[100px]"><Input value={row.category} onChange={(event) => setRow(index, { category: event.target.value })} className={fieldClassName} /></td>
                <td className="p-1">
                  <button type="button" className="text-xs text-[var(--error)]" onClick={() => update("otherBomRows", rows.filter((_, i) => i !== index))}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="font-heading text-sm font-semibold text-[var(--navy)]"
        onClick={() => update("otherBomRows", [...rows, emptyBomRow()])}
      >
        Add component
      </button>
    </>
  )
}
