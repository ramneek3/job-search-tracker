import { Link, isRouteErrorResponse, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      {children}
    </main>
  )
}

export function NotFoundPage() {
  return (
    <Shell title="Page not found">
      <p className="text-muted text-sm">That page doesn't exist.</p>
      <Link to="/board" className="text-brand-600 text-sm font-medium hover:underline">
        Back to your board
      </Link>
    </Shell>
  )
}

/** Route-level error boundary: a crash in one view never blanks the whole app. */
export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error'
  return (
    <Shell title="Something went wrong">
      <p className="text-muted max-w-md text-sm">{message}</p>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </Shell>
  )
}
