import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

export const controlClass =
  'w-full rounded-lg border border-base bg-[var(--bg)] px-3 py-2 text-sm shadow-sm placeholder:text-[var(--fg-muted)]/70 focus-visible:outline-2 aria-[invalid=true]:border-red-500'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby'?: string
  }) => ReactNode
  className?: string
}

/** Label + control + error message, wired up with the right ARIA attributes. */
export function Field({ label, error, hint, children, className }: FieldProps) {
  const id = useId()
  const descId = error || hint ? `${id}-desc` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': descId })}
      {error ? (
        <p id={descId} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={descId} className="text-muted text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlClass, 'h-9', className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn(controlClass, 'h-9 py-0', className)} {...props} />
  },
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(controlClass, 'min-h-24', className)} {...props} />
})
