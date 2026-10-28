import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Application, ApplicationPatch } from '@/lib/schema'
import { ApiError, type ApplicationsRepo, type AuthService, type User } from './types'

/** Row shape of the `applications` table (see supabase/schema.sql). */
interface Row {
  id: string
  user_id: string
  company: string
  role: string
  stage: Application['stage']
  source: Application['source']
  url: string | null
  location: string | null
  compensation: string | null
  applied_at: string | null
  deadline: string | null
  follow_up_at: string | null
  contact_name: string | null
  contact_email: string | null
  notes: string | null
  position: number
  history: Application['history']
  created_at: string
  updated_at: string
}

const FIELD_MAP = {
  company: 'company',
  role: 'role',
  stage: 'stage',
  source: 'source',
  url: 'url',
  location: 'location',
  compensation: 'compensation',
  appliedAt: 'applied_at',
  deadline: 'deadline',
  followUpAt: 'follow_up_at',
  contactName: 'contact_name',
  contactEmail: 'contact_email',
  notes: 'notes',
  position: 'position',
  history: 'history',
  updatedAt: 'updated_at',
} as const satisfies Partial<Record<keyof Application, keyof Row>>

const toApp = (r: Row): Application => ({
  id: r.id,
  company: r.company,
  role: r.role,
  stage: r.stage,
  source: r.source,
  url: r.url ?? '',
  location: r.location ?? '',
  compensation: r.compensation ?? '',
  appliedAt: r.applied_at ?? '',
  deadline: r.deadline ?? '',
  followUpAt: r.follow_up_at ?? '',
  contactName: r.contact_name ?? '',
  contactEmail: r.contact_email ?? '',
  notes: r.notes ?? '',
  position: r.position,
  history: r.history ?? [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

/** Maps a camelCase patch to columns; empty strings become NULL (dates can't be ''). */
function toRow(patch: ApplicationPatch): Partial<Row> {
  const row: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) {
    const col = FIELD_MAP[k as keyof typeof FIELD_MAP]
    if (col) row[col] = v === '' ? null : v
  }
  return row as Partial<Row>
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new ApiError(res.error.message, res.error)
  return res.data as T
}

export function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey)
}

export function createSupabaseRepo(client: SupabaseClient, userId: string): ApplicationsRepo {
  const table = () => client.from('applications')
  const insertRows = (apps: Application[]) =>
    apps.map((a) => ({
      ...toRow(a),
      id: a.id,
      user_id: userId,
      created_at: a.createdAt || undefined,
    }))

  return {
    async list() {
      return unwrap(await table().select('*').order('position')).map(toApp)
    },
    async create(app) {
      return toApp(
        unwrap(
          await table()
            .insert(insertRows([app]))
            .select()
            .single(),
        ),
      )
    },
    async createMany(apps) {
      return unwrap(await table().insert(insertRows(apps)).select()).map(toApp)
    },
    async update(id, patch) {
      return toApp(unwrap(await table().update(toRow(patch)).eq('id', id).select().single()))
    },
    async remove(id) {
      unwrap(await table().delete().eq('id', id))
    },
  }
}

export function createSupabaseAuth(client: SupabaseClient): AuthService {
  const toUser = (u: { id: string; email?: string } | null | undefined): User | null =>
    u ? { id: u.id, email: u.email ?? '' } : null

  return {
    mode: 'supabase',
    async getUser() {
      const { data } = await client.auth.getSession()
      return toUser(data.session?.user)
    },
    subscribe(cb) {
      const { data } = client.auth.onAuthStateChange((_e, session) => cb(toUser(session?.user)))
      return () => data.subscription.unsubscribe()
    },
    async signOut() {
      await client.auth.signOut()
    },
    async signInWithPassword(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password })
      if (error) throw new ApiError(error.message, error)
      return toUser(data.user)!
    },
    async signUp(email, password) {
      const { data, error } = await client.auth.signUp({ email, password })
      if (error) throw new ApiError(error.message, error)
      return { user: toUser(data.session?.user), needsConfirmation: !data.session }
    },
    async signInWithGitHub() {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw new ApiError(error.message, error)
    },
  }
}
