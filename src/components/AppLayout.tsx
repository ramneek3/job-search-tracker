import { NavLink, Outlet, useLocation } from 'react-router'
import { BarChart3, Command, KanbanSquare, Plus, Table2 } from 'lucide-react'
import { Suspense, lazy, useMemo } from 'react'
import { useBackend } from '@/auth/context'
import { useEditor } from '@/hooks/useEditor'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'
import { useHotkeys } from '@/hooks/useHotkeys'
import { Button } from './ui/button'
import { Logo } from './Logo'
import { PageSkeleton } from './PageSkeleton'
import { UserMenu } from './UserMenu'

// The form (react-hook-form + zod) and palette (cmdk) load on first use.
const ApplicationSheet = lazy(() => import('@/features/applications/ApplicationSheet'))
const CommandPalette = lazy(() => import('@/features/command/CommandPalette'))

const NAV = [
  { to: '/board', label: 'Board', icon: KanbanSquare },
  { to: '/table', label: 'Table', icon: Table2 },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AppLayout() {
  const { auth } = useBackend()
  const editor = useEditor()
  const { openNew } = editor
  const commandOpen = useUiStore((s) => s.commandOpen)
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)
  const hotkeys = useMemo(
    () => ({
      'mod+k': () => setCommandOpen(!useUiStore.getState().commandOpen),
      n: () => openNew(),
    }),
    [setCommandOpen, openNew],
  )
  useHotkeys(hotkeys)
  const { search } = useLocation()
  // Carry filters across views, but not the open editor.
  const carried = new URLSearchParams(search)
  carried.delete('app')
  carried.delete('new')
  const qs = carried.toString() ? `?${carried}` : ''

  return (
    <div className="flex h-dvh flex-col">
      <a
        href="#main"
        className="bg-brand-600 sr-only z-50 rounded-md px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      {auth.mode === 'demo' && (
        <p className="bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-100 px-4 py-1.5 text-center text-xs">
          Demo mode: your data is stored in this browser only. Use the ⚙ menu to simulate slow or
          failing saves.
        </p>
      )}
      <header className="border-base flex items-center gap-2 border-b px-4 py-2.5 sm:gap-4 sm:px-6">
        <Logo />
        <nav aria-label="Views" className="flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={`${to}${qs}`}
              className={({ isActive }) =>
                cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-muted' : 'text-muted hover:bg-subtle hover:text-[var(--fg)]',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
              <span className="sr-only sm:hidden">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted hidden md:inline-flex"
            onClick={() => setCommandOpen(true)}
            aria-keyshortcuts="Meta+K Control+K"
          >
            <Command className="size-3.5" aria-hidden />
            <span>Search or jump…</span>
            <kbd className="border-base rounded border px-1 text-[10px]">⌘K</kbd>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => editor.openNew()}
            aria-keyshortcuts="N"
          >
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">New</span>
            <span className="sr-only sm:hidden">New application</span>
          </Button>
          <UserMenu />
        </div>
      </header>
      <main id="main" className="flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        {editor.isOpen && <ApplicationSheet />}
        {commandOpen && <CommandPalette />}
      </Suspense>
    </div>
  )
}
