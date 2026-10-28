import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './context'

export function RequireAuth() {
  const auth = useAuth()
  const location = useLocation()
  if (auth.status === 'loading') {
    return (
      <div className="flex h-dvh items-center justify-center" role="status" aria-label="Loading" />
    )
  }
  if (auth.status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}
