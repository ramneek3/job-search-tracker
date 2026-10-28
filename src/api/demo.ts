import type { Application } from '@/lib/schema'
import { createLocalRepo } from './local-repo'
import { generateApplications } from './seed'
import type { ApplicationsRepo, AuthService, User } from './types'
import { useUiStore } from '@/stores/ui'

const SESSION_KEY = 'pipeline:demo-session'
const DATA_KEY = 'pipeline:demo-data'

const DEMO_USER: User = { id: 'demo', email: 'demo@pipeline.app' }

/** Realistic-feeling latency (120–450ms) when the "slow network" toggle is on. */
const latency = () => (useUiStore.getState().slowNetwork ? 120 + Math.random() * 330 : 0)
const failureRate = () => useUiStore.getState().failureRate

export function createDemoRepo(): ApplicationsRepo {
  return createLocalRepo({ storage: localStorage, key: DATA_KEY, latency, failureRate })
}

export function writeDemoData(apps: Application[]) {
  localStorage.setItem(DATA_KEY, JSON.stringify(apps))
}

export function seedSample(count = 48) {
  writeDemoData(generateApplications(count))
}

export function createDemoAuth(): AuthService {
  const listeners = new Set<(u: User | null) => void>()
  const emit = (u: User | null) => listeners.forEach((l) => l(u))

  return {
    mode: 'demo',
    async getUser() {
      return localStorage.getItem(SESSION_KEY) ? DEMO_USER : null
    },
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    async signOut() {
      localStorage.removeItem(SESSION_KEY)
      emit(null)
    },
    async enterDemo(workspace) {
      if (workspace === 'sample') seedSample()
      else writeDemoData([])
      localStorage.setItem(SESSION_KEY, '1')
      emit(DEMO_USER)
      return DEMO_USER
    },
  }
}
