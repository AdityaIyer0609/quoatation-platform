import { Eye, EyeOff, Maximize2 } from "lucide-react"
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PREVIEW_SAMPLE_STEPS } from "@/lib/previewSample"
import { cn } from "@/lib/utils"
import type { QuoteSpecification } from "@/types/quote"

const BagPreviewCanvas = lazy(() => import("@/components/quote/BagPreviewCanvas"))
const LABELS_KEY = "bag-preview-labels"

function readLabelsPref() {
  try {
    return sessionStorage.getItem(LABELS_KEY) !== "off"
  } catch {
    return true
  }
}

function writeLabelsPref(on: boolean) {
  try {
    sessionStorage.setItem(LABELS_KEY, on ? "on" : "off")
  } catch {
    /* ignore */
  }
}

class PreviewErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode; resetKey: string },
  { failed: boolean; retries: number }
> {
  state = { failed: false, retries: 0 }
  timer: ReturnType<typeof setTimeout> | null = null

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    if (this.state.retries >= 4) return
    this.timer = setTimeout(() => {
      this.setState((s) => ({ failed: false, retries: s.retries + 1 }))
    }, 250)
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false, retries: 0 })
    }
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer)
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

function caption(spec: QuoteSpecification) {
  return `${spec.constructionType} · ${spec.length}×${spec.width}×${spec.height} cm · ${spec.topType} / ${spec.bottomType}`
}

function Stage({
  specification,
  className,
  fallbackClassName,
  interactive,
  showLabels = false,
}: {
  specification: QuoteSpecification
  className: string
  fallbackClassName: string
  interactive: boolean
  showLabels?: boolean
}) {
  return (
    <PreviewErrorBoundary
      resetKey={`${interactive ? "live" : "thumb"}-${showLabels ? "labels" : "plain"}-${specification.length}-${specification.width}-${specification.height}-${specification.bodyGsm}-${specification.topType}-${specification.bottomType}-${specification.topSpoutType}-${specification.bottomSpoutType}`}
      fallback={
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={cn("flex items-center justify-center px-4 text-center text-xs text-[var(--text-secondary)]", fallbackClassName)}
        >
          Preview hit an error. Click to reload.
        </button>
      }
    >
      <Suspense
        fallback={
          <div className={cn("flex items-center justify-center bg-[var(--navy-bg)] text-xs text-[var(--navy-muted)]", fallbackClassName)}>
            Loading bag preview…
          </div>
        }
      >
        <div className={cn("bg-[var(--navy-bg)]", className)}>
          <BagPreviewCanvas
            specification={specification}
            interactive={interactive}
            showLabels={showLabels}
            className="h-full w-full touch-none"
          />
        </div>
      </Suspense>
    </PreviewErrorBoundary>
  )
}

export function BagPreview3D({
  specification,
  compact = false,
  className,
  onApplySample,
}: {
  specification: QuoteSpecification
  compact?: boolean
  className?: string
  onApplySample?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const thumbH = compact ? "h-[168px]" : "h-[280px] sm:h-[320px]"

  useEffect(() => {
    setShowLabels(readLabelsPref())
  }, [])

  const toggleLabels = () => {
    setShowLabels((on) => {
      const next = !on
      writeLabelsPref(next)
      return next
    })
  }

  return (
    <>
      <div className={cn("overflow-hidden rounded-xl border border-[var(--navy-border)] bg-[var(--surface)]", className)}>
        <div className="relative">
          {open ? (
            <div className={cn("bg-[var(--navy-bg)]", thumbH)} />
          ) : (
            <Stage specification={specification} className={thumbH} fallbackClassName={thumbH} interactive={false} />
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute right-2 bottom-2 z-10"
            aria-label="Enlarge bag preview"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)]/90 px-2 py-1 text-[10px] font-medium text-[var(--navy)] shadow-sm">
              <Maximize2 className="size-3" />
              Enlarge
            </span>
          </button>
        </div>
        <div className="border-t border-[var(--navy-border)] bg-[var(--surface)] px-4 py-2.5">
          <div className="font-heading line-clamp-2 text-xs font-semibold tracking-tight text-[var(--navy)]">{caption(specification)}</div>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Click Enlarge · drag to rotate in the drawer</p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-0 right-0 left-auto h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none p-0 sm:max-w-[640px] sm:rounded-l-2xl">
          <DialogHeader className="border-b border-[var(--navy-border)] px-5 py-4 pr-12">
            <DialogTitle>Bag preview</DialogTitle>
            <DialogDescription>{caption(specification)}</DialogDescription>
          </DialogHeader>
          <div className="px-5 pt-4">
            <div className="relative overflow-hidden rounded-xl border border-[var(--navy-border)]">
              <Stage
                specification={specification}
                className="h-[min(62dvh,560px)]"
                fallbackClassName="h-[420px]"
                interactive
                showLabels={showLabels}
              />
              <button
                type="button"
                onClick={toggleLabels}
                className="absolute right-2 bottom-2 z-10"
                aria-pressed={showLabels}
                aria-label={showLabels ? "Hide dimension labels" : "Show dimension labels"}
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)]/90 px-2 py-1 text-[10px] font-medium text-[var(--navy)] shadow-sm">
                  {showLabels ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  {showLabels ? "Hide labels" : "Show labels"}
                </span>
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              Drag any direction to orbit (top, sides, or bottom). Scroll to zoom. Right-drag to pan.
            </p>
          </div>
          <div className="px-5 py-4">
            <div className="font-heading text-xs font-semibold text-[var(--navy)]">Example input flow</div>
            <ol className="mt-2 space-y-2">
              {PREVIEW_SAMPLE_STEPS.map((item) => (
                <li key={item.step} className="text-xs leading-5 text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text)]">{item.step}</span>
                  <span className="block">{item.detail}</span>
                </li>
              ))}
            </ol>
            {onApplySample ? (
              <Button
                type="button"
                className="font-heading mt-4 h-auto w-full rounded-md bg-[var(--navy)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--navy-hover)]"
                onClick={() => {
                  onApplySample()
                  setOpen(true)
                }}
              >
                Apply this sample to the form
              </Button>
            ) : (
              <p className="mt-3 text-[11px] text-[var(--text-muted)]">
                Apply the sample from New Quote so the spinner can follow live fields.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
