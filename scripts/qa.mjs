import { chromium } from 'playwright'

const base = process.env.BASE_URL || 'http://127.0.0.1:4173/'
const browser = await chromium.launch({ headless: true })
const problems = []

function watch(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${label} console ${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => problems.push(`${label} page: ${error.message}`))
  page.on('requestfailed', (request) => problems.push(`${label} request: ${request.url()} ${request.failure()?.errorText ?? 'failed'}`))
}

async function inspect(path, width, height) {
  const page = await browser.newPage({ viewport: { width, height } })
  watch(page, `${path} ${width}px`)
  const response = await page.goto(new URL(path, base).toString(), { waitUntil: 'networkidle' })
  if (!response?.ok()) problems.push(`${path} ${width}px HTTP ${response?.status()}`)
  const result = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    brokenImages: [...document.images].filter((item) => !item.complete || item.naturalWidth === 0).map((item) => item.src),
  }))
  if (result.overflow) problems.push(`${path} ${width}px horizontal overflow`)
  for (const image of result.brokenImages) problems.push(`${path} ${width}px broken image ${image}`)
  await page.close()
}

const prototypeRoutes = [
  '?seed=qa#/',
  '?seed=qa#/mode',
  '?seed=qa#/location',
  '?seed=qa#/catalog',
  '?seed=qa#/product/syrniki',
  '?seed=qa#/cart',
  '?seed=qa#/time',
  '?seed=qa#/checkout',
  '?seed=qa#/payment-error',
  '?seed=qa#/success',
  '?seed=qa#/repeat',
  '?seed=qa#/cake',
  '?seed=qa#/cake-confirm',
  '?seed=qa#/loyalty',
  '?seed=qa#/login',
  '?seed=qa#/orders',
]

for (const width of [360, 390, 430]) {
  for (const route of prototypeRoutes) await inspect(route, width, 844)
}
for (const route of ['?seed=qa#/', '?seed=qa#/catalog', '?seed=qa#/payment-error']) {
  await inspect(route, 1440, 900)
}

for (const width of [390, 768, 1440]) {
  for (let slide = 1; slide <= 12; slide += 1) {
    await inspect(`case/#slide-${slide}`, width, width === 390 ? 844 : 900)
  }
}

async function scenario(name, run) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  watch(page, name)
  try {
    await run(page)
  } catch (error) {
    problems.push(`${name}: ${error instanceof Error ? error.message : error}`)
  } finally {
    await page.close()
  }
}

await scenario('main order flow', async (page) => {
  await page.goto(new URL('#/', base).toString(), { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Доставка', exact: true }).click()
  await page.getByText('Куда доставить?', { exact: true }).waitFor()
  await page.getByRole('button', { name: /Демо-адрес · ул. Красная, 64/ }).click()
  await page.getByText('Готовая еда', { exact: true }).first().waitFor()

  await page.getByRole('button', { name: 'Завтраки', exact: true }).click()
  await page.getByRole('button', { name: /Сырники классические/ }).first().click()
  await page.getByRole('button', { name: /Добавить/ }).click()
  await page.getByRole('button', { name: 'Назад' }).click()
  await page.getByRole('button', { name: /Корзина/ }).last().click()
  await page.getByRole('button', { name: /Выбрать время/ }).click()
  await page.getByRole('button', { name: /Сегодня · 19:10/ }).click()
  await page.getByRole('button', { name: /Перейти к оформлению/ }).click()
  await page.getByRole('button', { name: /Оплатить в демо/ }).click()
  await page.getByRole('heading', { name: /корзина сохранена/i }).waitFor()
  await page.getByRole('button', { name: /Проверить корзину/ }).click()
  await page.getByText('Демо-адрес · ул. Красная, 64').first().waitFor()
  await page.goBack()
  await page.getByRole('button', { name: /Повторить оплату/ }).click()
  await page.getByRole('heading', { name: /Демо-заказ подтверждён/i }).waitFor()
})

await scenario('repeat and empty orders', async (page) => {
  await page.goto(new URL('#/orders', base).toString(), { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Текущие', exact: true }).click()
  await page.getByText('Текущих заказов нет').waitFor()
  await page.getByRole('button', { name: 'История', exact: true }).click()
  await page.getByRole('button', { name: /Проверить и повторить/ }).click()
  await page.getByRole('heading', { name: /Проверили цену/ }).waitFor()
  await page.getByRole('button', { name: /Добавить доступное/ }).click()
  await page.getByText('Сезонная позиция', { exact: true }).waitFor({ state: 'detached' })
  await page.getByRole('button', { name: /Выбрать время/ }).waitFor()
})

await scenario('cake order flow', async (page) => {
  await page.goto(new URL('#/cake', base).toString(), { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'На 12–16 гостей' }).click()
  await page.getByRole('button', { name: /Продолжить/ }).click()
  await page.getByRole('button', { name: 'Ягодный акцент' }).click()
  await page.getByRole('button', { name: /Продолжить/ }).click()
  await page.getByText('На 12–16 гостей').waitFor()
  await page.getByText('Ягодный акцент').waitFor()
  await page.getByRole('button', { name: /Подтвердить демо/ }).click()
  await page.getByRole('heading', { name: /Торт сохранён/ }).waitFor()
})

await scenario('sms login and loyalty', async (page) => {
  await page.goto(new URL('#/login', base).toString(), { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Получить демо-код/ }).click()
  await page.getByRole('textbox', { name: /Код из СМС/ }).fill('2424')
  await page.getByRole('button', { name: /Войти и открыть карту/ }).click()
  await page.getByText('Карта доступна без сети').waitFor()
})

await scenario('case links and deep links', async (page) => {
  const allLinks = []
  for (let slide = 1; slide <= 12; slide += 1) {
    await page.goto(new URL(`case/#slide-${slide}`, base).toString(), { waitUntil: 'networkidle' })
    allLinks.push(...await page.locator('a[href]').evaluateAll((items) => items.map((item) => item.getAttribute('href')).filter(Boolean)))
  }
  const expected = ['#/mode', '#/payment-error', '#/loyalty', '#/cake', 'mailto:hello@eh.works', 'https://eh.works']
  for (const value of expected) {
    if (!allLinks.some((href) => href.includes(value))) problems.push(`case links: missing ${value}`)
  }

  for (const href of new Set(allLinks.filter((item) => item.startsWith('../?seed=case#')))) {
    const response = await page.goto(new URL(`case/${href}`, base).toString(), { waitUntil: 'networkidle' })
    if (response && !response.ok()) problems.push(`deep link ${href} HTTP ${response.status()}`)
    await page.reload({ waitUntil: 'networkidle' })
    const route = href.split('#')[1]
    if (new URL(page.url()).hash !== `#${route}`) problems.push(`deep link ${href} lost route after reload`)
  }
})

await browser.close()

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('QA passed: all prototype routes at 360/390/430 and desktop; all 12 case slides at 390/768/1440; four full scenarios; deep links; images; console; overflow')
