import { Check } from "lucide-react"
import { useId, type ReactNode } from "react"

import { COLOURS } from "@/lib/erpCatalog"
import { resolveFabricHex } from "@/lib/colourPreview"
import { isKnownPantone, pantoneForColour, PANTONE_OPTIONS, reconcileFromPantone } from "@/lib/pantone"
import { cn } from "@/lib/utils"
import type { QuoteSpecification } from "@/types/quote"

export function OptionChips({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "font-heading rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
              active
                ? "border-[1.5px] border-[var(--navy)] bg-[var(--navy)] text-white shadow-[var(--shadow-navy)]"
                : "border-[1.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:-translate-y-px hover:border-[var(--navy-border)] hover:text-[var(--navy)] hover:shadow-sm",
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

export function CheckboxChips({
  value,
  onChange,
  options,
}: {
  value: string[]
  onChange: (value: string[]) => void
  options: string[]
}) {
  function toggle(option: string) {
    if (value.includes(option)) onChange(value.filter((item) => item !== option))
    else onChange([...value, option])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked = value.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              "font-heading flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              checked
                ? "border-[1.5px] border-[var(--navy)] bg-[var(--navy)] text-white"
                : "border-[1.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--navy-border)] hover:text-[var(--navy)]",
            )}
          >
            <span
              className={cn(
                "flex size-3.5 items-center justify-center rounded-sm",
                checked
                  ? "border-[1.5px] border-[var(--navy)] bg-[var(--navy)]"
                  : "border-[1.5px] border-[var(--border-strong)]",
              )}
            >
              {checked && <Check className="size-2 text-white" strokeWidth={3} />}
            </span>
            {option}
          </button>
        )
      })}
    </div>
  )
}

const SELECT_CLASS =
  "w-full min-w-0 appearance-none rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-3 pr-8 text-sm outline-none transition-all duration-200 hover:border-[var(--navy-border)] focus:border-[var(--navy)] focus:bg-[var(--surface)] focus:ring-[4px] focus:ring-[var(--navy-bg)]"

const COLOUR_OPTION_SET = new Set<string>([...COLOURS, "Transparent"])

function optionsAreNumeric(options: string[]): boolean {
  if (!options.length) return false
  return options.every((option) => /^-?\d+(\.\d+)?$/.test(String(option).trim()))
}

function optionsAreColours(options: string[]): boolean {
  if (!options.length || options.length > 16) return false
  return options.every((option) => !option || COLOUR_OPTION_SET.has(option))
}

/** Dropdown with optional free typing (datalist). Auto-enabled for GSM/sizes and colour lists. */
export function FormSelect({
  value,
  onChange,
  options,
  placeholder,
  allowCustom,
  strict,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  /** Force free-text entry with suggestion list. */
  allowCustom?: boolean
  /** Force native select only (no free text). */
  strict?: boolean
}) {
  const listId = useId()
  const custom =
    !strict && (allowCustom ?? (optionsAreNumeric(options) || optionsAreColours(options)))
  const list = options.includes(value) ? options : value ? [value, ...options] : options

  if (custom) {
    return (
      <>
        <input
          list={listId}
          value={value}
          placeholder={placeholder || "Select or type…"}
          onChange={(event) => onChange(event.target.value)}
          className={SELECT_CLASS}
        />
        <datalist id={listId}>
          {list.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </>
    )
  }

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={SELECT_CLASS}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {list.map((option) => (
        <option key={option} value={option}>
          {option || "—"}
        </option>
      ))}
    </select>
  )
}

export function GsmLamiFields({
  gsm,
  lami,
  onGsm,
  onLami,
  gsmOptions,
  lamiOptions,
}: {
  gsm: string
  lami: string
  onGsm: (value: string) => void
  onLami: (value: string) => void
  gsmOptions: string[]
  lamiOptions: string[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <div className="mb-1 text-[10px] text-[var(--text-muted)]">GSM</div>
        <FormSelect value={gsm} onChange={onGsm} options={gsmOptions} allowCustom />
      </div>
      <div>
        <div className="mb-1 text-[10px] text-[var(--text-muted)]">Lamination</div>
        <FormSelect value={lami} onChange={onLami} options={lamiOptions} allowCustom />
      </div>
    </div>
  )
}

export function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] shadow-[inset_0_0_0_1px_var(--border)] transition-all duration-200 hover:shadow-[inset_0_0_0_1px_var(--navy-border),0_8px_20px_rgba(26,60,94,0.06)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-[var(--border-strong)] text-[var(--navy)] accent-[var(--navy)]"
      />
      {children}
    </label>
  )
}

/** Vertical stack of feature cards / sections. */
export function PanelStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-3", className)}>{children}</div>
}

/**
 * Toggle feature card — preferred over CheckRow stacks on BOM tabs.
 * Off = one-line row; On = expand body with fields.
 */
export function FeatureCard({
  title,
  on,
  onToggle,
  summary,
  locked,
  className,
  children,
}: {
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
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-200",
        on
          ? "border-[var(--navy-border)] bg-[var(--surface)] shadow-[0_8px_24px_rgba(17,24,39,0.06)]"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--navy-border)]",
        className,
      )}
    >
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        {!locked ? (
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={title}
            onClick={() => onToggle?.(!on)}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
              on ? "bg-[var(--navy)] shadow-[var(--shadow-navy)]" : "bg-[var(--border-strong)]",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-5 rounded-full bg-[var(--knob)] shadow-sm transition-transform duration-200 ease-out",
                on ? "translate-x-[22px]" : "translate-x-0",
              )}
            />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
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
        <div className="space-y-4 border-t border-[var(--navy-border)]/50 bg-[var(--bg)]/40 px-4 py-4 sm:px-5">{children}</div>
      ) : null}
    </div>
  )
}

