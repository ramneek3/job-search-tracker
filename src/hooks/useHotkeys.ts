import { useEffect } from 'react'

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

/**
 * Global single-key shortcuts. `mod+k` means ⌘K on macOS and Ctrl+K elsewhere.
 * Bare keys are ignored while typing in a field or when a dialog is open.
 */
export function useHotkeys(map: Record<string, (e: KeyboardEvent) => void>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const key = `${mod ? 'mod+' : ''}${e.key.toLowerCase()}`
      const handler = map[key]
      if (!handler) return
      if (!mod && (isTyping(e.target) || document.querySelector('[role="dialog"]'))) return
      e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [map])
}
