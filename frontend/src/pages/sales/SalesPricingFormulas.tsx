import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/layout/PageChrome"
import { api } from "@/services/api"

type ConversionRow = { design: string; loops: string; complication: string; rate: number }
type AddonRow = {
  name: string
  rate: number
  unit: string
  plusRm: string | null
  bomHeading: string | null
}
type BookPayload = {
  ruleVersion: string
  ppPlatts: number
  ppFob: number
  ppUv: number
  peRmPerT: number
  uPanelXCornerExtra: number
  surcharges: Record<string, number>
  typeCExtra: Record<string, number>
  minKg: Record<string, number>
  conversionRows: ConversionRow[]
  printMatrix: Record<string, Record<string, number>>
  addons: AddonRow[]
}

type BookResponse = {
  payload: BookPayload
  notes: string
  updatedByName: string
  createdAt: string | null
}

const TABS = [
  ["rm", "Raw material"],
  ["conversion", "Conversion"],
  ["surcharges", "Surcharges"],
  ["print", "Printing"],
  ["addons", "Add-ons"],
] as const

const PRINT_ROWS = ["cliche", "1S/1C", "1S/2C", "2S/2C", "1S/3C", "2S/3C", "4S/2C", "4S/3C"] as const

const field =
  "h-11 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-base outline-none focus:border-[var(--navy)]"
const select =
  "h-11 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm outline-none focus:border-[var(--navy)]"

