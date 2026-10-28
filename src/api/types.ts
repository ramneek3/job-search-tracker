import type { Application, ApplicationPatch } from '@/lib/schema'

/**
 * The only thing the UI knows about persistence. There are two implementations:
 * a localStorage one (demo mode, no account needed) and a Supabase one.
 */
export interface ApplicationsRepo {
  list(): Promise<Application[]>
  /** The client generates the id so optimistic rows never change identity. */
  create(app: Application): Promise<Application>
  createMany(apps: Application[]): Promise<Application[]>
  update(id: string, patch: ApplicationPatch): Promise<Application>
  remove(id: string): Promise<void>
}

export interface User {
  id: string
  email: string
}

export interface AuthService {
  mode: 'demo' | 'supabase'
  getUser(): Promise<User | null>
  subscribe(cb: (user: User | null) => void): () => void
  signOut(): Promise<void>
  /** Demo mode only. */
  enterDemo?(workspace: 'sample' | 'empty'): Promise<User>
  /** Supabase mode only. */
  signInWithPassword?(email: string, password: string): Promise<User>
  signUp?(
    email: string,
    password: string,
  ): Promise<{ user: User | null; needsConfirmation: boolean }>
  signInWithGitHub?(): Promise<void>
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
