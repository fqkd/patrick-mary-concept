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
    brokenImages: [...document.images].filter((item) => item.complete && item.naturalWidth === 0).map((item) => item.src),
    emptyRoot: !document.querySelector('#root, #case-root')?.textContent?.trim(),
  }))
  if (result.overflow) problems.push(`${path} ${width}px horizontal overflow`)
  if (result.emptyRoot) problems.push(`${path} ${width}px empty root`)
  for (const image of result.brokenImages) problems.push(`${path} ${width}px broken image ${image}`)
  await page.close()
}

const prototypeRoutes = [
  '?seed=qa#/', '?seed=qa#/mode', '?seed=qa#/location', '?seed=qa#/catalog',
  '?seed=qa#/product/syrniki', '?seed=qa#/cart', '?seed=qa#/time', '?seed=qa#/checkout',
  '?seed=qa#/payment-error', '?seed=qa#/success', '?seed=qa#/repeat', '?seed=qa#/cake',
  '?seed=qa#/cake-confirm', '?seed=qa#/loyalty', '?seed=qa#/login', '?seed=qa#/orders',
  '?seed=qa#/favorites',
]

for (const width of [360, 390, 430]) {
  for (const route of prototypeRoutes) await inspect(route, width, width === 430 ? 932 : 844)
}
for (const route of ['?seed=qa#/', '?seed=qa#/catalog', '?seed=qa#/product/syrniki', '?seed=qa#/payment-error']) {
  await inspect(route, 1440, 900)
}
for (const width of [390, 768, 1440]) {
  for (let slide = 1; slide <= 12; slide += 1) {
    await inspect(`case/#slide-${slide}`, width, width === 390 ? 844 : 900)
  }
}

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

async function assertBottomNav(page, label) {
  const hierarchy = await page.evaluate(() => ({
    insideScreen: Boolean(document.querySelector('.screen .bottom-nav')),
    directChild: document.querySelector('.phone-shell > .bottom-nav')?.parentElement?.classList.contains('phone-shell') ?? false,
    nestedVerticalScrolls: [...document.querySelectorAll('.screen *')].filter((element) => {
      const style = getComputedStyle(element)
      return ['auto', 'scroll'].includes(style.overflowY) && element.scrollHeight > element.clientHeight + 1
    }).length,
  }))
  if (hierarchy.insideScreen || !hierarchy.directChild) throw new Error(`${label}: нижняя навигация находится внутри прокрутки`)
  if (hierarchy.nestedVerticalScrolls) throw new Error(`${label}: найден вложенный вертикальный скролл`)

  const screen = page.locator('.screen')
  const nav = page.locator('.bottom-nav')
  const shell = page.locator('.phone-shell')
  const before = await nav.boundingBox()
  await screen.evaluate((element) => { element.scrollTop = element.scrollHeight })
  await page.waitForTimeout(120)
  const after = await nav.boundingBox()
  const shellBox = await shell.boundingBox()
  if (!before || !after || !shellBox) throw new Error(`${label}: не удалось измерить навигацию`)
  if (Math.abs(before.y - after.y) > 1) throw new Error(`${label}: навигация сдвинулась при прокрутке`)
  if (Math.abs(after.y + after.height - (shellBox.y + shellBox.height)) > 1) throw new Error(`${label}: навигация не у нижней границы`)
}

