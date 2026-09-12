import { ErpExtras } from "@/components/quote/ErpExtras"
import { BomCategoryNav } from "@/components/quote/QuoteChoice"
import { fieldClassName } from "@/components/login/fieldStyles"
import {
  CheckRow,
  FieldLabel,
  FormSelect,
  GsmLamiFields,
  OptionChips,
} from "@/components/quote/FormControls"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  DOC_OPENINGS,
  DOC_TYPES,
  DOC_UNITS,
  FILLER_CORD_TYPES,
  GSM_OPTIONS,
  LAMI_OPTIONS,
  LINER_MATERIALS,
  LINER_TYPES,
  LOOP_CONSTS,
  LOOP_MATERIALS,
  PACKING,
  PRINT_TYPES,
  TIE_GSM_OPTIONS,
  TOP_SPOUT_TYPES,
  BOTTOM_SPOUT_TYPES,
  BOTTOM_TYPES,
  TOP_TYPES,
  TRANSPORT,
} from "@/lib/erpCatalog"
import { ERP_BOM_TABS } from "@/lib/erpBomTabs"
import { topTypeDefaults } from "@/lib/erpDefaults"
import { cn } from "@/lib/utils"
import type { ComplicationPicker, QuoteSpecification } from "@/types/quote"

type Props = {
  spec: QuoteSpecification
  update: <K extends keyof QuoteSpecification>(key: K, value: QuoteSpecification[K]) => void
  patch: (partial: Partial<QuoteSpecification>) => void
  picker: ComplicationPicker | null
}

function fillerType(value: string) {
  return value.toLowerCase() === "double" ? "double" : "single"
}

function fillerSelect(enabled: boolean, type: string) {
  if (!enabled) return "None"
  return type.toLowerCase() === "double" ? "Double" : "Single"
}

function Section({
  title,
  index,
  total,
  slide,
  children,
}: {
  title: string
  index: number
  total: number
  slide?: "next" | "prev"
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl bg-[var(--surface)] shadow-[var(--shadow-lg)]",
        slide === "prev" ? "qc-slide-prev" : "qc-slide-next",
      )}
    >
      <div className="flex items-end justify-between gap-4 border-b border-[var(--border)] px-6 py-5 sm:px-8" style={{ background: "var(--header-grad)" }}>
        <div>
          <div className="text-[10px] font-semibold tracking-[0.14em] text-[var(--navy-muted)] uppercase">
            Category {index} of {total}
          </div>
          <h4 className="font-heading mt-1 text-xl font-bold tracking-tight text-[var(--navy)]">{title}</h4>
        </div>
      </div>
      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-7">{children}</div>
    </section>
  )
}