/** Responsive field grid for card bodies. */
export function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4", className)}>{children}</div>
}

export function FieldCell({
  children,
  span,
  className,
}: {
  children: ReactNode
  span?: 2 | "full"
  className?: string
}) {
  return (
    <div
      className={cn(
        "min-w-0",
        span === 2 && "col-span-2",
        span === "full" && "col-span-2 sm:col-span-4",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CompactCheck({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="mb-1 flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-[var(--border-strong)] accent-[var(--navy)]"
      />
      {children}
    </label>
  )
}

export function FieldLabel({
  children,
  optional,
}: {
  children: ReactNode
  optional?: boolean
}) {
  return (
    <label className="font-heading mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] text-[var(--text-muted)] uppercase">
      {children}
      {optional && <span className="font-normal text-[var(--text-muted)]">(optional)</span>}
    </label>
  )
}

const INPUT_CLASS =
  "w-full min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none transition-all duration-200 hover:border-[var(--navy-border)] focus:border-[var(--navy)] focus:bg-[var(--surface)] focus:ring-[4px] focus:ring-[var(--navy-bg)]"

/** Colour name + preview picker + Pantone (BOM / extras). */
export function ColourField({
  colour,
  pantone = "",
  onColourChange,
  onPantoneChange,
  options = COLOURS,
  label = "Color",
  className,
  showLabel = true,
  compact = false,
}: {
  colour: string
  pantone?: string
  onColourChange: (value: string) => void
  onPantoneChange: (value: string) => void
  options?: readonly string[]
  label?: string
  className?: string
  showLabel?: boolean
  /** Tighter single-row layout for feature cards. */
  compact?: boolean
}) {
  const colourListId = useId()
  const pantoneListId = useId()
  const previewHex = resolveFabricHex(colour)
  const pantoneTrimmed = pantone.trim()
  const pantoneUnknown = Boolean(pantoneTrimmed) && !isKnownPantone(pantoneTrimmed)
  const inputClass = compact
    ? "w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition-all duration-200 hover:border-[var(--navy-border)] focus:border-[var(--navy)] focus:ring-[3px] focus:ring-[var(--navy-bg)]"
    : INPUT_CLASS

  function setColour(next: string) {
    onColourChange(next)
    const mapped = pantoneForColour(next)
    if (mapped) onPantoneChange(mapped)
  }

  function setPantone(next: string) {
    const hit = reconcileFromPantone(next)
    if (hit) {
      onColourChange(hit.colour)
      onPantoneChange(hit.pantone)
    } else {
      onPantoneChange(next)
    }
  }

  return (
    <div className={cn(compact ? "space-y-1.5" : "space-y-2", className)}>
      {showLabel ? <FieldLabel>{label}</FieldLabel> : null}
      <div className={cn("grid gap-2 sm:items-end", compact ? "sm:grid-cols-[1fr_1fr_auto]" : "gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]")}>
        <div className="min-w-0">
          {!compact ? <div className="mb-1 text-[10px] text-[var(--text-muted)]">Colour name</div> : null}
          <div className="flex items-center gap-2">
            <input
              list={colourListId}
              value={colour}
              placeholder={compact ? "Colour" : "Blue, Milky White, #286…"}
              onChange={(event) => setColour(event.target.value)}
              className={inputClass}
            />
            <label
              className={cn(
                "relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden border border-[var(--border)] shadow-inner",
                compact ? "size-9 rounded-lg" : "size-10 rounded-xl",
              )}
              title="Preview colour"
              style={{ background: previewHex }}
            >
              <input
                type="color"
                value={previewHex}
                onChange={(event) => setColour(event.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Pick preview colour"
              />
            </label>
          </div>
        </div>
        <div className="min-w-0 sm:col-span-1">
          {!compact ? <div className="mb-1 text-[10px] text-[var(--text-muted)]">Pantone code</div> : null}
          <input
            list={pantoneListId}
            value={pantone}
            placeholder={compact ? "Pantone" : "e.g. PMS 286 C"}
            onChange={(event) => setPantone(event.target.value)}
            className={inputClass}
          />
          <datalist id={pantoneListId}>
            {PANTONE_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      </div>
      {pantoneUnknown ? (
        <p className="text-[10px] leading-snug text-[var(--text-muted)]">
          Pantone saved for ERP. Set colour or picker for 3D preview.
        </p>
      ) : !compact ? (
        <p className="text-[10px] leading-snug text-[var(--text-muted)]">
          Known Pantone fills colour. Preview uses colour / #hex.
        </p>
      ) : null}
      <datalist id={colourListId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  )
}

/** Wired colour + pantone for a quote spec field. */
export function BomColourField({
  spec,
  update,
  colourKey,
  label = "Color",
  options = COLOURS,
  className,
  compact = true,
}: {
  spec: QuoteSpecification
  update: <K extends keyof QuoteSpecification>(key: K, value: QuoteSpecification[K]) => void
  colourKey: keyof QuoteSpecification
  label?: string
  options?: readonly string[]
  className?: string
  compact?: boolean
}) {
  const key = String(colourKey)
  const colour = String(spec[colourKey] ?? "")
  const pantone =
    colourKey === "fabricColour" ? spec.fabricPantone : (spec.colourPantones?.[key] ?? "")

  function onPantoneChange(next: string) {
    if (colourKey === "fabricColour") {
      update("fabricPantone", next)
      return
    }
    update("colourPantones", { ...(spec.colourPantones ?? {}), [key]: next })
  }

  return (
    <ColourField
      label={label}
      colour={colour}
      pantone={pantone}
      options={options}
      className={className}
      compact={compact}
      onColourChange={(value) => update(colourKey, value as QuoteSpecification[typeof colourKey])}
      onPantoneChange={onPantoneChange}
    />
  )
}
