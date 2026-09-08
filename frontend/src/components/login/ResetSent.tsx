import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"

type ResetSentProps = {
  email: string
  onBack: () => void
}

export function ResetSent({ email, onBack }: ResetSentProps) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-[var(--success-border)] bg-[var(--success-bg)]">
        <Check className="size-5 text-[var(--success)]" strokeWidth={2} />
      </div>
      <h2 className="font-heading mb-2 text-xl font-bold">Check your inbox</h2>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        We&apos;ve sent a reset link to <strong>{email}</strong>
      </p>
      <Button
        type="button"
        variant="link"
        onClick={onBack}
        className="h-auto p-0 text-sm font-medium text-[var(--navy)]"
      >
        ← Back to sign in
      </Button>
    </div>
  )
}
