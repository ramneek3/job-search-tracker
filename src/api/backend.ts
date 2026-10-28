import { createDemoAuth, createDemoRepo } from './demo'
import type { ApplicationsRepo, AuthService, User } from './types'

export interface Backend {
  auth: AuthService
  repoFor(user: User): ApplicationsRepo
}

/**
 * Supabase when configured, otherwise a zero-setup demo backend in localStorage.
 * supabase-js is imported dynamically so demo-mode visitors never download it.
 */
export async function createBackend(): Promise<Backend> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (url && key) {
    const { createSupabaseAuth, createSupabaseClient, createSupabaseRepo } =
      await import('./supabase')
    const client = createSupabaseClient(url, key)
    const repos = new Map<string, ApplicationsRepo>()
    return {
      auth: createSupabaseAuth(client),
      repoFor: (u) =>
        repos.get(u.id) ?? repos.set(u.id, createSupabaseRepo(client, u.id)).get(u.id)!,
    }
  }
  const repo = createDemoRepo()
  return { auth: createDemoAuth(), repoFor: () => repo }
}
