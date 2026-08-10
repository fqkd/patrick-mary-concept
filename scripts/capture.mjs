import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base = process.env.BASE_URL || 'http://127.0.0.1:4173/'
const output = new URL('../public/assets/case/', import.meta.url)
await mkdir(output, { recursive: true })

const states = {
  home: '?seed=case#/',
  catalog: '?seed=case#/catalog',
  cart: '?seed=case#/cart',
  'payment-error': '?seed=case#/payment-error',
  login: '?seed=case#/login',
  loyalty: '?seed=case#/loyalty',
  cake: '?seed=case#/cake',
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
for (const [name, route] of Object.entries(states)) {
  await page.goto(new URL(route, base).toString(), { waitUntil: 'networkidle' })
  await page.screenshot({ path: new URL(`${name}.jpg`, output).pathname, type: 'jpeg', quality: 88 })
}
await browser.close()
console.log(`Captured ${Object.keys(states).length} prototype states`)
