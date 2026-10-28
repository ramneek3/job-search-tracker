import { Suspense } from 'react'
import { RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import type { Backend } from '@/api/backend'
import { AuthProvider } from '@/auth/AuthProvider'
import { useApplyTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/ui'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
})

export function App({ backend }: { backend: Backend }) {
  useApplyTheme()
  const theme = useUiStore((s) => s.theme)
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider backend={backend}>
        <Suspense fallback={null}>
          <RouterProvider router={router} />
        </Suspense>
        <Toaster position="bottom-right" theme={theme} closeButton richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}
