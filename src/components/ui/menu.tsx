import * as DM from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Menu = DM.Root
export const MenuTrigger = DM.Trigger

export function MenuContent({ className, ...props }: ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content
        sideOffset={6}
        align="end"
        className={cn('surface z-50 min-w-52 rounded-lg p-1 text-sm shadow-lg', className)}
        {...props}
      />
    </DM.Portal>
  )
}

const itemClass =
  'flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted'

export function MenuItem({ className, ...props }: ComponentProps<typeof DM.Item>) {
  return <DM.Item className={cn(itemClass, className)} {...props} />
}

export function MenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DM.CheckboxItem>) {
  return (
    <DM.CheckboxItem className={cn(itemClass, 'relative pl-7', className)} {...props}>
      <DM.ItemIndicator className="absolute left-3.5 -translate-x-1/2">
        <Check className="size-3.5" />
      </DM.ItemIndicator>
      {children}
    </DM.CheckboxItem>
  )
}

export function MenuRadioGroup(props: ComponentProps<typeof DM.RadioGroup>) {
  return <DM.RadioGroup {...props} />
}

export function MenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DM.RadioItem>) {
  return (
    <DM.RadioItem className={cn(itemClass, 'relative pl-7', className)} {...props}>
      <DM.ItemIndicator className="absolute left-3.5 -translate-x-1/2">
        <Check className="size-3.5" />
      </DM.ItemIndicator>
      {children}
    </DM.RadioItem>
  )
}

export function MenuLabel({ className, ...props }: ComponentProps<typeof DM.Label>) {
  return (
    <DM.Label
      className={cn('text-muted px-2 pt-2 pb-1 text-xs font-medium', className)}
      {...props}
    />
  )
}

export function MenuSeparator() {
  return <DM.Separator className="bg-muted -mx-1 my-1 h-px" />
}
