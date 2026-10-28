import { act, renderHook } from '@testing-library/react'
import { useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { createLocalRepo, memoryStorage } from '@/api/local-repo'
import { createWrapper } from '@/test/render'
import { useDebouncedValue } from './useDebouncedValue'
import { useEditor } from './useEditor'
import { useFilters } from './useFilters'
import { useHotkeys } from './useHotkeys'

const repo = createLocalRepo({ storage: memoryStorage(), key: 'k' })

function useWithLocation<T>(hook: () => T) {
  return function useHarness() {
    return { value: hook(), search: useLocation().search }
  }
}

describe('useFilters', () => {
  it('reads filters from the URL and writes changes back', () => {
    const { Wrapper } = createWrapper(repo, ['/table?stage=offer&app=1'])
    const { result } = renderHook(useWithLocation(useFilters), { wrapper: Wrapper })
    expect(result.current.value[0].stages).toEqual(['offer'])

    act(() => result.current.value[1]({ q: 'react', sources: ['referral'] }))
    expect(result.current.search).toBe('?stage=offer&app=1&q=react&source=referral')

    act(() => result.current.value[1]((f) => ({ stages: [...f.stages, 'interview'] })))
    expect(result.current.value[0].stages).toEqual(['offer', 'interview'])
  })
})

describe('useEditor', () => {
  it('opens and closes the editor through the URL, keeping filters', () => {
    const { Wrapper } = createWrapper(repo, ['/board?q=x'])
    const { result } = renderHook(useWithLocation(useEditor), { wrapper: Wrapper })
    expect(result.current.value.isOpen).toBe(false)

    act(() => result.current.value.open('abc'))
    expect(result.current.value).toMatchObject({ editingId: 'abc', isOpen: true })
    expect(result.current.search).toBe('?q=x&app=abc')

    act(() => result.current.value.openNew('offer'))
    expect(result.current.value).toMatchObject({ editingId: null, newStage: 'offer' })

    act(() => result.current.value.close())
    expect(result.current.search).toBe('?q=x')
  })

  it('falls back to Applied for an unknown ?new= stage', () => {
    const { Wrapper } = createWrapper(repo, ['/board?new=bogus'])
    const { result } = renderHook(useEditor, { wrapper: Wrapper })
    expect(result.current.newStage).toBe('applied')
  })
})

describe('useHotkeys', () => {
  const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = window) =>
    act(
      () =>
        void target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init })),
    )

  it('fires bare keys only outside text fields, and mod+key everywhere', () => {
    const n = vi.fn()
    const k = vi.fn()
    renderHook(() => useHotkeys({ n, 'mod+k': k }))
    const input = document.body.appendChild(document.createElement('input'))

    press('n')
    press('n', {}, input)
    press('k', { metaKey: true }, input)
    press('k', { ctrlKey: true })

    expect(n).toHaveBeenCalledTimes(1)
    expect(k).toHaveBeenCalledTimes(2)
    input.remove()
  })
})

describe('useDebouncedValue', () => {
  it('only updates after the value settles', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 200), {
      initialProps: { v: 'a' },
    })
    rerender({ v: 'ab' })
    rerender({ v: 'abc' })
    expect(result.current).toBe('a')
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('abc')
    vi.useRealTimers()
  })
})
