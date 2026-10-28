import { lazy } from 'react'
import { Navigate, createBrowserRouter } from 'react-router'
import { RequireAuth } from '@/auth/RequireAuth'
import { AppLayout } from '@/components/AppLayout'
import { NotFoundPage, RouteErrorPage } from '@/pages/ErrorPages'
// Eager: it's the landing page and only ~2 KB, so a lazy chunk would just add a round trip.
import LoginPage from '@/pages/LoginPage'

// Route-level code splitting: the charts library only loads on /analytics, etc.
const BoardPage = lazy(() => import('@/pages/BoardPage'))
const TablePage = lazy(() => import('@/pages/TablePage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/board" replace /> },
          { path: 'board', element: <BoardPage /> },
          { path: 'table', element: <TablePage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
