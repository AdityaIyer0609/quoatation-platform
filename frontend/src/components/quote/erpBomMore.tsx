import { fieldClassName } from "@/components/login/fieldStyles"
import {
  BomColourField,
  CompactCheck,
  ColourField,
  FeatureCard,
  FieldCell,
  FieldGrid,
  FieldLabel,
  FormSelect,
  GsmLamiFields,
  PanelStack,
} from "@/components/quote/FormControls"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ANCILLARY_LOOP_TYPES,
  BUFFLE_KINDS,
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
  pantone: "",
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

function Fields({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-end gap-x-3 gap-y-4", className)}>{children}</div>
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 rounded-2xl border border-[var(--border)] p-4">{children}</div>
}

export function LoopBomPanel({ spec, update, picker }: Draft & { picker: ComplicationPicker | null }) {
  return (
    <PanelStack>
      <FeatureCard
        title="Loop"
        on={spec.loopEnabled}
        onToggle={(v) => update("loopEnabled", v)}
        summary={
          spec.loopEnabled
            ? `${spec.loopConstruction} · ${spec.loopCount} × ${spec.loopLength}×${spec.loopWidth} · ${spec.loopColour}`
            : undefined
        }
      >
        <FieldGrid>
          <FieldCell span={2}>
            <FieldLabel>Const</FieldLabel>
            <FormSelect value={spec.loopConstruction} onChange={(value) => update("loopConstruction", value)} options={[...LOOP_CONSTS]} />
          </FieldCell>
          <FieldCell span={2}>
            <FieldLabel>Type</FieldLabel>
            <FormSelect value={spec.loopType} onChange={(value) => update("loopType", value)} options={[...LOOP_MATERIALS]} />
          </FieldCell>
          <FieldCell>
            <CompactCheck checked={spec.dropLoop} onChange={(checked) => update("dropLoop", checked)}>
              Drop Loop
            </CompactCheck>
          </FieldCell>
          {spec.dropLoop ? (
            <FieldCell>
              <FieldLabel>Lenght</FieldLabel>
              <Input value={spec.dropLoopLength} onChange={(event) => update("dropLoopLength", event.target.value)} className={fieldClassName} />
            </FieldCell>
          ) : null}
          <FieldCell>
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.loopGsm} onChange={(event) => update("loopGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>L</FieldLabel>
            <Input value={spec.loopLength} onChange={(event) => update("loopLength", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>W</FieldLabel>
            <Input value={spec.loopWidth} onChange={(event) => update("loopWidth", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>No of Loop:</FieldLabel>
            <Input value={spec.loopCount} onChange={(event) => update("loopCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <CompactCheck checked={spec.loopTillBottom} onChange={(checked) => update("loopTillBottom", checked)}>
              Till The Bottom
            </CompactCheck>
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="loopColour" />
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Short Leg</FieldLabel>
            <Input value={spec.loopShortLeg} onChange={(event) => update("loopShortLeg", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Long Leg</FieldLabel>
            <Input value={spec.loopLongLeg} onChange={(event) => update("loopLongLeg", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <CompactCheck checked={spec.fabricPatch} onChange={(checked) => update("fabricPatch", checked)}>
              Fabric Patch
            </CompactCheck>
          </FieldCell>
          {spec.fabricPatch ? (
            <>
              <FieldCell>
                <FieldLabel>GSM</FieldLabel>
                <FormSelect value={spec.fabricPatchGsm || "0"} onChange={(value) => update("fabricPatchGsm", value)} options={[...GSM_OPTIONS]} />
              </FieldCell>
              <FieldCell>
                <CompactCheck
                  checked={Boolean(spec.fabricPatchLami) && spec.fabricPatchLami !== "0"}
                  onChange={(checked) => update("fabricPatchLami", checked ? spec.fabricPatchLami && spec.fabricPatchLami !== "0" ? spec.fabricPatchLami : "25" : "0")}
                >
                  LAM
                </CompactCheck>
              </FieldCell>
            </>
          ) : null}
        </FieldGrid>
      </FeatureCard>

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

      <FeatureCard
        title="Loop Cover"
        on={spec.loopCover}
        onToggle={(v) => update("loopCover", v)}
        summary={spec.loopCover ? `${spec.loopCoverGsm} GSM · ${spec.loopCoverCount} no · ${spec.loopCoverColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>GSM:</FieldLabel>
            <Input value={spec.loopCoverGsm} onChange={(event) => update("loopCoverGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <CompactCheck
              checked={Boolean(spec.loopCoverLami) && spec.loopCoverLami !== "0"}
              onChange={(checked) => update("loopCoverLami", checked ? spec.loopCoverLami && spec.loopCoverLami !== "0" ? spec.loopCoverLami : "25" : "0")}
            >
              Lam
            </CompactCheck>
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size:</FieldLabel>
            <Input value={spec.loopCoverSize} onChange={(event) => update("loopCoverSize", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Cut Size:</FieldLabel>
            <Input value={spec.loopCoverCut} onChange={(event) => update("loopCoverCut", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>No:</FieldLabel>
            <Input value={spec.loopCoverCount} onChange={(event) => update("loopCoverCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="loopCoverColor" />
      </FeatureCard>

      <FeatureCard
        title="Stevdore"
        on={spec.stevedore}
        onToggle={(v) => update("stevedore", v)}
        summary={spec.stevedore ? `${spec.stevedoreGsm} grm · ${spec.stevedorePortion} · ${spec.stevedoreColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.stevedoreGsm} onChange={(event) => update("stevedoreGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.stevedoreSize} onChange={(event) => update("stevedoreSize", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell span={2}>
            <FieldLabel>Portion</FieldLabel>
            <FormSelect value={spec.stevedorePortion} onChange={(value) => update("stevedorePortion", value)} options={[...STEVEDORE_PORTIONS]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>No:</FieldLabel>
            <Input value={spec.stevedoreCount} onChange={(event) => update("stevedoreCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Lenght:</FieldLabel>
            <Input value={spec.stevedoreLength} onChange={(event) => update("stevedoreLength", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="stevedoreColor" />
      </FeatureCard>

      <FeatureCard
        title="Stevdore Cover"
        on={spec.steveCover}
        onToggle={(v) => update("steveCover", v)}
        summary={spec.steveCover ? `${spec.steveCoverGsm} GSM · ${spec.steveCoverCount} no · ${spec.steveCoverColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>GSM:</FieldLabel>
            <Input value={spec.steveCoverGsm} onChange={(event) => update("steveCoverGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <CompactCheck
              checked={Boolean(spec.steveCoverLami) && spec.steveCoverLami !== "0"}
              onChange={(checked) => update("steveCoverLami", checked ? spec.steveCoverLami && spec.steveCoverLami !== "0" ? spec.steveCoverLami : "25" : "0")}
            >
              Lam
            </CompactCheck>
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <FormSelect value={spec.steveCoverSize || "0"} onChange={(value) => update("steveCoverSize", value)} options={["0", "15", "20", "25", "30", "35", "40", "45", "50"]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>No:</FieldLabel>
            <Input value={spec.steveCoverCount} onChange={(event) => update("steveCoverCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Lenght:</FieldLabel>
            <Input value={spec.steveCoverLength} onChange={(event) => update("steveCoverLength", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="steveCoverColor" />
      </FeatureCard>

      <FeatureCard
        title="Tunnel"
        on={spec.tunnel}
        onToggle={(v) => update("tunnel", v)}
        summary={spec.tunnel ? `${spec.tunnelDesign} · ${spec.tunnelLength}×${spec.tunnelWidth} · ${spec.tunnelColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell span={2}>
            <FieldLabel>Oswal Design:</FieldLabel>
            <FormSelect value={spec.tunnelDesign} onChange={(value) => update("tunnelDesign", value)} options={[...TUNNEL_DESIGNS]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>GSM</FieldLabel>
            <FormSelect value={spec.tunnelGsm || "0"} onChange={(value) => update("tunnelGsm", value)} options={[...GSM_OPTIONS]} />
          </FieldCell>
          <FieldCell>
            <CompactCheck
              checked={Boolean(spec.tunnelLami) && spec.tunnelLami !== "0"}
              onChange={(checked) => update("tunnelLami", checked ? spec.tunnelLami && spec.tunnelLami !== "0" ? spec.tunnelLami : "25" : "0")}
            >
              Lam
            </CompactCheck>
          </FieldCell>
          <FieldCell>
            <FieldLabel>Free Len</FieldLabel>
            <Input value={spec.tunnelLength} onChange={(event) => update("tunnelLength", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Width</FieldLabel>
            <Input value={spec.tunnelWidth} onChange={(event) => update("tunnelWidth", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="tunnelColor" />
      </FeatureCard>

      <FeatureCard
        title="Bottom Loop"
        on={spec.bottomLoop}
        onToggle={(v) => update("bottomLoop", v)}
        summary={spec.bottomLoop ? `${spec.bottomLoopGsm} grm · ${spec.bottomLoopCount} no · ${spec.bottomLoopColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.bottomLoopGsm} onChange={(event) => update("bottomLoopGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.bottomLoopWidth} onChange={(event) => update("bottomLoopWidth", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>No:</FieldLabel>
            <Input value={spec.bottomLoopCount} onChange={(event) => update("bottomLoopCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Total Lenght:</FieldLabel>
            <Input value={spec.bottomLoopLength} onChange={(event) => update("bottomLoopLength", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Fabric Sze:</FieldLabel>
            <Input value={spec.bottomLoopFabricSize} onChange={(event) => update("bottomLoopFabricSize", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="bottomLoopColor" />
      </FeatureCard>

      <FeatureCard
        title="Belly Band 1"
        on={spec.bellyBand1}
        onToggle={(v) => update("bellyBand1", v)}
        summary={spec.bellyBand1 ? `${spec.bellyBand1Gsm} grm · ${spec.bellyBand1Size} · ${spec.bellyBand1Color}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.bellyBand1Gsm} onChange={(event) => update("bellyBand1Gsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.bellyBand1Size} onChange={(event) => update("bellyBand1Size", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="bellyBand1Color" />
      </FeatureCard>

      <FeatureCard
        title="Belly Band 2"
        on={spec.bellyBand2}
        onToggle={(v) => update("bellyBand2", v)}
        summary={spec.bellyBand2 ? `${spec.bellyBand2Gsm} grm · ${spec.bellyBand2Size} · ${spec.bellyBand2Color}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.bellyBand2Gsm} onChange={(event) => update("bellyBand2Gsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.bellyBand2Size} onChange={(event) => update("bellyBand2Size", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="bellyBand2Color" />
      </FeatureCard>
    </PanelStack>
  )
}

export function RateBomPanel({ spec, update }: Draft) {
  return (
    <PanelStack>
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
    </PanelStack>
  )
}

export function FlapBomPanel({ spec, update }: Draft) {
  return (
    <PanelStack>
      <FeatureCard
        title="Top flap"
        on={spec.topFlap}
        onToggle={(v) => update("topFlap", v)}
        summary={spec.topFlap ? `${spec.topFlapGsm} GSM · ${spec.topFlapCount} flap · ${spec.topFlapColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>GSM</FieldLabel>
            <Input value={spec.topFlapGsm} onChange={(event) => update("topFlapGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Lami</FieldLabel>
            <FormSelect value={spec.topFlapLami || "0"} onChange={(value) => update("topFlapLami", value)} options={[...LAMI_OPTIONS]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Nos {"{flap}"}</FieldLabel>
            <Input value={spec.topFlapCount} onChange={(event) => update("topFlapCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="topFlapColor" />
      </FeatureCard>

      <FeatureCard
        title="Bottom Flap"
        on={spec.bottomFlap}
        onToggle={(v) => update("bottomFlap", v)}
        summary={spec.bottomFlap ? `${spec.bottomFlapGsm} GSM · ${spec.bottomFlapCount} flap · ${spec.bottomFlapColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>GSM</FieldLabel>
            <Input value={spec.bottomFlapGsm} onChange={(event) => update("bottomFlapGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Lami</FieldLabel>
            <FormSelect value={spec.bottomFlapLami || "0"} onChange={(value) => update("bottomFlapLami", value)} options={[...LAMI_OPTIONS]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Nos {"{flap}"}</FieldLabel>
            <Input value={spec.bottomFlapCount} onChange={(event) => update("bottomFlapCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="bottomFlapColor" />
      </FeatureCard>

      <FeatureCard
        title="Top Hook"
        on={spec.topHook}
        onToggle={(v) => update("topHook", v)}
        summary={spec.topHook ? `${spec.topHookGsm} grm · ${spec.topHookCount} hook · ${spec.topHookColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.topHookGsm} onChange={(event) => update("topHookGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.topHookSize} onChange={(event) => update("topHookSize", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Cut</FieldLabel>
            <FormSelect value={spec.topHookCut} onChange={(value) => update("topHookCut", value)} options={[...HOOK_CUTS]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Nos {"{Hook}"}</FieldLabel>
            <Input value={spec.topHookCount} onChange={(event) => update("topHookCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="topHookColor" />
      </FeatureCard>

      <FeatureCard
        title="Bottom Hook"
        on={spec.bottomHook}
        onToggle={(v) => update("bottomHook", v)}
        summary={spec.bottomHook ? `${spec.bottomHookGsm} grm · ${spec.bottomHookCount} hook · ${spec.bottomHookColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.bottomHookGsm} onChange={(event) => update("bottomHookGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.bottomHookSize} onChange={(event) => update("bottomHookSize", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Cut</FieldLabel>
            <FormSelect value={spec.bottomHookCut} onChange={(value) => update("bottomHookCut", value)} options={[...HOOK_CUTS]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Nos {"{Hook}"}</FieldLabel>
            <Input value={spec.bottomHookCount} onChange={(event) => update("bottomHookCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="bottomHookColor" />
      </FeatureCard>

      <FeatureCard
        title="Ancillary Loop"
        on={spec.ancerie}
        onToggle={(v) => update("ancerie", v)}
        summary={spec.ancerie ? `${spec.ancerieType} · ${spec.ancerieCount} loop · ${spec.ancerieColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Grm</FieldLabel>
            <Input value={spec.ancerieGsm} onChange={(event) => update("ancerieGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size:</FieldLabel>
            <Input value={spec.ancerieSize} onChange={(event) => update("ancerieSize", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>W</FieldLabel>
            <Input value={spec.ancerieWidth} onChange={(event) => update("ancerieWidth", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Nos {"{Loop}"}</FieldLabel>
            <Input value={spec.ancerieCount} onChange={(event) => update("ancerieCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Attch</FieldLabel>
            <Input value={spec.ancerieAtt} onChange={(event) => update("ancerieAtt", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell span={2}>
            <FieldLabel>Type</FieldLabel>
            <FormSelect value={spec.ancerieType} onChange={(value) => update("ancerieType", value)} options={[...ANCILLARY_LOOP_TYPES]} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="ancerieColor" />
      </FeatureCard>
    </PanelStack>
  )
}

export function RopeBomPanel({ spec, update }: Draft) {
  return (
    <PanelStack>
      <FeatureCard
        title="TopTie"
        on={spec.topTie}
        onToggle={(v) => update("topTie", v)}
        summary={spec.topTie ? `${spec.topTieGsm} grm · ${spec.topTieCount} tie · ${spec.topTieColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Grm:</FieldLabel>
            <Input value={spec.topTieGsm} onChange={(event) => update("topTieGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <FormSelect value={spec.topTieSize} onChange={(value) => update("topTieSize", value)} options={[...ROPE_SIZE_10_25]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Cut</FieldLabel>
            <FormSelect value={spec.topTieCut} onChange={(value) => update("topTieCut", value)} options={[...CUT_0_20]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>No of Tie:</FieldLabel>
            <Input value={spec.topTieCount} onChange={(event) => update("topTieCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="topTieColor" />
      </FeatureCard>

      <FeatureCard
        title="Top Rope"
        on={spec.topRope}
        onToggle={(v) => update("topRope", v)}
        summary={spec.topRope ? `${spec.topRopeType} · ${spec.topRopeCount} rope · ${spec.topRopeColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell span={2}>
            <FieldLabel>Type:</FieldLabel>
            <FormSelect value={spec.topRopeType} onChange={(value) => update("topRopeType", value)} options={[...ROPE_TYPES]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Grm:</FieldLabel>
            <Input value={spec.topRopeGsm} onChange={(event) => update("topRopeGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <FormSelect value={spec.topRopeSize} onChange={(value) => update("topRopeSize", value)} options={[...ROPE_SIZES]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>No{"{Rope}"}:</FieldLabel>
            <Input value={spec.topRopeCount} onChange={(event) => update("topRopeCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="topRopeColor" />
      </FeatureCard>

      <FeatureCard
        title="Bottom Tie"
        on={spec.bottomTie}
        onToggle={(v) => update("bottomTie", v)}
        summary={spec.bottomTie ? `${spec.bottomTieGsm} grm · ${spec.bottomTieCount} tie · ${spec.bottomTieColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Grm:</FieldLabel>
            <Input value={spec.bottomTieGsm} onChange={(event) => update("bottomTieGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <FormSelect value={spec.bottomTieSize} onChange={(value) => update("bottomTieSize", value)} options={[...ROPE_SIZE_10_25]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>No of Tie:</FieldLabel>
            <Input value={spec.bottomTieCount} onChange={(event) => update("bottomTieCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="bottomTieColor" />
      </FeatureCard>

      <FeatureCard
        title="Bottom Rope"
        on={spec.bottomRope}
        onToggle={(v) => update("bottomRope", v)}
        summary={spec.bottomRope ? `${spec.bottomRopeType} · ${spec.bottomRopeCount} rope · ${spec.bottomRopeColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell span={2}>
            <FieldLabel>Type:</FieldLabel>
            <FormSelect value={spec.bottomRopeType} onChange={(value) => update("bottomRopeType", value)} options={[...ROPE_TYPES]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Grm:</FieldLabel>
            <Input value={spec.bottomRopeGsm} onChange={(event) => update("bottomRopeGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <FormSelect value={spec.bottomRopeSize} onChange={(value) => update("bottomRopeSize", value)} options={[...ROPE_SIZES]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>No{"{Rope}"}:</FieldLabel>
            <Input value={spec.bottomRopeCount} onChange={(event) => update("bottomRopeCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="bottomRopeColor" />
      </FeatureCard>

      <FeatureCard
        title="Thread"
        on={spec.threadEnabled}
        onToggle={(v) => update("threadEnabled", v)}
        summary={spec.threadEnabled ? `${spec.threadType} · ${spec.threadDenier} denier · ${spec.threadColour}` : undefined}
      >
        <FieldGrid>
          <FieldCell span={2}>
            <FieldLabel>Buffle Seam</FieldLabel>
            <FormSelect value={spec.threadBuffleSeam || "All Seam (12)"} onChange={(value) => update("threadBuffleSeam", value)} options={[...THREAD_BUFFLE_SEAMS]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Needle</FieldLabel>
            <FormSelect value={spec.threadNeedle || "Single"} onChange={(value) => update("threadNeedle", value)} options={[...THREAD_NEEDLES]} />
          </FieldCell>
          <FieldCell>
            <CompactCheck checked={spec.hiracle} onChange={(checked) => update("hiracle", checked)}>
              Hiracle
            </CompactCheck>
          </FieldCell>
          {spec.hiracle ? (
            <>
              <FieldCell>
                <CompactCheck checked={spec.hiracleTop} onChange={(checked) => update("hiracleTop", checked)}>
                  Top
                </CompactCheck>
              </FieldCell>
              <FieldCell>
                <CompactCheck checked={spec.hiracleBottom} onChange={(checked) => update("hiracleBottom", checked)}>
                  Bottom
                </CompactCheck>
              </FieldCell>
            </>
          ) : null}
          <FieldCell>
            <FieldLabel>Type</FieldLabel>
            <FormSelect value={spec.threadType} onChange={(value) => update("threadType", value)} options={[...THREAD_TYPES]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Denier</FieldLabel>
            <Input value={spec.threadDenier} onChange={(event) => update("threadDenier", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="threadColour" />
      </FeatureCard>
    </PanelStack>
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
    <PanelStack>
      <FeatureCard
        title="Doc Pouch"
        on={spec.docPouch}
        onToggle={(v) => update("docPouch", v)}
        summary={spec.docPouch ? `${spec.docType} · ${spec.docCount} no · ${spec.docColor}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Type</FieldLabel>
            <FormSelect value={spec.docType} onChange={(value) => update("docType", value)} options={[...DOC_TYPES]} />
          </FieldCell>
          <FieldCell span={2}>
            <FieldLabel>Opening</FieldLabel>
            <FormSelect value={spec.docOpening} onChange={(value) => update("docOpening", value)} options={[...DOC_OPENINGS]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <FormSelect value={spec.docSubtype} onChange={(value) => update("docSubtype", value)} options={[...PAPER_SIZES]} />
          </FieldCell>
          <FieldCell span={2}>
            <FieldLabel>Remarks</FieldLabel>
            <Input value={spec.docRemarks} onChange={(event) => update("docRemarks", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Nos</FieldLabel>
            <Input value={spec.docCount} onChange={(event) => update("docCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>L</FieldLabel>
            <Input value={spec.docLength} onChange={(event) => update("docLength", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>W</FieldLabel>
            <Input value={spec.docWidth} onChange={(event) => update("docWidth", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Micron</FieldLabel>
            <Input value={spec.docMicron} onChange={(event) => update("docMicron", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Unit</FieldLabel>
            <FormSelect value={spec.docUnit} onChange={(value) => update("docUnit", value)} options={[...DOC_UNITS]} />
          </FieldCell>
          <FieldCell>
            <CompactCheck checked={spec.docFlap} onChange={(checked) => update("docFlap", checked)}>
              Flap
            </CompactCheck>
          </FieldCell>
          {spec.docFlap ? (
            <FieldCell>
              <FieldLabel>Size</FieldLabel>
              <Input value={spec.docFlapSize} onChange={(event) => update("docFlapSize", event.target.value)} className={fieldClassName} />
            </FieldCell>
          ) : null}
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="docColor" options={DOC_COLORS} />
      </FeatureCard>

      <FeatureCard
        title="Filler Cord"
        on={spec.fillerCord}
        onToggle={(v) => update("fillerCord", v)}
        summary={spec.fillerCord ? `GPM ${spec.fillerCordGpm}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>GPM</FieldLabel>
            <Input value={spec.fillerCordGpm} onChange={(event) => update("fillerCordGpm", event.target.value)} className={fieldClassName} />
          </FieldCell>
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
            <FieldCell key={enabledKey}>
              <FieldLabel>{label}</FieldLabel>
              <FormSelect
                value={fillerSelect(Boolean(spec[enabledKey]), String(spec[typeKey]))}
                onChange={(value) => setFiller(enabledKey, typeKey, value)}
                options={[...FILLER_CORD_TYPES]}
              />
            </FieldCell>
          ))}
        </FieldGrid>
      </FeatureCard>

      <FeatureCard
        title="Inner Box"
        on={spec.innerBox}
        onToggle={(v) => update("innerBox", v)}
        summary={spec.innerBox ? `${spec.innerBoxGsm || spec.bodyGsm} GSM · lami ${spec.innerBoxLami || "0"}` : undefined}
      >
        <GsmLamiFields
          gsm={spec.innerBoxGsm || spec.bodyGsm}
          lami={spec.innerBoxLami || "0"}
          onGsm={(value) => update("innerBoxGsm", value)}
          onLami={(value) => update("innerBoxLami", value)}
          gsmOptions={[...GSM_OPTIONS]}
          lamiOptions={[...LAMI_OPTIONS]}
        />
      </FeatureCard>

      <FeatureCard
        title="Loop Proctector"
        on={spec.loopProtector}
        onToggle={(v) => update("loopProtector", v)}
        summary={spec.loopProtector ? `${spec.loopProtectorType} · ${spec.loopProtectorGsm} GSM` : undefined}
      >
        <FieldGrid>
          <FieldCell span={2}>
            <FieldLabel>Loop Protector:</FieldLabel>
            <FormSelect value={spec.loopProtectorType} onChange={(value) => update("loopProtectorType", value)} options={[...LOOP_PROTECTOR_TYPES]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>GSM</FieldLabel>
            <Input value={spec.loopProtectorGsm} onChange={(event) => update("loopProtectorGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <CompactCheck
              checked={Boolean(spec.loopProtectorLami) && spec.loopProtectorLami !== "0"}
              onChange={(checked) => update("loopProtectorLami", checked ? spec.loopProtectorLami && spec.loopProtectorLami !== "0" ? spec.loopProtectorLami : "25" : "0")}
            >
              Lam
            </CompactCheck>
          </FieldCell>
          <FieldCell>
            <FieldLabel>Size</FieldLabel>
            <Input value={spec.loopProtectorSize} onChange={(event) => update("loopProtectorSize", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
      </FeatureCard>

      <FeatureCard title="Felt" on={spec.felt} onToggle={(v) => update("felt", v)} summary={spec.felt ? "Placement zones selected" : undefined}>
        <FieldGrid>
          <FieldCell><CompactCheck checked={spec.feltTop} onChange={(checked) => update("feltTop", checked)}>Top</CompactCheck></FieldCell>
          <FieldCell><CompactCheck checked={spec.feltBottom} onChange={(checked) => update("feltBottom", checked)}>Bottom</CompactCheck></FieldCell>
          <FieldCell><CompactCheck checked={spec.feltBody} onChange={(checked) => update("feltBody", checked)}>Body</CompactCheck></FieldCell>
          <FieldCell><CompactCheck checked={spec.feltTopSpout} onChange={(checked) => update("feltTopSpout", checked)}>Top Spout</CompactCheck></FieldCell>
          <FieldCell><CompactCheck checked={spec.feltBottomSpout} onChange={(checked) => update("feltBottomSpout", checked)}>Bottom Spout</CompactCheck></FieldCell>
        </FieldGrid>
      </FeatureCard>

      <FeatureCard title="MF Webbing" on={spec.mfWeb} onToggle={(v) => update("mfWeb", v)} summary={spec.mfWeb ? "Placement zones selected" : undefined}>
        <FieldGrid>
          <FieldCell><CompactCheck checked={spec.mfWebTop} onChange={(checked) => update("mfWebTop", checked)}>Top</CompactCheck></FieldCell>
          <FieldCell><CompactCheck checked={spec.mfWebBottom} onChange={(checked) => update("mfWebBottom", checked)}>Bottom</CompactCheck></FieldCell>
          <FieldCell><CompactCheck checked={spec.mfWebTopSpout} onChange={(checked) => update("mfWebTopSpout", checked)}>Top Spout</CompactCheck></FieldCell>
          <FieldCell><CompactCheck checked={spec.mfWebBottomSpout} onChange={(checked) => update("mfWebBottomSpout", checked)}>Bottom Spout</CompactCheck></FieldCell>
          <FieldCell><CompactCheck checked={spec.mfWebBody} onChange={(checked) => update("mfWebBody", checked)}>Body</CompactCheck></FieldCell>
          <FieldCell><CompactCheck checked={spec.mfWebBuffle} onChange={(checked) => update("mfWebBuffle", checked)}>Buffle</CompactCheck></FieldCell>
        </FieldGrid>
      </FeatureCard>
    </PanelStack>
  )
}

export function ExtraLabelBomPanel({ spec, update }: Draft) {
  return (
    <PanelStack>
      <FeatureCard
        title="Extra Label"
        on={spec.extraLabel}
        onToggle={(v) => update("extraLabel", v)}
        summary={spec.extraLabel ? `${spec.extraLabelType} · ${spec.extraLabelCount} no · ${spec.extraLabelLength}×${spec.extraLabelWidth}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Nos</FieldLabel>
            <Input value={spec.extraLabelCount} onChange={(event) => update("extraLabelCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>L</FieldLabel>
            <Input value={spec.extraLabelLength} onChange={(event) => update("extraLabelLength", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>W</FieldLabel>
            <Input value={spec.extraLabelWidth} onChange={(event) => update("extraLabelWidth", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Micron</FieldLabel>
            <Input value={spec.extraLabelMicron} onChange={(event) => update("extraLabelMicron", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <CompactCheck
              checked={Boolean(spec.extraLabelLami) && spec.extraLabelLami !== "0"}
              onChange={(checked) => update("extraLabelLami", checked ? spec.extraLabelLami && spec.extraLabelLami !== "0" ? spec.extraLabelLami : "25" : "0")}
            >
              Lam
            </CompactCheck>
          </FieldCell>
          <FieldCell>
            <FieldLabel>Type</FieldLabel>
            <FormSelect value={spec.extraLabelType} onChange={(value) => update("extraLabelType", value)} options={[...EXTRA_LABEL_TYPES]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Subtype</FieldLabel>
            <FormSelect value={spec.extraLabelSubtype} onChange={(value) => update("extraLabelSubtype", value)} options={[...PAPER_SIZES]} />
          </FieldCell>
        </FieldGrid>
        {(
          [
            ["1", "extraLabel1", "extraLabel1Length", "extraLabel1Width", "extraLabel1Micron"],
            ["2", "extraLabel2", "extraLabel2Length", "extraLabel2Width", "extraLabel2Micron"],
            ["3", "extraLabel3", "extraLabel3Length", "extraLabel3Width", "extraLabel3Micron"],
          ] as const
        ).map(([n, onKey, lKey, wKey, mKey]) => (
          <FieldGrid key={n}>
            <FieldCell>
              <CompactCheck checked={Boolean(spec[onKey])} onChange={(checked) => update(onKey, checked)}>
                Lam
              </CompactCheck>
            </FieldCell>
            <FieldCell>
              <FieldLabel>L</FieldLabel>
              <Input value={String(spec[lKey])} onChange={(event) => update(lKey, event.target.value)} className={fieldClassName} />
            </FieldCell>
            <FieldCell>
              <FieldLabel>W</FieldLabel>
              <Input value={String(spec[wKey])} onChange={(event) => update(wKey, event.target.value)} className={fieldClassName} />
            </FieldCell>
            <FieldCell>
              <FieldLabel>Micron</FieldLabel>
              <Input value={String(spec[mKey])} onChange={(event) => update(mKey, event.target.value)} className={fieldClassName} />
            </FieldCell>
          </FieldGrid>
        ))}
      </FeatureCard>

      <FeatureCard
        title="Inner Skin"
        on={spec.innerSkin}
        onToggle={(v) => update("innerSkin", v)}
        summary={spec.innerSkin ? `${spec.innerSkinGsm || spec.bodyGsm} GSM · cut ${spec.innerSkinExtraCut}` : undefined}
      >
        <GsmLamiFields
          gsm={spec.innerSkinGsm || spec.bodyGsm}
          lami={spec.innerSkinLami || "0"}
          onGsm={(value) => update("innerSkinGsm", value)}
          onLami={(value) => update("innerSkinLami", value)}
          gsmOptions={[...GSM_OPTIONS]}
          lamiOptions={[...LAMI_OPTIONS]}
        />
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Extra cut</FieldLabel>
            <Input value={spec.innerSkinExtraCut} onChange={(event) => update("innerSkinExtraCut", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
      </FeatureCard>

      <FeatureCard
        title="Inner Top"
        on={spec.innerTop}
        onToggle={(v) => update("innerTop", v)}
        summary={spec.innerTop ? `${spec.innerTopGsm} GSM · dia ${spec.innerTopDia}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>GSM</FieldLabel>
            <Input value={spec.innerTopGsm} onChange={(event) => update("innerTopGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <CompactCheck
              checked={Boolean(spec.innerTopLami) && spec.innerTopLami !== "0"}
              onChange={(checked) => update("innerTopLami", checked ? spec.innerTopLami && spec.innerTopLami !== "0" ? spec.innerTopLami : "25" : "0")}
            >
              Lam
            </CompactCheck>
          </FieldCell>
          <FieldCell>
            <FieldLabel>Dia</FieldLabel>
            <Input value={spec.innerTopDia} onChange={(event) => update("innerTopDia", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Extra</FieldLabel>
            <Input value={spec.innerTopExtra} onChange={(event) => update("innerTopExtra", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
      </FeatureCard>

      <FeatureCard
        title="Inner Bottom"
        on={spec.innerBottom}
        onToggle={(v) => update("innerBottom", v)}
        summary={spec.innerBottom ? `${spec.innerBottomGsm} GSM · dia ${spec.innerBottomDia}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>GSM</FieldLabel>
            <Input value={spec.innerBottomGsm} onChange={(event) => update("innerBottomGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <CompactCheck
              checked={Boolean(spec.innerBottomLami) && spec.innerBottomLami !== "0"}
              onChange={(checked) => update("innerBottomLami", checked ? spec.innerBottomLami && spec.innerBottomLami !== "0" ? spec.innerBottomLami : "25" : "0")}
            >
              Lam
            </CompactCheck>
          </FieldCell>
          <FieldCell>
            <FieldLabel>Dia</FieldLabel>
            <Input value={spec.innerBottomDia} onChange={(event) => update("innerBottomDia", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Extra</FieldLabel>
            <Input value={spec.innerBottomExtra} onChange={(event) => update("innerBottomExtra", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
      </FeatureCard>
    </PanelStack>
  )
}

export function InstructionBomPanel({ spec, update }: Draft) {
  return (
    <PanelStack>
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
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Buffle GSM</FieldLabel>
            <Input value={spec.buffleGsm} onChange={(event) => update("buffleGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Single Coated GSM</FieldLabel>
            <Input value={spec.buffleSingleCoatedGsm} onChange={(event) => update("buffleSingleCoatedGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Double Coated GSM</FieldLabel>
            <Input value={spec.buffleDoubleCoatedGsm} onChange={(event) => update("buffleDoubleCoatedGsm", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Buffle Cut Lenght</FieldLabel>
            <Input value={spec.buffleCutLength} onChange={(event) => update("buffleCutLength", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Buffle Type</FieldLabel>
            <FormSelect value={spec.buffleKind} onChange={(value) => update("buffleKind", value)} options={[...BUFFLE_KINDS]} />
          </FieldCell>
          <FieldCell span={2}>
            <FieldLabel>Remarks</FieldLabel>
            <Input value={spec.buffleRemarks} onChange={(event) => update("buffleRemarks", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
      </Box>
      <Box>
        <FieldLabel>Remarks</FieldLabel>
        <FieldGrid>
          <FieldCell span={2}>
            <FieldLabel>Loop Remarks</FieldLabel>
            <Input value={spec.loopRemarks} onChange={(event) => update("loopRemarks", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
      </Box>
    </PanelStack>
  )
}

export function OtherBomPanel({ spec, update }: Draft) {
  return (
    <PanelStack>
      <FieldGrid>
        <FieldCell span={2}>
          <FieldLabel>Transport</FieldLabel>
          <FormSelect value={spec.transport} onChange={(value) => update("transport", value)} options={[...TRANSPORT]} placeholder="Select transport" />
        </FieldCell>
        <FieldCell span={2}>
          <FieldLabel>Type of Supply</FieldLabel>
          <FormSelect value={spec.typeOfSupply} onChange={(value) => update("typeOfSupply", value)} options={[...SUPPLY_TYPES]} />
        </FieldCell>
        <FieldCell span={2}>
          <FieldLabel>Packing</FieldLabel>
          <FormSelect value={spec.packing} onChange={(value) => update("packing", value)} options={[...PACKING]} placeholder="Select packing" />
        </FieldCell>
        <FieldCell>
          <FieldLabel>PCS Per Pack</FieldLabel>
          <Input value={spec.packingPcs} onChange={(event) => update("packingPcs", event.target.value)} className={fieldClassName} />
        </FieldCell>
      </FieldGrid>
    </PanelStack>
  )
}

export function OtherDocBomPanel({ spec, update }: Draft) {
  return (
    <PanelStack>
      <FeatureCard
        title="Doc Pouch 1"
        on={spec.docPouch1}
        onToggle={(v) => update("docPouch1", v)}
        summary={spec.docPouch1 ? `${spec.doc1Type} · ${spec.doc1Length}×${spec.doc1Width}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Type</FieldLabel>
            <FormSelect value={spec.doc1Type} onChange={(value) => update("doc1Type", value)} options={[...DOC_TYPES]} />
          </FieldCell>
          <FieldCell span={2}>
            <FieldLabel>Opening</FieldLabel>
            <FormSelect value={spec.doc1Opening} onChange={(value) => update("doc1Opening", value)} options={[...DOC_OPENINGS]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>L</FieldLabel>
            <Input value={spec.doc1Length} onChange={(event) => update("doc1Length", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>W</FieldLabel>
            <Input value={spec.doc1Width} onChange={(event) => update("doc1Width", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Micron</FieldLabel>
            <Input value={spec.doc1Micron} onChange={(event) => update("doc1Micron", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Unit</FieldLabel>
            <FormSelect value={spec.doc1Unit} onChange={(value) => update("doc1Unit", value)} options={[...DOC_UNITS]} />
          </FieldCell>
        </FieldGrid>
      </FeatureCard>

      <FeatureCard
        title="Doc Pouch 2"
        on={spec.docPouch2}
        onToggle={(v) => update("docPouch2", v)}
        summary={spec.docPouch2 ? `${spec.doc2Type} · ${spec.doc2Length}×${spec.doc2Width}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Type</FieldLabel>
            <FormSelect value={spec.doc2Type} onChange={(value) => update("doc2Type", value)} options={[...DOC_TYPES]} />
          </FieldCell>
          <FieldCell span={2}>
            <FieldLabel>Opening</FieldLabel>
            <FormSelect value={spec.doc2Opening} onChange={(value) => update("doc2Opening", value)} options={[...DOC_OPENINGS]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>L</FieldLabel>
            <Input value={spec.doc2Length} onChange={(event) => update("doc2Length", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>W</FieldLabel>
            <Input value={spec.doc2Width} onChange={(event) => update("doc2Width", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Micron</FieldLabel>
            <Input value={spec.doc2Micron} onChange={(event) => update("doc2Micron", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Unit</FieldLabel>
            <FormSelect value={spec.doc2Unit} onChange={(value) => update("doc2Unit", value)} options={[...DOC_UNITS]} />
          </FieldCell>
        </FieldGrid>
      </FeatureCard>
    </PanelStack>
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
    <PanelStack>
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
                <td className="p-1 min-w-[240px]">
                  <ColourField
                    colour={row.color}
                    pantone={row.pantone || ""}
                    showLabel={false}
                    onColourChange={(value) => setRow(index, { color: value })}
                    onPantoneChange={(value) => setRow(index, { pantone: value })}
                  />
                </td>
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
    </PanelStack>
  )
}
