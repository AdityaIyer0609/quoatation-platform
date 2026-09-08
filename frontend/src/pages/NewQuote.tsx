import { ArrowLeft, ArrowRight, Info } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { fieldClassName } from "@/components/login/fieldStyles"
import {
  FieldLabel,
  FormSelect,
  OptionChips,
} from "@/components/quote/FormControls"
import { MobilePriceBar, QuoteSummary } from "@/components/quote/QuoteSummary"
import { StepIndicator } from "@/components/quote/StepIndicator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useQuoteDraft } from "@/hooks/useQuoteDraft"
import {
  BAG_TYPES,
  BODY_GRADES,
  BODY_STYLES,
  BOTTOM_SPOUT_TYPES,
  BOTTOM_TYPES,
  COLOURS,
  CONSTRUCTIONS,
  GSM_OPTIONS,
  LAMI_OPTIONS,
  LINER_MATERIALS,
  LINER_TYPES,
  LOOP_CONSTS,
  LOOP_MATERIALS,
  PRINT_TYPES,
  SF_RATIOS,
  SIZE_TYPES,
  TOP_SPOUT_TYPES,
  TOP_TYPES,
} from "@/lib/erpCatalog"
import {
  bottomGsmFromBody,
  constructionDefaults,
  topTypeDefaults,
} from "@/lib/erpDefaults"
import { fetchComplicationPicker } from "@/services/pricing"
import type { ComplicationPicker } from "@/types/quote"

export default function NewQuote() {
  const navigate = useNavigate()
  const { specification: spec, step, setStep, update, patch } = useQuoteDraft()
  const [picker, setPicker] = useState<ComplicationPicker | null>(null)
  const fillingSpout = spec.topType === "Top Spout"
  const duffleTop =
    spec.topType === "Duffle or Skrit" ||
    spec.topType === "Top + Skrit" ||
    spec.topType === "Leno"
  const discharge = spec.bottomType === "Bottom Spout"
  const tunnel = spec.constructionType === "UPanel" && spec.bodyStyle === "Tunnel"
  const styleOptions = BODY_STYLES[spec.constructionType as keyof typeof BODY_STYLES] ?? BODY_STYLES.Circular

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
      navigate("/quotes/new/review")
    }
  }

  function goReview() {
    setStep(5)
    navigate("/quotes/new/review")
  }

  return (
    <div className="mx-auto max-w-[1100px] p-6 pb-28 md:p-8 lg:pb-8">
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <button
            type="button"
            className="text-[var(--text-secondary)] hover:underline"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
          <span>/</span>
          <span>New Quote</span>
        </div>
        <h1 className="font-heading text-xl font-bold">Configure your product</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Tell us the bag you need. We&apos;ll calculate the material list from your specification.
        </p>
      </div>

      <StepIndicator
        current={step}
        onStepClick={(next) => {
          if (next === 5) navigate("/quotes/new/review")
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
                    <OptionChips
                      value={spec.constructionType}
                      onChange={(value) => patch(constructionDefaults(value, spec))}
                      options={[...CONSTRUCTIONS]}
                    />
                  </div>
                  <div>
                    <FieldLabel>Body style</FieldLabel>
                    <FormSelect
                      value={spec.bodyStyle}
                      onChange={(value) => update("bodyStyle", value)}
                      options={[...styleOptions]}
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
                    <OptionChips
                      value={spec.topType}
                      onChange={(value) => patch(topTypeDefaults(value, spec))}
                      options={[...TOP_TYPES]}
                    />
                  </div>
                  <div>
                    <FieldLabel>Bottom</FieldLabel>
                    <OptionChips
                      value={spec.bottomType}
                      onChange={(value) => update("bottomType", value)}
                      options={[...BOTTOM_TYPES]}
                    />
                  </div>
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Fabric colour</FieldLabel>
                      <FormSelect
                        value={spec.fabricColour}
                        onChange={(value) => update("fabricColour", value)}
                        options={[...COLOURS]}
                      />
                    </div>
                    <div>
                      <FieldLabel>Body GSM</FieldLabel>
                      <FormSelect
                        value={spec.bodyGsm}
                        onChange={(value) =>
                          patch({
                            bodyGsm: value,
                            bottomGsm: spec.sameFabricForPanels
                              ? bottomGsmFromBody(spec.constructionType, value)
                              : spec.bottomGsm,
                          })
                        }
                        options={[...GSM_OPTIONS]}
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel optional>Lamination (g/m²)</FieldLabel>
                    <FormSelect
                      value={spec.bodyLami}
                      onChange={(value) => update("bodyLami", value)}
                      options={[...LAMI_OPTIONS]}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={spec.sameFabricForPanels}
                      onChange={(event) => update("sameFabricForPanels", event.target.checked)}
                    />
                    Use the same fabric for top, bottom, sides, and spouts
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={spec.doubleFoldBody}
                      onChange={(event) => update("doubleFoldBody", event.target.checked)}
                    />
                    Double-fold body seams
                  </label>
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
                  {fillingSpout && (
                    <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
                      <FieldLabel>Filling spout</FieldLabel>
                      <FormSelect
                        value={spec.topSpoutType}
                        onChange={(value) => update("topSpoutType", value)}
                        options={[...TOP_SPOUT_TYPES]}
                      />
                      <div className="grid grid-cols-2 gap-3">
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
                      </div>
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
                      <div className="grid grid-cols-2 gap-3">
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
                      </div>
                    </div>
                  )}
                  {tunnel && (
                    <div>
                      <FieldLabel>Tunnel design</FieldLabel>
                      <FormSelect
                        value={spec.tunnelDesign || "Flexcon"}
                        onChange={(value) => update("tunnelDesign", value)}
                        options={["Flexcon", "Store", "Plastene", "Greif"]}
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
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={spec.loopTillBottom}
                          onChange={(event) => update("loopTillBottom", event.target.checked)}
                        />
                        Loops to the bottom of the bag
                      </label>
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
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={spec.docPouch}
                      onChange={(event) => update("docPouch", event.target.checked)}
                    />
                    Document pouch
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={spec.label}
                      onChange={(event) => update("label", event.target.checked)}
                    />
                    Product label
                  </label>
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
            <QuoteSummary specification={spec} onProceed={goReview} />
          </div>
        </div>
      </div>

      <MobilePriceBar cta={step === 4 ? "Review" : "Continue"} onContinue={nextStep} />
    </div>
  )
}
