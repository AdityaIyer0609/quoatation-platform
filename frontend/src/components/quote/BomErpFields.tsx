import { ErpExtras } from "@/components/quote/ErpExtras"
import {
  DocBomPanel,
  ExtraLabelBomPanel,
  FlapBomPanel,
  InstructionBomPanel,
  LoopBomPanel,
  OtherBomGridPanel,
  OtherBomPanel,
  OtherDocBomPanel,
  RateBomPanel,
  RopeBomPanel,
} from "@/components/quote/erpBomMore"
import { BomCategoryNav } from "@/components/quote/QuoteChoice"
import { fieldClassName } from "@/components/login/fieldStyles"
import {
  CheckRow,
  FieldLabel,
  FormSelect,
  GsmLamiFields,
} from "@/components/quote/FormControls"
import { Input } from "@/components/ui/input"
import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  COLOURS,
  GSM_OPTIONS,
  LAMI_OPTIONS,
  LINER_MATERIALS,
  LINER_SUBTYPES,
  LINER_AT_POINTS,
  LINER_TYPES,
  TIE_GSM_OPTIONS,
  TOP_SPOUT_TYPES,
  BOTTOM_SPOUT_TYPES,
  BOTTOM_TYPES,
  TOP_TYPES,
  ROPE_TYPES,
  ROPE_SIZES,
  ROPE_SIZE_10_25,
} from "@/lib/erpCatalog"
import { ERP_BOM_TABS } from "@/lib/erpBomTabs"
import { bottomPunchRemarks, bottomTypeDefaults, topTypeDefaults } from "@/lib/erpDefaults"
import { cn } from "@/lib/utils"
import type { ComplicationPicker, QuoteSpecification } from "@/types/quote"

