/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  defaultSpecification,
  type QuoteSpecification,
} from "@/types/quote"

const DRAFT_KEY = "quotecraft.draft.v9"

type DraftState = {
  specification: QuoteSpecification
  step: number
}

function loadDraft(): DraftState {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DraftState
      return {
        step: parsed.step || 1,
        specification: { ...defaultSpecification, ...parsed.specification },
      }
    }
  } catch {
    /* ignore */
  }
  return { specification: defaultSpecification, step: 1 }
}

function persist(state: DraftState) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(state))
}

type QuoteDraftContextValue = {
  specification: QuoteSpecification
  step: number
  setStep: (step: number) => void
  update: <K extends keyof QuoteSpecification>(
    key: K,
    value: QuoteSpecification[K],
  ) => void
  patch: (partial: Partial<QuoteSpecification>) => void
  reset: () => void
}

const QuoteDraftContext = createContext<QuoteDraftContextValue | null>(null)

export function QuoteDraftProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DraftState>(loadDraft)

  const setStep = useCallback((step: number) => {
    setState((prev) => {
      const next = { ...prev, step }
      persist(next)
      return next
    })
  }, [])

  const update = useCallback(
    <K extends keyof QuoteSpecification>(key: K, value: QuoteSpecification[K]) => {
      setState((prev) => {
        const next = {
          ...prev,
          specification: { ...prev.specification, [key]: value },
        }
        persist(next)
        return next
      })
    },
    [],
  )

  const patch = useCallback((partial: Partial<QuoteSpecification>) => {
    setState((prev) => {
      const next = {
        ...prev,
        specification: { ...prev.specification, ...partial },
      }
      persist(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    const next = { specification: defaultSpecification, step: 1 }
    persist(next)
    setState(next)
  }, [])

  const value = useMemo(
    () => ({
      specification: state.specification,
      step: state.step,
      setStep,
      update,
      patch,
      reset,
    }),
    [state.specification, state.step, setStep, update, patch, reset],
  )

  return (
    <QuoteDraftContext.Provider value={value}>{children}</QuoteDraftContext.Provider>
  )
}

export function useQuoteDraft() {
  const ctx = useContext(QuoteDraftContext)
  if (!ctx) throw new Error("useQuoteDraft must be used within QuoteDraftProvider")
  return ctx
}
