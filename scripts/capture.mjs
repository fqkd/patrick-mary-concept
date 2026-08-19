import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base = process.env.BASE_URL || 'http://127.0.0.1:4173/'
const output = new URL('../public/assets/case/', import.meta.url)
await mkdir(output, { recursive: true })

const states = {
  home: '?seed=case#/',
  catalog: '?seed=case#/catalog?category=cakes',
  cart: '?seed=case#/cart',
  checkout: '?seed=case#/checkout',
  'payment-error': '?seed=case#/payment-error',
  login: '?seed=case#/login?step=code',
  loyalty: '?seed=case#/loyalty',
  cake: '?seed=case#/cake?step=style',
  'cake-confirm': '?seed=case#/cake-confirm',
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
for (const [name, route] of Object.entries(states)) {
  await page.goto(new URL(route, base).toString(), { waitUntil: 'networkidle' })
  await page.reload({ waitUntil: 'networkidle' })
  if (name === 'login') await page.getByRole('textbox', { name: 'Код из СМС' }).fill('1234')
  await page.waitForFunction(() => [...document.images]
    .filter((image) => {
      const box = image.getBoundingClientRect()
      return box.top < window.innerHeight && box.bottom > 0
    })
    .every((image) => image.complete && image.naturalWidth > 0))
  await page.locator('.screen').evaluate((screen) => { screen.scrollTop = 0 })
  await page.screenshot({ path: new URL(`${name}.jpg`, output).pathname, type: 'jpeg', quality: 88 })
}
await browser.close()
console.log(`Captured ${Object.keys(states).length} prototype states`)
