import { Moon, Sun } from "lucide-react"

import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolved, toggle } = useTheme()
  const dark = resolved === "dark"

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "group relative flex items-center rounded-full transition-colors duration-300",
        compact ? "h-9 w-9 justify-center" : "h-10 w-[72px] px-1",
        dark
          ? "bg-[#1a2433] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_20px_rgba(0,0,0,0.35)]"
          : "bg-[var(--navy-bg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
      )}
    >
      {!compact ? (
        <>
          <span
            className={cn(
              "absolute top-1 left-1 size-8 rounded-full bg-[var(--surface)] shadow-[0_6px_16px_rgba(26,60,94,0.18)] transition-transform duration-300 ease-out",
              dark && "translate-x-[32px]",
            )}
          />
          <Sun
            className={cn(
              "relative z-10 ml-1.5 size-3.5 transition-colors",
              dark ? "text-[var(--text-muted)]" : "text-[var(--navy)]",
            )}
          />
          <Moon
            className={cn(
              "relative z-10 ml-auto mr-1.5 size-3.5 transition-colors",
              dark ? "text-[#e8d5a8]" : "text-[var(--text-muted)]",
            )}
          />
        </>
      ) : dark ? (
        <Moon className="size-4 text-[#e8d5a8]" />
      ) : (
        <Sun className="size-4 text-[var(--navy)]" />
      )}
    </button>
  )
}

export function AppearancePicker() {
  const { theme, setTheme } = useTheme()
  const options = [
    { id: "light" as const, label: "Light", hint: "Soft paper" },
    { id: "dark" as const, label: "Dark", hint: "Night mill" },
    { id: "system" as const, label: "System", hint: "Match device" },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const selected = theme === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setTheme(option.id)}
            className={cn(
              "rounded-2xl border px-3 py-3 text-left transition-all duration-200",
              selected
                ? "border-[var(--navy)] bg-[var(--navy-bg)] shadow-[var(--shadow-md)]"
                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--navy-border)]",
            )}
          >
            <div className={cn("font-heading text-sm font-semibold", selected ? "text-[var(--navy)]" : "text-[var(--text)]")}>
              {option.label}
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">{option.hint}</div>
          </button>
        )
      })}
    </div>
  )
}
