import { useEffect } from 'react'
import { useUiStore } from '@/stores/ui'

/** Keeps the `dark` class on <html> in sync with the chosen theme and the OS setting. */
export function useApplyTheme() {
  const theme = useUiStore((s) => s.theme)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () =>
      document.documentElement.classList.toggle(
        'dark',
        theme === 'dark' || (theme === 'system' && mq.matches),
      )
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}
