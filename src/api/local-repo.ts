import type { Application, ApplicationPatch } from '@/lib/schema'
import { ApiError, type ApplicationsRepo } from './types'

export interface LocalRepoOptions {
  storage: Pick<Storage, 'getItem' | 'setItem'>
  key: string
  /** Milliseconds to wait before each call, to make loading states and races visible. */
  latency?: () => number
  /** 0–1 probability that a write fails — used to demo optimistic rollback. */
  failureRate?: () => number
  now?: () => Date
}

/**
 * A fake backend over localStorage. It deliberately behaves like a network API:
 * async, optionally slow, optionally flaky, and it returns copies rather than
 * references so the UI can't accidentally mutate "server" state.
 */
export function createLocalRepo({
  storage,
  key,
  latency = () => 0,
  failureRate = () => 0,
  now = () => new Date(),
}: LocalRepoOptions): ApplicationsRepo {
  const read = (): Application[] => {
    try {
      return JSON.parse(storage.getItem(key) ?? '[]') as Application[]
    } catch {
      return []
    }
  }
  const write = (apps: Application[]) => storage.setItem(key, JSON.stringify(apps))

  const network = async (isWrite: boolean) => {
    const ms = latency()
    if (ms > 0) await new Promise((r) => setTimeout(r, ms))
    if (isWrite && Math.random() < failureRate())
      throw new ApiError('Network request failed (simulated)')
  }
  const clone = <T>(v: T): T => structuredClone(v)

  return {
    async list() {
      await network(false)
      return clone(read())
    },
    async create(app) {
      return (await this.createMany([app]))[0]!
    },
    async createMany(newApps) {
      await network(true)
      const ts = now().toISOString()
      const all = read()
      const existing = new Set(all.map((a) => a.id))
      const created = newApps.map((a) => ({ ...a, createdAt: a.createdAt || ts, updatedAt: ts }))
      if (created.some((a) => existing.has(a.id)))
        throw new ApiError('An application with this id already exists')
      write([...all, ...created])
      return clone(created)
    },
    async update(id: string, patch: ApplicationPatch) {
      await network(true)
      const all = read()
      const i = all.findIndex((a) => a.id === id)
      if (i === -1) throw new ApiError('That application no longer exists')
      const updated = { ...all[i]!, ...patch, id, updatedAt: now().toISOString() }
      all[i] = updated
      write(all)
      return clone(updated)
    },
    async remove(id) {
      await network(true)
      write(read().filter((a) => a.id !== id))
    },
  }
}

/** In-memory Storage for tests. */
export function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  }
}
