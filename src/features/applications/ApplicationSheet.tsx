import { Sheet } from '@/components/ui/sheet'
import { useEditor } from '@/hooks/useEditor'
import {
  useApplication,
  useApplications,
  useCreateApplication,
  useDeleteApplication,
  useUpdateApplication,
} from '@/hooks/useApplications'
import { EMPTY_INPUT, buildApplication, toInput } from '@/lib/application'
import { stageChangePatch } from '@/lib/stage'
import { ApplicationForm } from './ApplicationForm'

/** Create/edit panel, driven entirely by the URL (see useEditor). */
export default function ApplicationSheet() {
  const editor = useEditor()
  const { data: apps = [] } = useApplications()
  const app = useApplication(editor.editingId)
  const create = useCreateApplication()
  const update = useUpdateApplication()
  const remove = useDeleteApplication()

  // A stale ?app= link to something that was deleted just shows nothing.
  const open = editor.newStage !== null || !!app

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && editor.close()}
      title={app ? `${app.company}` : 'New application'}
      description={app ? app.role : 'Track a role you want or have applied to.'}
    >
      {open && (
        <ApplicationForm
          key={app?.id ?? 'new'}
          submitLabel={app ? 'Save changes' : 'Add application'}
          defaultValues={
            app ? toInput(app) : { ...EMPTY_INPUT, stage: editor.newStage ?? 'applied' }
          }
          onCancel={editor.close}
          onDelete={
            app
              ? () => {
                  remove.mutate(app)
                  editor.close()
                }
              : undefined
          }
          onSubmit={(values) => {
            if (app) {
              update.mutate({
                id: app.id,
                patch: { ...values, ...stageChangePatch(app, values.stage) },
              })
            } else {
              create.mutate(buildApplication(values, apps))
            }
            editor.close()
          }}
        />
      )}
    </Sheet>
  )
}
