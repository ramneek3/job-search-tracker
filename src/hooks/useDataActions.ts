import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { seedSample, writeDemoData } from '@/api/demo'
import { generateApplications } from '@/api/seed'
import { useBackend, useSession } from '@/auth/context'
import { buildApplication } from '@/lib/application'
import { downloadText } from '@/lib/download'
import { toISODate } from '@/lib/stage'
import { pluralize } from '@/lib/utils'
import { applicationsKey, useApplications, useImportApplications } from './useApplications'

/** CSV import/export plus demo-data controls, shared by the menu and the command palette. */
export function useDataActions() {
  const { auth } = useBackend()
  const { user } = useSession()
  const qc = useQueryClient()
  const { data: apps = [] } = useApplications()
  const importMutation = useImportApplications()

  const exportCSV = useCallback(async () => {
    const { toCSV } = await import('@/lib/csv')
    downloadText(`pipeline-${toISODate(new Date())}.csv`, toCSV(apps))
    toast.success(`Exported ${pluralize(apps.length, 'application')}`)
  }, [apps])

  const importFile = useCallback(
    async (file: File) => {
      const { importCSV } = await import('@/lib/csv')
      const { valid, errors } = importCSV(await file.text())
      if (errors.length) {
        toast.warning(`${pluralize(errors.length, 'row')} skipped`, {
          description: errors
            .slice(0, 3)
            .map((e) => `Line ${e.line}: ${e.message}`)
            .join('\n'),
        })
      }
      if (valid.length === 0) return
      const built = valid.reduce<ReturnType<typeof buildApplication>[]>(
        (acc, input) => [...acc, buildApplication(input, [...apps, ...acc])],
        [],
      )
      importMutation.mutate(built)
    },
    [apps, importMutation],
  )

  const chooseImportFile = useCallback(() => {
    const input = Object.assign(document.createElement('input'), {
      type: 'file',
      accept: '.csv,text/csv',
    })
    input.onchange = () => input.files?.[0] && importFile(input.files[0])
    input.click()
  }, [importFile])

  const resetDemo = useCallback(
    async (kind: 'sample' | 'empty' | 'stress') => {
      if (kind === 'sample') seedSample()
      else if (kind === 'empty') writeDemoData([])
      else writeDemoData(generateApplications(2000, new Date(), 7))
      await qc.invalidateQueries({ queryKey: applicationsKey(user.id) })
      toast.success(kind === 'stress' ? 'Loaded 2,000 applications' : 'Demo data reset')
    },
    [qc, user.id],
  )

  return { isDemo: auth.mode === 'demo', exportCSV, chooseImportFile, importFile, resetDemo }
}
