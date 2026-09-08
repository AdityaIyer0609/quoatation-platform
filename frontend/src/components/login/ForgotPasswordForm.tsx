import type { FormEvent } from "react"
import { ChevronLeft, Loader2 } from "lucide-react"

import { fieldClassName } from "@/components/login/fieldStyles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ForgotPasswordFormProps = {
  email: string
  loading: boolean
  onBack: () => void
  onEmailChange: (value: string) => void
  onSubmit: (event: FormEvent) => void
}

export function ForgotPasswordForm({
  email,
  loading,
  onBack,
  onEmailChange,
  onSubmit,
}: ForgotPasswordFormProps) {
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="mb-8 h-auto gap-1.5 p-0 text-xs text-[var(--text-secondary)] hover:bg-transparent hover:text-[var(--text-secondary)]"
      >
        <ChevronLeft className="size-3.5" />
        Back to sign in
      </Button>
      <h2 className="font-heading mb-1.5 text-2xl font-bold">Reset password</h2>
      <p className="mb-8 text-sm text-[var(--text-secondary)]">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label
            htmlFor="reset-email"
            className="font-heading mb-1.5 text-xs text-[var(--text-secondary)]"
          >
            Email address
          </Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            autoComplete="email"
            required
            className={fieldClassName}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-auto w-full gap-2 rounded-md bg-[var(--navy)] py-2.5 font-heading text-sm font-semibold text-white hover:bg-[var(--navy-hover)] disabled:bg-[var(--navy-muted)]"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>
    </>
  )
}
