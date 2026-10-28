import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Github, Loader2, Sparkles } from 'lucide-react'
import { useAuth, useBackend } from '@/auth/context'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Logo } from '@/components/Logo'

export default function LoginPage() {
  const { auth } = useBackend()
  const state = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/board'
  const [busy, setBusy] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState<string | null>(null)

  if (state.status === 'authenticated') return <Navigate to={from} replace />

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key)
    setError(null)
    try {
      await fn()
      navigate(from, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    if (mode === 'signin') return run('password', () => auth.signInWithPassword!(email, password))
    setBusy('password')
    auth.signUp!(email, password)
      .then(({ needsConfirmation }) => {
        if (needsConfirmation) toast.success('Check your inbox to confirm your email')
        else navigate(from, { replace: true })
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(null))
  }

  return (
    <main className="bg-subtle flex min-h-dvh items-center justify-center p-4">
      <div className="surface w-full max-w-sm rounded-2xl p-6 shadow-sm sm:p-8">
        <Logo />
        <h1 className="mt-6 text-xl font-semibold tracking-tight">
          Track every application, wishlist to offer
        </h1>
        <p className="text-muted mt-1 text-sm">
          A Kanban board, table and analytics for your internship search.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300"
          >
            {error}
          </p>
        )}

        {auth.mode === 'demo' ? (
          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="primary"
              onClick={() => run('sample', () => auth.enterDemo!('sample'))}
              disabled={!!busy}
            >
              {busy === 'sample' ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
              Explore with sample data
            </Button>
            <Button onClick={() => run('empty', () => auth.enterDemo!('empty'))} disabled={!!busy}>
              Start with an empty board
            </Button>
            <p className="text-muted mt-3 text-xs">
              No account needed: demo data stays in this browser. Connect Supabase (see README) for
              real accounts and sync.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
              <Field label="Email">
                {(a) => <Input {...a} name="email" type="email" autoComplete="email" required />}
              </Field>
              <Field
                label="Password"
                hint={mode === 'signup' ? 'At least 8 characters' : undefined}
              >
                {(a) => (
                  <Input
                    {...a}
                    name="password"
                    type="password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    minLength={8}
                    required
                  />
                )}
              </Field>
              <Button type="submit" variant="primary" disabled={!!busy}>
                {busy === 'password' && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>
            <Button
              className="mt-2 w-full"
              onClick={() => run('github', () => auth.signInWithGitHub!())}
              disabled={!!busy}
            >
              <Github className="size-4" aria-hidden /> Continue with GitHub
            </Button>
            <p className="text-muted mt-4 text-center text-sm">
              {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
              <button
                type="button"
                className="text-brand-600 dark:text-brand-100 cursor-pointer font-medium underline-offset-2 hover:underline"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              >
                {mode === 'signin' ? 'Create an account' : 'Sign in'}
              </button>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
