import { describe, expect, it } from 'vitest'
import { makeApp } from '@/test/factories'
import { createLocalRepo, memoryStorage } from './local-repo'

const setup = (failureRate = 0) =>
  createLocalRepo({
    storage: memoryStorage(),
    key: 'k',
    failureRate: () => failureRate,
    now: () => new Date('2026-10-28T00:00:00Z'),
  })

describe('createLocalRepo', () => {
  it('supports create, list, update and remove', async () => {
    const repo = setup()
    const app = makeApp()
    await repo.create(app)
    expect(await repo.list()).toHaveLength(1)

    const updated = await repo.update(app.id, { stage: 'offer' })
    expect(updated).toMatchObject({ stage: 'offer', updatedAt: '2026-10-28T00:00:00.000Z' })

    await repo.remove(app.id)
    expect(await repo.list()).toEqual([])
  })

  it('returns copies so callers cannot mutate stored data', async () => {
    const repo = setup()
    await repo.create(makeApp({ company: 'Original' }))
    const [first] = await repo.list()
    first!.company = 'Mutated'
    expect((await repo.list())[0]!.company).toBe('Original')
  })

  it('rejects duplicate ids and updates to missing records', async () => {
    const repo = setup()
    const app = makeApp()
    await repo.create(app)
    await expect(repo.create(app)).rejects.toThrow(/already exists/)
    await expect(repo.update('missing', {})).rejects.toThrow(/no longer exists/)
  })

  it('fails writes but not reads when the network is flaky', async () => {
    const repo = setup(1)
    await expect(repo.create(makeApp())).rejects.toThrow(/simulated/)
    await expect(repo.list()).resolves.toEqual([])
  })
})
