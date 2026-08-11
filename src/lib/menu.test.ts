import test from 'node:test'
import assert from 'node:assert/strict'
import { officialCategories, products } from '../data/menu.ts'

test('every official menu category contains two or three products', () => {
  assert.equal(officialCategories.length, 19)
  for (const category of officialCategories) {
    const categoryProducts = products.filter((product) => product.category === category)
    assert.ok(categoryProducts.length >= 2, `${category} contains fewer than two products`)
    assert.ok(categoryProducts.length <= 3, `${category} contains more than three products`)
  }
})

test('all menu content links only to official Patrick & Mary sources', () => {
  for (const product of products) {
    assert.match(product.source, /^https:\/\/patrickmary\.ru\/product\//)
    assert.match(product.image, /^https:\/\/api\.patrickmary\.ru\/api\/file\//)
    assert.ok(product.name.length > 0)
    assert.ok(product.description.length > 0)
    assert.ok(product.price > 0)
    assert.ok(product.weight.length > 0)
  }
})
