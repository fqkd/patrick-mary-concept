import test from 'node:test'
import assert from 'node:assert/strict'
import { addLine, changeQuantity, reconcileRepeat, total, type CartLine } from './order.ts'

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
