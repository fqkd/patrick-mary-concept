import assert from 'node:assert/strict'
import test from 'node:test'
import { pickupLocations } from '../data/locations.ts'
import { filterPickupLocations, sortPickupLocationsFromCenter } from './locations.ts'

test('official pickup dataset contains 21 unique geocoded locations', () => {
  assert.equal(pickupLocations.length, 21)
  assert.equal(new Set(pickupLocations.map((location) => location.id)).size, 21)
  for (const location of pickupLocations) {
    assert.match(location.fullAddress, /Краснодар|Динская/)
    assert.ok(location.coordinates[0] > 44.9 && location.coordinates[0] < 45.3)
    assert.ok(location.coordinates[1] > 38.8 && location.coordinates[1] < 39.3)
    assert.ok(location.hours)
  }
})

test('pickup search matches street, address and district', () => {
  assert.deepEqual(filterPickupLocations(pickupLocations, 'красная, 155').map((location) => location.id), [82])
  assert.deepEqual(filterPickupLocations(pickupLocations, 'КАРАСУНСКИЙ').map((location) => location.id), [165])
  assert.ok(filterPickupLocations(pickupLocations, 'динская').some((location) => location.id === 124828))
  assert.ok(filterPickupLocations(pickupLocations, 'восточно-кругликовская').some((location) => location.id === 122165))
})

test('default pickup order starts with five locations near Krasnodar center', () => {
  const firstFive = sortPickupLocationsFromCenter(pickupLocations).slice(0, 5)
  assert.equal(firstFive.length, 5)
  assert.ok(firstFive.every((location) => location.city === 'Краснодар'))
  assert.ok(firstFive.every((location) => location.id !== 124828))
})
