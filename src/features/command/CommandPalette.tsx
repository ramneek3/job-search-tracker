import { Command } from 'cmdk'
import { useNavigate } from 'react-router'
import { BarChart3, Download, KanbanSquare, Moon, Plus, Sun, Table2, Upload } from 'lucide-react'
import { useApplications } from '@/hooks/useApplications'
import { useDataActions } from '@/hooks/useDataActions'
import { useEditor } from '@/hooks/useEditor'
import { useUiStore } from '@/stores/ui'
import { StageBadge } from '@/components/ui/badge'
import type { ReactNode } from 'react'

const groupClass =
  '[&_[cmdk-group-heading]]:text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium'

function Item({
  children,
  onSelect,
  value,
}: {
  children: ReactNode
  onSelect: () => void
  value?: string
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="data-[selected=true]:bg-muted flex cursor-default items-center gap-2 rounded-md px-2 py-2 text-sm"
    >
      {children}
    </Command.Item>
  )
}

export default function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen)
  const setOpen = useUiStore((s) => s.setCommandOpen)
  const { theme, setTheme } = useUiStore()
  const navigate = useNavigate()
  const editor = useEditor()
  const { data: apps = [] } = useApplications()
  const data = useDataActions()

  const run = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }
  const isDark =
    theme === 'dark' || (theme === 'system' && document.documentElement.classList.contains('dark'))

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command menu"
      overlayClassName="fixed inset-0 z-40 bg-black/40"
      contentClassName="surface fixed top-[15vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl shadow-2xl"
    >
      <Command.Input
        placeholder="Type a command or search applications…"
        className="border-base w-full border-b bg-transparent px-4 py-3 text-sm outline-none"
      />
      <Command.List className="max-h-[50vh] overflow-y-auto p-2">
        <Command.Empty className="text-muted py-6 text-center text-sm">No results.</Command.Empty>
        <Command.Group heading="Actions" className={groupClass}>
          <Item onSelect={run(() => editor.openNew())}>
            <Plus className="size-4" aria-hidden /> New application
            <kbd className="text-muted ml-auto text-xs">N</kbd>
          </Item>
          <Item onSelect={run(() => setTheme(isDark ? 'light' : 'dark'))}>
            {isDark ? (
              <Sun className="size-4" aria-hidden />
            ) : (
              <Moon className="size-4" aria-hidden />
            )}
            Switch to {isDark ? 'light' : 'dark'} theme
          </Item>
          <Item onSelect={run(data.exportCSV)}>
            <Download className="size-4" aria-hidden /> Export CSV
          </Item>
          <Item onSelect={run(data.chooseImportFile)}>
            <Upload className="size-4" aria-hidden /> Import CSV
          </Item>
        </Command.Group>
        <Command.Group heading="Go to" className={groupClass}>
          <Item onSelect={run(() => navigate('/board'))}>
            <KanbanSquare className="size-4" aria-hidden /> Board
          </Item>
          <Item onSelect={run(() => navigate('/table'))}>
            <Table2 className="size-4" aria-hidden /> Table
          </Item>
          <Item onSelect={run(() => navigate('/analytics'))}>
            <BarChart3 className="size-4" aria-hidden /> Analytics
          </Item>
        </Command.Group>
        <Command.Group heading="Applications" className={groupClass}>
          {apps.slice(0, 500).map((a) => (
            <Item
              key={a.id}
              value={`${a.company} ${a.role} ${a.id}`}
              onSelect={run(() => editor.open(a.id))}
            >
              <span className="truncate font-medium">{a.company}</span>
              <span className="text-muted truncate">{a.role}</span>
              <StageBadge stage={a.stage} className="ml-auto" />
            </Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
