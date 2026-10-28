import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Backend } from '@/api/backend'
import { AuthContext, BackendContext, type AuthState } from './context'

export function AuthProvider({ backend, children }: { backend: Backend; children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null })
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true
    backend.auth.getUser().then((user) => {
      if (active)
        setState(user ? { status: 'authenticated', user } : { status: 'anonymous', user: null })
    })
    const unsubscribe = backend.auth.subscribe((user) => {
      // Never let one user's cached data leak into the next session.
      queryClient.clear()
      setState(user ? { status: 'authenticated', user } : { status: 'anonymous', user: null })
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [backend, queryClient])

  return (
    <BackendContext.Provider value={backend}>
      <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
    </BackendContext.Provider>
  )
}