type Props = {
  spec: QuoteSpecification
  update: <K extends keyof QuoteSpecification>(key: K, value: QuoteSpecification[K]) => void
  patch: (partial: Partial<QuoteSpecification>) => void
  picker: ComplicationPicker | null
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
        return <LoopBomPanel spec={spec} update={update} patch={patch} picker={picker} />
      case "top":
        return <TopPanel spec={spec} update={update} patch={patch} />
      case "bottom":
        return <BottomPanel spec={spec} update={update} patch={patch} />
      case "liner":
        return <LinerPanel spec={spec} update={update} patch={patch} />
      case "rate":
        return <RateBomPanel spec={spec} update={update} patch={patch} />
      case "flap":
        return <FlapBomPanel spec={spec} update={update} patch={patch} />
      case "rope":
        return <RopeBomPanel spec={spec} update={update} patch={patch} />
      case "doc":
        return <DocBomPanel spec={spec} update={update} patch={patch} />
      case "extraLabel":
        return <ExtraLabelBomPanel spec={spec} update={update} patch={patch} />
      case "buffle":
        return <InstructionBomPanel spec={spec} update={update} patch={patch} />
      case "other":
        return <OtherBomPanel spec={spec} update={update} patch={patch} />
      case "otherDoc":
        return <OtherDocBomPanel spec={spec} update={update} patch={patch} />
      case "otherBom":
        return <OtherBomGridPanel spec={spec} update={update} patch={patch} />
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

function TopPanel({
  spec,
  update,
  patch,
}: {
  spec: QuoteSpecification
  update: Props["update"]
  patch: Props["patch"]
}) {
  const topType = spec.topType
  const showSpout = topType === "Top Spout" || topType === "Conical PlateTop" || topType === "Conical Top"
  const showDuffle =
    topType === "Duffle or Skrit" ||
    topType === "Top + Skrit" ||
    topType === "Leno" ||
    topType === "Oversize Duffle or Skrit" ||
    topType === "Drawstring Skirt" ||
    topType === "Jute Skirt"
  const showGroup6 = topType !== "Open"
  const showSpoutRope = topType === "Top Spout"
  const showConicalHeight = topType === "Conical PlateTop" || topType === "Conical Top"
  const irisTop = spec.topSpoutType.toLowerCase().includes("iris")

  return (
    <>
      <CheckRow checked={spec.topEnabled} onChange={(checked) => update("topEnabled", checked)}>
        Top
      </CheckRow>
      {spec.topEnabled ? (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-[2] basis-[220px]">
              <FieldLabel>Top Type</FieldLabel>
              <FormSelect
                value={spec.topType}
                onChange={(value) => patch(topTypeDefaults(value, spec))}
                options={[...TOP_TYPES]}
              />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>Top GSM</FieldLabel>
              <FormSelect value={spec.topGsm || "0"} onChange={(value) => update("topGsm", value)} options={[...GSM_OPTIONS]} />
            </div>
            <label className="mb-1 flex h-12 shrink-0 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(spec.topLami) && spec.topLami !== "0"}
                onChange={(event) => update("topLami", event.target.checked ? (spec.topLami && spec.topLami !== "0" ? spec.topLami : "25") : "0")}
                className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
              />
              Lam
            </label>
            <div className="w-[72px] shrink-0">
              <FieldLabel>No</FieldLabel>
              <Input value={spec.topCount} onChange={(event) => update("topCount", event.target.value)} className={fieldClassName} />
            </div>
            <div className="min-w-[160px] flex-1 basis-[160px]">
              <FieldLabel>Color</FieldLabel>
              <FormSelect value={spec.topColour || "Milky White"} onChange={(value) => update("topColour", value)} options={[...COLOURS]} />
            </div>
            {showConicalHeight ? (
              <div className="w-[88px] shrink-0">
                <FieldLabel>Conical Top</FieldLabel>
                <Input value={spec.conicalTop} onChange={(event) => update("conicalTop", event.target.value)} className={fieldClassName} />
              </div>
            ) : null}
          </div>

          {showSpout ? (
            <div className="space-y-3 rounded-2xl border border-[var(--border)] p-4">
              <FieldLabel>Spout</FieldLabel>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={spec.topSpoutConical}
                  onChange={(event) => update("topSpoutConical", event.target.checked)}
                  className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
                />
                Conical
              </label>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-[2] basis-[220px]">
                  <FieldLabel>Spout Type</FieldLabel>
                  <FormSelect value={spec.topSpoutType || "None"} onChange={(value) => update("topSpoutType", value)} options={[...TOP_SPOUT_TYPES]} />
                </div>
                <div className="w-[88px] shrink-0">
                  <FieldLabel>GSM</FieldLabel>
                  <FormSelect value={spec.topSpoutGsm || "0"} onChange={(value) => update("topSpoutGsm", value)} options={[...GSM_OPTIONS]} />
                </div>
                <label className="mb-1 flex h-12 shrink-0 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(spec.topSpoutLami) && spec.topSpoutLami !== "0"}
                    onChange={(event) =>
                      update("topSpoutLami", event.target.checked ? (spec.topSpoutLami && spec.topSpoutLami !== "0" ? spec.topSpoutLami : "25") : "0")
                    }
                    className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
                  />
                  Lam
                </label>
                <div className="w-[72px] shrink-0">
                  <FieldLabel>Dia</FieldLabel>
                  <Input value={spec.topSpoutDia} onChange={(event) => update("topSpoutDia", event.target.value)} className={fieldClassName} />
                </div>
                <div className="w-[72px] shrink-0">
                  <FieldLabel>Height</FieldLabel>
                  <Input value={spec.topSpoutHeight} onChange={(event) => update("topSpoutHeight", event.target.value)} className={fieldClassName} />
                </div>
                <div className="w-[72px] shrink-0">
                  <FieldLabel>No</FieldLabel>
                  <Input value={spec.topSpoutCount} onChange={(event) => update("topSpoutCount", event.target.value)} className={fieldClassName} />
                </div>
              </div>
            </div>
          ) : null}

          {showDuffle ? (
            <div>
              <FieldLabel>Duffle / skirt height</FieldLabel>
              <Input value={spec.duffleHeight} onChange={(event) => update("duffleHeight", event.target.value)} className={fieldClassName} />
            </div>
          ) : null}

          {showGroup6 ? (
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
              <label className="mb-1 flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-sm">
                <input
                  type="checkbox"
                  checked={spec.topVelcro}
                  onChange={(event) => update("topVelcro", event.target.checked)}
                  className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
                />
                Velcro
              </label>
              {spec.topVelcro ? (
                <div className="w-[72px] shrink-0">
                  <FormSelect value={spec.topVelcroSize || "0"} onChange={(value) => update("topVelcroSize", value)} options={["0", "1", "2", "4", "6"]} />
                </div>
              ) : null}
              <label className="mb-1 flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-sm">
                <input
                  type="checkbox"
                  checked={spec.hoseSlider}
                  onChange={(event) => update("hoseSlider", event.target.checked)}
                  className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
                />
                Hose Slider
              </label>
              {spec.hoseSlider ? (
                <div className="w-[72px] shrink-0">
                  <Input value={spec.hoseSliderCount} onChange={(event) => update("hoseSliderCount", event.target.value)} className={fieldClassName} />
                </div>
              ) : null}
              <label className="mb-1 flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-sm">
                <input
                  type="checkbox"
                  checked={spec.cableTie}
                  onChange={(event) => update("cableTie", event.target.checked)}
                  className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
                />
                Cable Tie
              </label>
              {spec.cableTie ? (
                <div className="w-[72px] shrink-0">
                  <Input value={spec.cableTieCount} onChange={(event) => update("cableTieCount", event.target.value)} className={fieldClassName} />
                </div>
              ) : null}
              <div className="min-w-[160px] flex-1 basis-[160px]">
                <FieldLabel>Color</FieldLabel>
                <FormSelect value={spec.topSpoutColor || "Milky White"} onChange={(value) => update("topSpoutColor", value)} options={[...COLOURS]} />
              </div>
              <div className="min-w-[180px] flex-[2] basis-[180px]">
                <FieldLabel>Top Remarks</FieldLabel>
                <Input value={spec.topRemarks} onChange={(event) => update("topRemarks", event.target.value)} className={fieldClassName} />
              </div>
            </div>
          ) : null}

          <CheckRow checked={spec.doubleFoldTop} onChange={(checked) => update("doubleFoldTop", checked)}>
            Double Fold
          </CheckRow>

          {showSpoutRope ? (
            <CheckRow checked={spec.topSpoutRope} onChange={(checked) => update("topSpoutRope", checked)}>
              TopSpout Rope
            </CheckRow>
          ) : null}

          <CheckRow checked={spec.topSpoutTie} onChange={(checked) => update("topSpoutTie", checked)}>
            TopSpout Tie
          </CheckRow>
          {spec.topSpoutTie ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <FieldLabel>Grm</FieldLabel>
                <FormSelect value={spec.topSpoutTieGsm || "0"} onChange={(value) => update("topSpoutTieGsm", value)} options={[...TIE_GSM_OPTIONS]} />
              </div>
              <div>
                <FieldLabel>Size</FieldLabel>
                <Input value={spec.topSpoutTieSize} onChange={(event) => update("topSpoutTieSize", event.target.value)} className={fieldClassName} />
              </div>
              <div>
                <FieldLabel>No (Tie)</FieldLabel>
                <Input value={spec.topSpoutTieCount} onChange={(event) => update("topSpoutTieCount", event.target.value)} className={fieldClassName} />
              </div>
              <div>
                <FieldLabel>Remarks</FieldLabel>
                <Input value={spec.topSpoutTieRemarks} onChange={(event) => update("topSpoutTieRemarks", event.target.value)} className={fieldClassName} />
              </div>
            </div>
          ) : null}

          <CheckRow checked={spec.topBand} onChange={(checked) => update("topBand", checked)}>
            Top Band
          </CheckRow>
          {spec.topBand ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>GPM</FieldLabel>
                <Input value={spec.topBandGsm} onChange={(event) => update("topBandGsm", event.target.value)} className={fieldClassName} />
              </div>
              <div>
                <FieldLabel>Size</FieldLabel>
                <Input value={spec.topBandSize} onChange={(event) => update("topBandSize", event.target.value)} className={fieldClassName} />
              </div>
            </div>
          ) : null}

          {irisTop ? (
            <div>
              <FieldLabel optional>Iris tie count</FieldLabel>
              <Input value={spec.topIrisTieCount} onChange={(event) => update("topIrisTieCount", event.target.value)} className={fieldClassName} />
            </div>
          ) : null}
        </>
      ) : null}
    </>
  )
}

