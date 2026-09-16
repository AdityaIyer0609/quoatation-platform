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
  BomColourField,
  CompactCheck,
  FeatureCard,
  FieldCell,
  FieldGrid,
  FieldLabel,
  FormSelect,
  GsmLamiFields,
  PanelStack,
} from "@/components/quote/FormControls"
import { Input } from "@/components/ui/input"
import { useEffect, useRef, useState, type ReactNode } from "react"
import {
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
    <PanelStack>
      <FeatureCard
        title="Top"
        on={spec.topEnabled}
        onToggle={(v) => update("topEnabled", v)}
        summary={spec.topEnabled ? `${spec.topType} · ${spec.topGsm || "0"} GSM · ${spec.topColour}` : undefined}
      >
        <FieldGrid>
          <FieldCell span={2}>
            <FieldLabel>Top Type</FieldLabel>
            <FormSelect
              value={spec.topType}
              onChange={(value) => patch(topTypeDefaults(value, spec))}
              options={[...TOP_TYPES]}
            />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Top GSM</FieldLabel>
            <FormSelect value={spec.topGsm || "0"} onChange={(value) => update("topGsm", value)} options={[...GSM_OPTIONS]} />
          </FieldCell>
          <FieldCell>
            <CompactCheck
              checked={Boolean(spec.topLami) && spec.topLami !== "0"}
              onChange={(checked) => update("topLami", checked ? (spec.topLami && spec.topLami !== "0" ? spec.topLami : "25") : "0")}
            >
              Lam
            </CompactCheck>
          </FieldCell>
          <FieldCell>
            <FieldLabel>No</FieldLabel>
            <Input value={spec.topCount} onChange={(event) => update("topCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
          {showConicalHeight ? (
            <FieldCell>
              <FieldLabel>Conical Top</FieldLabel>
              <Input value={spec.conicalTop} onChange={(event) => update("conicalTop", event.target.value)} className={fieldClassName} />
            </FieldCell>
          ) : null}
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="topColour" />

        {showSpout ? (
          <div className="space-y-3 rounded-2xl border border-[var(--border)] p-4">
            <FieldLabel>Spout</FieldLabel>
            <CompactCheck checked={spec.topSpoutConical} onChange={(checked) => update("topSpoutConical", checked)}>
              Conical
            </CompactCheck>
            <FieldGrid>
              <FieldCell span={2}>
                <FieldLabel>Spout Type</FieldLabel>
                <FormSelect value={spec.topSpoutType || "None"} onChange={(value) => update("topSpoutType", value)} options={[...TOP_SPOUT_TYPES]} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>GSM</FieldLabel>
                <FormSelect value={spec.topSpoutGsm || "0"} onChange={(value) => update("topSpoutGsm", value)} options={[...GSM_OPTIONS]} />
              </FieldCell>
              <FieldCell>
                <CompactCheck
                  checked={Boolean(spec.topSpoutLami) && spec.topSpoutLami !== "0"}
                  onChange={(checked) =>
                    update("topSpoutLami", checked ? (spec.topSpoutLami && spec.topSpoutLami !== "0" ? spec.topSpoutLami : "25") : "0")
                  }
                >
                  Lam
                </CompactCheck>
              </FieldCell>
              <FieldCell>
                <FieldLabel>Dia</FieldLabel>
                <Input value={spec.topSpoutDia} onChange={(event) => update("topSpoutDia", event.target.value)} className={fieldClassName} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>Height</FieldLabel>
                <Input value={spec.topSpoutHeight} onChange={(event) => update("topSpoutHeight", event.target.value)} className={fieldClassName} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>No</FieldLabel>
                <Input value={spec.topSpoutCount} onChange={(event) => update("topSpoutCount", event.target.value)} className={fieldClassName} />
              </FieldCell>
            </FieldGrid>
          </div>
        ) : null}

        {showDuffle ? (
          <FieldGrid>
            <FieldCell span={2}>
              <FieldLabel>Duffle / skirt height</FieldLabel>
              <Input value={spec.duffleHeight} onChange={(event) => update("duffleHeight", event.target.value)} className={fieldClassName} />
            </FieldCell>
          </FieldGrid>
        ) : null}

        {showGroup6 ? (
          <>
            <FieldGrid>
              <FieldCell>
                <CompactCheck checked={spec.topVelcro} onChange={(checked) => update("topVelcro", checked)}>
                  Velcro
                </CompactCheck>
              </FieldCell>
              {spec.topVelcro ? (
                <FieldCell>
                  <FormSelect value={spec.topVelcroSize || "0"} onChange={(value) => update("topVelcroSize", value)} options={["0", "1", "2", "4", "6"]} />
                </FieldCell>
              ) : null}
              <FieldCell>
                <CompactCheck checked={spec.hoseSlider} onChange={(checked) => update("hoseSlider", checked)}>
                  Hose Slider
                </CompactCheck>
              </FieldCell>
              {spec.hoseSlider ? (
                <FieldCell>
                  <Input value={spec.hoseSliderCount} onChange={(event) => update("hoseSliderCount", event.target.value)} className={fieldClassName} />
                </FieldCell>
              ) : null}
              <FieldCell>
                <CompactCheck checked={spec.cableTie} onChange={(checked) => update("cableTie", checked)}>
                  Cable Tie
                </CompactCheck>
              </FieldCell>
              {spec.cableTie ? (
                <FieldCell>
                  <Input value={spec.cableTieCount} onChange={(event) => update("cableTieCount", event.target.value)} className={fieldClassName} />
                </FieldCell>
              ) : null}
              <FieldCell span={2}>
                <FieldLabel>Top Remarks</FieldLabel>
                <Input value={spec.topRemarks} onChange={(event) => update("topRemarks", event.target.value)} className={fieldClassName} />
              </FieldCell>
            </FieldGrid>
            <BomColourField spec={spec} update={update} colourKey="topSpoutColor" />
          </>
        ) : null}

        {irisTop ? (
          <FieldGrid>
            <FieldCell>
              <FieldLabel optional>Iris tie count</FieldLabel>
              <Input value={spec.topIrisTieCount} onChange={(event) => update("topIrisTieCount", event.target.value)} className={fieldClassName} />
            </FieldCell>
          </FieldGrid>
        ) : null}
      </FeatureCard>

      {spec.topEnabled ? (
        <>
          <FeatureCard title="Double Fold" on={spec.doubleFoldTop} onToggle={(v) => update("doubleFoldTop", v)} />

          {showSpoutRope ? (
            <FeatureCard title="TopSpout Rope" on={spec.topSpoutRope} onToggle={(v) => update("topSpoutRope", v)} />
          ) : null}

          <FeatureCard
            title="TopSpout Tie"
            on={spec.topSpoutTie}
            onToggle={(v) => update("topSpoutTie", v)}
            summary={spec.topSpoutTie ? `${spec.topSpoutTieGsm || "0"} grm · ${spec.topSpoutTieCount} tie` : undefined}
          >
            <FieldGrid>
              <FieldCell>
                <FieldLabel>Grm</FieldLabel>
                <FormSelect value={spec.topSpoutTieGsm || "0"} onChange={(value) => update("topSpoutTieGsm", value)} options={[...TIE_GSM_OPTIONS]} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>Size</FieldLabel>
                <Input value={spec.topSpoutTieSize} onChange={(event) => update("topSpoutTieSize", event.target.value)} className={fieldClassName} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>No (Tie)</FieldLabel>
                <Input value={spec.topSpoutTieCount} onChange={(event) => update("topSpoutTieCount", event.target.value)} className={fieldClassName} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>Remarks</FieldLabel>
                <Input value={spec.topSpoutTieRemarks} onChange={(event) => update("topSpoutTieRemarks", event.target.value)} className={fieldClassName} />
              </FieldCell>
            </FieldGrid>
          </FeatureCard>

          <FeatureCard
            title="Top Band"
            on={spec.topBand}
            onToggle={(v) => update("topBand", v)}
            summary={spec.topBand ? `${spec.topBandGsm} GPM · size ${spec.topBandSize}` : undefined}
          >
            <FieldGrid>
              <FieldCell>
                <FieldLabel>GPM</FieldLabel>
                <Input value={spec.topBandGsm} onChange={(event) => update("topBandGsm", event.target.value)} className={fieldClassName} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>Size</FieldLabel>
                <Input value={spec.topBandSize} onChange={(event) => update("topBandSize", event.target.value)} className={fieldClassName} />
              </FieldCell>
            </FieldGrid>
          </FeatureCard>
        </>
      ) : null}
    </PanelStack>
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
    <PanelStack>
      <FeatureCard
        title="Bottom"
        on={spec.bottomEnabled}
        onToggle={(v) => update("bottomEnabled", v)}
        summary={spec.bottomEnabled ? `${spec.bottomType} · ${spec.bottomGsm || spec.bodyGsm || "0"} GSM · ${spec.bottomColour}` : undefined}
      >
        <FieldGrid>
          <FieldCell span={2}>
            <FieldLabel>Type</FieldLabel>
            <FormSelect
              value={spec.bottomType}
              onChange={(value) => patch(bottomTypeDefaults(value, spec))}
              options={[...BOTTOM_TYPES]}
            />
          </FieldCell>
          <FieldCell>
            <FieldLabel>GSM</FieldLabel>
            <FormSelect
              value={spec.bottomGsm || spec.bodyGsm || "0"}
              onChange={(value) => update("bottomGsm", value)}
              options={[...GSM_OPTIONS]}
            />
          </FieldCell>
          <FieldCell>
            <CompactCheck
              checked={Boolean(spec.bottomLami) && spec.bottomLami !== "0"}
              onChange={(checked) =>
                update("bottomLami", checked ? (spec.bottomLami && spec.bottomLami !== "0" ? spec.bottomLami : "25") : "0")
              }
            >
              Lam
            </CompactCheck>
          </FieldCell>
          <FieldCell>
            <FieldLabel>No</FieldLabel>
            <Input value={spec.bottomCount} onChange={(event) => update("bottomCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell span={2}>
            <FieldLabel>Remarks</FieldLabel>
            <Input value={spec.bottomRemarks} onChange={(event) => update("bottomRemarks", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="bottomColour" />

        <div className="space-y-3 rounded-2xl border border-[var(--border)] p-4">
          <FieldGrid>
            <FieldCell span={2}>
              <FieldLabel>Sub type</FieldLabel>
              <FormSelect
                value={spec.bottomSpoutType || "None"}
                onChange={(value) => patchSubtype({ bottomSpoutType: value })}
                options={[...BOTTOM_SPOUT_TYPES]}
              />
            </FieldCell>
            <FieldCell>
              <FieldLabel>GSM</FieldLabel>
              <FormSelect
                value={spec.bottomSpoutGsm || "0"}
                onChange={(value) => update("bottomSpoutGsm", value)}
                options={[...GSM_OPTIONS]}
              />
            </FieldCell>
            <FieldCell>
              <CompactCheck
                checked={Boolean(spec.bottomSpoutLami) && spec.bottomSpoutLami !== "0"}
                onChange={(checked) =>
                  update(
                    "bottomSpoutLami",
                    checked ? (spec.bottomSpoutLami && spec.bottomSpoutLami !== "0" ? spec.bottomSpoutLami : "25") : "0",
                  )
                }
              >
                Lam
              </CompactCheck>
            </FieldCell>
            <FieldCell>
              <FieldLabel>Dia</FieldLabel>
              <Input
                value={spec.bottomSpoutDia}
                onChange={(event) => patchSubtype({ bottomSpoutDia: event.target.value })}
                className={fieldClassName}
              />
            </FieldCell>
            <FieldCell>
              <FieldLabel>Height</FieldLabel>
              <Input value={spec.bottomSpoutHeight} onChange={(event) => update("bottomSpoutHeight", event.target.value)} className={fieldClassName} />
            </FieldCell>
            <FieldCell>
              <FieldLabel>No</FieldLabel>
              <Input value={spec.bottomSpoutCount} onChange={(event) => update("bottomSpoutCount", event.target.value)} className={fieldClassName} />
            </FieldCell>
            {showSkirt ? (
              <FieldCell>
                <FieldLabel>Skirt Height</FieldLabel>
                <Input value={spec.bottomSkirtHeight} onChange={(event) => update("bottomSkirtHeight", event.target.value)} className={fieldClassName} />
              </FieldCell>
            ) : null}
            {conicalBottom ? (
              <FieldCell>
                <FieldLabel>Conical Height</FieldLabel>
                <Input value={spec.bottomConicalHeight} onChange={(event) => update("bottomConicalHeight", event.target.value)} className={fieldClassName} />
              </FieldCell>
            ) : null}
          </FieldGrid>

          <FieldGrid>
            <FieldCell>
              <CompactCheck checked={spec.bottomTieExtra} onChange={(checked) => update("bottomTieExtra", checked)}>
                Tie Extra
              </CompactCheck>
            </FieldCell>
            <FieldCell>
              <CompactCheck checked={spec.bottomVelcro} onChange={(checked) => update("bottomVelcro", checked)}>
                Velcro
              </CompactCheck>
            </FieldCell>
            {spec.bottomVelcro ? (
              <FieldCell>
                <FormSelect value={spec.bottomVelcroSize || "0"} onChange={(value) => update("bottomVelcroSize", value)} options={["0", "1", "2", "4", "6"]} />
              </FieldCell>
            ) : null}
            <FieldCell>
              <CompactCheck checked={spec.bottomHoseSlider} onChange={(checked) => update("bottomHoseSlider", checked)}>
                Hose Slider
              </CompactCheck>
            </FieldCell>
            {spec.bottomHoseSlider ? (
              <FieldCell>
                <Input value={spec.bottomHoseSliderCount} onChange={(event) => update("bottomHoseSliderCount", event.target.value)} className={fieldClassName} />
              </FieldCell>
            ) : null}
            <FieldCell>
              <CompactCheck checked={spec.bottomWireTie} onChange={(checked) => update("bottomWireTie", checked)}>
                WireTie
              </CompactCheck>
            </FieldCell>
            {spec.bottomWireTie ? (
              <FieldCell>
                <Input value={spec.bottomWireTieCount} onChange={(event) => update("bottomWireTieCount", event.target.value)} className={fieldClassName} />
              </FieldCell>
            ) : null}
            <FieldCell>
              <CompactCheck checked={spec.bottomCableTie} onChange={(checked) => update("bottomCableTie", checked)}>
                Cable Tie
              </CompactCheck>
            </FieldCell>
            {spec.bottomCableTie ? (
              <FieldCell>
                <Input value={spec.bottomCableTieCount} onChange={(event) => update("bottomCableTieCount", event.target.value)} className={fieldClassName} />
              </FieldCell>
            ) : null}
            <FieldCell span={2}>
              <FieldLabel>Remarks</FieldLabel>
              <Input value={spec.bottomSpoutRemarks} onChange={(event) => update("bottomSpoutRemarks", event.target.value)} className={fieldClassName} />
            </FieldCell>
          </FieldGrid>
          <BomColourField spec={spec} update={update} colourKey="bottomSpoutColor" />
          {irisBottom ? (
            <FieldGrid>
              <FieldCell>
                <FieldLabel optional>Iris tie count</FieldLabel>
                <Input value={spec.bottomIrisTieCount} onChange={(event) => update("bottomIrisTieCount", event.target.value)} className={fieldClassName} />
              </FieldCell>
            </FieldGrid>
          ) : null}
        </div>
      </FeatureCard>

      {spec.bottomEnabled ? (
        <>
          <FeatureCard title="Double Fold" on={spec.doubleFoldBottom} onToggle={(v) => update("doubleFoldBottom", v)} />
          <FeatureCard title="Edge Hemming" on={spec.bottomSpoutEdgeHemming} onToggle={(v) => update("bottomSpoutEdgeHemming", v)} />

          <FeatureCard
            title="Bottom Spout Rope"
            on={spec.bottomSpoutRope}
            onToggle={(v) => update("bottomSpoutRope", v)}
            summary={spec.bottomSpoutRope ? `${spec.bottomSpoutRopeType} · ${spec.bottomSpoutRopeCount} rope · ${spec.bottomSpoutRopeColor}` : undefined}
          >
            <FieldGrid>
              <FieldCell>
                <FieldLabel>Type</FieldLabel>
                <FormSelect value={spec.bottomSpoutRopeType} onChange={(value) => update("bottomSpoutRopeType", value)} options={[...ROPE_TYPES]} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>Grm</FieldLabel>
                <Input value={spec.bottomSpoutRopeGsm} onChange={(event) => update("bottomSpoutRopeGsm", event.target.value)} className={fieldClassName} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>Size</FieldLabel>
                <FormSelect value={spec.bottomSpoutRopeSize || "5"} onChange={(value) => update("bottomSpoutRopeSize", value)} options={[...ROPE_SIZES]} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>No (rope)</FieldLabel>
                <Input value={spec.bottomSpoutRopeCount} onChange={(event) => update("bottomSpoutRopeCount", event.target.value)} className={fieldClassName} />
              </FieldCell>
              <FieldCell span={2}>
                <FieldLabel>Remarks</FieldLabel>
                <Input value={spec.bottomSpoutRopeRemarks} onChange={(event) => update("bottomSpoutRopeRemarks", event.target.value)} className={fieldClassName} />
              </FieldCell>
            </FieldGrid>
            <BomColourField spec={spec} update={update} colourKey="bottomSpoutRopeColor" />
            <FieldLabel optional>Petal flap</FieldLabel>
            <GsmLamiFields
              gsm={spec.bottomPetalFlapGsm || "70"}
              lami={spec.bottomPetalFlapLami || "0"}
              onGsm={(value) => update("bottomPetalFlapGsm", value)}
              onLami={(value) => update("bottomPetalFlapLami", value)}
              gsmOptions={[...GSM_OPTIONS]}
              lamiOptions={[...LAMI_OPTIONS]}
            />
          </FeatureCard>

          <FeatureCard
            title="Bottom Spout Tie"
            on={spec.bottomSpoutTie}
            onToggle={(v) => update("bottomSpoutTie", v)}
            summary={spec.bottomSpoutTie ? `${spec.bottomSpoutTieGsm || "0"} grm · ${spec.bottomSpoutTieCount} tie` : undefined}
          >
            <FieldGrid>
              <FieldCell>
                <FieldLabel>Grm</FieldLabel>
                <FormSelect value={spec.bottomSpoutTieGsm || "0"} onChange={(value) => update("bottomSpoutTieGsm", value)} options={[...TIE_GSM_OPTIONS]} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>Size</FieldLabel>
                <FormSelect value={spec.bottomSpoutTieSize} onChange={(value) => update("bottomSpoutTieSize", value)} options={[...ROPE_SIZE_10_25]} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>No (Tie)</FieldLabel>
                <Input value={spec.bottomSpoutTieCount} onChange={(event) => update("bottomSpoutTieCount", event.target.value)} className={fieldClassName} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>Remarks</FieldLabel>
                <Input value={spec.bottomSpoutTieRemarks} onChange={(event) => update("bottomSpoutTieRemarks", event.target.value)} className={fieldClassName} />
              </FieldCell>
            </FieldGrid>
          </FeatureCard>

          <FeatureCard
            title="Bottom Band"
            on={spec.topBottomBand}
            onToggle={(v) => update("topBottomBand", v)}
            summary={spec.topBottomBand ? `${spec.topBottomBandGsm} GPM · size ${spec.topBottomBandSize}` : undefined}
          >
            <FieldGrid>
              <FieldCell>
                <FieldLabel>GPM</FieldLabel>
                <Input value={spec.topBottomBandGsm} onChange={(event) => update("topBottomBandGsm", event.target.value)} className={fieldClassName} />
              </FieldCell>
              <FieldCell>
                <FieldLabel>Size</FieldLabel>
                <Input value={spec.topBottomBandSize} onChange={(event) => update("topBottomBandSize", event.target.value)} className={fieldClassName} />
              </FieldCell>
            </FieldGrid>
          </FeatureCard>

          {discharge ? <ErpExtras specification={spec} update={update} tab="bottomSpout2" /> : null}
        </>
      ) : null}
    </PanelStack>
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
    <PanelStack>
      <p className="text-sm text-[var(--text-secondary)]">Liner Options is visible depends on Top and Bottom construction</p>

      <FeatureCard
        title="Liner"
        on={spec.linerEnabled}
        onToggle={setLiner}
        summary={spec.linerEnabled ? `${spec.linerMaterial} · ${spec.linerMicron}µ · ${spec.linerColour}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Type</FieldLabel>
            <FormSelect value={spec.linerMaterial} onChange={(value) => update("linerMaterial", value)} options={[...LINER_MATERIALS]} />
          </FieldCell>
          <FieldCell span={2}>
            <FieldLabel>Liner type</FieldLabel>
            <FormSelect value={spec.linerType || "None"} onChange={(value) => update("linerType", value)} options={[...LINER_TYPES]} />
          </FieldCell>
          {showBaffle ? (
            <FieldCell>
              <CompactCheck
                checked={spec.linerBaffle}
                onChange={(checked) =>
                  patch({
                    linerBaffle: checked,
                    linerBaffleMicron: checked ? spec.linerBaffleMicron : "",
                  })
                }
              >
                Baffle Liner
              </CompactCheck>
            </FieldCell>
          ) : null}
          {showBaffle && spec.linerBaffle ? (
            <FieldCell>
              <FieldLabel>Baffle Liner Micron</FieldLabel>
              <Input value={spec.linerBaffleMicron} onChange={(event) => update("linerBaffleMicron", event.target.value)} className={fieldClassName} />
            </FieldCell>
          ) : null}
          <FieldCell>
            <FieldLabel>Micron</FieldLabel>
            <Input value={spec.linerMicron} onChange={(event) => update("linerMicron", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Height</FieldLabel>
            <Input value={spec.linerHeight} onChange={(event) => update("linerHeight", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Width</FieldLabel>
            <Input value={spec.linerWidth} onChange={(event) => update("linerWidth", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Sub type</FieldLabel>
            <FormSelect value={spec.linerSubtype || "Normal"} onChange={(value) => update("linerSubtype", value)} options={[...LINER_SUBTYPES]} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>At-Point</FieldLabel>
            <FormSelect value={spec.linerAtPoint || "0"} onChange={(value) => update("linerAtPoint", value)} options={[...LINER_AT_POINTS]} />
          </FieldCell>
          <FieldCell span={2}>
            <FieldLabel>Remarks</FieldLabel>
            <Input value={spec.linerRemarks} onChange={(event) => update("linerRemarks", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="linerColour" />
      </FeatureCard>

      <FeatureCard
        title="Label"
        on={spec.label}
        onToggle={(v) => update("label", v)}
        summary={spec.label ? `${spec.labelCount} no · ${spec.labelLength}×${spec.labelWidth} · ${spec.labelColour}` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Nos</FieldLabel>
            <Input value={spec.labelCount} onChange={(event) => update("labelCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <CompactCheck checked={spec.labelTyvac} onChange={(checked) => update("labelTyvac", checked)}>
              Tyvac
            </CompactCheck>
          </FieldCell>
          <FieldCell>
            <FieldLabel>L</FieldLabel>
            <Input value={spec.labelLength} onChange={(event) => update("labelLength", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>W</FieldLabel>
            <Input value={spec.labelWidth} onChange={(event) => update("labelWidth", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell>
            <FieldLabel>Micron</FieldLabel>
            <Input value={spec.labelMicron} onChange={(event) => update("labelMicron", event.target.value)} className={fieldClassName} />
          </FieldCell>
          <FieldCell span={2}>
            <FieldLabel>Remarks</FieldLabel>
            <Input value={spec.labelRemarks} onChange={(event) => update("labelRemarks", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
        <BomColourField spec={spec} update={update} colourKey="labelColour" />
      </FeatureCard>

      <FeatureCard
        title="B-Lock"
        on={spec.bLock}
        onToggle={(v) => update("bLock", v)}
        summary={spec.bLock ? `${spec.bLockCount} nos` : undefined}
      >
        <FieldGrid>
          <FieldCell>
            <FieldLabel>Nos</FieldLabel>
            <Input value={spec.bLockCount} onChange={(event) => update("bLockCount", event.target.value)} className={fieldClassName} />
          </FieldCell>
        </FieldGrid>
      </FeatureCard>
    </PanelStack>
  )
}

