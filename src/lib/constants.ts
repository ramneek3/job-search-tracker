// Plain constants with no runtime dependencies, so importing them never pulls zod into a chunk.

export const STAGES = ['wishlist', 'applied', 'oa', 'interview', 'offer', 'rejected'] as const
export type Stage = (typeof STAGES)[number]

export const STAGE_LABELS: Record<Stage, string> = {
  wishlist: 'Wishlist',
  applied: 'Applied',
  oa: 'Online assessment',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

export const SOURCES = [
  'linkedin',
  'company_site',
  'referral',
  'handshake',
  'indeed',
  'other',
] as const
export type Source = (typeof SOURCES)[number]

export const SOURCE_LABELS: Record<Source, string> = {
  linkedin: 'LinkedIn',
  company_site: 'Company site',
  referral: 'Referral',
  handshake: 'Handshake',
  indeed: 'Indeed',
  other: 'Other',
}

export const STAGE_ORDER: Record<Stage, number> = Object.fromEntries(
  STAGES.map((s, i) => [s, i]),
) as Record<Stage, number>
