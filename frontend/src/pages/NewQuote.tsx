import { ArrowLeft, ArrowRight, Info } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb"
import { BomErpFields } from "@/components/quote/BomErpFields"
import { fieldClassName } from "@/components/login/fieldStyles"
import {
  CheckRow,
  FieldLabel,
  FormSelect,
  GsmLamiFields,
} from "@/components/quote/FormControls"
import { ChoiceCard, ColourSwatches, SpecLine } from "@/components/quote/QuoteChoice"
import { MobilePriceBar, QuoteSummary } from "@/components/quote/QuoteSummary"
import { StepIndicator } from "@/components/quote/StepIndicator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useQuoteDraft } from "@/hooks/useQuoteDraft"
import { usePortalPaths } from "@/lib/portal"
import {
  BAG_TYPES,
  BODY_GRADES,
  COLOURS,
  CONSTRUCTIONS,
  GSM_OPTIONS,
  LAMI_OPTIONS,
  SF_RATIOS,
  SIZE_TYPES,
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

const PRODUCT_TYPES = ["FIBC Bulk Bag", "PP Woven Bag", "Liner Bag", "Other"] as const
const FEATURED_CONSTRUCTIONS = ["Circular", "UPanel", "4 Panel", "Buffle"] as const

const PRODUCT_HINT: Record<string, string> = {
  "FIBC Bulk Bag": "Flexible intermediate bulk container",
  "PP Woven Bag": "Woven polypropylene sack",
  "Liner Bag": "Inner liner only",
  Other: "Custom product request",
}

const BAG_HINT: Record<string, string> = {
  "Type A": "Standard insulating fabric",
  "Type B": "Low-energy dissipative",
  "Type C": "Conductive — must be grounded",
  "Type D": "Static-dissipative fabric",
}

const CONSTRUCTION_HINT: Record<string, string> = {
  Circular: "Seamless tubular body",
  UPanel: "U-shaped body and two side panels",
  "4 Panel": "Four sewn body panels",
  Buffle: "Internal baffles for a cube fill",
}

export default function NewQuote() {
  const navigate = useNavigate()
  const paths = usePortalPaths()
  const { specification: spec, step, setStep, update, patch } = useQuoteDraft()
  const [picker, setPicker] = useState<ComplicationPicker | null>(null)
  const styleOptions = bodyStylesFor(spec.constructionType)

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

  return (
    <div className="qc-page max-w-[1180px] pb-28 lg:pb-8">
      <div className="mb-6">
        <PageBreadcrumb
          items={[
            { label: "Dashboard", onClick: () => navigate(paths.dashboard) },
            { label: "New Quote" },
          ]}
        />
        <h1 className="font-heading text-2xl font-bold tracking-tight">Configure your product</h1>
        <SpecLine spec={spec} />
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
          <div
            className={
              step === 4
                ? ""
                : "rounded-3xl bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8"
            }
          >
            {step === 1 && (
              <div key="step-1" className="qc-rise">
                <h2 className="font-heading mb-1 text-lg font-bold tracking-tight">What product do you need?</h2>
                <p className="mb-6 text-sm text-[var(--text-secondary)]">Choose the bag family and electrostatic type.</p>
                <div className="space-y-7">
                  <div>
                    <FieldLabel>Product type</FieldLabel>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {PRODUCT_TYPES.map((type) => (
                        <ChoiceCard
                          key={type}
                          title={type}
                          hint={PRODUCT_HINT[type]}
                          selected={spec.productType === type}
                          onSelect={() => update("productType", type)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>FIBC type</FieldLabel>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {BAG_TYPES.map((type) => (
                        <ChoiceCard
                          key={type}
                          title={type}
                          hint={BAG_HINT[type]}
                          selected={spec.productCategory === type}
                          onSelect={() => update("productCategory", type)}
                        />
                      ))}
                    </div>
                  </div>
                  {spec.productCategory === "Type C" && (
                    <div className="flex items-start gap-3 rounded-2xl border border-[var(--navy-border)] bg-[var(--navy-bg)] p-4 text-xs text-[var(--navy-muted)]">
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
              <div key="step-2" className="qc-rise">
                <h2 className="font-heading mb-1 text-lg font-bold tracking-tight">Construction</h2>
                <p className="mb-6 text-sm text-[var(--text-secondary)]">
                  Circular, U-Panel, 4-Panel, and Buffle have full material formulas. Other constructions are stored; kg may be incomplete.
                </p>
                <div className="space-y-7">
                  <div>
                    <FieldLabel>Construction type</FieldLabel>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {FEATURED_CONSTRUCTIONS.map((type) => (
                        <ChoiceCard
                          key={type}
                          title={type}
                          hint={CONSTRUCTION_HINT[type]}
                          selected={spec.constructionType === type}
                          onSelect={() => patch(constructionDefaults(type, spec))}
                        />
                      ))}
                    </div>
                    <div className="mt-4">
                      <FieldLabel>Other construction</FieldLabel>
                      <FormSelect
                        value={FEATURED_CONSTRUCTIONS.includes(spec.constructionType as (typeof FEATURED_CONSTRUCTIONS)[number]) ? "" : spec.constructionType}
                        onChange={(value) => {
                          if (value) patch(constructionDefaults(value, spec))
                        }}
                        options={CONSTRUCTIONS.filter((item) => !FEATURED_CONSTRUCTIONS.includes(item as (typeof FEATURED_CONSTRUCTIONS)[number]))}
                        placeholder="More constructions…"
                      />
                    </div>
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
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {BODY_GRADES.map((grade) => (
                        <ChoiceCard
                          key={grade}
                          title={grade}
                          selected={spec.bodyGrade === grade}
                          onSelect={() => update("bodyGrade", grade)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Size reference</FieldLabel>
                    <div className="grid grid-cols-2 gap-2.5">
                      {SIZE_TYPES.map((size) => (
                        <ChoiceCard
                          key={size}
                          title={size === "OUTER" ? "Outer" : size === "INNER" ? "Inner" : size}
                          hint={size === "INNER" ? "Filled size" : size === "OUTER" ? "Cut size including seams" : undefined}
                          selected={spec.sizeType === size}
                          onSelect={() => update("sizeType", size)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div key="step-3" className="qc-rise">
                <h2 className="font-heading mb-1 text-lg font-bold tracking-tight">Technical specifications</h2>
                <p className="mb-6 text-sm text-[var(--text-secondary)]">Size, load rating, colour, and fabric.</p>
                <div className="space-y-7">
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
                    <ColourSwatches
                      value={spec.fabricColour}
                      options={COLOURS}
                      onChange={(value) => update("fabricColour", value)}
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
                    <div className="space-y-4 rounded-2xl border border-[var(--border)] p-4">
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
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="mb-5">
                  <h2 className="font-heading text-2xl font-bold tracking-tight">Bill of materials</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Pick a category. The card on the right changes — nothing scrolls away.
                  </p>
                </div>
                <BomErpFields spec={spec} update={update} patch={patch} picker={picker} />
              </div>
            )}

            <div
              className={
                step === 4
                  ? "mt-6 flex items-center justify-between rounded-3xl bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-md)]"
                  : "mt-8 flex items-center justify-between border-t border-[var(--border)] pt-5"
              }
            >
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="font-heading h-auto gap-1.5 rounded-2xl px-4 py-2.5 text-sm shadow-sm"
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
                className="font-heading h-auto gap-2 rounded-2xl bg-[var(--navy)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-navy)] transition-transform hover:-translate-y-px hover:bg-[var(--navy-hover)]"
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

