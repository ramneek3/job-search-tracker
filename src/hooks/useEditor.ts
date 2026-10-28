import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { STAGES } from '@/lib/constants'
import type { Stage } from '@/lib/schema'

/**
 * The editor's open/closed state lives in the URL (?app=<id> or ?new=<stage>),
 * so an open application is linkable and the back button closes it.
 */
export function useEditor() {
  const [params, setParams] = useSearchParams()
  const editingId = params.get('app')
  const rawNew = params.get('new')
  const newStage =
    rawNew !== null
      ? (STAGES as readonly string[]).includes(rawNew)
        ? (rawNew as Stage)
        : 'applied'
      : null

  const update = useCallback(
    (fn: (p: URLSearchParams) => void, replace = false) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('app')
          next.delete('new')
          fn(next)
          return next
        },
        { replace },
      ),
    [setParams],
  )

  return {
    editingId,
    newStage,
    isOpen: editingId !== null || newStage !== null,
    open: useCallback((id: string) => update((p) => p.set('app', id)), [update]),
    openNew: useCallback(
      (stage: Stage = 'applied') => update((p) => p.set('new', stage)),
      [update],
    ),
    close: useCallback(() => update(() => {}, true), [update]),
  }
}
