import { ArrowLeft, ArrowRight, Info } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { ErpExtras } from "@/components/quote/ErpExtras"
import { fieldClassName } from "@/components/login/fieldStyles"
import {
  CheckRow,
  FieldLabel,
  FormSelect,
  GsmLamiFields,
  OptionChips,
} from "@/components/quote/FormControls"
import { MobilePriceBar, QuoteSummary } from "@/components/quote/QuoteSummary"
import { StepIndicator } from "@/components/quote/StepIndicator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useQuoteDraft } from "@/hooks/useQuoteDraft"
import { usePortalPaths } from "@/lib/portal"
import {
  BAG_TYPES,
  BODY_GRADES,
  BOTTOM_SPOUT_TYPES,
  BOTTOM_TYPES,
  COLOURS,
  CONSTRUCTIONS,
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
  SF_RATIOS,
  SIZE_TYPES,
  THREAD_BUFFLE_SEAMS,
  THREAD_NEEDLES,
  THREAD_TYPES,
  TIE_GSM_OPTIONS,
  TOP_SPOUT_TYPES,
  TOP_TYPES,
  TRANSPORT,
  TUNNEL_DESIGNS,
  bodyStylesFor,
} from "@/lib/erpCatalog"
import {
  constructionDefaults,
  sameFabricPatch,
  topTypeDefaults,
} from "@/lib/erpDefaults"
import { PREVIEW_SAMPLE_PATCH } from "@/lib/previewSample"
import { fetchComplicationPicker } from "@/services/pricing"
import type { ComplicationPicker, QuoteSpecification } from "@/types/quote"

function fillerType(value: string) {
  return value.toLowerCase() === "double" ? "double" : "single"
}

