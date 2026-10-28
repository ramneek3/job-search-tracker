import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Backend } from '@/api/backend'
import type { ApplicationsRepo, User } from '@/api/types'
import { AuthContext, BackendContext } from '@/auth/context'

export const TEST_USER: User = { id: 'u1', email: 'test@example.com' }

/** Wraps components/hooks with a signed-in user, a fresh QueryClient and a router. */
export function createWrapper(repo: ApplicationsRepo, initialEntries = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const backend: Backend = {
    auth: {
      mode: 'demo',
      getUser: async () => TEST_USER,
      subscribe: () => () => {},
      signOut: async () => {},
    },
    repoFor: () => repo,
  }
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BackendContext.Provider value={backend}>
          <AuthContext.Provider value={{ status: 'authenticated', user: TEST_USER }}>
            <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
          </AuthContext.Provider>
        </BackendContext.Provider>
      </QueryClientProvider>
    )
  }
  return { Wrapper, queryClient }
}
