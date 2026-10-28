import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { SOURCES, SOURCE_LABELS, STAGES, STAGE_LABELS } from '@/lib/constants'
import { applicationInputSchema, type ApplicationInput } from '@/lib/schema'

export type ApplicationOutput = z.output<typeof applicationInputSchema>

interface Props {
  defaultValues: ApplicationInput
  onSubmit: (values: ApplicationOutput) => void
  onCancel: () => void
  onDelete?: () => void
  submitLabel: string
}

export function ApplicationForm({
  defaultValues,
  onSubmit,
  onCancel,
  onDelete,
  submitLabel,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ApplicationInput, unknown, ApplicationOutput>({
    resolver: zodResolver(applicationInputSchema),
    defaultValues,
    mode: 'onTouched',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-full flex-col">
      <div className="grid flex-1 grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <Field label="Company" error={errors.company?.message}>
          {(a) => <Input {...a} {...register('company')} autoComplete="organization" />}
        </Field>
        <Field label="Role" error={errors.role?.message}>
          {(a) => <Input {...a} {...register('role')} autoComplete="organization-title" />}
        </Field>
        <Field label="Stage" error={errors.stage?.message}>
          {(a) => (
            <Select {...a} {...register('stage')}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Source" error={errors.source?.message}>
          {(a) => (
            <Select {...a} {...register('source')}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Date applied" error={errors.appliedAt?.message}>
          {(a) => <Input {...a} type="date" {...register('appliedAt')} />}
        </Field>
        <Field label="Follow up on" error={errors.followUpAt?.message} hint="Shows up in Due soon">
          {(a) => <Input {...a} type="date" {...register('followUpAt')} />}
        </Field>
        <Field label="Application deadline" error={errors.deadline?.message}>
          {(a) => <Input {...a} type="date" {...register('deadline')} />}
        </Field>
        <Field label="Location" error={errors.location?.message}>
          {(a) => <Input {...a} {...register('location')} placeholder="Remote" />}
        </Field>
        <Field label="Job posting URL" error={errors.url?.message} className="sm:col-span-2">
          {(a) => (
            <Input {...a} type="url" inputMode="url" {...register('url')} placeholder="https://" />
          )}
        </Field>
        <Field label="Compensation" error={errors.compensation?.message}>
          {(a) => <Input {...a} {...register('compensation')} placeholder="$40/hr" />}
        </Field>
        <Field label="Contact name" error={errors.contactName?.message}>
          {(a) => <Input {...a} {...register('contactName')} autoComplete="off" />}
        </Field>
        <Field label="Contact email" error={errors.contactEmail?.message} className="sm:col-span-2">
          {(a) => <Input {...a} type="email" {...register('contactEmail')} autoComplete="off" />}
        </Field>
        <Field label="Notes" error={errors.notes?.message} className="sm:col-span-2">
          {(a) => <Textarea {...a} {...register('notes')} rows={4} />}
        </Field>
      </div>

      <footer className="border-base bg-subtle sticky bottom-0 flex items-center gap-2 border-t px-5 py-3">
        {onDelete && (
          <Button variant="ghost" className="text-red-600 dark:text-red-400" onClick={onDelete}>
            <Trash2 className="size-4" aria-hidden />
            Delete
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!!onDelete && !isDirty}>
            {submitLabel}
          </Button>
        </div>
      </footer>
    </form>
  )
}