function BottomPanel({
  spec,
  update,
  patch,
}: {
  spec: QuoteSpecification
  update: Props["update"]
  patch: Props["patch"]
}) {
  const conicalBottom = spec.bottomType === "Conical Base" || spec.bottomType === "Conical Plate Base"
  const discharge = spec.bottomType === "Bottom Spout"
  const showSkirt = spec.bottomType === "Bottom + Skirt"
  const irisBottom = spec.bottomSpoutType.toLowerCase().includes("iris")

  function patchSubtype(partial: Partial<QuoteSpecification>) {
    const nextType = partial.bottomType ?? spec.bottomType
    const nextSub = partial.bottomSpoutType ?? spec.bottomSpoutType
    const nextDia = partial.bottomSpoutDia ?? spec.bottomSpoutDia
    const punch = bottomPunchRemarks(nextType, nextSub, nextDia)
    patch(punch ? { ...partial, bottomRemarks: punch } : partial)
  }

  return (
    <>
      <CheckRow checked={spec.bottomEnabled} onChange={(checked) => update("bottomEnabled", checked)}>
        Bottom
      </CheckRow>
      {spec.bottomEnabled ? (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-[2] basis-[220px]">
              <FieldLabel>Type</FieldLabel>
              <FormSelect
                value={spec.bottomType}
                onChange={(value) => patch(bottomTypeDefaults(value, spec))}
                options={[...BOTTOM_TYPES]}
              />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>GSM</FieldLabel>
              <FormSelect
                value={spec.bottomGsm || spec.bodyGsm || "0"}
                onChange={(value) => update("bottomGsm", value)}
                options={[...GSM_OPTIONS]}
              />
            </div>
            <label className="mb-1 flex h-12 shrink-0 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(spec.bottomLami) && spec.bottomLami !== "0"}
                onChange={(event) =>
                  update("bottomLami", event.target.checked ? (spec.bottomLami && spec.bottomLami !== "0" ? spec.bottomLami : "25") : "0")
                }
                className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
              />
              Lam
            </label>
            <div className="w-[72px] shrink-0">
              <FieldLabel>No</FieldLabel>
              <Input value={spec.bottomCount} onChange={(event) => update("bottomCount", event.target.value)} className={fieldClassName} />
            </div>
            <div className="min-w-[160px] flex-1 basis-[160px]">
              <FieldLabel>Color</FieldLabel>
              <FormSelect value={spec.bottomColour || "Milky White"} onChange={(value) => update("bottomColour", value)} options={[...COLOURS]} />
            </div>
            <div className="min-w-[180px] flex-[2] basis-[180px]">
              <FieldLabel>Remarks</FieldLabel>
              <Input value={spec.bottomRemarks} onChange={(event) => update("bottomRemarks", event.target.value)} className={fieldClassName} />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-[var(--border)] p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-[2] basis-[220px]">
                <FieldLabel>Sub type</FieldLabel>
                <FormSelect
                  value={spec.bottomSpoutType || "None"}
                  onChange={(value) => patchSubtype({ bottomSpoutType: value })}
                  options={[...BOTTOM_SPOUT_TYPES]}
                />
              </div>
              <div className="w-[88px] shrink-0">
                <FieldLabel>GSM</FieldLabel>
                <FormSelect
                  value={spec.bottomSpoutGsm || "0"}
                  onChange={(value) => update("bottomSpoutGsm", value)}
                  options={[...GSM_OPTIONS]}
                />
              </div>
              <label className="mb-1 flex h-12 shrink-0 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(spec.bottomSpoutLami) && spec.bottomSpoutLami !== "0"}
                  onChange={(event) =>
                    update(
                      "bottomSpoutLami",
                      event.target.checked ? (spec.bottomSpoutLami && spec.bottomSpoutLami !== "0" ? spec.bottomSpoutLami : "25") : "0",
                    )
                  }
                  className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
                />
                Lam
              </label>
              <div className="w-[72px] shrink-0">
                <FieldLabel>Dia</FieldLabel>
                <Input
                  value={spec.bottomSpoutDia}
                  onChange={(event) => patchSubtype({ bottomSpoutDia: event.target.value })}
                  className={fieldClassName}
                />
              </div>
              <div className="w-[72px] shrink-0">
                <FieldLabel>Height</FieldLabel>
                <Input value={spec.bottomSpoutHeight} onChange={(event) => update("bottomSpoutHeight", event.target.value)} className={fieldClassName} />
              </div>
              <div className="w-[72px] shrink-0">
                <FieldLabel>No</FieldLabel>
                <Input value={spec.bottomSpoutCount} onChange={(event) => update("bottomSpoutCount", event.target.value)} className={fieldClassName} />
              </div>
              {showSkirt ? (
                <div className="w-[88px] shrink-0">
                  <FieldLabel>Skirt Height</FieldLabel>
                  <Input value={spec.bottomSkirtHeight} onChange={(event) => update("bottomSkirtHeight", event.target.value)} className={fieldClassName} />
                </div>
              ) : null}
              {conicalBottom ? (
                <div className="w-[88px] shrink-0">
                  <FieldLabel>Conical Height</FieldLabel>
                  <Input value={spec.bottomConicalHeight} onChange={(event) => update("bottomConicalHeight", event.target.value)} className={fieldClassName} />
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
              <label className="mb-1 flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-sm">
                <input
                  type="checkbox"
                  checked={spec.bottomTieExtra}
                  onChange={(event) => update("bottomTieExtra", event.target.checked)}
                  className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
                />
                Tie Extra
              </label>
              <label className="mb-1 flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-sm">
                <input
                  type="checkbox"
                  checked={spec.bottomVelcro}
                  onChange={(event) => update("bottomVelcro", event.target.checked)}
                  className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
                />
                Velcro
              </label>
              {spec.bottomVelcro ? (
                <div className="w-[72px] shrink-0">
                  <FormSelect value={spec.bottomVelcroSize || "0"} onChange={(value) => update("bottomVelcroSize", value)} options={["0", "1", "2", "4", "6"]} />
                </div>
              ) : null}
              <label className="mb-1 flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-sm">
                <input
                  type="checkbox"
                  checked={spec.bottomHoseSlider}
                  onChange={(event) => update("bottomHoseSlider", event.target.checked)}
                  className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
                />
                Hose Slider
              </label>
              {spec.bottomHoseSlider ? (
                <div className="w-[72px] shrink-0">
                  <Input value={spec.bottomHoseSliderCount} onChange={(event) => update("bottomHoseSliderCount", event.target.value)} className={fieldClassName} />
                </div>
              ) : null}
              <label className="mb-1 flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-sm">
                <input
                  type="checkbox"
                  checked={spec.bottomWireTie}
                  onChange={(event) => update("bottomWireTie", event.target.checked)}
                  className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
                />
                WireTie
              </label>
              {spec.bottomWireTie ? (
                <div className="w-[72px] shrink-0">
                  <Input value={spec.bottomWireTieCount} onChange={(event) => update("bottomWireTieCount", event.target.value)} className={fieldClassName} />
                </div>
              ) : null}
              <label className="mb-1 flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-sm">
                <input
                  type="checkbox"
                  checked={spec.bottomCableTie}
                  onChange={(event) => update("bottomCableTie", event.target.checked)}
                  className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
                />
                Cable Tie
              </label>
              {spec.bottomCableTie ? (
                <div className="w-[72px] shrink-0">
                  <Input value={spec.bottomCableTieCount} onChange={(event) => update("bottomCableTieCount", event.target.value)} className={fieldClassName} />
                </div>
              ) : null}
              <div className="min-w-[160px] flex-1 basis-[160px]">
                <FieldLabel>Color</FieldLabel>
                <FormSelect value={spec.bottomSpoutColor || "Milky White"} onChange={(value) => update("bottomSpoutColor", value)} options={[...COLOURS]} />
              </div>
              <div className="min-w-[180px] flex-[2] basis-[180px]">
                <FieldLabel>Remarks</FieldLabel>
                <Input value={spec.bottomSpoutRemarks} onChange={(event) => update("bottomSpoutRemarks", event.target.value)} className={fieldClassName} />
              </div>
            </div>
            {irisBottom ? (
              <div className="w-[120px]">
                <FieldLabel optional>Iris tie count</FieldLabel>
                <Input value={spec.bottomIrisTieCount} onChange={(event) => update("bottomIrisTieCount", event.target.value)} className={fieldClassName} />
              </div>
            ) : null}
          </div>

          <CheckRow checked={spec.doubleFoldBottom} onChange={(checked) => update("doubleFoldBottom", checked)}>
            Double Fold
          </CheckRow>
          <CheckRow checked={spec.bottomSpoutEdgeHemming} onChange={(checked) => update("bottomSpoutEdgeHemming", checked)}>
            Edge Hemming
          </CheckRow>

          <CheckRow checked={spec.bottomSpoutRope} onChange={(checked) => update("bottomSpoutRope", checked)}>
            Bottom Spout Rope
          </CheckRow>
          {spec.bottomSpoutRope ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <FieldLabel>Type</FieldLabel>
                  <FormSelect value={spec.bottomSpoutRopeType} onChange={(value) => update("bottomSpoutRopeType", value)} options={[...ROPE_TYPES]} />
                </div>
                <div>
                  <FieldLabel>Grm</FieldLabel>
                  <Input value={spec.bottomSpoutRopeGsm} onChange={(event) => update("bottomSpoutRopeGsm", event.target.value)} className={fieldClassName} />
                </div>
                <div>
                  <FieldLabel>Size</FieldLabel>
                  <FormSelect value={spec.bottomSpoutRopeSize || "5"} onChange={(value) => update("bottomSpoutRopeSize", value)} options={[...ROPE_SIZES]} />
                </div>
                <div>
                  <FieldLabel>Color</FieldLabel>
                  <FormSelect value={spec.bottomSpoutRopeColor || "Milky White"} onChange={(value) => update("bottomSpoutRopeColor", value)} options={[...COLOURS]} />
                </div>
                <div>
                  <FieldLabel>No (rope)</FieldLabel>
                  <Input value={spec.bottomSpoutRopeCount} onChange={(event) => update("bottomSpoutRopeCount", event.target.value)} className={fieldClassName} />
                </div>
                <div>
                  <FieldLabel>Remarks</FieldLabel>
                  <Input value={spec.bottomSpoutRopeRemarks} onChange={(event) => update("bottomSpoutRopeRemarks", event.target.value)} className={fieldClassName} />
                </div>
              </div>
              <FieldLabel optional>Petal flap</FieldLabel>
              <GsmLamiFields
                gsm={spec.bottomPetalFlapGsm || "70"}
                lami={spec.bottomPetalFlapLami || "0"}
                onGsm={(value) => update("bottomPetalFlapGsm", value)}
                onLami={(value) => update("bottomPetalFlapLami", value)}
                gsmOptions={[...GSM_OPTIONS]}
                lamiOptions={[...LAMI_OPTIONS]}
              />
            </div>
          ) : null}

          <CheckRow checked={spec.bottomSpoutTie} onChange={(checked) => update("bottomSpoutTie", checked)}>
            Bottom Spout Tie
          </CheckRow>
          {spec.bottomSpoutTie ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <FieldLabel>Grm</FieldLabel>
                <FormSelect value={spec.bottomSpoutTieGsm || "0"} onChange={(value) => update("bottomSpoutTieGsm", value)} options={[...TIE_GSM_OPTIONS]} />
              </div>
              <div>
                <FieldLabel>Size</FieldLabel>
                <FormSelect value={spec.bottomSpoutTieSize} onChange={(value) => update("bottomSpoutTieSize", value)} options={[...ROPE_SIZE_10_25]} />
              </div>
              <div>
                <FieldLabel>No (Tie)</FieldLabel>
                <Input value={spec.bottomSpoutTieCount} onChange={(event) => update("bottomSpoutTieCount", event.target.value)} className={fieldClassName} />
              </div>
              <div>
                <FieldLabel>Remarks</FieldLabel>
                <Input value={spec.bottomSpoutTieRemarks} onChange={(event) => update("bottomSpoutTieRemarks", event.target.value)} className={fieldClassName} />
              </div>
            </div>
          ) : null}

          <CheckRow checked={spec.topBottomBand} onChange={(checked) => update("topBottomBand", checked)}>
            Bottom Band
          </CheckRow>
          {spec.topBottomBand ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>GPM</FieldLabel>
                <Input value={spec.topBottomBandGsm} onChange={(event) => update("topBottomBandGsm", event.target.value)} className={fieldClassName} />
              </div>
              <div>
                <FieldLabel>Size</FieldLabel>
                <Input value={spec.topBottomBandSize} onChange={(event) => update("topBottomBandSize", event.target.value)} className={fieldClassName} />
              </div>
            </div>
          ) : null}

          {discharge ? <ErpExtras specification={spec} update={update} tab="bottomSpout2" /> : null}
        </>
      ) : null}
    </>
  )
}