export function BomErpFields({ spec, update, patch, picker }: Props) {
  const fillingSpout = spec.topType === "Top Spout"
  const conicalTop = spec.topType === "Conical Top" || spec.topType === "Conical PlateTop"
  const duffleTop =
    spec.topType === "Duffle or Skrit" ||
    spec.topType === "Top + Skrit" ||
    spec.topType === "Leno" ||
    spec.topType === "Oversize Duffle or Skrit" ||
    spec.topType === "Drawstring Skirt" ||
    spec.topType === "Jute Skirt"
  const conicalBottom = spec.bottomType === "Conical Base" || spec.bottomType === "Conical Plate Base"
  const discharge = spec.bottomType === "Bottom Spout"
  const irisTop = spec.topSpoutType.toLowerCase().includes("iris")
  const irisBottom = spec.bottomSpoutType.toLowerCase().includes("iris")

  function setFillerPosition(
    enabledKey: keyof QuoteSpecification,
    typeKey: keyof QuoteSpecification,
    value: string,
  ) {
    if (value === "None") {
      patch({ [enabledKey]: false } as Partial<QuoteSpecification>)
      return
    }
    patch({
      [enabledKey]: true,
      [typeKey]: fillerType(value),
    } as Partial<QuoteSpecification>)
  }

  const navItems = ERP_BOM_TABS.filter((tab) => tab.id !== "bottomSpout" && tab.id !== "bottomSpout2")
  const [activeId, setActiveId] = useState("loop")
  const prevIndexRef = useRef(0)

  useEffect(() => {
    if (activeId === "bottomSpout" || activeId === "bottomSpout2") setActiveId("bottom")
  }, [activeId])

  const activeIndex = Math.max(0, navItems.findIndex((item) => item.id === activeId))
  const slide: "next" | "prev" = activeIndex >= prevIndexRef.current ? "next" : "prev"
  prevIndexRef.current = activeIndex
  const active = navItems[activeIndex] ?? navItems[0]

  function renderPanel(id: string) {
    switch (id) {
      case "loop":
        return (
          <>
            <LoopPanel spec={spec} update={update} picker={picker} />
            <ErpExtras specification={spec} update={update} tab="loop" />
          </>
        )
      case "top":
        return (
          <>
            <TopPanel
              spec={spec}
              update={update}
              patch={patch}
              duffleTop={duffleTop}
              conicalTop={conicalTop}
              fillingSpout={fillingSpout}
              irisTop={irisTop}
            />
            <ErpExtras specification={spec} update={update} tab="top" />
          </>
        )
      case "bottom":
        return (
          <>
            <BottomPanel spec={spec} update={update} conicalBottom={conicalBottom} />
            {discharge ? (
              <>
                <BottomSpoutPanel spec={spec} update={update} irisBottom={irisBottom} />
                <ErpExtras specification={spec} update={update} tab="bottomSpout2" />
              </>
            ) : null}
            <ErpExtras specification={spec} update={update} tab="bottom" />
          </>
        )
      case "liner":
        return (
          <>
            <LinerPanel spec={spec} update={update} />
            <ErpExtras specification={spec} update={update} tab="liner" />
          </>
        )
      case "rate":
        return (
          <>
            <RatePanel spec={spec} update={update} />
            <ErpExtras specification={spec} update={update} tab="rate" />
          </>
        )
      case "flap":
        return <ErpExtras specification={spec} update={update} tab="flap" />
      case "rope":
        return <ErpExtras specification={spec} update={update} tab="rope" />
      case "doc":
        return (
          <>
            <DocFillerPanel spec={spec} update={update} setFillerPosition={setFillerPosition} />
            <ErpExtras specification={spec} update={update} tab="doc" />
          </>
        )
      case "extraLabel":
        return <ErpExtras specification={spec} update={update} tab="extraLabel" />
      case "buffle":
        return <InstructionPanel spec={spec} update={update} />
      case "other":
        return (
          <>
            <div>
              <FieldLabel optional>Transport</FieldLabel>
              <FormSelect
                value={spec.transport}
                onChange={(value) => update("transport", value)}
                options={[...TRANSPORT]}
                placeholder="Select transport"
              />
            </div>
            <ErpExtras specification={spec} update={update} tab="other" />
          </>
        )
      case "otherDoc":
        return <ErpExtras specification={spec} update={update} tab="otherDoc" />
      case "otherBom":
        return <ErpExtras specification={spec} update={update} tab="otherBom" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
      <BomCategoryNav items={[...navItems]} activeId={active?.id ?? "loop"} onChange={setActiveId} />
      <div className="min-w-0 flex-1">
        {active ? (
          <Section key={active.id} title={active.label} index={activeIndex + 1} total={navItems.length} slide={slide}>
            {renderPanel(active.id)}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() => setActiveId(navItems[activeIndex - 1].id)}
                className="font-heading rounded-2xl px-3 py-2 text-sm font-semibold text-[var(--navy)] transition-colors hover:bg-[var(--navy-bg)] disabled:pointer-events-none disabled:opacity-30"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={activeIndex >= navItems.length - 1}
                onClick={() => setActiveId(navItems[activeIndex + 1].id)}
                className="font-heading rounded-2xl bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-navy)] transition-transform hover:-translate-y-px disabled:pointer-events-none disabled:opacity-30"
              >
                Next category
              </button>
            </div>
          </Section>
        ) : null}
      </div>
    </div>
  )
}

