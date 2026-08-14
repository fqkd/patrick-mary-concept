import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addLine,
  changeQuantity,
  createCakeRequest,
  createConfirmedOrder,
  filterLocations,
  positionWord,
  reconcileRepeat,
  toggleFavoriteId,
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
    { id: 'syrniki', name: 'Сырник творожный', price: 150, quantity: 1 },
    { id: 'bakery', name: 'Киш из песочного теста с рыбой', price: 1132, quantity: 2 },
  ]
  const order = createConfirmedOrder('PM-024', 'delivery', 'ул. Красная, 64', 'Сегодня · 19:10–19:25', basket)
  assert.equal(order.amount, 2414)
  assert.equal(order.lines[1].quantity, 2)
  assert.equal(order.location, 'ул. Красная, 64')
  assert.equal(order.status, 'Принят')
})

test('repeat preview and resulting cart preserve the same quantities', () => {
  const previous: CartLine[] = [
    { id: 'syrniki', name: 'Сырник творожный', price: 140, quantity: 1 },
    { id: 'bakery', name: 'Киш из песочного теста с рыбой', price: 1090, quantity: 2 },
  ]
  const available = reconcileRepeat(previous, { syrniki: 150, bakery: 1132 }).filter((line) => line.available)
  assert.deepEqual(available.map(({ id, quantity }) => ({ id, quantity })), [
    { id: 'syrniki', quantity: 1 },
    { id: 'bakery', quantity: 2 },
  ])
  assert.equal(total(available), 2414)
})

test('cake request keeps every field entered by the user', () => {
  assert.deepEqual(createCakeRequest({
    occasion: 'День рождения',
    guests: '12–16 гостей',
    design: 'Оформление с ягодами',
    date: '2026-08-22',
    phone: '+7 900 000 00 24',
    comment: 'Без надписи',
  }), {
    occasion: 'День рождения',
    guests: '12–16 гостей',
    design: 'Оформление с ягодами',
    date: '2026-08-22',
    phone: '+7 900 000 00 24',
    comment: 'Без надписи',
    status: 'Сохранена',
  })
})

test('position declension handles Russian exceptions', () => {
  assert.equal(positionWord(1), 'позиция')
  assert.equal(positionWord(2), 'позиции')
  assert.equal(positionWord(4), 'позиции')
  assert.equal(positionWord(5), 'позиций')
  assert.equal(positionWord(11), 'позиций')
  assert.equal(positionWord(21), 'позиция')
})

test('favorite toggle adds and removes a product without duplicates', () => {
  const added = toggleFavoriteId([], 'syrniki')
  assert.deepEqual(added, ['syrniki'])
  assert.deepEqual(toggleFavoriteId(added, 'syrniki'), [])
})

test('location search filters the selectable list', () => {
  const locations = ['ул. Красная, 155', 'ул. Кубанская набережная, 35']
  assert.deepEqual(filterLocations(locations, 'кубанская'), ['ул. Кубанская набережная, 35'])
  assert.deepEqual(filterLocations(locations, ''), locations)
})
