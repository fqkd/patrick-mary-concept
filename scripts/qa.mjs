import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const remoteBase = process.env.BASE_URL
const base = remoteBase || 'http://127.0.0.1:4173/'
let preview

process.on('exit', () => {
  if (preview && !preview.killed) preview.kill('SIGTERM')
})

async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Сервер не ответил: ${url}`)
}

if (!remoteBase) {
  preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  await waitForServer(base)
}

const browser = await chromium.launch({ headless: true })
const problems = []

function watch(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(`${label} console ${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`${label} page: ${error.message}`))
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).origin === new URL(base).origin) problems.push(`${label} request: ${request.url()} ${request.failure()?.errorText ?? 'failed'}`)
  })
}

async function inspect(path, width, height) {
  const page = await browser.newPage({ viewport: { width, height } })
  watch(page, `${path} ${width}px`)
  try {
    const response = await page.goto(new URL(path, base).toString(), { waitUntil: 'networkidle' })
    if (!response?.ok()) problems.push(`${path} ${width}px HTTP ${response?.status()}`)
    const result = await page.evaluate(() => {
      const root = document.querySelector('#root, #case-root')
      const visible = (element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      }
      const undersized = [...document.querySelectorAll('.screen button, .screen a[href]')]
        .filter(visible)
        .filter((element) => !element.closest('.pickup-map') && (element.getBoundingClientRect().width < 44 || element.getBoundingClientRect().height < 44))
        .map((element) => `${element.tagName}:${element.textContent?.trim().slice(0, 32)} ${Math.round(element.getBoundingClientRect().width)}x${Math.round(element.getBoundingClientRect().height)}`)
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        brokenImages: [...document.images].filter((item) => item.complete && item.naturalWidth === 0).map((item) => item.src),
        emptyRoot: !root?.textContent?.trim(),
        undersized,
      }
    })
    if (result.overflow) problems.push(`${path} ${width}px horizontal overflow`)
    if (result.emptyRoot) problems.push(`${path} ${width}px empty root`)
    for (const image of result.brokenImages) problems.push(`${path} ${width}px broken image ${image}`)
    for (const target of result.undersized) problems.push(`${path} ${width}px undersized target ${target}`)
  } finally {
    await page.close()
  }
}

const seededRoutes = [
  '/', '/mode', '/location?mode=pickup', '/location?mode=delivery', '/catalog?category=cakes',
  '/product/syrniki', '/cart', '/time', '/checkout', '/payment-error', '/success', '/repeat',
  '/cake?step=occasion', '/cake?step=guests', '/cake?step=style', '/cake?step=details', '/cake?step=review',
  '/cake-confirm', '/loyalty', '/login?step=phone', '/login?step=code', '/orders?tab=current',
  '/orders?tab=history', '/favorites', '/profile',
]

const inspections = []
for (const width of [360, 390, 430]) {
  for (const route of seededRoutes) inspections.push(() => inspect(`?seed=qa#${route}`, width, width === 430 ? 932 : 844))
}
for (const width of [390, 768, 1440]) {
  for (let slide = 1; slide <= 12; slide += 1) inspections.push(() => inspect(`case/#slide-${slide}`, width, width === 390 ? 844 : 900))
}
let inspectionIndex = 0
await Promise.all(Array.from({ length: 4 }, async () => {
  while (inspectionIndex < inspections.length) {
    const task = inspections[inspectionIndex]
    inspectionIndex += 1
    await task()
  }
}))

async function scenario(name, width, run) {
  const page = await browser.newPage({ viewport: { width, height: width === 430 ? 932 : 844 } })
  watch(page, `${name} ${width}px`)
  try {
    await run(page)
  } catch (error) {
    problems.push(`${name} ${width}px: ${error instanceof Error ? error.message : error}`)
  } finally {
    await page.close()
  }
}

const routeUrl = (route, seed = '') => new URL(`${seed ? `?seed=${seed}` : ''}#${route}`, base).toString()

async function fresh(page, route = '/') {
  await page.goto(routeUrl('/'), { waitUntil: 'networkidle' })
  await page.evaluate(() => { sessionStorage.clear(); localStorage.clear() })
  await page.goto(routeUrl(route), { waitUntil: 'networkidle' })
}

async function assertHash(page, expected) {
  await page.waitForFunction((hash) => window.location.hash === hash, `#${expected}`)
}

async function assertBottomNav(page, label) {
  const result = await page.evaluate(() => ({
    nested: Boolean(document.querySelector('.screen .bottom-nav')),
    direct: Boolean(document.querySelector('.phone-shell > .bottom-nav')),
  }))
  if (result.nested || !result.direct) throw new Error(`${label}: нижняя навигация находится внутри прокрутки`)
  const nav = page.locator('.bottom-nav')
  const before = await nav.boundingBox()
  await page.locator('.screen').evaluate((element) => { element.scrollTop = element.scrollHeight })
  const after = await nav.boundingBox()
  if (!before || !after || Math.abs(before.y - after.y) > 1) throw new Error(`${label}: нижняя навигация сдвинулась`)
}

