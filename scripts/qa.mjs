import { chromium } from 'playwright'

const base = process.env.BASE_URL || 'http://127.0.0.1:4173/'
const browser = await chromium.launch({ headless: true })
const problems = []

async function inspect(path, width, height) {
  const page = await browser.newPage({ viewport: { width, height } })
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`${path} ${width}px console: ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`${path} ${width}px page: ${error.message}`))
  const response = await page.goto(new URL(path, base).toString(), { waitUntil: 'networkidle' })
  if (!response?.ok()) problems.push(`${path} ${width}px HTTP ${response?.status()}`)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  if (overflow) problems.push(`${path} ${width}px horizontal overflow`)
  await page.close()
}

for (const width of [360, 390, 430]) {
  for (const route of ['?seed=qa#/', '?seed=qa#/catalog', '?seed=qa#/cart', '?seed=qa#/payment-error', '?seed=qa#/loyalty', '?seed=qa#/cake']) {
    await inspect(route, width, 844)
  }
}

for (const width of [390, 768, 1440]) {
  for (const slide of [1, 2, 5, 6, 7, 10, 12]) {
    await inspect(`case/#slide-${slide}`, width, width === 390 ? 844 : 900)
  }
}

const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto(new URL('?seed=qa#/cart', base).toString(), { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /Выбрать время/ }).click()
await page.getByRole('button', { name: /Сегодня · 19:10/ }).click()
await page.getByRole('button', { name: /Перейти к оформлению/ }).click()
await page.getByRole('button', { name: /Оплатить в демо/ }).click()
await page.getByRole('heading', { name: /корзина сохранена/i }).waitFor()
await page.getByRole('button', { name: /Повторить оплату/ }).click()
await page.getByRole('heading', { name: /подтверждён|забирать/i }).waitFor()

await page.goto(new URL('case/#slide-5', base).toString(), { waitUntil: 'networkidle' })
const links = await page.locator('a[href]').evaluateAll((items) => items.map((item) => item.getAttribute('href')))
if (!links.some((href) => href?.includes('#/payment-error'))) problems.push('case slide 5 does not link to payment recovery state')

await page.close()
await browser.close()

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('QA passed: prototype 360/390/430; case 390/768/1440; console, overflow and payment recovery flow')
