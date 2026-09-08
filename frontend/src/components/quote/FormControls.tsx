import { Check } from "lucide-react"
import type { ReactNode } from "react"

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
              "font-heading rounded px-3 py-1.5 text-sm font-medium",
              active
                ? "border-[1.5px] border-[var(--navy)] bg-[var(--navy-bg)] text-[var(--navy)]"
                : "border-[1.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]",
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
              "font-heading flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium",
              checked
                ? "border-[1.5px] border-[var(--navy)] bg-[var(--navy-bg)] text-[var(--navy)]"
                : "border-[1.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]",
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

export function FormSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full appearance-none rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 pr-8 text-sm outline-none focus:border-[var(--navy)] focus:ring-[3px] focus:ring-[var(--navy-bg)]"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
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
    <label className="font-heading mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
      {children}
      {optional && (
        <span className="font-normal text-[var(--text-muted)]">(optional)</span>
      )}
    </label>
  )
}
