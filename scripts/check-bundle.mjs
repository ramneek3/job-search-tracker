// Fails the build if the JavaScript needed for first paint grows past the budget.
// "Initial" = the entry script + everything index.html modulepreloads.
import { readFileSync, readdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const BUDGET_KB = Number(process.env.BUNDLE_BUDGET_KB ?? 200)
const ROUTE_BUDGET_KB = 120
const dist = 'dist'
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const initial = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1])
const gz = (file) => gzipSync(readFileSync(join(dist, file))).length / 1024

const initialKB = initial.reduce((sum, f) => sum + gz(f), 0)
const routes = readdirSync(join(dist, 'assets'))
  .filter((f) => /^(Board|Table|Analytics|Login)Page-.*\.js$/.test(f))
  .map((f) => ({ f, kb: gz(join('assets', f)) }))

console.log(`Initial JS: ${initialKB.toFixed(1)} KB gzipped (budget ${BUDGET_KB} KB)`)
for (const r of routes) console.log(`  route ${r.f.split('-')[0].padEnd(14)} ${r.kb.toFixed(1)} KB`)

let failed = initialKB > BUDGET_KB
for (const r of routes) if (r.kb > ROUTE_BUDGET_KB) failed = true
if (failed) {
  console.error('Bundle budget exceeded')
  process.exit(1)
}
