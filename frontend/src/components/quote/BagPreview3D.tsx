import { Maximize2 } from "lucide-react"
import { Component, lazy, Suspense, useState, type ReactNode } from "react"

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

class PreviewErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
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
}: {
  specification: QuoteSpecification
  className: string
  fallbackClassName: string
  interactive: boolean
}) {
  return (
    <PreviewErrorBoundary
      fallback={
        <div className={cn("flex items-center justify-center px-4 text-center text-xs text-[var(--text-secondary)]", fallbackClassName)}>
          3D preview needs WebGL in this browser.
        </div>
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
          <BagPreviewCanvas specification={specification} interactive={interactive} className="h-full w-full touch-none" />
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
  const thumbH = compact ? "h-[168px]" : "h-[280px] sm:h-[320px]"

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
            <div className="overflow-hidden rounded-xl border border-[var(--navy-border)]">
              <Stage specification={specification} className="h-[min(62dvh,560px)]" fallbackClassName="h-[420px]" interactive />
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
