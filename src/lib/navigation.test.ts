import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPath, readHashRoute, routeRedirect, serviceModeFromParams } from './navigation.ts'

const complete = {
  authenticated: true,
  mode: 'pickup' as const,
  location: 'ул. Красная, 155',
  cartCount: 2,
  slot: 'Сегодня · 19:10–19:25',
  orderCount: 1,
  hasCakeRequest: true,
}

test('hash query remains the source of truth for direct location links', () => {
  const route = readHashRoute('#/location?mode=pickup')
  assert.equal(route.path, '/location')
  assert.equal(serviceModeFromParams(route.params), 'pickup')
  assert.equal(serviceModeFromParams(readHashRoute('#/location?mode=delivery').params), 'delivery')
})

test('hash helpers preserve catalog, cake, login and orders substates', () => {
  assert.equal(hashPath('/catalog', { category: 'cakes' }), '/catalog?category=cakes')
  assert.equal(hashPath('/cake', { step: 'review' }), '/cake?step=review')
  assert.equal(hashPath('/login', { step: 'code' }), '/login?step=code')
  assert.equal(hashPath('/orders', { tab: 'current' }), '/orders?tab=current')
})

test('fresh sessions cannot skip context, cart, time or authentication', () => {
  const fresh = { ...complete, authenticated: false, mode: null, location: '', cartCount: 0, slot: '', orderCount: 0, hasCakeRequest: false }
  assert.equal(routeRedirect('/catalog', fresh), '/mode')
  assert.equal(routeRedirect('/time', fresh), '/mode')
  assert.equal(routeRedirect('/checkout', fresh), '/mode')
  assert.equal(routeRedirect('/payment-error', fresh), '/mode')
  assert.equal(routeRedirect('/success', fresh), '/orders?tab=current')
  assert.equal(routeRedirect('/repeat', fresh), '/login?step=phone&next=repeat')
})

test('checkout guard redirects to the exact missing step', () => {
  assert.equal(routeRedirect('/checkout', { ...complete, cartCount: 0 }), '/catalog')
  assert.equal(routeRedirect('/checkout', { ...complete, slot: '' }), '/time')
  assert.equal(routeRedirect('/checkout', { ...complete, authenticated: false }), '/login?step=phone&next=checkout')
  assert.equal(routeRedirect('/checkout', complete), null)
})