async function runMobileJourney(page) {
  await page.goto(new URL('#/', base).toString(), { waitUntil: 'networkidle' })
  await page.evaluate(() => { sessionStorage.clear(); localStorage.clear() })
  await page.reload({ waitUntil: 'networkidle' })

  if (await page.locator('.safe-top').count()) throw new Error('декоративный верхний вырез остался в прототипе')

  await page.getByRole('button', { name: /^Доставка/ }).click()
  const addressSearch = page.getByRole('textbox', { name: 'Поиск адреса доставки' })
  await addressSearch.fill('Красная')
  await page.getByRole('button', { name: /ул. Красная, 64/ }).click()
  await page.getByText('Доставка · ул. Красная, 64').waitFor()

  await assertBottomNav(page, 'каталог')
  await page.locator('.screen').evaluate((element) => { element.scrollTop = 0 })
  await page.getByRole('heading', { name: 'Всё меню' }).waitFor()
  if (await page.locator('.menu-category-section').count() !== 19) throw new Error('всё меню не разделено на 19 категорий')
  await page.getByRole('textbox', { name: 'Поиск по меню' }).fill('сырник')
  const foundSyrniki = page.locator('.product-card').filter({ hasText: 'Сырник творожный' })
  await foundSyrniki.getByRole('button', { name: 'Добавить Сырник творожный в избранное' }).click()
  await page.getByRole('button', { name: 'Избранное', exact: true }).click()
  await page.getByRole('heading', { name: 'Избранное' }).last().waitFor()
  await page.getByText('Сырник творожный', { exact: true }).waitFor()
  await assertBottomNav(page, 'избранное')
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('Сырник творожный', { exact: true }).waitFor()
  const storedFavorites = await page.evaluate(() => JSON.parse(localStorage.getItem('pm-favorites') || '[]'))
  if (!storedFavorites.includes('syrniki')) throw new Error('избранное не сохранилось после обновления')
  await page.evaluate(() => sessionStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('Сырник творожный', { exact: true }).waitFor()
  await page.goto(new URL('#/mode', base).toString(), { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /^Доставка/ }).click()
  await page.getByRole('textbox', { name: 'Поиск адреса доставки' }).fill('Красная')
  await page.getByRole('button', { name: /ул. Красная, 64/ }).click()
  await page.getByText('Доставка · ул. Красная, 64').waitFor()
  await page.getByRole('button', { name: 'Меню', exact: true }).click()
  await page.getByRole('textbox', { name: 'Поиск по меню' }).fill('сырник')
  await page.locator('.product-card').filter({ hasText: 'Сырник творожный' }).locator('.product-copy').click()
  await page.getByRole('button', { name: 'Удалить из избранного' }).waitFor()
  if (await page.locator('.product-hero img').getAttribute('src') !== 'https://api.patrickmary.ru/api/file/Nomenclature729x475/10754/6f116cfa-e348-11db-a154-0011671aa2d0_99-0005168_729x475.jpg') throw new Error('у сырников неверное изображение')
  await page.getByRole('button', { name: /^Добавить$/ }).click()
  await page.getByRole('button', { name: /Открыть корзину · 1/ }).click()
  const syrnikiLine = page.locator('.cart-line').filter({ hasText: 'Сырник творожный' })
  await syrnikiLine.getByText('1', { exact: true }).waitFor()
  if (!await page.getByText('150 ₽', { exact: true }).count()) throw new Error('повторное нажатие незаметно изменило сумму')
  await syrnikiLine.getByRole('button', { name: 'Увеличить' }).click()
  await syrnikiLine.getByText('2', { exact: true }).waitFor()
  await syrnikiLine.getByRole('button', { name: 'Уменьшить' }).click()
  await syrnikiLine.getByText('1', { exact: true }).waitFor()

  await page.getByRole('button', { name: /Выбрать время/ }).click()
  await page.getByRole('button', { name: /Сегодня · 19:10/ }).click()
  await page.getByRole('button', { name: /Перейти к оформлению/ }).click()
  if (await page.getByRole('checkbox').count()) throw new Error('на оформлении осталось предварительное согласие')
  await page.getByText('заказ и оплата никуда не отправятся', { exact: false }).waitFor()
  await page.getByRole('button', { name: /Проверить оплату/ }).click()
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('Доставка · ул. Красная, 64').waitFor()
  await page.getByRole('button', { name: /Повторить оплату/ }).click()
  await page.getByRole('heading', { name: 'Заказ подтверждён' }).waitFor()
  await page.getByText('Сырник творожный × 1').waitFor()
  await page.getByText('150 ₽', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Посмотреть историю' }).click()
  await page.getByText('Доставка · ул. Красная, 64').waitFor()
  await page.getByText('Сырник творожный × 1').waitFor()
  await assertBottomNav(page, 'заказы')

  const afterOrder = await page.evaluate(() => JSON.parse(sessionStorage.getItem('pm-demo-state') || '{}'))
  if (afterOrder.cart?.length !== 0 || afterOrder.orders?.[0]?.amount !== 150) throw new Error('заказ не сохранён или корзина не очищена')

  await page.goto(new URL('#/mode', base).toString(), { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Самовывоз/ }).click()
  const pickupSearch = page.getByRole('textbox', { name: 'Поиск кулинарии' })
  await pickupSearch.fill('Кубанская')
  if (await page.locator('.location-list button').count() !== 1) throw new Error('поиск кулинарии не фильтрует список')
  await page.getByRole('button', { name: /ул. Кубанская набережная, 35/ }).click()
  await page.getByText('Самовывоз · ул. Кубанская набережная, 35').waitFor()
  await page.getByRole('button', { name: 'Главная', exact: true }).click()
  await page.getByText('Самовывоз · ул. Кубанская набережная, 35').waitFor()

  await page.goto(new URL('#/repeat', base).toString(), { waitUntil: 'networkidle' })
  await page.getByText('Сырник творожный · 1 шт.').waitFor()
  await page.getByText('Киш из песочного теста с рыбой · 2 шт.').waitFor()
  await page.getByText('3 шт. · 2 414 ₽').waitFor()
  await page.getByRole('button', { name: /Собрать корзину · 2 414 ₽/ }).click()
  await page.locator('.cart-line').filter({ hasText: 'Киш из песочного теста с рыбой' }).getByText('2', { exact: true }).waitFor()
  const repeated = await page.evaluate(() => JSON.parse(sessionStorage.getItem('pm-demo-state') || '{}').cart)
  if (repeated?.find((line) => line.id === 'bakery')?.quantity !== 2) throw new Error('количества повтора не совпадают с корзиной')

  await page.goto(new URL('#/loyalty', base).toString(), { waitUntil: 'networkidle' })
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('Покажите его сотруднику до оплаты.').waitFor()
  await page.getByText('Начислить или списать баллы').waitFor()
  await assertBottomNav(page, 'карта')

  await page.goto(new URL('#/cake', base).toString(), { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'На 12–16 гостей' }).click()
  await page.getByRole('button', { name: /Продолжить/ }).click()
  await page.getByRole('button', { name: 'Ягодный акцент' }).click()
  await page.getByRole('button', { name: /Продолжить/ }).click()
  await page.getByText('На 12–16 гостей').waitFor()
  await page.getByText('Ягодный акцент', { exact: true }).last().waitFor()
  const cakeReview = await page.locator('.cake-body').textContent()
  if (/18 августа|12:00|2 400 ₽/.test(cakeReview || '')) throw new Error('в заявке появились невыбранные дата, время или цена')
  await page.getByRole('button', { name: /Сохранить заявку/ }).click()
  await page.getByText('Заявка хранится отдельно').waitFor()
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('На 12–16 гостей').waitFor()
  const afterCake = await page.evaluate(() => JSON.parse(sessionStorage.getItem('pm-demo-state') || '{}'))
  if (afterCake.cart?.some((line) => line.id === 'cake')) throw new Error('заявка на торт попала в обычную корзину')
  if (afterCake.cakeRequest?.design !== 'Ягодный акцент') throw new Error('итог заявки не сохранил выбранное оформление')
}

for (const width of [360, 390, 430]) {
  await scenario('полный мобильный путь', width, runMobileJourney)
}

await scenario('официальные категории меню', 390, async (page) => {
  await page.goto(new URL('?seed=qa#/catalog', base).toString(), { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Всё меню' }).waitFor()
  const sections = page.locator('.menu-category-section')
  if (await sections.count() !== 19) throw new Error('показаны не все 19 разделов меню')
  for (const section of await sections.all()) {
    const count = await section.locator('.product-card').count()
    if (count < 2 || count > 3) throw new Error(`в разделе показано ${count} позиций`)
  }
  await page.getByRole('button', { name: 'Все категории' }).click()
  if (await page.locator('.category-panel button').count() !== 20) throw new Error('в выборе нет пункта «Всё меню» и 19 категорий')
  await page.locator('.category-panel button').filter({ hasText: 'Завтраки' }).click()
  await page.getByRole('heading', { name: 'Завтраки' }).waitFor()
  if (await page.locator('.product-card').count() !== 3) throw new Error('в категории «Завтраки» показано неверное число позиций')
})

await scenario('case links and device frames', 390, async (page) => {
  const allLinks = []
  for (let slide = 1; slide <= 12; slide += 1) {
    await page.goto(new URL(`case/#slide-${slide}`, base).toString(), { waitUntil: 'networkidle' })
    allLinks.push(...await page.locator('a[href]').evaluateAll((items) => items.map((item) => item.getAttribute('href')).filter(Boolean)))
  }
  if (await page.locator('.phone-shot > span').count()) throw new Error('декоративный вырез перекрывает мокап')
  const expected = ['#/mode', '#/payment-error', '#/loyalty', '#/cake', 'mailto:hello@eh.works', 'https://eh.works', 'https://t.me/andrey_ergohaven', 'https://max.ru/id5041212966_biz']
  for (const value of expected) {
    if (!allLinks.some((href) => href.includes(value))) problems.push(`case links: missing ${value}`)
  }
  for (const href of new Set(allLinks.filter((item) => item.startsWith('../?seed=case#')))) {
    const response = await page.goto(new URL(`case/${href}`, base).toString(), { waitUntil: 'networkidle' })
    if (response && !response.ok()) problems.push(`deep link ${href} HTTP ${response.status()}`)
    await page.reload({ waitUntil: 'networkidle' })
    const route = href.split('#')[1]
    if (new URL(page.url()).hash !== `#${route}`) problems.push(`deep link ${href} lost route after reload`)
    if (!await page.locator('#root').textContent()) problems.push(`deep link ${href} empty root`)
  }
})

await browser.close()
if (preview) preview.kill('SIGTERM')

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('QA passed: 17 routes at 360/390/430; grouped categories, persistent favorites, full delivery, pickup, product, order, repeat, loyalty and cake flows; fixed five-tab nav; case at 390/768/1440; deep links; console; overflow')
