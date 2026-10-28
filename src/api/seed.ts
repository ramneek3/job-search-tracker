import { SOURCES } from '@/lib/constants'
import type { Application, Source, Stage } from '@/lib/schema'
import { toISODate } from '@/lib/stage'

/** Small deterministic PRNG so the demo looks the same on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const COMPANIES = [
  'Stripe',
  'Figma',
  'Shopify',
  'Atlassian',
  'Notion',
  'Vercel',
  'Airbnb',
  'Spotify',
  'Datadog',
  'Canva',
  'Linear',
  'Duolingo',
  'Discord',
  'Coinbase',
  'Asana',
  'Dropbox',
  'Pinterest',
  'Reddit',
  'Twilio',
  'Cloudflare',
  'GitLab',
  'Zapier',
  'Miro',
  'Grammarly',
  'Plaid',
  'Ramp',
  'Robinhood',
  'Instacart',
  'DoorDash',
  'Lyft',
  'Snowflake',
  'MongoDB',
  'HubSpot',
  'Intuit',
  'Adobe',
  'Wealthsimple',
  'Klaviyo',
  'Brex',
  'Retool',
  'Supabase',
  'Netlify',
  'Postman',
  'Loom',
  'Webflow',
  'Airtable',
  'Etsy',
  'Squarespace',
  'Benchling',
  'Faire',
  'Gusto',
]
const ROLES = [
  'Frontend Engineering Intern',
  'Software Engineer Intern, Web',
  'React Developer Intern',
  'UI Engineering Intern',
  'Software Engineering Intern',
  'Product Engineering Intern',
  'Full-Stack Intern',
  'Web Platform Intern',
]
const CITIES = [
  'Remote',
  'San Francisco, CA',
  'New York, NY',
  'Toronto, ON',
  'Seattle, WA',
  'Austin, TX',
  'Remote (US)',
  'London, UK',
]
const CONTACTS = [
  'Priya Patel',
  'Jordan Lee',
  'Sam Rivera',
  'Alex Chen',
  'Taylor Kim',
  'Morgan Diaz',
]

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)]!
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** Walks a plausible path through the pipeline and returns the final stage + history. */
function simulate(
  rand: () => number,
  applied: Date,
  now: Date,
): { stage: Stage; history: Application['history'] } {
  const history: Application['history'] = [{ stage: 'applied', at: applied.toISOString() }]
  let at = applied
  const step = (stage: Stage, minDays: number, maxDays: number) => {
    at = addDays(at, minDays + Math.floor(rand() * (maxDays - minDays)))
    if (at > now) return false
    history.push({ stage, at: at.toISOString() })
    return true
  }
  const r = rand()
  if (r < 0.55) return { stage: 'applied', history } // ghosted (so far)
  if (r < 0.75)
    return step('rejected', 3, 21) ? { stage: 'rejected', history } : { stage: 'applied', history }
  if (!step(rand() < 0.6 ? 'oa' : 'interview', 4, 14)) return { stage: 'applied', history }
  const r2 = rand()
  if (history.at(-1)!.stage === 'oa' && r2 < 0.35)
    return step('rejected', 2, 10) ? { stage: 'rejected', history } : { stage: 'oa', history }
  if (history.at(-1)!.stage === 'oa' && !step('interview', 3, 10)) return { stage: 'oa', history }
  if (rand() < 0.55)
    return step('rejected', 3, 14)
      ? { stage: 'rejected', history }
      : { stage: 'interview', history }
  if (rand() < 0.5 && step('offer', 5, 14)) return { stage: 'offer', history }
  return { stage: 'interview', history }
}

export function generateApplications(count: number, now = new Date(), seed = 42): Application[] {
  const rand = mulberry32(seed)
  const apps: Application[] = []
  const positions: Record<string, number> = {}

  for (let i = 0; i < count; i++) {
    // Unique names for the sample; numbered suffixes only once we run out (stress test).
    const round = Math.floor(i / COMPANIES.length)
    const company = `${COMPANIES[(i * 7) % COMPANIES.length]!}${round ? ` ${round + 1}` : ''}`
    const isWishlist = rand() < 0.15
    const source: Source = rand() < 0.15 ? 'referral' : pick(rand, SOURCES)
    const created = addDays(now, -Math.floor(rand() * 84) - 1)
    let stage: Stage = 'wishlist'
    let history: Application['history'] = [{ stage: 'wishlist', at: created.toISOString() }]
    let appliedAt: string | undefined
    let deadline: string | undefined

    if (isWishlist) {
      deadline = toISODate(addDays(now, Math.floor(rand() * 21) - 3))
    } else {
      // Referrals get answered more often — gives the analytics a real story to tell.
      const sim = simulate(source === 'referral' ? () => rand() * 0.5 + 0.5 : rand, created, now)
      stage = sim.stage
      history = sim.history
      appliedAt = toISODate(created)
    }

    positions[stage] = (positions[stage] ?? 0) + 1024
    const open = stage === 'applied' || stage === 'oa' || stage === 'interview'
    apps.push({
      id: `seed-${seed}-${i}`,
      company,
      role: pick(rand, ROLES),
      stage,
      source,
      url: `https://careers.example.com/${company.toLowerCase().replace(/\W+/g, '-')}`,
      location: pick(rand, CITIES),
      compensation: rand() < 0.6 ? `$${35 + Math.floor(rand() * 25)}/hr` : '',
      appliedAt,
      deadline,
      followUpAt: open && rand() < 0.4 ? toISODate(addDays(now, Math.floor(rand() * 12) - 4)) : '',
      contactName: source === 'referral' ? pick(rand, CONTACTS) : '',
      contactEmail: '',
      notes:
        stage === 'interview'
          ? 'Prep: React hooks, system design for a news feed, behavioural STAR stories.'
          : '',
      position: positions[stage]!,
      history,
      createdAt: created.toISOString(),
      updatedAt: history.at(-1)?.at ?? created.toISOString(),
    })
  }
  return apps
}
