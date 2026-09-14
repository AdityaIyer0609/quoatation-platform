import { Check } from "lucide-react"
import { useId, type ReactNode } from "react"

import { COLOURS } from "@/lib/erpCatalog"
import { cn } from "@/lib/utils"

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
