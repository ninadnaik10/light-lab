// Interaction checks with headless Chrome (playwright-core + installed Google Chrome).
// Usage:
//   node scripts/interact.mjs drag <hash> <handleIndex> <dx> <dy> <out.png>   → drags the Nth `.handle` by (dx,dy) px, screenshots, prints main text
//   node scripts/interact.mjs text <hash>                                       → prints the main text (readouts) after load
//   node scripts/interact.mjs click <hash> "<button text>" <out.png>            → clicks a button by visible text, screenshots
//   node scripts/interact.mjs slider <hash> "<label text>" <value> <out.png>    → sets a range input (found by its label) to value
import { chromium } from 'playwright-core'

const BASE = process.env.LL_BASE ?? 'http://localhost:5173'
const [cmd, hash, ...rest] = process.argv.slice(2)

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('console', (m) => (m.type() === 'error' ? errors.push(m.text()) : null))
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(`${BASE}/#${hash}`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('main svg', { timeout: 15000 })
await page.waitForTimeout(700)

const mainText = async () => (await page.locator('main').innerText()).replace(/\n{2,}/g, '\n')

if (cmd === 'drag') {
  const [idx, dx, dy, out] = rest
  const handle = page.locator('.handle').nth(Number(idx))
  const box = await handle.boundingBox()
  if (!box) throw new Error('handle not found')
  const sx = box.x + box.width / 2
  const sy = box.y + box.height / 2
  await page.mouse.move(sx, sy)
  await page.mouse.down()
  const steps = 12
  for (let s = 1; s <= steps; s++) {
    await page.mouse.move(sx + (Number(dx) * s) / steps, sy + (Number(dy) * s) / steps)
    await page.waitForTimeout(16)
  }
  await page.mouse.up()
  await page.waitForTimeout(300)
  if (out) await page.screenshot({ path: out })
  console.log(await mainText())
} else if (cmd === 'text') {
  console.log(await mainText())
} else if (cmd === 'click') {
  const [label, out] = rest
  const btn = page.getByRole('button', { name: label }).first()
  if (await btn.count()) await btn.click({ timeout: 5000 })
  else await page.getByRole('tab', { name: label }).first().click({ timeout: 5000 })
  await page.waitForTimeout(500)
  if (out) await page.screenshot({ path: out })
  console.log(await mainText())
} else if (cmd === 'toggle') {
  const [label, out] = rest
  await page.getByRole('switch', { name: label }).first().click()
  await page.waitForTimeout(600)
  if (out) await page.screenshot({ path: out, fullPage: true })
  console.log(await mainText())
} else if (cmd === 'slider') {
  const [label, value, out] = rest
  const input = page.getByLabel(label, { exact: false }).and(page.locator('input[type=range]')).first()
  await input.evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(el, String(v))
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
  await page.waitForTimeout(400)
  if (out) await page.screenshot({ path: out })
  console.log(await mainText())
} else if (cmd === 'steps') {
  // steps <hash> '<json array>' e.g. [{"type":"click","label":"Concave"},{"type":"slider","label":"Sun height","value":5},{"type":"shot","out":"/tmp/x.png","full":true}]
  const steps = JSON.parse(rest[0])
  for (const st of steps) {
    if (st.type === 'click') {
      const btn = page.getByRole('button', { name: st.label }).first()
      if (await btn.count()) await btn.click({ timeout: 5000 })
      else await page.getByRole('tab', { name: st.label }).first().click({ timeout: 5000 })
    } else if (st.type === 'toggle') {
      await page.getByRole('switch', { name: st.label }).first().click()
    } else if (st.type === 'slider') {
      const input = page.getByLabel(st.label, { exact: false }).and(page.locator('input[type=range]')).first()
      await input.evaluate((el, v) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
        setter.call(el, String(v))
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
      }, st.value)
    } else if (st.type === 'wait') {
      await page.waitForTimeout(st.ms ?? 500)
    } else if (st.type === 'shot') {
      await page.waitForTimeout(400)
      await page.screenshot({ path: st.out, fullPage: !!st.full })
      console.log(`saved ${st.out}`)
    } else if (st.type === 'scrollTo') {
      await page.getByText(st.text, { exact: false }).first().scrollIntoViewIfNeeded()
    }
    await page.waitForTimeout(250)
  }
  console.log(await mainText())
} else {
  console.log('usage: drag|text|click|toggle|slider|steps')
}
if (errors.length) console.log('\nCONSOLE ERRORS:\n' + errors.join('\n'))
await browser.close()
