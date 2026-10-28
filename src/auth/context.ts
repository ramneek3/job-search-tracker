import { createContext, useContext } from 'react'
import type { Backend } from '@/api/backend'
import type { ApplicationsRepo, User } from '@/api/types'

export type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'anonymous'; user: null }
  | { status: 'authenticated'; user: User }

export const BackendContext = createContext<Backend | null>(null)
export const AuthContext = createContext<AuthState>({ status: 'loading', user: null })

export function useBackend(): Backend {
  const b = useContext(BackendContext)
  if (!b) throw new Error('useBackend must be used inside <AppProviders>')
  return b
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

/** The current user and their repository. Only call below <RequireAuth>. */
export function useSession(): { user: User; repo: ApplicationsRepo } {
  const backend = useBackend()
  const auth = useAuth()
  if (auth.status !== 'authenticated') throw new Error('useSession requires a signed-in user')
  return { user: auth.user, repo: backend.repoFor(auth.user) }
}
