import { Search } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"

import { fieldClassName } from "@/components/login/fieldStyles"
import { FieldLabel, FormSelect, GsmLamiFields } from "@/components/quote/FormControls"
import { Input } from "@/components/ui/input"
import {
  ANCILLARY_LOOP_TYPES,
  BUFFLE_KINDS,
  COLOURS,
  CUT_0_20,
  DOC_OPENINGS,
  DOC_TYPES,
  DOC_UNITS,
  GRM_0_20,
  GSM_OPTIONS,
  HOOK_CUTS,
  LAMI_OPTIONS,
  LOOP_PROTECTOR_TYPES,
  ROPE_SIZE_10_25,
  ROPE_SIZES,
  ROPE_TYPES,
  STEVEDORE_PORTIONS,
} from "@/lib/erpCatalog"
import { cn } from "@/lib/utils"
import type { QuoteSpecification } from "@/types/quote"

type DraftApi = {
  specification: QuoteSpecification
  update: <K extends keyof QuoteSpecification>(key: K, value: QuoteSpecification[K]) => void
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.04em] text-[var(--text-secondary)] uppercase">
        {label}
      </div>
      {children}
    </div>
  )
}

function ExtraRow({
  type,
  onType,
  typeOptions,
  grm,
  onGrm,
  grmLabel = "Grm",
  size,
  onSize,
  sizeOptions,
  cut,
  onCut,
  cutOptions,
  color,
  onColor,
  count,
  onCount,
  countLabel = "Count",
  remarks,
  onRemarks,
}: {
  type?: string
  onType?: (value: string) => void
  typeOptions?: readonly string[]
  grm: string
  onGrm: (value: string) => void
  grmLabel?: string
  size: string
  onSize: (value: string) => void
  sizeOptions: readonly string[]
  cut?: string
  onCut?: (value: string) => void
  cutOptions?: readonly string[]
  color?: string
  onColor?: (value: string) => void
  count: string
  onCount: (value: string) => void
  countLabel?: string
  remarks?: string
  onRemarks?: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
      {onType && typeOptions ? (
        <Labeled label="Type">
          <FormSelect value={type || typeOptions[0]} onChange={onType} options={[...typeOptions]} />
        </Labeled>
      ) : null}
      <Labeled label={grmLabel}>
        <FormSelect value={grm || "0"} onChange={onGrm} options={[...GRM_0_20]} />
      </Labeled>
      <Labeled label="Size">
        <FormSelect value={size || sizeOptions[0]} onChange={onSize} options={[...sizeOptions]} />
      </Labeled>
      {onCut ? (
        <Labeled label="Cut size">
          <FormSelect value={cut || ""} onChange={onCut} options={[...(cutOptions ?? CUT_0_20)]} placeholder="Select" />
        </Labeled>
      ) : null}
      {onColor ? (
        <Labeled label="Color">
          <FormSelect value={color || COLOURS[0]} onChange={onColor} options={[...COLOURS]} />
        </Labeled>
      ) : null}
      <Labeled label={countLabel}>
        <Input value={count} onChange={(event) => onCount(event.target.value)} className={fieldClassName} />
      </Labeled>
      {onRemarks ? (
        <div className="sm:col-span-2">
          <Labeled label="Remarks">
            <Input value={remarks || ""} onChange={(event) => onRemarks(event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ) : null}
    </div>
  )
}

function ExtraCard({
  id,
  title,
  on,
  onToggle,
  summary,
  locked,
  className,
  children,
}: {
  id: string
  title: string
  on: boolean
  onToggle?: (value: boolean) => void
  summary?: string
  locked?: boolean
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      id={id}
      className={cn(
        "relative scroll-mt-28 overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] duration-150",
        on
          ? "border-[var(--navy-border)] shadow-[0_10px_28px_rgba(26,60,94,0.08)]"
          : "border-[var(--border)] hover:border-[var(--navy-border)] hover:shadow-[0_6px_18px_rgba(17,17,16,0.04)]",
        className,
      )}
    >
      {on ? <div className="absolute inset-y-0 left-0 w-[3px] bg-[var(--navy)]" /> : null}
      <div className={cn("flex items-center gap-3.5 py-3.5 pr-4", on || locked ? "pl-5" : "pl-4")}>
        {!locked ? (
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => onToggle?.(!on)}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              on ? "bg-[var(--navy)]" : "bg-[var(--border-strong)]",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
                on ? "left-[22px]" : "left-0.5",
              )}
            />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-heading text-[15px] font-semibold tracking-tight text-[var(--text)]">{title}</div>
            {on ? (
              <span className="rounded-full bg-[var(--navy-bg)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--navy)] uppercase">
                On
              </span>
            ) : null}
          </div>
          {on && summary ? (
            <div className="mt-0.5 line-clamp-1 text-xs leading-5 text-[var(--text-secondary)]">{summary}</div>
          ) : !on ? (
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">Off · switch to specify</div>
          ) : null}
        </div>
      </div>
      {on && children ? (
        <div className="border-t border-[var(--navy-border)]/60 bg-[var(--navy-bg)]/35 px-5 py-4">{children}</div>
      ) : null}
    </div>
  )
}

function PositionChips({
  options,
}: {
  options: { label: string; checked: boolean; onChange: (value: boolean) => void }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={() => option.onChange(!option.checked)}
          className={cn(
            "font-heading rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            option.checked
              ? "border border-[var(--navy)] bg-[var(--navy)] text-white"
              : "border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--navy-border)] hover:text-[var(--navy)]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

type CatalogItem = {
  id: string
  title: string
  on: boolean
  search: string
  summary?: string
  locked?: boolean
  body?: ReactNode
}

export function ErpExtras({ specification: spec, update }: DraftApi) {
  const [query, setQuery] = useState("")

  const selected = useMemo(
    () =>
      [
        spec.topTie && "Top tie",
        spec.topRope && "Top rope",
        spec.bottomTie && "Bottom tie",
        spec.bottomRope && "Bottom rope",
        spec.topSpoutRope && "Filling-spout rope",
        spec.bottomSpoutRope && "Discharge-spout rope",
        spec.topFlap && "Top flap",
        spec.bottomFlap && "Bottom flap",
        spec.topHook && "Top hook",
        spec.bottomHook && "Bottom hook",
        spec.bottomLoop && "Bottom loop",
        spec.loopProtector && "Loop protector",
        spec.loopCover && "Loop cover",
        spec.felt && "Felt",
        spec.mfWeb && "MF webbing",
        spec.innerSkin && "Inner skin",
        spec.innerBox && "Inner box",
        spec.innerTop && "Inner top",
        spec.innerBottom && "Inner bottom",
        spec.fabricPatch && "Fabric patch",
        spec.topBand && "Top band",
        spec.stevedore && "Stevedore",
        spec.ancerie && "Anchor loop",
        spec.hoseSlider && "Hose slider",
        spec.bellyBand1 && "Belly band 1",
        spec.bellyBand2 && "Belly band 2",
        spec.topBottomBand && "Top–bottom band",
        spec.safetyBand && "Safety band",
        spec.steveCover && "Stevedore cover",
        spec.docPouch1 && "Doc pouch 1",
        spec.docPouch2 && "Doc pouch 2",
        spec.extraLabel && "Extra label",
        spec.extraLabel1 && "Extra label 1",
        spec.extraLabel2 && "Extra label 2",
        spec.extraLabel3 && "Extra label 3",
        spec.bottomSpout2 && "2nd discharge",
        spec.bottomSpout3 && "3rd discharge",
        spec.cableTie && "Cable tie",
        spec.topVelcro && "Top velcro",
        spec.bottomVelcro && "Bottom velcro",
      ].filter((item): item is string => Boolean(item)),
    [spec],
  )

  const rope: CatalogItem[] = [
    {
      id: "extra-top-tie",
      title: "Top tie",
      on: spec.topTie,
      search: "top tie bag",
      summary: `${spec.topTieGsm || "—"} grm · ${spec.topTieSize || "—"} · ×${spec.topTieCount}`,
      body: (
        <ExtraRow
          grm={spec.topTieGsm}
          onGrm={(value) => update("topTieGsm", value)}
          grmLabel="Tie grm"
          size={spec.topTieSize}
          onSize={(value) => update("topTieSize", value)}
          sizeOptions={ROPE_SIZE_10_25}
          cut={spec.topTieCut}
          onCut={(value) => update("topTieCut", value)}
          color={spec.topTieColor}
          onColor={(value) => update("topTieColor", value)}
          count={spec.topTieCount}
          onCount={(value) => update("topTieCount", value)}
          countLabel="No of tie"
        />
      ),
    },
    {
      id: "extra-top-rope",
      title: "Top rope",
      on: spec.topRope,
      search: "top rope braided",
      summary: `${spec.topRopeType} · ${spec.topRopeGsm || "—"} grm · ×${spec.topRopeCount}`,
      body: (
        <ExtraRow
          type={spec.topRopeType}
          onType={(value) => update("topRopeType", value)}
          typeOptions={ROPE_TYPES}
          grm={spec.topRopeGsm}
          onGrm={(value) => update("topRopeGsm", value)}
          size={spec.topRopeSize}
          onSize={(value) => update("topRopeSize", value)}
          sizeOptions={ROPE_SIZE_10_25}
          cut={spec.topRopeCut}
          onCut={(value) => update("topRopeCut", value)}
          color={spec.topRopeColor}
          onColor={(value) => update("topRopeColor", value)}
          count={spec.topRopeCount}
          onCount={(value) => update("topRopeCount", value)}
          countLabel="No (rope)"
        />
      ),
    },
    {
      id: "extra-bottom-tie",
      title: "Bottom tie",
      on: spec.bottomTie,
      search: "bottom tie bag",
      summary: `${spec.bottomTieGsm || "—"} grm · ${spec.bottomTieSize || "—"} · ×${spec.bottomTieCount}`,
      body: (
        <ExtraRow
          grm={spec.bottomTieGsm}
          onGrm={(value) => update("bottomTieGsm", value)}
          grmLabel="Tie grm"
          size={spec.bottomTieSize}
          onSize={(value) => update("bottomTieSize", value)}
          sizeOptions={ROPE_SIZE_10_25}
          cut={spec.bottomTieCut}
          onCut={(value) => update("bottomTieCut", value)}
          color={spec.bottomTieColor}
          onColor={(value) => update("bottomTieColor", value)}
          count={spec.bottomTieCount}
          onCount={(value) => update("bottomTieCount", value)}
          countLabel="No of tie"
        />
      ),
    },
    {
      id: "extra-bottom-rope",
      title: "Bottom rope",
      on: spec.bottomRope,
      search: "bottom rope braided",
      summary: `${spec.bottomRopeType} · ${spec.bottomRopeGsm || "—"} grm · ×${spec.bottomRopeCount}`,
      body: (
        <ExtraRow
          type={spec.bottomRopeType}
          onType={(value) => update("bottomRopeType", value)}
          typeOptions={ROPE_TYPES}
          grm={spec.bottomRopeGsm}
          onGrm={(value) => update("bottomRopeGsm", value)}
          size={spec.bottomRopeSize}
          onSize={(value) => update("bottomRopeSize", value)}
          sizeOptions={ROPE_SIZE_10_25}
          cut={spec.bottomRopeCut}
          onCut={(value) => update("bottomRopeCut", value)}
          color={spec.bottomRopeColor}
          onColor={(value) => update("bottomRopeColor", value)}
          count={spec.bottomRopeCount}
          onCount={(value) => update("bottomRopeCount", value)}
          countLabel="No (rope)"
        />
      ),
    },
    {
      id: "extra-fs-rope",
      title: "Filling-spout rope",
      on: spec.topSpoutRope,
      search: "filling spout rope petal",
      summary: `${spec.topSpoutRopeType} · ${spec.topSpoutRopeGsm || "—"} grm`,
      body: (
        <div className="space-y-3">
          <ExtraRow
            type={spec.topSpoutRopeType}
            onType={(value) => update("topSpoutRopeType", value)}
            typeOptions={ROPE_TYPES}
            grm={spec.topSpoutRopeGsm}
            onGrm={(value) => update("topSpoutRopeGsm", value)}
            size={spec.topSpoutRopeSize}
            onSize={(value) => update("topSpoutRopeSize", value)}
            sizeOptions={ROPE_SIZES}
            color={spec.topSpoutRopeColor}
            onColor={(value) => update("topSpoutRopeColor", value)}
            count={spec.topSpoutRopeCount}
            onCount={(value) => update("topSpoutRopeCount", value)}
            countLabel="No (rope)"
            remarks={spec.topSpoutRopeRemarks}
            onRemarks={(value) => update("topSpoutRopeRemarks", value)}
          />
          <FieldLabel optional>Petal flap</FieldLabel>
          <GsmLamiFields
            gsm={spec.topPetalFlapGsm || "70"}
            lami={spec.topPetalFlapLami || "0"}
            onGsm={(value) => update("topPetalFlapGsm", value)}
            onLami={(value) => update("topPetalFlapLami", value)}
            gsmOptions={[...GSM_OPTIONS]}
            lamiOptions={[...LAMI_OPTIONS]}
          />
        </div>
      ),
    },
    {
      id: "extra-ds-rope",
      title: "Discharge-spout rope",
      on: spec.bottomSpoutRope,
      search: "discharge spout rope petal",
      summary: `${spec.bottomSpoutRopeType} · ${spec.bottomSpoutRopeGsm || "—"} grm`,
      body: (
        <div className="space-y-3">
          <ExtraRow
            type={spec.bottomSpoutRopeType}
            onType={(value) => update("bottomSpoutRopeType", value)}
            typeOptions={ROPE_TYPES}
            grm={spec.bottomSpoutRopeGsm}
            onGrm={(value) => update("bottomSpoutRopeGsm", value)}
            size={spec.bottomSpoutRopeSize}
            onSize={(value) => update("bottomSpoutRopeSize", value)}
            sizeOptions={ROPE_SIZES}
            color={spec.bottomSpoutRopeColor}
            onColor={(value) => update("bottomSpoutRopeColor", value)}
            count={spec.bottomSpoutRopeCount}
            onCount={(value) => update("bottomSpoutRopeCount", value)}
            countLabel="No (rope)"
            remarks={spec.bottomSpoutRopeRemarks}
            onRemarks={(value) => update("bottomSpoutRopeRemarks", value)}
          />
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
      ),
    },
  ]

  const flap: CatalogItem[] = [
    {
      id: "extra-top-flap",
      title: "Top flap",
      on: spec.topFlap,
      search: "top flap d-ring",
      summary: `${spec.topFlapGsm || spec.bodyGsm} GSM · ${spec.topFlapColor}`,
      body: (
        <div className="space-y-3">
          <GsmLamiFields
            gsm={spec.topFlapGsm || spec.bodyGsm}
            lami={spec.topFlapLami || "0"}
            onGsm={(value) => update("topFlapGsm", value)}
            onLami={(value) => update("topFlapLami", value)}
            gsmOptions={[...GSM_OPTIONS]}
            lamiOptions={[...LAMI_OPTIONS]}
          />
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <Labeled label="Color">
              <FormSelect value={spec.topFlapColor} onChange={(value) => update("topFlapColor", value)} options={[...COLOURS]} />
            </Labeled>
            <Labeled label="Count">
              <Input value={spec.topFlapCount} onChange={(event) => update("topFlapCount", event.target.value)} className={fieldClassName} />
            </Labeled>
          </div>
        </div>
      ),
    },
    {
      id: "extra-bottom-flap",
      title: "Bottom flap",
      on: spec.bottomFlap,
      search: "bottom flap",
      summary: `${spec.bottomFlapGsm || spec.bodyGsm} GSM · ${spec.bottomFlapColor}`,
      body: (
        <div className="space-y-3">
          <GsmLamiFields
            gsm={spec.bottomFlapGsm || spec.bodyGsm}
            lami={spec.bottomFlapLami || "0"}
            onGsm={(value) => update("bottomFlapGsm", value)}
            onLami={(value) => update("bottomFlapLami", value)}
            gsmOptions={[...GSM_OPTIONS]}
            lamiOptions={[...LAMI_OPTIONS]}
          />
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <Labeled label="Color">
              <FormSelect value={spec.bottomFlapColor} onChange={(value) => update("bottomFlapColor", value)} options={[...COLOURS]} />
            </Labeled>
            <Labeled label="Count">
              <Input value={spec.bottomFlapCount} onChange={(event) => update("bottomFlapCount", event.target.value)} className={fieldClassName} />
            </Labeled>
          </div>
        </div>
      ),
    },
    {
      id: "extra-top-hook",
      title: "Top flap hook",
      on: spec.topHook,
      search: "top hook flap",
      summary: `${spec.topHookGsm || "—"} grm · cut ${spec.topHookCut || "—"}`,
      body: (
        <ExtraRow
          grm={spec.topHookGsm}
          onGrm={(value) => update("topHookGsm", value)}
          size={spec.topHookSize}
          onSize={(value) => update("topHookSize", value)}
          sizeOptions={ROPE_SIZES}
          cut={spec.topHookCut}
          onCut={(value) => update("topHookCut", value)}
          cutOptions={HOOK_CUTS}
          color={spec.topHookColor}
          onColor={(value) => update("topHookColor", value)}
          count={spec.topHookCount}
          onCount={(value) => update("topHookCount", value)}
        />
      ),
    },
    {
      id: "extra-bottom-hook",
      title: "Bottom flap hook",
      on: spec.bottomHook,
      search: "bottom hook flap",
      summary: `${spec.bottomHookGsm || "—"} grm · cut ${spec.bottomHookCut || "—"}`,
      body: (
        <ExtraRow
          grm={spec.bottomHookGsm}
          onGrm={(value) => update("bottomHookGsm", value)}
          size={spec.bottomHookSize}
          onSize={(value) => update("bottomHookSize", value)}
          sizeOptions={ROPE_SIZES}
          cut={spec.bottomHookCut}
          onCut={(value) => update("bottomHookCut", value)}
          cutOptions={HOOK_CUTS}
          color={spec.bottomHookColor}
          onColor={(value) => update("bottomHookColor", value)}
          count={spec.bottomHookCount}
          onCount={(value) => update("bottomHookCount", value)}
        />
      ),
    },
    {
      id: "extra-bottom-loop",
      title: "Bottom loop",
      on: spec.bottomLoop,
      search: "bottom loop",
      summary: `${spec.bottomLoopGsm || "—"} GSM · ${spec.bottomLoopLength || "—"}×${spec.bottomLoopWidth || "—"}`,
      body: (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
          <Labeled label="GSM">
            <Input value={spec.bottomLoopGsm} onChange={(event) => update("bottomLoopGsm", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Length">
            <Input value={spec.bottomLoopLength} onChange={(event) => update("bottomLoopLength", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Width">
            <Input value={spec.bottomLoopWidth} onChange={(event) => update("bottomLoopWidth", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Count">
            <Input value={spec.bottomLoopCount} onChange={(event) => update("bottomLoopCount", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-loop-protector",
      title: "Loop protector",
      on: spec.loopProtector,
      search: "loop protector sleeve webbing",
      summary: spec.loopProtectorType,
      body: (
        <div className="space-y-3">
          <Labeled label="Type">
            <FormSelect value={spec.loopProtectorType} onChange={(value) => update("loopProtectorType", value)} options={[...LOOP_PROTECTOR_TYPES]} />
          </Labeled>
          <GsmLamiFields
            gsm={spec.loopProtectorGsm || "40"}
            lami={spec.loopProtectorLami || "0"}
            onGsm={(value) => update("loopProtectorGsm", value)}
            onLami={(value) => update("loopProtectorLami", value)}
            gsmOptions={[...GSM_OPTIONS]}
            lamiOptions={[...LAMI_OPTIONS]}
          />
          <Labeled label="Size">
            <Input value={spec.loopProtectorSize} onChange={(event) => update("loopProtectorSize", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-loop-cover",
      title: "Loop cover",
      on: spec.loopCover,
      search: "loop cover",
      summary: `${spec.loopCoverGsm || "—"} GSM · cut ${spec.loopCoverCut || "—"}`,
      body: (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
          <Labeled label="GSM">
            <Input value={spec.loopCoverGsm} onChange={(event) => update("loopCoverGsm", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Lamination">
            <Input value={spec.loopCoverLami} onChange={(event) => update("loopCoverLami", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Width">
            <Input value={spec.loopCoverSize} onChange={(event) => update("loopCoverSize", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Cut length">
            <Input value={spec.loopCoverCut} onChange={(event) => update("loopCoverCut", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Count">
            <Input value={spec.loopCoverCount} onChange={(event) => update("loopCoverCount", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-ancerie",
      title: "Anchor / Ancerie loop",
      on: spec.ancerie,
      search: "anchor ancerie ancillary loop",
      summary: `${spec.ancerieType} · ${spec.ancerieGsm || "—"} grm`,
      body: (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
          <Labeled label="Type">
            <FormSelect value={spec.ancerieType} onChange={(value) => update("ancerieType", value)} options={[...ANCILLARY_LOOP_TYPES]} />
          </Labeled>
          <Labeled label="GPM">
            <Input value={spec.ancerieGsm} onChange={(event) => update("ancerieGsm", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Size">
            <Input value={spec.ancerieSize} onChange={(event) => update("ancerieSize", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Attachment">
            <Input value={spec.ancerieAtt} onChange={(event) => update("ancerieAtt", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Count">
            <Input value={spec.ancerieCount} onChange={(event) => update("ancerieCount", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Color">
            <FormSelect value={spec.ancerieColor} onChange={(value) => update("ancerieColor", value)} options={[...COLOURS]} />
          </Labeled>
        </div>
      ),
    },
  ]

  const fabric: CatalogItem[] = [
    ...(spec.constructionType === "Buffle"
      ? [
          {
            id: "extra-baffle",
            title: "Baffle",
            on: true,
            locked: true,
            search: "baffle buffle",
            summary: `${spec.buffleKind} · ${spec.buffleGsm || "70"} GSM`,
            body: (
              <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                <Labeled label="Kind">
                  <FormSelect value={spec.buffleKind} onChange={(value) => update("buffleKind", value)} options={[...BUFFLE_KINDS]} />
                </Labeled>
                <Labeled label="GSM">
                  <FormSelect value={spec.buffleGsm || "70"} onChange={(value) => update("buffleGsm", value)} options={[...GSM_OPTIONS]} />
                </Labeled>
              </div>
            ),
          } satisfies CatalogItem,
        ]
      : []),
    {
      id: "extra-felt",
      title: "Felt",
      on: spec.felt,
      search: "felt",
      summary: [
        spec.feltTop && "Top",
        spec.feltBottom && "Bottom",
        spec.feltBody && "Body",
        spec.feltTopSpout && "Top spout",
        spec.feltBottomSpout && "Bottom spout",
      ]
        .filter(Boolean)
        .join(" · ") || "Choose positions",
      body: (
        <PositionChips
          options={[
            { label: "Top", checked: spec.feltTop, onChange: (value) => update("feltTop", value) },
            { label: "Bottom", checked: spec.feltBottom, onChange: (value) => update("feltBottom", value) },
            { label: "Body", checked: spec.feltBody, onChange: (value) => update("feltBody", value) },
            { label: "Top spout", checked: spec.feltTopSpout, onChange: (value) => update("feltTopSpout", value) },
            { label: "Bottom spout", checked: spec.feltBottomSpout, onChange: (value) => update("feltBottomSpout", value) },
          ]}
        />
      ),
    },
    {
      id: "extra-mf",
      title: "MF webbing",
      on: spec.mfWeb,
      search: "mf webbing",
      summary: [
        spec.mfWebTop && "Top",
        spec.mfWebBottom && "Bottom",
        spec.mfWebBody && "Body",
        spec.mfWebTopSpout && "Top spout",
        spec.mfWebBottomSpout && "Bottom spout",
        spec.mfWebBuffle && "Baffle",
      ]
        .filter(Boolean)
        .join(" · ") || "Choose positions",
      body: (
        <PositionChips
          options={[
            { label: "Top", checked: spec.mfWebTop, onChange: (value) => update("mfWebTop", value) },
            { label: "Bottom", checked: spec.mfWebBottom, onChange: (value) => update("mfWebBottom", value) },
            { label: "Body", checked: spec.mfWebBody, onChange: (value) => update("mfWebBody", value) },
            { label: "Top spout", checked: spec.mfWebTopSpout, onChange: (value) => update("mfWebTopSpout", value) },
            { label: "Bottom spout", checked: spec.mfWebBottomSpout, onChange: (value) => update("mfWebBottomSpout", value) },
            { label: "Baffle", checked: spec.mfWebBuffle, onChange: (value) => update("mfWebBuffle", value) },
          ]}
        />
      ),
    },
    {
      id: "extra-inner-skin",
      title: "Inner skin",
      on: spec.innerSkin,
      search: "inner skin",
      summary: `${spec.innerSkinGsm || spec.bodyGsm} GSM`,
      body: (
        <div className="space-y-3">
          <GsmLamiFields
            gsm={spec.innerSkinGsm || spec.bodyGsm}
            lami={spec.innerSkinLami || "0"}
            onGsm={(value) => update("innerSkinGsm", value)}
            onLami={(value) => update("innerSkinLami", value)}
            gsmOptions={[...GSM_OPTIONS]}
            lamiOptions={[...LAMI_OPTIONS]}
          />
          <Labeled label="Extra cut length">
            <Input value={spec.innerSkinExtraCut} onChange={(event) => update("innerSkinExtraCut", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-inner-box",
      title: "Inner box",
      on: spec.innerBox,
      search: "inner box",
      summary: `${spec.innerBoxGsm || spec.bodyGsm} GSM`,
      body: (
        <GsmLamiFields
          gsm={spec.innerBoxGsm || spec.bodyGsm}
          lami={spec.innerBoxLami || "0"}
          onGsm={(value) => update("innerBoxGsm", value)}
          onLami={(value) => update("innerBoxLami", value)}
          gsmOptions={[...GSM_OPTIONS]}
          lamiOptions={[...LAMI_OPTIONS]}
        />
      ),
    },
    {
      id: "extra-inner-top",
      title: "Inner top",
      on: spec.innerTop,
      search: "inner top",
      summary: `${spec.innerTopGsm || spec.bodyGsm} GSM`,
      body: (
        <div className="space-y-3">
          <GsmLamiFields
            gsm={spec.innerTopGsm || spec.bodyGsm}
            lami={spec.innerTopLami || "0"}
            onGsm={(value) => update("innerTopGsm", value)}
            onLami={(value) => update("innerTopLami", value)}
            gsmOptions={[...GSM_OPTIONS]}
            lamiOptions={[...LAMI_OPTIONS]}
          />
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <Labeled label="Dia">
              <Input value={spec.innerTopDia} onChange={(event) => update("innerTopDia", event.target.value)} className={fieldClassName} />
            </Labeled>
            <Labeled label="Extra">
              <Input value={spec.innerTopExtra} onChange={(event) => update("innerTopExtra", event.target.value)} className={fieldClassName} />
            </Labeled>
          </div>
        </div>
      ),
    },
    {
      id: "extra-inner-bottom",
      title: "Inner bottom",
      on: spec.innerBottom,
      search: "inner bottom",
      summary: `${spec.innerBottomGsm || spec.bodyGsm} GSM`,
      body: (
        <div className="space-y-3">
          <GsmLamiFields
            gsm={spec.innerBottomGsm || spec.bodyGsm}
            lami={spec.innerBottomLami || "0"}
            onGsm={(value) => update("innerBottomGsm", value)}
            onLami={(value) => update("innerBottomLami", value)}
            gsmOptions={[...GSM_OPTIONS]}
            lamiOptions={[...LAMI_OPTIONS]}
          />
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <Labeled label="Dia">
              <Input value={spec.innerBottomDia} onChange={(event) => update("innerBottomDia", event.target.value)} className={fieldClassName} />
            </Labeled>
            <Labeled label="Extra">
              <Input value={spec.innerBottomExtra} onChange={(event) => update("innerBottomExtra", event.target.value)} className={fieldClassName} />
            </Labeled>
          </div>
        </div>
      ),
    },
    {
      id: "extra-fabric-patch",
      title: "Fabric patch",
      on: spec.fabricPatch,
      search: "fabric patch",
      summary: `${spec.fabricPatchGsm || spec.bodyGsm} GSM`,
      body: (
        <GsmLamiFields
          gsm={spec.fabricPatchGsm || spec.bodyGsm}
          lami={spec.fabricPatchLami || "0"}
          onGsm={(value) => update("fabricPatchGsm", value)}
          onLami={(value) => update("fabricPatchLami", value)}
          gsmOptions={[...GSM_OPTIONS]}
          lamiOptions={[...LAMI_OPTIONS]}
        />
      ),
    },
  ]

  const bands: CatalogItem[] = [
    {
      id: "extra-top-band",
      title: "Top band",
      on: spec.topBand,
      search: "top band webbing",
      summary: `${spec.topBandGsm || "—"} GPM · size ${spec.topBandSize || "—"}`,
      body: (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <Labeled label="GPM">
            <Input value={spec.topBandGsm} onChange={(event) => update("topBandGsm", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Size">
            <Input value={spec.topBandSize} onChange={(event) => update("topBandSize", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-stevedore",
      title: "Stevedore strap",
      on: spec.stevedore,
      search: "stevedore strap",
      summary: `${spec.stevedorePortion} · ${spec.stevedoreGsm || "—"} GPM`,
      body: (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
          <Labeled label="Portion">
            <FormSelect value={spec.stevedorePortion} onChange={(value) => update("stevedorePortion", value)} options={[...STEVEDORE_PORTIONS]} />
          </Labeled>
          <Labeled label="GPM">
            <Input value={spec.stevedoreGsm} onChange={(event) => update("stevedoreGsm", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Size">
            <Input value={spec.stevedoreSize} onChange={(event) => update("stevedoreSize", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Count">
            <Input value={spec.stevedoreCount} onChange={(event) => update("stevedoreCount", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-hose",
      title: "Hose slider",
      on: spec.hoseSlider,
      search: "hose slider",
      summary: `${spec.hoseSliderCount || "1"} × 0.005 kg`,
      body: (
        <Labeled label="Count">
          <Input value={spec.hoseSliderCount} onChange={(event) => update("hoseSliderCount", event.target.value)} className={fieldClassName} />
        </Labeled>
      ),
    },
    {
      id: "extra-belly-1",
      title: "Belly band 1",
      on: spec.bellyBand1,
      search: "belly band",
      summary: `${spec.bellyBand1Gsm || "—"} GPM`,
      body: (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <Labeled label="GPM">
            <Input value={spec.bellyBand1Gsm} onChange={(event) => update("bellyBand1Gsm", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Size">
            <Input value={spec.bellyBand1Size} onChange={(event) => update("bellyBand1Size", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-belly-2",
      title: "Belly band 2",
      on: spec.bellyBand2,
      search: "belly band",
      summary: `${spec.bellyBand2Gsm || "—"} GPM`,
      body: (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <Labeled label="GPM">
            <Input value={spec.bellyBand2Gsm} onChange={(event) => update("bellyBand2Gsm", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Size">
            <Input value={spec.bellyBand2Size} onChange={(event) => update("bellyBand2Size", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-tb-band",
      title: "Top–bottom band",
      on: spec.topBottomBand,
      search: "top bottom band",
      summary: `${spec.topBottomBandGsm || "—"} GPM`,
      body: (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <Labeled label="GPM">
            <Input value={spec.topBottomBandGsm} onChange={(event) => update("topBottomBandGsm", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Size">
            <Input value={spec.topBottomBandSize} onChange={(event) => update("topBottomBandSize", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-safety-band",
      title: "Safety band",
      on: spec.safetyBand,
      search: "safety band",
      summary: "Uses bag L and H",
    },
    {
      id: "extra-steve-cover",
      title: "Stevedore cover",
      on: spec.steveCover,
      search: "stevedore cover",
      summary: `L ${spec.steveCoverLength || "—"} · ×${spec.steveCoverCount}`,
      body: (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
          <Labeled label="Webbing size">
            <Input value={spec.steveCoverSize} onChange={(event) => update("steveCoverSize", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Length">
            <Input value={spec.steveCoverLength} onChange={(event) => update("steveCoverLength", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="GSM">
            <Input value={spec.steveCoverGsm} onChange={(event) => update("steveCoverGsm", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Lamination">
            <FormSelect value={spec.steveCoverLami || "0"} onChange={(value) => update("steveCoverLami", value)} options={[...LAMI_OPTIONS]} />
          </Labeled>
          <Labeled label="Count">
            <Input value={spec.steveCoverCount} onChange={(event) => update("steveCoverCount", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-doc1",
      title: "Extra document pouch 1",
      on: spec.docPouch1,
      search: "document pouch doc",
      summary: `${spec.doc1Length}×${spec.doc1Width} ${spec.doc1Unit}`,
      body: (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
          <Labeled label="Type">
            <FormSelect value={spec.doc1Type} onChange={(value) => update("doc1Type", value)} options={[...DOC_TYPES]} />
          </Labeled>
          <Labeled label="Opening">
            <FormSelect value={spec.doc1Opening} onChange={(value) => update("doc1Opening", value)} options={[...DOC_OPENINGS]} />
          </Labeled>
          <Labeled label="Unit">
            <FormSelect value={spec.doc1Unit} onChange={(value) => update("doc1Unit", value)} options={[...DOC_UNITS]} />
          </Labeled>
          <Labeled label="Length">
            <Input value={spec.doc1Length} onChange={(event) => update("doc1Length", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Width">
            <Input value={spec.doc1Width} onChange={(event) => update("doc1Width", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Micron">
            <Input value={spec.doc1Micron} onChange={(event) => update("doc1Micron", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Count">
            <Input value={spec.doc1Count} onChange={(event) => update("doc1Count", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-doc2",
      title: "Extra document pouch 2",
      on: spec.docPouch2,
      search: "document pouch doc",
      summary: `${spec.doc2Length}×${spec.doc2Width} ${spec.doc2Unit}`,
      body: (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
          <Labeled label="Type">
            <FormSelect value={spec.doc2Type} onChange={(value) => update("doc2Type", value)} options={[...DOC_TYPES]} />
          </Labeled>
          <Labeled label="Opening">
            <FormSelect value={spec.doc2Opening} onChange={(value) => update("doc2Opening", value)} options={[...DOC_OPENINGS]} />
          </Labeled>
          <Labeled label="Unit">
            <FormSelect value={spec.doc2Unit} onChange={(value) => update("doc2Unit", value)} options={[...DOC_UNITS]} />
          </Labeled>
          <Labeled label="Length">
            <Input value={spec.doc2Length} onChange={(event) => update("doc2Length", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Width">
            <Input value={spec.doc2Width} onChange={(event) => update("doc2Width", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Micron">
            <Input value={spec.doc2Micron} onChange={(event) => update("doc2Micron", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Count">
            <Input value={spec.doc2Count} onChange={(event) => update("doc2Count", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-label",
      title: "Extra label",
      on: spec.extraLabel,
      search: "extra label",
      summary: `${spec.extraLabelLength}×${spec.extraLabelWidth} · ×${spec.extraLabelCount}`,
      body: (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
          <Labeled label="Length">
            <Input value={spec.extraLabelLength} onChange={(event) => update("extraLabelLength", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Width">
            <Input value={spec.extraLabelWidth} onChange={(event) => update("extraLabelWidth", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Micron">
            <Input value={spec.extraLabelMicron} onChange={(event) => update("extraLabelMicron", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Count">
            <Input value={spec.extraLabelCount} onChange={(event) => update("extraLabelCount", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-label-1",
      title: "Extra label 1",
      on: spec.extraLabel1,
      search: "extra label",
      body: (
        <div className="grid grid-cols-3 gap-3">
          <Labeled label="Length">
            <Input value={spec.extraLabel1Length} onChange={(event) => update("extraLabel1Length", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Width">
            <Input value={spec.extraLabel1Width} onChange={(event) => update("extraLabel1Width", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Micron">
            <Input value={spec.extraLabel1Micron} onChange={(event) => update("extraLabel1Micron", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-label-2",
      title: "Extra label 2",
      on: spec.extraLabel2,
      search: "extra label",
      body: (
        <div className="grid grid-cols-3 gap-3">
          <Labeled label="Length">
            <Input value={spec.extraLabel2Length} onChange={(event) => update("extraLabel2Length", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Width">
            <Input value={spec.extraLabel2Width} onChange={(event) => update("extraLabel2Width", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Micron">
            <Input value={spec.extraLabel2Micron} onChange={(event) => update("extraLabel2Micron", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-label-3",
      title: "Extra label 3",
      on: spec.extraLabel3,
      search: "extra label",
      body: (
        <div className="grid grid-cols-3 gap-3">
          <Labeled label="Length">
            <Input value={spec.extraLabel3Length} onChange={(event) => update("extraLabel3Length", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Width">
            <Input value={spec.extraLabel3Width} onChange={(event) => update("extraLabel3Width", event.target.value)} className={fieldClassName} />
          </Labeled>
          <Labeled label="Micron">
            <Input value={spec.extraLabel3Micron} onChange={(event) => update("extraLabel3Micron", event.target.value)} className={fieldClassName} />
          </Labeled>
        </div>
      ),
    },
    {
      id: "extra-ds2",
      title: "2nd discharge spout",
      on: spec.bottomSpout2,
      search: "discharge spout extra",
      summary: `${spec.bottomSpout2Dia || "—"} × ${spec.bottomSpout2Height || "—"}`,
      body: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <Labeled label="Dia">
              <Input value={spec.bottomSpout2Dia} onChange={(event) => update("bottomSpout2Dia", event.target.value)} className={fieldClassName} />
            </Labeled>
            <Labeled label="Height">
              <Input value={spec.bottomSpout2Height} onChange={(event) => update("bottomSpout2Height", event.target.value)} className={fieldClassName} />
            </Labeled>
          </div>
          <GsmLamiFields
            gsm={spec.bottomSpout2Gsm || spec.bodyGsm}
            lami={spec.bottomSpout2Lami || "0"}
            onGsm={(value) => update("bottomSpout2Gsm", value)}
            onLami={(value) => update("bottomSpout2Lami", value)}
            gsmOptions={[...GSM_OPTIONS]}
            lamiOptions={[...LAMI_OPTIONS]}
          />
        </div>
      ),
    },
    {
      id: "extra-ds3",
      title: "3rd discharge spout",
      on: spec.bottomSpout3,
      search: "discharge spout extra",
      summary: `${spec.bottomSpout3Dia || "—"} × ${spec.bottomSpout3Height || "—"}`,
      body: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <Labeled label="Dia">
              <Input value={spec.bottomSpout3Dia} onChange={(event) => update("bottomSpout3Dia", event.target.value)} className={fieldClassName} />
            </Labeled>
            <Labeled label="Height">
              <Input value={spec.bottomSpout3Height} onChange={(event) => update("bottomSpout3Height", event.target.value)} className={fieldClassName} />
            </Labeled>
          </div>
          <GsmLamiFields
            gsm={spec.bottomSpout3Gsm || spec.bodyGsm}
            lami={spec.bottomSpout3Lami || "0"}
            onGsm={(value) => update("bottomSpout3Gsm", value)}
            onLami={(value) => update("bottomSpout3Lami", value)}
            gsmOptions={[...GSM_OPTIONS]}
            lamiOptions={[...LAMI_OPTIONS]}
          />
        </div>
      ),
    },
    {
      id: "extra-cable",
      title: "Cable tie",
      on: spec.cableTie,
      search: "cable tie",
      summary: spec.cableTieCount ? `×${spec.cableTieCount} · no kg formula` : "Collected, no kg formula",
      body: (
        <Labeled label="Count">
          <Input value={spec.cableTieCount} onChange={(event) => update("cableTieCount", event.target.value)} className={fieldClassName} />
        </Labeled>
      ),
    },
    {
      id: "extra-top-velcro",
      title: "Top velcro",
      on: spec.topVelcro,
      search: "velcro",
      summary: "Collected, no kg formula",
    },
    {
      id: "extra-bottom-velcro",
      title: "Bottom velcro",
      on: spec.bottomVelcro,
      search: "velcro",
      summary: "Collected, no kg formula",
    },
  ]

  const sections = [
    { title: "Rope & tie", items: rope, toggles: {
        "extra-top-tie": "topTie",
        "extra-top-rope": "topRope",
        "extra-bottom-tie": "bottomTie",
        "extra-bottom-rope": "bottomRope",
        "extra-fs-rope": "topSpoutRope",
        "extra-ds-rope": "bottomSpoutRope",
      } as const },
    { title: "Flap & loop", items: flap, toggles: {
        "extra-top-flap": "topFlap",
        "extra-bottom-flap": "bottomFlap",
        "extra-top-hook": "topHook",
        "extra-bottom-hook": "bottomHook",
        "extra-bottom-loop": "bottomLoop",
        "extra-loop-protector": "loopProtector",
        "extra-loop-cover": "loopCover",
        "extra-ancerie": "ancerie",
      } as const },
    { title: "Fabric extras", items: fabric, toggles: {
        "extra-felt": "felt",
        "extra-mf": "mfWeb",
        "extra-inner-skin": "innerSkin",
        "extra-inner-box": "innerBox",
        "extra-inner-top": "innerTop",
        "extra-inner-bottom": "innerBottom",
        "extra-fabric-patch": "fabricPatch",
      } as const },
    { title: "Bands & packing extras", items: bands, toggles: {
        "extra-top-band": "topBand",
        "extra-stevedore": "stevedore",
        "extra-hose": "hoseSlider",
        "extra-belly-1": "bellyBand1",
        "extra-belly-2": "bellyBand2",
        "extra-tb-band": "topBottomBand",
        "extra-safety-band": "safetyBand",
        "extra-steve-cover": "steveCover",
        "extra-doc1": "docPouch1",
        "extra-doc2": "docPouch2",
        "extra-label": "extraLabel",
        "extra-label-1": "extraLabel1",
        "extra-label-2": "extraLabel2",
        "extra-label-3": "extraLabel3",
        "extra-ds2": "bottomSpout2",
        "extra-ds3": "bottomSpout3",
        "extra-cable": "cableTie",
        "extra-top-velcro": "topVelcro",
        "extra-bottom-velcro": "bottomVelcro",
      } as const },
  ]

  const needle = query.trim().toLowerCase()

  function jump(label: string) {
    const match = [...rope, ...flap, ...fabric, ...bands].find((item) => item.title === label || item.title.startsWith(label))
    const aliases: Record<string, string> = {
      "Top hook": "extra-top-hook",
      "Bottom hook": "extra-bottom-hook",
      Stevedore: "extra-stevedore",
      "2nd discharge": "extra-ds2",
      "3rd discharge": "extra-ds3",
      "Doc pouch 1": "extra-doc1",
      "Doc pouch 2": "extra-doc2",
    }
    const id = aliases[label] || match?.id
    if (!id) return
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-10 overflow-hidden rounded-xl border border-[var(--navy-border)] bg-white shadow-[0_12px_32px_rgba(26,60,94,0.08)]">
        <div className="flex flex-col gap-3 border-b border-[var(--navy-border)] bg-[var(--navy-bg)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-heading text-base font-semibold tracking-tight text-[var(--navy)]">Plant extras</h3>
            <p className="mt-0.5 text-xs text-[var(--navy-muted)]">
              {selected.length} on · search, then switch a card to specify
            </p>
          </div>
          <div className="relative w-full sm:max-w-[240px]">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search extras…"
              className={cn(fieldClassName, "h-9 bg-white pl-9")}
            />
          </div>
        </div>
        <div className="px-5 py-3">
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selected.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => jump(label)}
                  className="rounded-full border border-[var(--navy-border)] bg-[var(--navy-bg)] px-3 py-1 text-xs font-medium text-[var(--navy)] transition-colors hover:bg-[var(--navy)] hover:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-5 text-[var(--text-secondary)]">
              Nothing on yet. Switch a card — fields stay hidden until you need them.
            </p>
          )}
        </div>
      </div>

      {sections.map((section) => {
        const items = section.items.filter((item) => {
          if (!needle) return true
          return `${item.title} ${item.search}`.toLowerCase().includes(needle)
        })
        if (items.length === 0) return null
        const onCount = items.filter((item) => item.on).length
        return (
          <section key={section.title} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="font-heading text-sm font-semibold tracking-tight text-[var(--text)]">{section.title}</h4>
              <span className="text-xs text-[var(--text-muted)]">
                {onCount} of {items.length} on
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((item) => {
                const key = item.id as keyof typeof section.toggles
                const toggleField = section.toggles[key]
                return (
                  <ExtraCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    on={item.on}
                    locked={item.locked}
                    summary={item.summary}
                    className={item.on ? "sm:col-span-2" : undefined}
                    onToggle={
                      toggleField
                        ? (value) => update(toggleField, value as never)
                        : undefined
                    }
                  >
                    {item.body}
                  </ExtraCard>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