export default function NewQuote() {
  const navigate = useNavigate()
  const paths = usePortalPaths()
  const { specification: spec, step, setStep, update, patch } = useQuoteDraft()
  const [picker, setPicker] = useState<ComplicationPicker | null>(null)
  const fillingSpout = spec.topType === "Top Spout"
  const conicalTop = spec.topType === "Conical Top" || spec.topType === "Conical PlateTop"
  const duffleTop =
    spec.topType === "Duffle or Skrit" ||
    spec.topType === "Top + Skrit" ||
    spec.topType === "Leno" ||
    spec.topType === "Oversize Duffle or Skrit" ||
    spec.topType === "Drawstring Skirt" ||
    spec.topType === "Jute Skirt"
  const discharge = spec.bottomType === "Bottom Spout"
  const conicalBottom = spec.bottomType === "Conical Base" || spec.bottomType === "Conical Plate Base"
  const tunnel = spec.bodyStyle.toLowerCase().includes("tunnel")
  const styleOptions = bodyStylesFor(spec.constructionType)
  const irisTop = spec.topSpoutType.toLowerCase().includes("iris")
  const irisBottom = spec.bottomSpoutType.toLowerCase().includes("iris")

  useEffect(() => {
    if (step !== 4) return
    let cancelled = false
    fetchComplicationPicker(spec)
      .then((result) => {
        if (cancelled) return
        setPicker(result)
        const allowed = result.candidates.map((row) => row.complication)
        if (spec.book4Complication && !allowed.includes(spec.book4Complication)) {
          update("book4Complication", "")
        }
      })
      .catch(() => {
        if (!cancelled) setPicker(null)
      })
    return () => {
      cancelled = true
    }
    // Intentionally omit book4Complication so clearing an invalid value does not retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step,
    spec.constructionType,
    spec.bodyStyle,
    spec.loopConstruction,
    spec.loopEnabled,
    spec.loopCount,
    spec.linerEnabled,
    spec.linerType,
  ])

  function nextStep() {
    if (step < 4) setStep(step + 1)
    else {
      setStep(5)
      navigate(paths.review)
    }
  }

  function goReview() {
    setStep(5)
    navigate(paths.review)
  }

  function applyPreviewSample() {
    patch({
      ...constructionDefaults("Circular", spec),
      ...topTypeDefaults("Top Spout", { ...spec, ...PREVIEW_SAMPLE_PATCH } as QuoteSpecification),
      ...PREVIEW_SAMPLE_PATCH,
    })
    setStep(4)
  }

  function setFabric(bodyGsm: string, bodyLami: string) {
    if (spec.sameFabricForPanels) patch(sameFabricPatch(spec, bodyGsm, bodyLami))
    else patch({ bodyGsm, bodyLami })
  }

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

  function fillerSelect(enabled: boolean, type: string) {
    if (!enabled) return "None"
    return type.toLowerCase() === "double" ? "Double" : "Single"
  }

  return (
    <div className="mx-auto max-w-[1100px] p-6 pb-28 md:p-8 lg:pb-8">
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <button
            type="button"
            className="text-[var(--text-secondary)] hover:underline"
            onClick={() => navigate(paths.dashboard)}
          >
            Dashboard
          </button>
          <span>/</span>
          <span>New Quote</span>
        </div>
        <h1 className="font-heading text-xl font-bold">Configure your product</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Fill the same bag details the plant uses on the BOM form. The material list is calculated from this specification.
        </p>
      </div>

      <StepIndicator
        current={step}
        onStepClick={(next) => {
          if (next === 5) navigate(paths.review)
          else setStep(next)
        }}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
            {step === 1 && (
              <div>
                <h2 className="font-heading mb-5 text-base font-bold">What product do you need?</h2>
                <div className="space-y-5">
                  <div>
                    <FieldLabel>Product type</FieldLabel>
                    <OptionChips
                      value={spec.productType}
                      onChange={(value) => update("productType", value)}
                      options={["FIBC Bulk Bag", "PP Woven Bag", "Liner Bag", "Other"]}
                    />
                  </div>
                  <div>
                    <FieldLabel>FIBC type</FieldLabel>
                    <OptionChips
                      value={spec.productCategory}
                      onChange={(value) => update("productCategory", value)}
                      options={[...BAG_TYPES]}
                    />
                  </div>
                  {spec.productCategory === "Type C" && (
                    <div className="flex items-start gap-3 rounded-lg border border-[var(--navy-border)] bg-[var(--navy-bg)] p-3.5 text-xs text-[var(--navy-muted)]">
                      <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--navy)]" />
                      <span>
                        <strong className="text-[var(--navy)]">Type C (Anti-Static)</strong> is
                        required for flammable or combustible products.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-heading mb-5 text-base font-bold">Construction</h2>
                <div className="space-y-5">
                  <div>
                    <FieldLabel>Construction type</FieldLabel>
                    <FormSelect
                      value={spec.constructionType}
                      onChange={(value) => patch(constructionDefaults(value, spec))}
                      options={[...CONSTRUCTIONS]}
                    />
                    <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
                      Circular, U-Panel, 4-Panel, and Buffle have full material formulas. Other constructions are stored; kg may be incomplete.
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Body style</FieldLabel>
                    <FormSelect
                      value={spec.bodyStyle}
                      onChange={(value) => update("bodyStyle", value)}
                      options={styleOptions}
                    />
                  </div>
                  <div>
                    <FieldLabel>Fabric grade</FieldLabel>
                    <OptionChips
                      value={spec.bodyGrade}
                      onChange={(value) => update("bodyGrade", value)}
                      options={[...BODY_GRADES]}
                    />
                  </div>
                  <div>
                    <FieldLabel>Size reference</FieldLabel>
                    <OptionChips
                      value={spec.sizeType}
                      onChange={(value) => update("sizeType", value)}
                      options={[...SIZE_TYPES]}
                    />
                    <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
                      Inner is the filled size. Outer is the cut size including seams.
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Top</FieldLabel>
                    <FormSelect
                      value={spec.topType}
                      onChange={(value) => patch(topTypeDefaults(value, spec))}
                      options={[...TOP_TYPES]}
                    />
                  </div>
                  <div>
                    <FieldLabel>Bottom</FieldLabel>
                    <FormSelect
                      value={spec.bottomType}
                      onChange={(value) => update("bottomType", value)}
                      options={[...BOTTOM_TYPES]}
                    />
                  </div>
                  <CheckRow
                    checked={spec.doubleFoldTop}
                    onChange={(checked) => update("doubleFoldTop", checked)}
                  >
                    Double-fold top
                  </CheckRow>
                  <CheckRow
                    checked={spec.doubleFoldBottom}
                    onChange={(checked) => update("doubleFoldBottom", checked)}
                  >
                    Double-fold bottom
                  </CheckRow>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-heading mb-5 text-base font-bold">Technical specifications</h2>
                <div className="space-y-5">
                  <div>
                    <FieldLabel>Dimensions (cm)</FieldLabel>
                    <div className="grid grid-cols-3 gap-3">
                      {(
                        [
                          ["length", "Length"],
                          ["width", "Width"],
                          ["height", "Height"],
                        ] as const
                      ).map(([key, label]) => (
                        <div key={key}>
                          <div className="mb-1 text-[10px] text-[var(--text-muted)]">{label}</div>
                          <Input
                            value={spec[key]}
                            onChange={(event) => update(key, event.target.value)}
                            placeholder="cm"
                            className={fieldClassName}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Safe working load (kg)</FieldLabel>
                      <FormSelect
                        value={spec.swl}
                        onChange={(value) =>
                          patch({ swl: value, ...constructionDefaults(spec.constructionType, { ...spec, swl: value }) })
                        }
                        options={["500", "750", "1000", "1250", "1500", "2000"]}
                      />
                    </div>
                    <div>
                      <FieldLabel>Safety factor</FieldLabel>
                      <FormSelect
                        value={spec.sfRatio}
                        onChange={(value) =>
                          patch({
                            sfRatio: value,
                            ...constructionDefaults(spec.constructionType, { ...spec, sfRatio: value }),
                          })
                        }
                        options={[...SF_RATIOS]}
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Fabric colour</FieldLabel>
                    <FormSelect
                      value={spec.fabricColour}
                      onChange={(value) => update("fabricColour", value)}
                      options={[...COLOURS]}
                    />
                  </div>
                  <div>
                    <FieldLabel>Body fabric</FieldLabel>
                    <GsmLamiFields
                      gsm={spec.bodyGsm}
                      lami={spec.bodyLami}
                      onGsm={(value) => setFabric(value, spec.bodyLami)}
                      onLami={(value) => setFabric(spec.bodyGsm, value)}
                      gsmOptions={[...GSM_OPTIONS]}
                      lamiOptions={[...LAMI_OPTIONS]}
                    />
                  </div>
                  <CheckRow
                    checked={spec.sameFabricForPanels}
                    onChange={(checked) => {
                      if (checked) patch({ sameFabricForPanels: true, ...sameFabricPatch(spec, spec.bodyGsm, spec.bodyLami) })
                      else update("sameFabricForPanels", false)
                    }}
                  >
                    Use the same fabric for top, bottom, sides, and spouts
                  </CheckRow>
                  {!spec.sameFabricForPanels && (
                    <div className="space-y-4 rounded-lg border border-[var(--border)] p-4">
                      <div>
                        <FieldLabel>Top fabric</FieldLabel>
                        <GsmLamiFields
                          gsm={spec.topGsm || spec.bodyGsm}
                          lami={spec.topLami || spec.bodyLami}
                          onGsm={(value) => update("topGsm", value)}
                          onLami={(value) => update("topLami", value)}
                          gsmOptions={[...GSM_OPTIONS]}
                          lamiOptions={[...LAMI_OPTIONS]}
                        />
                      </div>
                      <div>
                        <FieldLabel>Bottom fabric</FieldLabel>
                        <GsmLamiFields
                          gsm={spec.bottomGsm || spec.bodyGsm}
                          lami={spec.bottomLami || spec.bodyLami}
                          onGsm={(value) => update("bottomGsm", value)}
                          onLami={(value) => update("bottomLami", value)}
                          gsmOptions={[...GSM_OPTIONS]}
                          lamiOptions={[...LAMI_OPTIONS]}
                        />
                      </div>
                      <div>
                        <FieldLabel>Side / U-panel fabric</FieldLabel>
                        <GsmLamiFields
                          gsm={spec.sideGsm || spec.bodyGsm}
                          lami={spec.sideLami || spec.bodyLami}
                          onGsm={(value) => update("sideGsm", value)}
                          onLami={(value) => update("sideLami", value)}
                          gsmOptions={[...GSM_OPTIONS]}
                          lamiOptions={[...LAMI_OPTIONS]}
                        />
                      </div>
                    </div>
                  )}
                  <CheckRow
                    checked={spec.doubleFoldBody}
                    onChange={(checked) => update("doubleFoldBody", checked)}
                  >
                    Double-fold body seams
                  </CheckRow>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel optional>Sewing thread</FieldLabel>
                      <FormSelect
                        value={spec.threadType}
                        onChange={(value) => update("threadType", value)}
                        options={[...THREAD_TYPES]}
                      />
                    </div>
                    <div>
                      <FieldLabel optional>Thread colour</FieldLabel>
                      <FormSelect
                        value={spec.threadColour}
                        onChange={(value) => update("threadColour", value)}
                        options={[...COLOURS]}
                      />
                    </div>
                    <div>
                      <FieldLabel optional>Needle type</FieldLabel>
                      <FormSelect
                        value={spec.threadNeedle}
                        onChange={(value) => update("threadNeedle", value)}
                        options={[...THREAD_NEEDLES]}
                      />
                    </div>
                    <div>
                      <FieldLabel optional>Denier</FieldLabel>
                      <Input
                        value={spec.threadDenier}
                        onChange={(event) => update("threadDenier", event.target.value)}
                        className={fieldClassName}
                      />
                    </div>
                    <div>
                      <FieldLabel optional>Baffle seam</FieldLabel>
                      <FormSelect
                        value={spec.threadBuffleSeam}
                        onChange={(value) => update("threadBuffleSeam", value)}
                        options={[...THREAD_BUFFLE_SEAMS]}
                        placeholder="Select"
                      />
                    </div>
                  </div>
                  <CheckRow checked={spec.hiracle} onChange={(checked) => update("hiracle", checked)}>
                    Hiracle stitch
                  </CheckRow>
                  {spec.hiracle && (
                    <div className="space-y-2">
                      <CheckRow checked={spec.hiracleTop} onChange={(checked) => update("hiracleTop", checked)}>
                        Hiracle on top
                      </CheckRow>
                      <CheckRow checked={spec.hiracleBottom} onChange={(checked) => update("hiracleBottom", checked)}>
                        Hiracle on bottom
                      </CheckRow>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="font-heading mb-5 text-base font-bold">Components & accessories</h2>
                <div className="space-y-5">
                  {duffleTop && (
                    <div>
                      <FieldLabel>Duffle / skirt height (cm)</FieldLabel>
                      <Input
                        value={spec.duffleHeight}
                        onChange={(event) => update("duffleHeight", event.target.value)}
                        className={fieldClassName}
                      />
                    </div>
                  )}
                  {conicalTop && (
                    <div>
                      <FieldLabel>Conical top height (cm)</FieldLabel>
                      <Input
                        value={spec.conicalTop}
                        onChange={(event) => update("conicalTop", event.target.value)}
                        className={fieldClassName}
                      />
                    </div>
                  )}
                  {(fillingSpout || conicalTop) && (
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
                      {!spec.sameFabricForPanels && (
                        <GsmLamiFields
                          gsm={spec.topSpoutGsm || spec.bodyGsm}
                          lami={spec.topSpoutLami || spec.bodyLami}
                          onGsm={(value) => update("topSpoutGsm", value)}
                          onLami={(value) => update("topSpoutLami", value)}
                          gsmOptions={[...GSM_OPTIONS]}
                          lamiOptions={[...LAMI_OPTIONS]}
                        />
                      )}
                      <CheckRow
                        checked={spec.topSpoutEdgeHemming}
                        onChange={(checked) => update("topSpoutEdgeHemming", checked)}
                      >
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
                          <Input
                            value={spec.topSpoutTieSize}
                            onChange={(event) => update("topSpoutTieSize", event.target.value)}
                            className={fieldClassName}
                          />
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] text-[var(--text-muted)]">Tie count</div>
                          <Input
                            value={spec.topSpoutTieCount}
                            onChange={(event) => update("topSpoutTieCount", event.target.value)}
                            className={fieldClassName}
                          />
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
                      {irisTop && (
                        <div>
                          <FieldLabel optional>Iris tie count</FieldLabel>
                          <Input
                            value={spec.topIrisTieCount}
                            onChange={(event) => update("topIrisTieCount", event.target.value)}
                            className={fieldClassName}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {discharge && (
                    <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
                      <FieldLabel>Discharge spout</FieldLabel>
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
                      {!spec.sameFabricForPanels && (
                        <GsmLamiFields
                          gsm={spec.bottomSpoutGsm || spec.bodyGsm}
                          lami={spec.bottomSpoutLami || spec.bodyLami}
                          onGsm={(value) => update("bottomSpoutGsm", value)}
                          onLami={(value) => update("bottomSpoutLami", value)}
                          gsmOptions={[...GSM_OPTIONS]}
                          lamiOptions={[...LAMI_OPTIONS]}
                        />
                      )}
                      <CheckRow
                        checked={spec.bottomSpoutEdgeHemming}
                        onChange={(checked) => update("bottomSpoutEdgeHemming", checked)}
                      >
                        Edge hemming
                      </CheckRow>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <div className="mb-1 text-[10px] text-[var(--text-muted)]">Tie GSM</div>
                          <FormSelect
                            value={spec.bottomSpoutTieGsm || "0"}
                            onChange={(value) => update("bottomSpoutTieGsm", value)}
                            options={[...TIE_GSM_OPTIONS]}
                          />
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] text-[var(--text-muted)]">Tie size</div>
                          <Input
                            value={spec.bottomSpoutTieSize}
                            onChange={(event) => update("bottomSpoutTieSize", event.target.value)}
                            className={fieldClassName}
                          />
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] text-[var(--text-muted)]">Tie count</div>
                          <Input
                            value={spec.bottomSpoutTieCount}
                            onChange={(event) => update("bottomSpoutTieCount", event.target.value)}
                            className={fieldClassName}
                          />
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] text-[var(--text-muted)]">Tie remarks</div>
                          <Input
                            value={spec.bottomSpoutTieRemarks}
                            onChange={(event) => update("bottomSpoutTieRemarks", event.target.value)}
                            className={fieldClassName}
                          />
                        </div>
                      </div>
                      {irisBottom && (
                        <div>
                          <FieldLabel optional>Iris tie count</FieldLabel>
                          <Input
                            value={spec.bottomIrisTieCount}
                            onChange={(event) => update("bottomIrisTieCount", event.target.value)}
                            className={fieldClassName}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {conicalBottom && (
                    <div>
                      <FieldLabel>Conical base height (cm)</FieldLabel>
                      <Input
                        value={spec.bottomConicalHeight}
                        onChange={(event) => update("bottomConicalHeight", event.target.value)}
                        className={fieldClassName}
                      />
                    </div>
                  )}
                  {tunnel && (
                    <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
                      <FieldLabel>Tunnel design</FieldLabel>
                      <FormSelect
                        value={spec.tunnelDesign || "Flexcon"}
                        onChange={(value) => update("tunnelDesign", value)}
                        options={[...TUNNEL_DESIGNS]}
                      />
                      <GsmLamiFields
                        gsm={spec.tunnelGsm || spec.bodyGsm}
                        lami={spec.tunnelLami || spec.bodyLami}
                        onGsm={(value) => update("tunnelGsm", value)}
                        onLami={(value) => update("tunnelLami", value)}
                        gsmOptions={[...GSM_OPTIONS]}
                        lamiOptions={[...LAMI_OPTIONS]}
                      />
                    </div>
                  )}
                  <div>
                    <FieldLabel>Lifting loops</FieldLabel>
                    <OptionChips
                      value={spec.loopEnabled ? "Loops" : "No loops"}
                      onChange={(value) => {
                        update("loopEnabled", value === "Loops")
                      }}
                      options={["Loops", "No loops"]}
                    />
                  </div>
                  {spec.loopEnabled && (
                    <>
                      <div>
                        <FieldLabel>Loop construction</FieldLabel>
                        <FormSelect
                          value={spec.loopConstruction}
                          onChange={(value) => update("loopConstruction", value)}
                          options={[...LOOP_CONSTS]}
                        />
                      </div>
                      {picker?.needsPicker && (
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
                      )}
                      <div>
                        <FieldLabel>Loop material</FieldLabel>
                        <FormSelect
                          value={spec.loopType}
                          onChange={(value) => update("loopType", value)}
                          options={[...LOOP_MATERIALS]}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <div className="mb-1 text-[10px] text-[var(--text-muted)]">Loop GSM</div>
                          <Input
                            value={spec.loopGsm}
                            onChange={(event) => update("loopGsm", event.target.value)}
                            className={fieldClassName}
                          />
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] text-[var(--text-muted)]">Length cm</div>
                          <Input
                            value={spec.loopLength}
                            onChange={(event) => update("loopLength", event.target.value)}
                            className={fieldClassName}
                          />
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] text-[var(--text-muted)]">Width cm</div>
                          <Input
                            value={spec.loopWidth}
                            onChange={(event) => update("loopWidth", event.target.value)}
                            className={fieldClassName}
                          />
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] text-[var(--text-muted)]">Count</div>
                          <Input
                            value={spec.loopCount}
                            onChange={(event) => update("loopCount", event.target.value)}
                            className={fieldClassName}
                          />
                        </div>
                      </div>
                      {spec.constructionType !== "Circular" && (
                        <CheckRow
                          checked={spec.loopTillBottom}
                          onChange={(checked) => update("loopTillBottom", checked)}
                        >
                          Loops to the bottom of the bag
                        </CheckRow>
                      )}
                      <CheckRow
                        checked={spec.dropLoop}
                        onChange={(checked) => update("dropLoop", checked)}
                      >
                        Drop loop
                      </CheckRow>
                      {spec.dropLoop && (
                        <div>
                          <FieldLabel>Drop loop length (cm)</FieldLabel>
                          <Input
                            value={spec.dropLoopLength}
                            onChange={(event) => update("dropLoopLength", event.target.value)}
                            className={fieldClassName}
                          />
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <FieldLabel optional>Inner liner</FieldLabel>
                    <FormSelect
                      value={spec.linerEnabled ? spec.linerType : "No liner"}
                      onChange={(value) => {
                        if (value === "No liner") update("linerEnabled", false)
                        else {
                          update("linerEnabled", true)
                          update("linerType", value)
                        }
                      }}
                      options={["No liner", ...LINER_TYPES.filter((item) => item !== "None")]}
                    />
                  </div>
                  {spec.linerEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>Liner material</FieldLabel>
                        <FormSelect
                          value={spec.linerMaterial}
                          onChange={(value) => update("linerMaterial", value)}
                          options={[...LINER_MATERIALS.filter((item) => item !== "None")]}
                        />
                      </div>
                      <div>
                        <FieldLabel>Thickness (micron)</FieldLabel>
                        <Input
                          value={spec.linerMicron}
                          onChange={(event) => update("linerMicron", event.target.value)}
                          className={fieldClassName}
                        />
                      </div>
                    </div>
                  )}
                  <CheckRow checked={spec.docPouch} onChange={(checked) => update("docPouch", checked)}>
                    Document pouch
                  </CheckRow>
                  {spec.docPouch && (
                    <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <FieldLabel>Pouch type</FieldLabel>
                          <FormSelect
                            value={spec.docType}
                            onChange={(value) => update("docType", value)}
                            options={[...DOC_TYPES]}
                          />
                        </div>
                        <div>
                          <FieldLabel>Opening</FieldLabel>
                          <FormSelect
                            value={spec.docOpening}
                            onChange={(value) => update("docOpening", value)}
                            options={[...DOC_OPENINGS]}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Input
                          value={spec.docLength}
                          onChange={(event) => update("docLength", event.target.value)}
                          placeholder="Length"
                          className={fieldClassName}
                        />
                        <Input
                          value={spec.docWidth}
                          onChange={(event) => update("docWidth", event.target.value)}
                          placeholder="Width"
                          className={fieldClassName}
                        />
                        <Input
                          value={spec.docMicron}
                          onChange={(event) => update("docMicron", event.target.value)}
                          placeholder="Micron"
                          className={fieldClassName}
                        />
                        <Input
                          value={spec.docCount}
                          onChange={(event) => update("docCount", event.target.value)}
                          placeholder="Count"
                          className={fieldClassName}
                        />
                      </div>
                      <FormSelect
                        value={spec.docUnit}
                        onChange={(value) => update("docUnit", value)}
                        options={[...DOC_UNITS]}
                      />
                    </div>
                  )}
                  <CheckRow checked={spec.label} onChange={(checked) => update("label", checked)}>
                    Product label
                  </CheckRow>
                  {spec.label && (
                    <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          value={spec.labelLength}
                          onChange={(event) => update("labelLength", event.target.value)}
                          placeholder="Length"
                          className={fieldClassName}
                        />
                        <Input
                          value={spec.labelWidth}
                          onChange={(event) => update("labelWidth", event.target.value)}
                          placeholder="Width"
                          className={fieldClassName}
                        />
                        <Input
                          value={spec.labelMicron}
                          onChange={(event) => update("labelMicron", event.target.value)}
                          placeholder="Micron"
                          className={fieldClassName}
                        />
                      </div>
                      <CheckRow checked={spec.labelTyvac} onChange={(checked) => update("labelTyvac", checked)}>
                        Tyvek / Tyvac label
                      </CheckRow>
                    </div>
                  )}
                  <CheckRow checked={spec.fillerCord} onChange={(checked) => update("fillerCord", checked)}>
                    Filler cord
                  </CheckRow>
                  {spec.fillerCord && (
                    <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
                      <div>
                        <FieldLabel>Filler cord GPM</FieldLabel>
                        <Input
                          value={spec.fillerCordGpm}
                          onChange={(event) => update("fillerCordGpm", event.target.value)}
                          className={fieldClassName}
                        />
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
                  )}
                  <ErpExtras specification={spec} update={update} />
                  <div>
                    <FieldLabel optional>Printing</FieldLabel>
                    <FormSelect
                      value={spec.printing}
                      onChange={(value) => update("printing", value)}
                      options={[...PRINT_TYPES]}
                    />
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
                      <Input
                        value={spec.partyName}
                        onChange={(event) => update("partyName", event.target.value)}
                        className={fieldClassName}
                      />
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
                    <div>
                      <FieldLabel optional>Transport</FieldLabel>
                      <FormSelect
                        value={spec.transport}
                        onChange={(value) => update("transport", value)}
                        options={[...TRANSPORT]}
                        placeholder="Select transport"
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel optional>Additional requirements</FieldLabel>
                    <Textarea
                      value={spec.notes}
                      onChange={(event) => update("notes", event.target.value)}
                      rows={3}
                      className="min-h-[88px] resize-none rounded-md border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-5">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="font-heading h-auto gap-1.5 rounded-md px-4 py-2.5 text-sm"
                >
                  <ArrowLeft className="size-3.5" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                type="button"
                onClick={nextStep}
                className="font-heading h-auto gap-2 rounded-md bg-[var(--navy)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--navy-hover)]"
              >
                {step === 4 ? "Review" : "Continue"}
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-6">
            <QuoteSummary specification={spec} onProceed={goReview} onApplySample={applyPreviewSample} />
          </div>
        </div>
      </div>

      <MobilePriceBar cta={step === 4 ? "Review" : "Continue"} onContinue={nextStep} />
    </div>
  )
}
