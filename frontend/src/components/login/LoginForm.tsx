import type { FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { fieldClassName } from "@/components/login/fieldStyles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type LoginFormProps = {
  email: string
  password: string
  loading: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onForgotPassword: () => void
  onSubmit: (event: FormEvent) => void
}

export function LoginForm({
  email,
  password,
  loading,
  onEmailChange,
  onPasswordChange,
  onForgotPassword,
  onSubmit,
}: LoginFormProps) {
  return (
    <>
      <h2 className="font-heading mb-1.5 text-2xl font-bold">Welcome back</h2>
      <p className="mb-8 text-sm text-[var(--text-secondary)]">
        Sign in to your account to continue
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label
            htmlFor="email"
            className="font-heading mb-1.5 text-xs text-[var(--text-secondary)]"
          >
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
            className={fieldClassName}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label
              htmlFor="password"
              className="font-heading text-xs text-[var(--text-secondary)]"
            >
              Password
            </Label>
            <Button
              type="button"
              variant="link"
              onClick={onForgotPassword}
              className="h-auto p-0 text-xs text-[var(--navy)]"
            >
              Forgot password?
            </Button>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
            className={fieldClassName}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-auto w-full gap-2 rounded-2xl bg-[var(--navy)] py-3 font-heading text-sm font-semibold text-white shadow-[var(--shadow-navy)] hover:bg-[var(--navy-hover)] disabled:bg-[var(--navy-muted)]"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
        Don&apos;t have an account?{" "}
        <a href="#" className="font-medium text-[var(--navy)]">
          Contact your account manager
        </a>
      </p>
    </>
  )
}
