import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { createLocalRepo, memoryStorage } from '@/api/local-repo'
import type { ApplicationsRepo } from '@/api/types'
import { makeApp } from '@/test/factories'
import { createWrapper, TEST_USER } from '@/test/render'
import type { Application } from '@/lib/schema'
import {
  applicationsKey,
  useApplications,
  useDeleteApplication,
  useMoveApplication,
} from './useApplications'

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

/** A repo whose writes wait until we release them, so we can observe the optimistic state. */
function controllableRepo(seed: Application[], { fail = false } = {}) {
  const inner = createLocalRepo({ storage: memoryStorage(), key: 'k' })
  let release!: () => void
  const gate = new Promise<void>((r) => (release = r))
  const repo: ApplicationsRepo = {
    ...inner,
    list: () => inner.list(),
    update: async (id, patch) => {
      await gate
      if (fail) throw new Error('boom')
      return inner.update(id, patch)
    },
    remove: async (id) => {
      await gate
      return inner.remove(id)
    },
  }
  return { repo, release, ready: inner.createMany(seed) }
}

function useHarness() {
  return { list: useApplications(), move: useMoveApplication(), remove: useDeleteApplication() }
}

describe('optimistic mutations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('moves a card instantly, then keeps it once the server confirms', async () => {
    const app = makeApp({ stage: 'applied' })
    const { repo, release, ready } = controllableRepo([app])
    await ready
    const { Wrapper } = createWrapper(repo)
    const { result } = renderHook(useHarness, { wrapper: Wrapper })
    await waitFor(() => expect(result.current.list.data).toHaveLength(1))

    act(() => result.current.move.mutate({ app, stage: 'interview', position: 5 }))
    // Optimistic: updated before the request resolves.
    await waitFor(() =>
      expect(result.current.list.data?.[0]).toMatchObject({ stage: 'interview', position: 5 }),
    )
    expect(result.current.list.data?.[0]!.history.at(-1)?.stage).toBe('interview')

    release()
    await waitFor(() => expect(result.current.move.isSuccess).toBe(true))
    expect((await repo.list())[0]!.stage).toBe('interview')
  })

  it('rolls back and tells the user when the save fails', async () => {
    const app = makeApp({ company: 'Figma', stage: 'applied' })
    const { repo, release, ready } = controllableRepo([app], { fail: true })
    await ready
    const { Wrapper, queryClient } = createWrapper(repo)
    const { result } = renderHook(useHarness, { wrapper: Wrapper })
    await waitFor(() => expect(result.current.list.data).toHaveLength(1))

    act(() => result.current.move.mutate({ app, stage: 'offer', position: 1 }))
    await waitFor(() => expect(result.current.list.data?.[0]!.stage).toBe('offer'))

    release()
    await waitFor(() => expect(result.current.move.isError).toBe(true))
    expect(queryClient.getQueryData<Application[]>(applicationsKey(TEST_USER.id))?.[0]!.stage).toBe(
      'applied',
    )
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Couldn't move Figma to Offer"),
      expect.anything(),
    )
  })

  it('deletes optimistically and offers an undo that restores the same record', async () => {
    const app = makeApp({ company: 'Linear' })
    const { repo, release, ready } = controllableRepo([app])
    await ready
    release()
    const { Wrapper } = createWrapper(repo)
    const { result } = renderHook(useHarness, { wrapper: Wrapper })
    await waitFor(() => expect(result.current.list.data).toHaveLength(1))

    act(() => result.current.remove.mutate(app))
    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true))
    expect(result.current.list.data).toEqual([])

    const [message, options] = vi.mocked(toast).mock.calls[0]!
    expect(message).toBe('Deleted Linear')
    act(() => (options as unknown as { action: { onClick: () => void } }).action.onClick())
    await waitFor(() => expect(result.current.list.data?.map((a) => a.id)).toEqual([app.id]))
  })
})
