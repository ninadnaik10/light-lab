// Headless visual pass using the locally installed Google Chrome via playwright-core.
// Usage:
//   node scripts/visual.mjs shot <hash> <out.png> [--mobile] [--full]
//   node scripts/visual.mjs all [--mobile]            → screenshots every section into /tmp/ll-shots
//   node scripts/visual.mjs eval <hash> "<js expression>"   → prints JSON result of the expression in the page
import { chromium } from 'playwright-core'

const BASE = process.env.LL_BASE ?? 'http://localhost:5173'
const SECTIONS = ['reflection', 'refraction', 'tir', 'dispersion', 'mirrors', 'lenses']

async function open(hash, { mobile = false } = {}) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({
    viewport: mobile ? { width: 375, height: 800 } : { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
  await page.goto(`${BASE}/#${hash}`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('main svg', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(900)
  return { browser, page, errors }
}

const args = process.argv.slice(2)
const cmd = args[0]
const flag = (f) => args.includes(f)

if (cmd === 'shot') {
  const [, hash, out] = args
  const { browser, page, errors } = await open(hash, { mobile: flag('--mobile') })
  await page.screenshot({ path: out, fullPage: flag('--full') })
  console.log(`saved ${out}`)
  if (errors.length) console.log('console:\n' + errors.join('\n'))
  await browser.close()
} else if (cmd === 'all') {
  const mobile = flag('--mobile')
  for (const s of SECTIONS) {
    const { browser, page, errors } = await open(s, { mobile })
    const out = `/tmp/ll-shots/${s}${mobile ? '-mobile' : ''}.png`
    await page.screenshot({ path: out, fullPage: true })
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
    console.log(`${s}: saved ${out} (scrollWidth ${scrollW})${errors.length ? '\n  console: ' + errors.join('\n  ') : ''}`)
    await browser.close()
  }
} else if (cmd === 'eval') {
  const [, hash, expr] = args
  const { browser, page, errors } = await open(hash, { mobile: flag('--mobile') })
  const result = await page.evaluate(expr)
  console.log(JSON.stringify(result, null, 2))
  if (errors.length) console.log('console:\n' + errors.join('\n'))
  await browser.close()
} else {
  console.log('usage: shot <hash> <out> | all [--mobile] | eval <hash> <js>')
  process.exit(1)
}