function num(value: string, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function Field({
  value,
  onChange,
  type = "text",
  step,
  className = "",
}: {
  value: string | number
  onChange: (value: string) => void
  type?: string
  step?: string
  className?: string
}) {
  return (
    <input
      className={`${field} ${className}`}
      type={type}
      step={step}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export default function SalesPricingFormulas() {
  const [book, setBook] = useState<BookResponse | null>(null)
  const [payload, setPayload] = useState<BookPayload | null>(null)
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("rm")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function apply(data: BookResponse) {
    setBook(data)
    setPayload(data.payload)
    setNotes(data.notes ?? "")
  }

  useEffect(() => {
    api
      .salesPricingBook()
      .then((data) => apply(data as BookResponse))
      .catch((err: Error) => setError(err.message))
  }, [])

  function patch(next: Partial<BookPayload>) {
    setPayload((current) => (current ? { ...current, ...next } : current))
  }

  async function save() {
    if (!payload) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const data = (await api.saveSalesPricingBook(
        payload as unknown as Record<string, unknown>,
        notes,
        payload.ruleVersion,
      )) as BookResponse
      apply(data)
      setMessage("Saved. New quotes use these rates.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.")
    } finally {
      setSaving(false)
    }
  }

  async function restore() {
    if (!window.confirm("Restore the original Book4 sheet rates?")) return
    setSaving(true)
    setError(null)
    try {
      apply((await api.resetSalesPricingBook()) as BookResponse)
      setMessage("Restored Book4 defaults.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore.")
    } finally {
      setSaving(false)
    }
  }

  const ppRm = useMemo(() => {
    if (!payload) return 0
    return Number(payload.ppPlatts) + Number(payload.ppFob) + Number(payload.ppUv)
  }, [payload])

  if (!payload || !book) {
    return (
      <PageShell wide>
        <p className="text-sm text-[var(--text-muted)]">{error ?? "Loading…"}</p>
      </PageShell>
    )
  }

  const savedAt = book.createdAt
    ? new Date(book.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null

  return (
    <PageShell wide className="pb-24">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Pricing formulas</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Click a value, change it, then save. Amounts are USD — conversion is per ton, printing is per bag.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={saving} onClick={() => void restore()}>
            Restore Book4
          </Button>
          <Button variant="navy" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-[var(--error)]">{error}</p>}
      {message && <p className="mb-3 text-sm text-[var(--navy)]">{message}</p>}

      <div className="mb-6 grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-2">
          <span className="text-sm font-medium">Version name</span>
          <Field value={payload.ruleVersion} onChange={(value) => patch({ ruleVersion: value })} />
        </label>
        <label className="flex min-w-0 flex-col gap-2">
          <span className="text-sm font-medium">Change note</span>
          <Field value={notes} onChange={setNotes} />
        </label>
        <p className="text-sm text-[var(--text-muted)] sm:col-span-2">
          Combined PP RM is <span className="font-medium text-[var(--text)]">{ppRm} USD/t</span>
          {" · "}
          Last saved by {book.updatedByName || "system"}
          {savedAt ? ` on ${savedAt}` : ""}.
        </p>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-[var(--border)] pb-px">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`shrink-0 px-3 py-2 text-sm ${
              tab === id
                ? "border-b-2 border-[var(--navy)] font-semibold text-[var(--navy)]"
                : "text-[var(--text-muted)]"
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        {tab === "rm" && (
          <div className="grid gap-5 sm:grid-cols-2">
            {(
              [
                ["ppPlatts", "PP Platts", "US dollars per ton"],
                ["ppFob", "PP FOB", "US dollars per ton"],
                ["ppUv", "PP UV", "US dollars per ton"],
                ["peRmPerT", "PE RM", "US dollars per ton"],
                ["uPanelXCornerExtra", "U+2 X-Corner extra", "Added to Circular X-Corner, US dollars per ton"],
              ] as const
            ).map(([key, label, hint]) => (
              <label
                key={key}
                className="flex min-w-0 flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4"
              >
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-[var(--text-muted)]">{hint}</span>
                <Field
                  type="number"
                  value={payload[key]}
                  onChange={(value) => patch({ [key]: num(value) })}
                />
              </label>
            ))}
          </div>
        )}

        {tab === "conversion" && (
          <div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--text-muted)]">Each row is one conversion formula in USD per ton.</p>
              <Button
                variant="outline"
                onClick={() =>
                  patch({
                    conversionRows: [
                      ...payload.conversionRows,
                      { design: "", loops: "", complication: "", rate: 0 },
                    ],
                  })
                }
              >
                Add row
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                    <th className="py-3 pr-3 font-medium">Bag design</th>
                    <th className="py-3 pr-3 font-medium">Loops</th>
                    <th className="py-3 pr-3 font-medium">Formula</th>
                    <th className="w-32 py-3 pr-3 font-medium">USD / ton</th>
                    <th className="w-20 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {payload.conversionRows.map((row, index) => (
                    <tr key={index} className="border-b border-[var(--border)] last:border-0">
                      {(["design", "loops", "complication"] as const).map((col) => (
                        <td key={col} className="py-2.5 pr-3">
                          <Field
                            value={row[col]}
                            onChange={(value) => {
                              const next = payload.conversionRows.slice()
                              next[index] = { ...row, [col]: value }
                              patch({ conversionRows: next })
                            }}
                          />
                        </td>
                      ))}
                      <td className="py-2.5 pr-3">
                        <Field
                          type="number"
                          value={row.rate}
                          onChange={(value) => {
                            const next = payload.conversionRows.slice()
                            next[index] = { ...row, rate: num(value) }
                            patch({ conversionRows: next })
                          }}
                        />
                      </td>
                      <td className="py-2.5">
                        <button
                          type="button"
                          className="text-xs text-[var(--error)]"
                          onClick={() =>
                            patch({ conversionRows: payload.conversionRows.filter((_, i) => i !== index) })
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "surcharges" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <RateList
              title="Surcharges · USD/t"
              rows={(
                [
                  ["usa", "USA market"],
                  ["foodGrade", "Food grade"],
                  ["shuttle8", "8-shuttle loom"],
                  ["attachment1", "1 attachment"],
                  ["attachment2", "2 attachments"],
                  ["twoLoop", "2-loop bag"],
                ] as const
              ).map(([key, label]) => [label, payload.surcharges[key] ?? 0] as const)}
              onRate={(label, value) => {
                const key = (
                  {
                    "USA market": "usa",
                    "Food grade": "foodGrade",
                    "8-shuttle loom": "shuttle8",
                    "1 attachment": "attachment1",
                    "2 attachments": "attachment2",
                    "2-loop bag": "twoLoop",
                  } as Record<string, string>
                )[label]
                if (!key) return
                patch({ surcharges: { ...payload.surcharges, [key]: value } })
              }}
            />
            <div className="space-y-8">
              <NamedRates
                title="Type C extra · USD/t"
                values={payload.typeCExtra}
                onChange={(typeCExtra) => patch({ typeCExtra })}
              />
              <NamedRates
                title="Minimum kg (warning only)"
                values={payload.minKg}
                onChange={(minKg) => patch({ minKg })}
              />
            </div>
          </div>
        )}

        {tab === "print" && (
          <div>
            <p className="mb-5 text-sm text-[var(--text-muted)]">
              Printing is USD per bag. The quote adds cliché plus the print type.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                    <th className="w-36 py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium">Under 500 bags</th>
                    <th className="py-3 font-medium">Over 500 bags</th>
                  </tr>
                </thead>
                <tbody>
                  {PRINT_ROWS.map((key) => (
                    <tr key={key} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2.5 pr-4">
                        <div className="text-sm font-medium">{key === "cliche" ? "Cliché" : key}</div>
                        <div className="mt-0.5 text-xs text-[var(--text-muted)]">USD / bag</div>
                      </td>
                      {(["lt500", "gt500"] as const).map((band) => (
                        <td key={band} className="py-2.5 pr-4 last:pr-0">
                          <Field
                            type="number"
                            step="0.01"
                            className="max-w-[12rem]"
                            value={payload.printMatrix[band]?.[key] ?? 0}
                            onChange={(value) =>
                              patch({
                                printMatrix: {
                                  ...payload.printMatrix,
                                  [band]: { ...payload.printMatrix[band], [key]: num(value) },
                                },
                              })
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "addons" && (
          <div>
            <div className="mb-5 flex justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  patch({
                    addons: [...payload.addons, { name: "", rate: 0, unit: "pcs", plusRm: null, bomHeading: null }],
                  })
                }
              >
                Add add-on
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                    <th className="py-3 pr-3 font-medium">Name</th>
                    <th className="w-32 py-3 pr-3 font-medium">Rate</th>
                    <th className="w-36 py-3 pr-3 font-medium">Unit</th>
                    <th className="w-32 py-3 pr-3 font-medium">Plus RM</th>
                    <th className="w-40 py-3 pr-3 font-medium">BOM heading</th>
                    <th className="w-20 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {payload.addons.map((row, index) => (
                    <tr key={index} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2.5 pr-3">
                        <Field
                          value={row.name}
                          onChange={(value) => {
                            const next = payload.addons.slice()
                            next[index] = { ...row, name: value }
                            patch({ addons: next })
                          }}
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <Field
                          type="number"
                          value={row.rate}
                          onChange={(value) => {
                            const next = payload.addons.slice()
                            next[index] = { ...row, rate: num(value) }
                            patch({ addons: next })
                          }}
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <select
                          className={select}
                          value={row.unit}
                          onChange={(event) => {
                            const next = payload.addons.slice()
                            next[index] = { ...row, unit: event.target.value }
                            patch({ addons: next })
                          }}
                        >
                          <option value="pcs">USD / bag</option>
                          <option value="per_ton">USD / t</option>
                        </select>
                      </td>
                      <td className="py-2.5 pr-3">
                        <select
                          className={select}
                          value={row.plusRm ?? ""}
                          onChange={(event) => {
                            const next = payload.addons.slice()
                            next[index] = { ...row, plusRm: event.target.value || null }
                            patch({ addons: next })
                          }}
                        >
                          <option value="">None</option>
                          <option value="PP">PP</option>
                          <option value="PE">PE</option>
                        </select>
                      </td>
                      <td className="py-2.5 pr-3">
                        <Field
                          value={row.bomHeading ?? ""}
                          onChange={(value) => {
                            const next = payload.addons.slice()
                            next[index] = { ...row, bomHeading: value || null }
                            patch({ addons: next })
                          }}
                        />
                      </td>
                      <td className="py-2.5">
                        <button
                          type="button"
                          className="text-xs text-[var(--error)]"
                          onClick={() => patch({ addons: payload.addons.filter((_, i) => i !== index) })}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}

function RateList({
  title,
  rows,
  onRate,
}: {
  title: string
  rows: ReadonlyArray<readonly [string, number]>
  onRate: (label: string, value: number) => void
}) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      <div className="grid gap-4">
        {rows.map(([label, value]) => (
          <label
            key={label}
            className="flex min-w-0 flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4"
          >
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-xs text-[var(--text-muted)]">US dollars per ton</span>
            <Field type="number" value={value} onChange={(next) => onRate(label, num(next))} />
          </label>
        ))}
      </div>
    </div>
  )
}

function NamedRates({
  title,
  values,
  onChange,
}: {
  title: string
  values: Record<string, number>
  onChange: (next: Record<string, number>) => void
}) {
  const entries = Object.entries(values)
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button type="button" className="text-sm text-[var(--navy)]" onClick={() => onChange({ ...values, "": 0 })}>
          Add
        </button>
      </div>
      <div className="grid gap-4">
        {entries.map(([key, value], index) => (
          <div
            key={`${key}-${index}`}
            className="grid min-w-0 gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
          >
            <label className="flex min-w-0 flex-col gap-2">
              <span className="text-sm font-medium">Name</span>
              <Field
                value={key}
                onChange={(nextName) => {
                  const next: Record<string, number> = {}
                  entries.forEach(([currentKey, currentValue], i) => {
                    next[i === index ? nextName : currentKey] = currentValue
                  })
                  onChange(next)
                }}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-2">
              <span className="text-sm font-medium">Rate</span>
              <Field type="number" value={value} onChange={(next) => onChange({ ...values, [key]: num(next) })} />
            </label>
            <button
              type="button"
              className="mb-2 text-xs text-[var(--error)]"
              onClick={() => {
                const next = { ...values }
                delete next[key]
                onChange(next)
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
