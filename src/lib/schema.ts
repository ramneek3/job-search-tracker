import { z } from 'zod'
import { SOURCES, STAGES, type Stage } from './constants'

export type { Source, Stage } from './constants'

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Not a real date')

/** Empty form inputs come through as '' — treat them as "not set". */
const optionalDate = z.union([z.literal(''), isoDate]).optional()
const optionalText = (max: number) =>
  z.string().trim().max(max, `Keep it under ${max} characters`).optional()

export const applicationInputSchema = z
  .object({
    company: z
      .string({ error: 'Company is required' })
      .trim()
      .min(1, 'Company is required')
      .max(100, 'Keep it under 100 characters'),
    role: z
      .string({ error: 'Role is required' })
      .trim()
      .min(1, 'Role is required')
      .max(120, 'Keep it under 120 characters'),
    stage: z.enum(STAGES),
    source: z.enum(SOURCES),
    url: z
      .union([z.literal(''), z.url({ message: 'Enter a full URL, e.g. https://…' })])
      .optional(),
    location: optionalText(100),
    compensation: optionalText(60),
    appliedAt: optionalDate,
    deadline: optionalDate,
    followUpAt: optionalDate,
    contactName: optionalText(100),
    contactEmail: z.union([z.literal(''), z.email({ message: 'Enter a valid email' })]).optional(),
    notes: optionalText(2000),
  })
  .refine((v) => v.stage === 'wishlist' || !!v.appliedAt, {
    path: ['appliedAt'],
    message: 'Add the date you applied (or keep it in Wishlist)',
  })

/** What the form edits. */
export type ApplicationInput = z.input<typeof applicationInputSchema>

export interface StageEvent {
  stage: Stage
  at: string // ISO timestamp
}

export interface Application extends ApplicationInput {
  id: string
  /** Fractional index for ordering within a board column. */
  position: number
  history: StageEvent[]
  createdAt: string
  updatedAt: string
}

export type ApplicationPatch = Partial<Omit<Application, 'id' | 'createdAt'>>