await scenario('гостевой старт и защита данных', 390, async (page) => {
  await fresh(page)
  if (await page.getByText('1 240', { exact: true }).count()) throw new Error('баланс виден гостю')
  if (await page.locator('.demo-qr').count()) throw new Error('QR-код виден гостю')
  if (await page.getByText('+7 900 000 00 24', { exact: true }).count()) throw new Error('телефон виден гостю')
  await page.goto(routeUrl('/loyalty'), { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Войдите, чтобы открыть карту' }).waitFor()
  if (await page.locator('.demo-qr').count()) throw new Error('QR-код доступен по прямой ссылке гостю')
  await page.goto(routeUrl('/orders?tab=history'), { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Заказы доступны после входа' }).waitFor()
  if (await page.getByText('28 июля', { exact: true }).count()) throw new Error('история видна гостю')
  await page.goto(routeUrl('/location?mode=delivery'), { waitUntil: 'networkidle' })
  await page.getByText('Сохранённые адреса скрыты', { exact: true }).waitFor()
})

await scenario('защита прямых маршрутов свежей сессии', 390, async (page) => {
  const redirects = [
    ['/catalog?category=cakes', '/mode'],
    ['/time', '/mode'],
    ['/checkout', '/mode'],
    ['/payment-error', '/mode'],
    ['/success', '/orders?tab=current'],
  ]
  for (const [route, expected] of redirects) {
    await fresh(page, route)
    await assertHash(page, expected)
  }
})

await scenario('URL — источник истины и reload', 390, async (page) => {
  const states = [
    ['/location?mode=pickup', 'Выберите кулинарию'],
    ['/location?mode=delivery', 'Куда доставить?'],
    ['/catalog?category=cakes', 'Торты'],
    ['/cake?step=style', 'Какой стиль ближе?'],
    ['/cake?step=review', 'Ваш бриф'],
    ['/login?step=phone', 'Номер телефона — и вы внутри'],
    ['/login?step=code', 'Введите код из СМС'],
    ['/orders?tab=current', 'Текущие'],
    ['/orders?tab=history', '28 июля'],
  ]
  for (const [route, text] of states) {
    await page.goto(routeUrl(route, 'routes'), { waitUntil: 'networkidle' })
    await page.reload({ waitUntil: 'networkidle' })
    await assertHash(page, route)
    await page.getByText(text, { exact: text === '28 июля' }).last().waitFor()
  }
  await page.goto(routeUrl('/location?mode=pickup', 'routes'), { waitUntil: 'networkidle' })
  await page.evaluate(() => { window.location.hash = '/location?mode=delivery' })
  await assertHash(page, '/location?mode=delivery')
  await page.goBack()
  await assertHash(page, '/location?mode=pickup')
  await page.getByText('Ближайшие кулинарии', { exact: true }).waitFor()
})

async function fullJourney(page) {
  await fresh(page)
  await page.getByLabel('Войти').click()
  await assertHash(page, '/login?step=phone&next=profile')
  await page.getByRole('button', { name: 'Получить код' }).click()
  await assertHash(page, '/login?step=code&next=profile')
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Введите код из СМС' }).waitFor()
  await page.getByRole('textbox', { name: 'Код из СМС' }).fill('1234')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await page.getByRole('heading', { name: 'Андрей' }).waitFor()
  await page.goto(routeUrl('/loyalty'), { waitUntil: 'networkidle' })
  await page.locator('.demo-qr').waitFor()
  if (await page.getByRole('link', { name: /Правила программы/ }).getAttribute('href') !== 'https://patrickmary.ru/bonusy') throw new Error('правила лояльности не ведут на официальный источник')
  await assertBottomNav(page, 'бонусы')

  await page.goto(routeUrl('/mode'), { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /^Самовывоз/ }).click()
  await assertHash(page, '/location?mode=pickup')
  await page.locator('.map-marker').first().waitFor()
  if (await page.locator('.map-marker').count() !== 3) throw new Error('на карте не три маркера')
  await page.getByRole('button', { name: /Точка 2:/ }).click()
  const selectedRow = page.locator('.location-list button.active')
  if (!await selectedRow.getByText('ул. Кубанская набережная, 35').count()) throw new Error('маркер не синхронизирован со строкой')
  await page.getByRole('button', { name: 'Выбрать эту кулинарию' }).click()
  await page.getByText('Самовывоз · ул. Кубанская набережная, 35').waitFor()

  await page.getByRole('button', { name: 'Категории' }).click()
  await page.locator('.category-panel button').filter({ hasText: /^Торты2$/ }).click()
  await assertHash(page, '/catalog?category=cakes')
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Торты', exact: true }).waitFor()
  await page.getByRole('textbox', { name: 'Поиск по меню' }).fill('сырник')
  const syrnik = page.locator('.product-card').filter({ hasText: 'Сырник творожный' })
  await syrnik.getByRole('button', { name: 'Добавить Сырник творожный в избранное' }).click()
  await syrnik.getByRole('button', { name: 'Добавить Сырник творожный' }).click()
  await page.getByRole('button', { name: 'Корзина', exact: true }).click()
  await page.getByText('Время').last().waitFor()
  if (await page.getByText('уточним дальше', { exact: false }).count()) throw new Error('корзина противоречит выбранному адресу')

  await page.goto(routeUrl('/mode'), { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /^Доставка/ }).click()
  await page.getByRole('textbox', { name: 'Поиск адреса доставки' }).fill('Красная')
  await page.getByRole('button', { name: /ул. Красная, 64/ }).click()
  await page.getByRole('button', { name: 'Доставить по этому адресу' }).click()
  await page.getByText('Корзина проверена для нового адреса').waitFor()
  await page.getByRole('button', { name: 'Корзина', exact: true }).click()
  await page.getByRole('button', { name: /Выбрать время/ }).click()
  await page.getByRole('button', { name: /Сегодня · 19:10/ }).click()
  await page.getByRole('button', { name: /Перейти к оформлению/ }).click()
  await page.getByRole('heading', { name: 'Ваш заказ' }).waitFor()
  await page.getByRole('button', { name: /Оплатить 150 ₽/ }).click()
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('1 позиция', { exact: false }).waitFor()
  const retained = await page.evaluate(() => JSON.parse(sessionStorage.getItem('pm-demo-state') || '{}').cart)
  if (retained?.[0]?.id !== 'syrniki') throw new Error('корзина потерялась после ошибки оплаты')
  await page.getByRole('button', { name: 'Повторить оплату' }).click()
  await page.getByRole('button', { name: 'Посмотреть заказ' }).click()
  await assertHash(page, '/orders?tab=current')
  await page.getByText('Сырник творожный × 1').waitFor()

  await page.getByRole('button', { name: 'История' }).click()
  await assertHash(page, '/orders?tab=history')
  await page.getByText('4 шт. · тогда 2 580 ₽', { exact: false }).waitFor()
  await page.getByRole('button', { name: /Проверить и повторить/ }).click()
  await page.getByText('Тогда 2 580 ₽', { exact: false }).waitFor()
  const priceCompare = page.locator('.price-compare')
  await priceCompare.getByText('Сейчас', { exact: true }).waitFor()
  await priceCompare.getByText('2 414 ₽', { exact: true }).waitFor()

  await page.goto(routeUrl('/cake?step=occasion'), { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Свадьба' }).click()
  await page.getByRole('button', { name: /Продолжить/ }).click()
  await page.getByRole('button', { name: '12–16 гостей' }).click()
  await page.getByRole('button', { name: /Продолжить/ }).click()
  await page.getByRole('button', { name: /Ягодный акцент/ }).click()
  const berryImage = await page.locator('.cake-visual img').getAttribute('src')
  await page.getByRole('button', { name: /Лаконичная надпись/ }).click()
  const letteringImage = await page.locator('.cake-visual img').getAttribute('src')
  if (berryImage === letteringImage) throw new Error('превью стилей торта не меняется')
  await page.getByRole('button', { name: /Продолжить/ }).click()
  await page.getByLabel('Желаемая дата').fill('2026-08-22')
  await page.getByLabel('Комментарий к заявке').fill('Без надписи')
  await page.getByRole('button', { name: /Продолжить/ }).click()
  await assertHash(page, '/cake?step=review')
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('Без надписи').waitFor()
  await page.getByRole('button', { name: /Сохранить заявку/ }).click()
  await page.getByRole('heading', { name: 'Бриф получен' }).waitFor()
}

for (const width of [360, 390, 430]) await scenario('полный мобильный путь', width, fullJourney)

await scenario('недоступная позиция при смене адреса', 390, async (page) => {
  await page.goto(routeUrl('/catalog?category=all', 'switch'), { waitUntil: 'networkidle' })
  await page.getByRole('textbox', { name: 'Поиск по меню' }).fill('утка фаршированная')
  await page.locator('.product-card').filter({ hasText: 'Утка фаршированная' }).getByRole('button', { name: 'Добавить Утка фаршированная', exact: true }).click()
  await page.waitForFunction(() => JSON.parse(sessionStorage.getItem('pm-demo-state') || '{}').cart?.some((line) => line.id === 'stuffed-duck'))
  await page.goto(routeUrl('/location?mode=delivery'), { waitUntil: 'networkidle' })
  await page.getByRole('textbox', { name: 'Поиск адреса доставки' }).fill('Красная')
  await page.getByRole('button', { name: /ул. Красная, 64/ }).click()
  await page.getByRole('button', { name: 'Доставить по этому адресу' }).click()
  await page.getByRole('heading', { name: /Состав нужно/ }).waitFor()
  await page.getByText('Утка фаршированная · 1 шт.').waitFor()
  await page.getByRole('button', { name: 'Заменить недоступные' }).click()
  await page.getByText('Недоступные позиции заменены для нового адреса').waitFor()
})

await browser.close()
if (preview) preview.kill('SIGTERM')

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('QA passed: fresh guest guards, URL/reload/back states, pickup map, address switch checks, order recovery, repeat, cake brief, 25 routes at 360/390/430 and case at 390/768/1440')
