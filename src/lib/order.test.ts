import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addLine,
  changeQuantity,
  createCakeRequest,
  createConfirmedOrder,
  filterLocations,
  reconcileRepeat,
  total,
  type CartLine,
} from './order.ts'

test('cart keeps quantities and calculates a total', () => {
  const first = addLine([], { id: 'syrniki', name: 'Сырники', price: 390 })
  const second = addLine(first, { id: 'syrniki', name: 'Сырники', price: 390 })
  assert.equal(second[0].quantity, 2)
  assert.equal(total(second), 780)
  assert.deepEqual(changeQuantity(second, 'syrniki', -2), [])
})

test('repeat order checks current price and availability before cart creation', () => {
  const previous: CartLine[] = [
    { id: 'syrniki', name: 'Сырники', price: 350, quantity: 1 },
    { id: 'seasonal', name: 'Сезонная позиция', price: 260, quantity: 1 },
  ]
  const reconciled = reconcileRepeat(previous, { syrniki: 390 })
  assert.equal(reconciled[0].price, 390)
  assert.equal(reconciled[0].available, true)
  assert.equal(reconciled[1].available, false)
})

test('payment recovery never clears cart lines', () => {
  const basket: CartLine[] = [{ id: 'pie', name: 'Пирог', price: 540, quantity: 1 }]
  const snapshot = structuredClone(basket)
  assert.deepEqual(snapshot, basket)
})

test('confirmed order keeps the exact checkout snapshot', () => {
  const basket: CartLine[] = [
    { id: 'syrniki', name: 'Сырники классические', price: 390, quantity: 1 },
    { id: 'bakery', name: 'Свежая выпечка', price: 190, quantity: 2 },
  ]
  const order = createConfirmedOrder('PM-024', 'delivery', 'ул. Красная, 64', 'Сегодня · 19:10–19:25', basket)
  assert.equal(order.amount, 770)
  assert.equal(order.lines[1].quantity, 2)
  assert.equal(order.location, 'ул. Красная, 64')
  assert.equal(order.status, 'Принят')
})

test('repeat preview and resulting cart preserve the same quantities', () => {
  const previous: CartLine[] = [
    { id: 'syrniki', name: 'Сырники классические', price: 350, quantity: 1 },
    { id: 'bakery', name: 'Свежая выпечка', price: 190, quantity: 2 },
  ]
  const available = reconcileRepeat(previous, { syrniki: 390, bakery: 190 }).filter((line) => line.available)
  assert.deepEqual(available.map(({ id, quantity }) => ({ id, quantity })), [
    { id: 'syrniki', quantity: 1 },
    { id: 'bakery', quantity: 2 },
  ])
  assert.equal(total(available), 770)
})

test('cake request contains only choices made by the user', () => {
  assert.deepEqual(createCakeRequest('На 12–16 гостей', 'Ягодный акцент'), {
    size: 'На 12–16 гостей',
    design: 'Ягодный акцент',
    status: 'Сохранена',
  })
})

test('location search filters the selectable list', () => {
  const locations = ['ул. Красная, 155', 'ул. Кубанская набережная, 35']
  assert.deepEqual(filterLocations(locations, 'кубанская'), ['ул. Кубанская набережная, 35'])
  assert.deepEqual(filterLocations(locations, ''), locations)
})