function LoopPanel({
  spec,
  update,
  picker,
}: {
  spec: QuoteSpecification
  update: Props["update"]
  picker: ComplicationPicker | null
}) {
  return (
    <>
      <div>
        <FieldLabel>Lifting loops</FieldLabel>
        <OptionChips
          value={spec.loopEnabled ? "Loops" : "No loops"}
          onChange={(value) => update("loopEnabled", value === "Loops")}
          options={["Loops", "No loops"]}
        />
      </div>
      {spec.loopEnabled ? (
        <>
          <div>
            <FieldLabel>Loop construction</FieldLabel>
            <FormSelect
              value={spec.loopConstruction}
              onChange={(value) => update("loopConstruction", value)}
              options={[...LOOP_CONSTS]}
            />
          </div>
          {picker?.needsPicker ? (
            <div>
              <FieldLabel>Book4 conversion type</FieldLabel>
              <p className="mb-2 text-xs text-[var(--text-muted)]">
                Book4 has several conversion rows for {picker.lookupDesign} / {picker.lookupLoops}.
                Choose the exact sheet label. Leave blank for manual pricing.
                {picker.usesCircularXCornerPlus75
                  ? " U-Panel with cross-corner loops uses the Circular X-Corner rate plus $75/t."
                  : ""}
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
          <div>
            <FieldLabel>Loop material</FieldLabel>
            <FormSelect value={spec.loopType} onChange={(value) => update("loopType", value)} options={[...LOOP_MATERIALS]} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className="mb-1 text-[10px] text-[var(--text-muted)]">Loop GSM</div>
              <Input value={spec.loopGsm} onChange={(event) => update("loopGsm", event.target.value)} className={fieldClassName} />
            </div>
            <div>
              <div className="mb-1 text-[10px] text-[var(--text-muted)]">Length cm</div>
              <Input value={spec.loopLength} onChange={(event) => update("loopLength", event.target.value)} className={fieldClassName} />
            </div>
            <div>
              <div className="mb-1 text-[10px] text-[var(--text-muted)]">Width cm</div>
              <Input value={spec.loopWidth} onChange={(event) => update("loopWidth", event.target.value)} className={fieldClassName} />
            </div>
            <div>
              <div className="mb-1 text-[10px] text-[var(--text-muted)]">Count</div>
              <Input value={spec.loopCount} onChange={(event) => update("loopCount", event.target.value)} className={fieldClassName} />
            </div>
          </div>
          {spec.constructionType !== "Circular" ? (
            <CheckRow checked={spec.loopTillBottom} onChange={(checked) => update("loopTillBottom", checked)}>
              Loops to the bottom of the bag
            </CheckRow>
          ) : null}
          <CheckRow checked={spec.dropLoop} onChange={(checked) => update("dropLoop", checked)}>
            Drop loop
          </CheckRow>
          {spec.dropLoop ? (
            <div>
              <FieldLabel>Drop loop length (cm)</FieldLabel>
              <Input
                value={spec.dropLoopLength}
                onChange={(event) => update("dropLoopLength", event.target.value)}
                className={fieldClassName}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </>
  )
}

function TopPanel({
  spec,
  update,
  patch,
  duffleTop,
  conicalTop,
  fillingSpout,
  irisTop,
}: {
  spec: QuoteSpecification
  update: Props["update"]
  patch: Props["patch"]
  duffleTop: boolean
  conicalTop: boolean
  fillingSpout: boolean
  irisTop: boolean
}) {
  return (
    <>
      <div>
        <FieldLabel>Top</FieldLabel>
        <FormSelect
          value={spec.topType}
          onChange={(value) => patch(topTypeDefaults(value, spec))}
          options={[...TOP_TYPES]}
        />
      </div>
      <CheckRow checked={spec.doubleFoldTop} onChange={(checked) => update("doubleFoldTop", checked)}>
        Double-fold top
      </CheckRow>
      {duffleTop ? (
        <div>
          <FieldLabel>Duffle / skirt height (cm)</FieldLabel>
          <Input value={spec.duffleHeight} onChange={(event) => update("duffleHeight", event.target.value)} className={fieldClassName} />
        </div>
      ) : null}
      {conicalTop ? (
        <div>
          <FieldLabel>Conical top height (cm)</FieldLabel>
          <Input value={spec.conicalTop} onChange={(event) => update("conicalTop", event.target.value)} className={fieldClassName} />
        </div>
      ) : null}
      {fillingSpout || conicalTop ? (
        <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
          <FieldLabel>Filling spout</FieldLabel>
          <FormSelect
            value={spec.topSpoutType}
            onChange={(value) => update("topSpoutType", value)}
            options={[...TOP_SPOUT_TYPES]}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Input
              value={spec.topSpoutDia}
              onChange={(event) => update("topSpoutDia", event.target.value)}
              placeholder="Diameter cm"
              className={fieldClassName}
            />
            <Input
              value={spec.topSpoutHeight}
              onChange={(event) => update("topSpoutHeight", event.target.value)}
              placeholder="Height cm"
              className={fieldClassName}
            />
            <Input
              value={spec.topSpoutCount}
              onChange={(event) => update("topSpoutCount", event.target.value)}
              placeholder="Count"
              className={fieldClassName}
            />
          </div>
          {!spec.sameFabricForPanels ? (
            <GsmLamiFields
              gsm={spec.topSpoutGsm || spec.bodyGsm}
              lami={spec.topSpoutLami || spec.bodyLami}
              onGsm={(value) => update("topSpoutGsm", value)}
              onLami={(value) => update("topSpoutLami", value)}
              gsmOptions={[...GSM_OPTIONS]}
              lamiOptions={[...LAMI_OPTIONS]}
            />
          ) : null}
          <CheckRow checked={spec.topSpoutEdgeHemming} onChange={(checked) => update("topSpoutEdgeHemming", checked)}>
            Edge hemming
          </CheckRow>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className="mb-1 text-[10px] text-[var(--text-muted)]">Tie GSM</div>
              <FormSelect
                value={spec.topSpoutTieGsm || "0"}
                onChange={(value) => update("topSpoutTieGsm", value)}
                options={[...TIE_GSM_OPTIONS]}
              />
            </div>
            <div>
              <div className="mb-1 text-[10px] text-[var(--text-muted)]">Tie size</div>
              <Input value={spec.topSpoutTieSize} onChange={(event) => update("topSpoutTieSize", event.target.value)} className={fieldClassName} />
            </div>
            <div>
              <div className="mb-1 text-[10px] text-[var(--text-muted)]">Tie count</div>
              <Input value={spec.topSpoutTieCount} onChange={(event) => update("topSpoutTieCount", event.target.value)} className={fieldClassName} />
            </div>
            <div>
              <div className="mb-1 text-[10px] text-[var(--text-muted)]">Tie remarks</div>
              <Input
                value={spec.topSpoutTieRemarks}
                onChange={(event) => update("topSpoutTieRemarks", event.target.value)}
                className={fieldClassName}
              />
            </div>
          </div>
          {irisTop ? (
            <div>
              <FieldLabel optional>Iris tie count</FieldLabel>
              <Input value={spec.topIrisTieCount} onChange={(event) => update("topIrisTieCount", event.target.value)} className={fieldClassName} />
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

function BottomPanel({
  spec,
  update,
  conicalBottom,
}: {
  spec: QuoteSpecification
  update: Props["update"]
  conicalBottom: boolean
}) {
  return (
    <>
      <div>
        <FieldLabel>Bottom</FieldLabel>
        <FormSelect
          value={spec.bottomType}
          onChange={(value) => update("bottomType", value)}
          options={[...BOTTOM_TYPES]}
        />
      </div>
      <CheckRow checked={spec.doubleFoldBottom} onChange={(checked) => update("doubleFoldBottom", checked)}>
        Double-fold bottom
      </CheckRow>
      {conicalBottom ? (
        <div>
          <FieldLabel>Conical base height (cm)</FieldLabel>
          <Input
            value={spec.bottomConicalHeight}
            onChange={(event) => update("bottomConicalHeight", event.target.value)}
            className={fieldClassName}
          />
        </div>
      ) : null}
    </>
  )
}

function BottomSpoutPanel({
  spec,
  update,
  irisBottom,
}: {
  spec: QuoteSpecification
  update: Props["update"]
  irisBottom: boolean
}) {
  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
      <FieldLabel>Bottom Spout</FieldLabel>
      <FormSelect
        value={spec.bottomSpoutType}
        onChange={(value) => update("bottomSpoutType", value)}
        options={[...BOTTOM_SPOUT_TYPES]}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Input
          value={spec.bottomSpoutDia}
          onChange={(event) => update("bottomSpoutDia", event.target.value)}
          placeholder="Diameter cm"
          className={fieldClassName}
        />
        <Input
          value={spec.bottomSpoutHeight}
          onChange={(event) => update("bottomSpoutHeight", event.target.value)}
          placeholder="Height cm"
          className={fieldClassName}
        />
        <Input
          value={spec.bottomSpoutCount}
          onChange={(event) => update("bottomSpoutCount", event.target.value)}
          placeholder="Count"
          className={fieldClassName}
        />
      </div>
      {!spec.sameFabricForPanels ? (
        <GsmLamiFields
          gsm={spec.bottomSpoutGsm || spec.bodyGsm}
          lami={spec.bottomSpoutLami || spec.bodyLami}
          onGsm={(value) => update("bottomSpoutGsm", value)}
          onLami={(value) => update("bottomSpoutLami", value)}
          gsmOptions={[...GSM_OPTIONS]}
          lamiOptions={[...LAMI_OPTIONS]}
        />
      ) : null}
      <CheckRow checked={spec.bottomSpoutEdgeHemming} onChange={(checked) => update("bottomSpoutEdgeHemming", checked)}>
        Edge hemming
      </CheckRow>
      {irisBottom ? (
        <div>
          <FieldLabel optional>Iris tie count</FieldLabel>
          <Input
            value={spec.bottomIrisTieCount}
            onChange={(event) => update("bottomIrisTieCount", event.target.value)}
            className={fieldClassName}
          />
        </div>
      ) : null}
    </div>
  )
}

function LinerPanel({ spec, update }: { spec: QuoteSpecification; update: Props["update"] }) {
  return (
    <>
      <CheckRow checked={spec.linerEnabled} onChange={(checked) => update("linerEnabled", checked)}>
        Liner
      </CheckRow>
      {spec.linerEnabled ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Type</FieldLabel>
            <FormSelect
              value={spec.linerMaterial}
              onChange={(value) => update("linerMaterial", value)}
              options={[...LINER_MATERIALS.filter((item) => item !== "None")]}
            />
          </div>
          <div>
            <FieldLabel>Liner sewn to Edge</FieldLabel>
            <FormSelect
              value={spec.linerType}
              onChange={(value) => update("linerType", value)}
              options={[...LINER_TYPES.filter((item) => item !== "None")]}
            />
          </div>
          <div>
            <FieldLabel>Micron</FieldLabel>
            <Input value={spec.linerMicron} onChange={(event) => update("linerMicron", event.target.value)} className={fieldClassName} />
          </div>
        </div>
      ) : null}
      <CheckRow checked={spec.label} onChange={(checked) => update("label", checked)}>
        Label
      </CheckRow>
      {spec.label ? (
        <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <FieldLabel>Nos</FieldLabel>
              <Input value={spec.labelCount} onChange={(event) => update("labelCount", event.target.value)} className={fieldClassName} />
            </div>
            <div>
              <FieldLabel>L</FieldLabel>
              <Input value={spec.labelLength} onChange={(event) => update("labelLength", event.target.value)} className={fieldClassName} />
            </div>
            <div>
              <FieldLabel>W</FieldLabel>
              <Input value={spec.labelWidth} onChange={(event) => update("labelWidth", event.target.value)} className={fieldClassName} />
            </div>
            <div>
              <FieldLabel>Micron</FieldLabel>
              <Input value={spec.labelMicron} onChange={(event) => update("labelMicron", event.target.value)} className={fieldClassName} />
            </div>
          </div>
          <CheckRow checked={spec.labelTyvac} onChange={(checked) => update("labelTyvac", checked)}>
            Tyvac
          </CheckRow>
        </div>
      ) : null}
      <CheckRow checked={spec.bLock} onChange={(checked) => update("bLock", checked)}>
        B-Lock
      </CheckRow>
      {spec.bLock ? (
        <div>
          <FieldLabel>Nos</FieldLabel>
          <Input value={spec.bLockCount} onChange={(event) => update("bLockCount", event.target.value)} className={fieldClassName} />
        </div>
      ) : null}
    </>
  )
}

function RatePanel({ spec, update }: { spec: QuoteSpecification; update: Props["update"] }) {
  return (
    <>
      <div>
        <FieldLabel optional>Printing</FieldLabel>
        <FormSelect value={spec.printing} onChange={(value) => update("printing", value)} options={[...PRINT_TYPES]} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Quantity (bags)</FieldLabel>
          <Input
            type="number"
            min={1}
            value={spec.quantity}
            onChange={(event) => update("quantity", event.target.value)}
            className={fieldClassName}
          />
        </div>
        <div>
          <FieldLabel>Delivery location</FieldLabel>
          <Input
            value={spec.deliveryLocation}
            onChange={(event) => update("deliveryLocation", event.target.value)}
            className={fieldClassName}
          />
        </div>
        <div>
          <FieldLabel optional>Party name</FieldLabel>
          <Input value={spec.partyName} onChange={(event) => update("partyName", event.target.value)} className={fieldClassName} />
        </div>
        <div>
          <FieldLabel optional>Packing</FieldLabel>
          <FormSelect
            value={spec.packing}
            onChange={(value) => update("packing", value)}
            options={[...PACKING]}
            placeholder="Select packing"
          />
        </div>
      </div>
    </>
  )
}

function DocFillerPanel({
  spec,
  update,
  setFillerPosition,
}: {
  spec: QuoteSpecification
  update: Props["update"]
  setFillerPosition: (enabledKey: keyof QuoteSpecification, typeKey: keyof QuoteSpecification, value: string) => void
}) {
  return (
    <>
      <CheckRow checked={spec.docPouch} onChange={(checked) => update("docPouch", checked)}>
        Doc Pouch
      </CheckRow>
      {spec.docPouch ? (
        <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Pouch type</FieldLabel>
              <FormSelect value={spec.docType} onChange={(value) => update("docType", value)} options={[...DOC_TYPES]} />
            </div>
            <div>
              <FieldLabel>Opening</FieldLabel>
              <FormSelect value={spec.docOpening} onChange={(value) => update("docOpening", value)} options={[...DOC_OPENINGS]} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Input value={spec.docLength} onChange={(event) => update("docLength", event.target.value)} placeholder="Length" className={fieldClassName} />
            <Input value={spec.docWidth} onChange={(event) => update("docWidth", event.target.value)} placeholder="Width" className={fieldClassName} />
            <Input value={spec.docMicron} onChange={(event) => update("docMicron", event.target.value)} placeholder="Micron" className={fieldClassName} />
            <Input value={spec.docCount} onChange={(event) => update("docCount", event.target.value)} placeholder="Count" className={fieldClassName} />
          </div>
          <FormSelect value={spec.docUnit} onChange={(value) => update("docUnit", value)} options={[...DOC_UNITS]} />
        </div>
      ) : null}
      <CheckRow checked={spec.fillerCord} onChange={(checked) => update("fillerCord", checked)}>
        Filler Cord
      </CheckRow>
      {spec.fillerCord ? (
        <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
          <div>
            <FieldLabel>Filler cord GPM</FieldLabel>
            <Input value={spec.fillerCordGpm} onChange={(event) => update("fillerCordGpm", event.target.value)} className={fieldClassName} />
          </div>
          {(
            [
              ["Top", "fillerCordTop", "fillerCordTopType"],
              ["Bottom", "fillerCordBottom", "fillerCordBottomType"],
              ["Body", "fillerCordBody", "fillerCordBodyType"],
              ["Top spout", "fillerCordTopSpout", "fillerCordTopSpoutType"],
              ["Bottom spout", "fillerCordBottomSpout", "fillerCordBottomSpoutType"],
              ["Baffle", "fillerCordBuffle", "fillerCordBuffleType"],
            ] as const
          ).map(([label, enabledKey, typeKey]) => (
            <div key={enabledKey}>
              <FieldLabel>{label}</FieldLabel>
              <FormSelect
                value={fillerSelect(Boolean(spec[enabledKey]), String(spec[typeKey]))}
                onChange={(value) => setFillerPosition(enabledKey, typeKey, value)}
                options={[...FILLER_CORD_TYPES]}
              />
            </div>
          ))}
        </div>
      ) : null}
    </>
  )
}

function InstructionPanel({ spec, update }: { spec: QuoteSpecification; update: Props["update"] }) {
  return (
    <>
      <div>
        <FieldLabel>Instruction</FieldLabel>
        <Textarea
          value={spec.notes}
          onChange={(event) => update("notes", event.target.value)}
          rows={5}
          className="min-h-[120px] resize-none rounded-md border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
        />
      </div>
      <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
        <FieldLabel>Buffle</FieldLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <FieldLabel>Buffle GSM</FieldLabel>
            <Input value={spec.buffleGsm} onChange={(event) => update("buffleGsm", event.target.value)} className={fieldClassName} />
          </div>
          <div>
            <FieldLabel>Single Coated GSM</FieldLabel>
            <Input
              value={spec.buffleSingleCoatedGsm}
              onChange={(event) => update("buffleSingleCoatedGsm", event.target.value)}
              className={fieldClassName}
            />
          </div>
          <div>
            <FieldLabel>Double Coated GSM</FieldLabel>
            <Input
              value={spec.buffleDoubleCoatedGsm}
              onChange={(event) => update("buffleDoubleCoatedGsm", event.target.value)}
              className={fieldClassName}
            />
          </div>
        </div>
      </div>
      <div>
        <FieldLabel optional>Loop Remarks</FieldLabel>
        <Input value={spec.loopRemarks} onChange={(event) => update("loopRemarks", event.target.value)} className={fieldClassName} />
      </div>
    </>
  )
}
