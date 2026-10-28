import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './button'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

/** Side panel built on Radix Dialog: focus trap, Esc to close, focus returns to the trigger. */
export function Sheet({ open, onOpenChange, title, description, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-[fade-in_150ms]" />
        <Dialog.Content
          onOpenAutoFocus={(e) => {
            // Focus the first form field rather than the close button.
            const first = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(
              'input, select, textarea',
            )
            if (first) {
              e.preventDefault()
              first.focus()
            }
          }}
          className="surface fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-y-0 border-r-0 shadow-2xl outline-none data-[state=open]:animate-[slide-in_200ms_ease-out]"
        >
          <header className="border-base flex items-start justify-between gap-4 border-b px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-muted mt-0.5 text-sm">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
