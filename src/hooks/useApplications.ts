import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/auth/context'
import type { Application, ApplicationPatch, Stage } from '@/lib/schema'
import { stageChangePatch } from '@/lib/stage'
import { STAGE_LABELS } from '@/lib/constants'

export const applicationsKey = (userId: string): QueryKey => ['applications', userId]
const MUTATION_KEY = ['applications', 'write']

export function useApplications() {
  const { user, repo } = useSession()
  return useQuery({
    queryKey: applicationsKey(user.id),
    queryFn: () => repo.list(),
  })
}

export function useApplication(id: string | null | undefined) {
  const { data } = useApplications()
  return useMemo(() => (id ? data?.find((a) => a.id === id) : undefined), [data, id])
}

/**
 * Shared optimistic-update plumbing: apply the change to the cache immediately,
 * roll back to the snapshot if the request fails, and refetch once the last
 * in-flight write settles (refetching earlier would clobber newer optimistic state).
 */
function useOptimisticMutation<TVars, TResult>({
  mutationFn,
  apply,
  errorMessage,
  onSuccess,
}: {
  mutationFn: (vars: TVars) => Promise<TResult>
  apply: (apps: Application[], vars: TVars) => Application[]
  errorMessage: (vars: TVars, error: Error) => string
  onSuccess?: (result: TResult, vars: TVars) => void
}) {
  const { user } = useSession()
  const qc = useQueryClient()
  const key = applicationsKey(user.id)

  return useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn,
    onMutate: async (vars: TVars) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<Application[]>(key)
      qc.setQueryData<Application[]>(key, (apps = []) => apply(apps, vars))
      return { previous }
    },
    onError: (error, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous)
      toast.error(errorMessage(vars, error), { description: error.message })
    },
    onSuccess,
    onSettled: () => {
      if (qc.isMutating({ mutationKey: MUTATION_KEY }) <= 1) {
        return qc.invalidateQueries({ queryKey: key })
      }
    },
  })
}

export function useCreateApplication() {
  const { repo } = useSession()
  return useOptimisticMutation({
    mutationFn: (app: Application) => repo.create(app),
    apply: (apps, app) => [...apps, app],
    errorMessage: (app) => `Couldn't save ${app.company}`,
    onSuccess: (app) => toast.success(`Added ${app.company}`),
  })
}

export function useUpdateApplication() {
  const { repo } = useSession()
  return useOptimisticMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ApplicationPatch }) => repo.update(id, patch),
    apply: (apps, { id, patch }) => apps.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    errorMessage: () => `Couldn't save your changes — they've been undone`,
  })
}

export interface MoveVars {
  app: Application
  stage: Stage
  position: number
}

export function useMoveApplication() {
  const { repo } = useSession()
  return useOptimisticMutation({
    mutationFn: ({ app, stage, position }: MoveVars) =>
      repo.update(app.id, { ...stageChangePatch(app, stage), position }),
    apply: (apps, { app, stage, position }) =>
      apps.map((a) => (a.id === app.id ? { ...a, ...stageChangePatch(a, stage), position } : a)),
    errorMessage: ({ app, stage }) =>
      `Couldn't move ${app.company} to ${STAGE_LABELS[stage]} — it's back where it was`,
  })
}

function useRestoreApplication() {
  const { repo } = useSession()
  return useOptimisticMutation({
    mutationFn: (app: Application) => repo.create(app),
    apply: (apps, app) => [...apps, app],
    errorMessage: (app) => `Couldn't restore ${app.company}`,
    onSuccess: (app) => toast.success(`Restored ${app.company}`),
  })
}

export function useDeleteApplication() {
  const { repo } = useSession()
  const restore = useRestoreApplication()
  return useOptimisticMutation({
    mutationFn: (app: Application) => repo.remove(app.id),
    apply: (apps, app) => apps.filter((a) => a.id !== app.id),
    errorMessage: (app) => `Couldn't delete ${app.company}`,
    onSuccess: (_r, app) =>
      toast(`Deleted ${app.company}`, {
        action: { label: 'Undo', onClick: () => restore.mutate(app) },
        duration: 6000,
      }),
  })
}

export function useImportApplications() {
  const { user, repo } = useSession()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (apps: Application[]) => repo.createMany(apps),
    onSuccess: (apps) => {
      toast.success(`Imported ${apps.length} applications`)
      return qc.invalidateQueries({ queryKey: applicationsKey(user.id) })
    },
    onError: (error) => toast.error('Import failed', { description: error.message }),
  })
}
