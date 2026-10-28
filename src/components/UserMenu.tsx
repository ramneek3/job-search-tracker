import { Download, FlaskConical, LogOut, Monitor, Moon, Settings2, Sun, Upload } from 'lucide-react'
import { useBackend, useSession } from '@/auth/context'
import { useDataActions } from '@/hooks/useDataActions'
import { useUiStore, type Theme } from '@/stores/ui'
import { Button } from './ui/button'
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from './ui/menu'

export function UserMenu() {
  const { auth } = useBackend()
  const { user } = useSession()
  const data = useDataActions()
  const { theme, setTheme, slowNetwork, setSlowNetwork, failureRate, setFailureRate } = useUiStore()

  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings and data">
          <Settings2 className="size-4" />
        </Button>
      </MenuTrigger>
      <MenuContent className="w-64">
        <MenuLabel className="truncate">{user.email}</MenuLabel>
        <MenuSeparator />
        <MenuLabel>Theme</MenuLabel>
        <MenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          <MenuRadioItem value="light">
            <Sun className="size-4" aria-hidden /> Light
          </MenuRadioItem>
          <MenuRadioItem value="dark">
            <Moon className="size-4" aria-hidden /> Dark
          </MenuRadioItem>
          <MenuRadioItem value="system">
            <Monitor className="size-4" aria-hidden /> System
          </MenuRadioItem>
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuItem onSelect={data.exportCSV}>
          <Download className="size-4" aria-hidden /> Export CSV
        </MenuItem>
        <MenuItem onSelect={data.chooseImportFile}>
          <Upload className="size-4" aria-hidden /> Import CSV
        </MenuItem>
        {data.isDemo && (
          <>
            <MenuSeparator />
            <MenuLabel className="flex items-center gap-1.5">
              <FlaskConical className="size-3.5" aria-hidden /> Demo controls
            </MenuLabel>
            <MenuCheckboxItem
              checked={slowNetwork}
              onCheckedChange={setSlowNetwork}
              onSelect={(e) => e.preventDefault()}
            >
              Simulate network latency
            </MenuCheckboxItem>
            <MenuLabel>Failed saves</MenuLabel>
            <MenuRadioGroup
              value={String(failureRate)}
              onValueChange={(v) => setFailureRate(Number(v))}
            >
              <MenuRadioItem value="0">Never</MenuRadioItem>
              <MenuRadioItem value="0.3">30% of saves</MenuRadioItem>
              <MenuRadioItem value="1">Every save</MenuRadioItem>
            </MenuRadioGroup>
            <MenuSeparator />
            <MenuItem onSelect={() => data.resetDemo('sample')}>Reset sample data</MenuItem>
            <MenuItem onSelect={() => data.resetDemo('stress')}>
              Load 2,000 rows (stress test)
            </MenuItem>
            <MenuItem onSelect={() => data.resetDemo('empty')}>Clear all data</MenuItem>
          </>
        )}
        <MenuSeparator />
        <MenuItem onSelect={() => auth.signOut()}>
          <LogOut className="size-4" aria-hidden /> Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}