function LinerPanel({
  spec,
  update,
  patch,
}: {
  spec: QuoteSpecification
  update: Props["update"]
  patch: Props["patch"]
}) {
  const showBaffle = spec.constructionType !== "Buffle"

  function setLiner(checked: boolean) {
    if (!checked) {
      patch({ linerEnabled: false, linerBaffle: false })
      return
    }
    patch({
      linerEnabled: true,
      linerMaterial: spec.linerMaterial && spec.linerMaterial !== "None" ? spec.linerMaterial : "LD",
      linerMicron: spec.linerMicron || "70",
      linerType: spec.linerType || "None",
      linerSubtype: spec.linerSubtype || "Normal",
      linerColour: spec.linerColour || "Natural",
      linerBaffle: spec.constructionType === "Buffle" ? false : spec.linerBaffle,
    })
  }

  return (
    <>
      <p className="text-sm text-[var(--text-secondary)]">Liner Options is visible depends on Top and Bottom construction</p>
      <CheckRow checked={spec.linerEnabled} onChange={setLiner}>
        Liner
      </CheckRow>
      {spec.linerEnabled ? (
        <div className="space-y-3 rounded-2xl border border-[var(--border)] p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[140px] shrink-0">
              <FieldLabel>Type</FieldLabel>
              <FormSelect value={spec.linerMaterial} onChange={(value) => update("linerMaterial", value)} options={[...LINER_MATERIALS]} />
            </div>
            <div className="min-w-[220px] flex-[2] basis-[220px]">
              <FieldLabel>Liner type</FieldLabel>
              <FormSelect value={spec.linerType || "None"} onChange={(value) => update("linerType", value)} options={[...LINER_TYPES]} />
            </div>
            {showBaffle ? (
              <label className="mb-1 flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-sm">
                <input
                  type="checkbox"
                  checked={spec.linerBaffle}
                  onChange={(event) =>
                    patch({
                      linerBaffle: event.target.checked,
                      linerBaffleMicron: event.target.checked ? spec.linerBaffleMicron : "",
                    })
                  }
                  className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
                />
                Baffle Liner
              </label>
            ) : null}
            {showBaffle && spec.linerBaffle ? (
              <div className="w-[88px] shrink-0">
                <FieldLabel>Baffle Liner Micron</FieldLabel>
                <Input value={spec.linerBaffleMicron} onChange={(event) => update("linerBaffleMicron", event.target.value)} className={fieldClassName} />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[88px] shrink-0">
              <FieldLabel>Micron</FieldLabel>
              <Input value={spec.linerMicron} onChange={(event) => update("linerMicron", event.target.value)} className={fieldClassName} />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>Height</FieldLabel>
              <Input value={spec.linerHeight} onChange={(event) => update("linerHeight", event.target.value)} className={fieldClassName} />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>Width</FieldLabel>
              <Input value={spec.linerWidth} onChange={(event) => update("linerWidth", event.target.value)} className={fieldClassName} />
            </div>
            <div className="min-w-[140px] flex-1 basis-[140px]">
              <FieldLabel>Sub type</FieldLabel>
              <FormSelect value={spec.linerSubtype || "Normal"} onChange={(value) => update("linerSubtype", value)} options={[...LINER_SUBTYPES]} />
            </div>
            <div className="w-[88px] shrink-0">
              <FieldLabel>At-Point</FieldLabel>
              <FormSelect value={spec.linerAtPoint || "0"} onChange={(value) => update("linerAtPoint", value)} options={[...LINER_AT_POINTS]} />
            </div>
            <div className="min-w-[160px] flex-1 basis-[160px]">
              <FieldLabel>Color</FieldLabel>
              <FormSelect value={spec.linerColour || "Natural"} onChange={(value) => update("linerColour", value)} options={[...COLOURS]} />
            </div>
            <div className="min-w-[180px] flex-[2] basis-[180px]">
              <FieldLabel>Remarks</FieldLabel>
              <Input value={spec.linerRemarks} onChange={(event) => update("linerRemarks", event.target.value)} className={fieldClassName} />
            </div>
          </div>
        </div>
      ) : null}

      <CheckRow checked={spec.label} onChange={(checked) => update("label", checked)}>
        Label
      </CheckRow>
      {spec.label ? (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--border)] p-4">
          <div className="w-[72px] shrink-0">
            <FieldLabel>Nos</FieldLabel>
            <Input value={spec.labelCount} onChange={(event) => update("labelCount", event.target.value)} className={fieldClassName} />
          </div>
          <label className="mb-1 flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-sm">
            <input
              type="checkbox"
              checked={spec.labelTyvac}
              onChange={(event) => update("labelTyvac", event.target.checked)}
              className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
            />
            Tyvac
          </label>
          <div className="w-[72px] shrink-0">
            <FieldLabel>L</FieldLabel>
            <Input value={spec.labelLength} onChange={(event) => update("labelLength", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[72px] shrink-0">
            <FieldLabel>W</FieldLabel>
            <Input value={spec.labelWidth} onChange={(event) => update("labelWidth", event.target.value)} className={fieldClassName} />
          </div>
          <div className="w-[88px] shrink-0">
            <FieldLabel>Micron</FieldLabel>
            <Input value={spec.labelMicron} onChange={(event) => update("labelMicron", event.target.value)} className={fieldClassName} />
          </div>
          <div className="min-w-[160px] flex-1 basis-[160px]">
            <FieldLabel>Color</FieldLabel>
            <FormSelect value={spec.labelColour || "Milky White"} onChange={(value) => update("labelColour", value)} options={[...COLOURS]} />
          </div>
          <div className="min-w-[180px] flex-[2] basis-[180px]">
            <FieldLabel>Remarks</FieldLabel>
            <Input value={spec.labelRemarks} onChange={(event) => update("labelRemarks", event.target.value)} className={fieldClassName} />
          </div>
        </div>
      ) : null}

      <CheckRow checked={spec.bLock} onChange={(checked) => update("bLock", checked)}>
        B-Lock
      </CheckRow>
      {spec.bLock ? (
        <div className="w-[88px]">
          <FieldLabel>Nos</FieldLabel>
          <Input value={spec.bLockCount} onChange={(event) => update("bLockCount", event.target.value)} className={fieldClassName} />
        </div>
      ) : null}
    </>
  )
}

