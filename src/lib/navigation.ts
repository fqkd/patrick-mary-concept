import type { ServiceMode } from './order'

export type RouteSnapshot = {
  path: string
  params: URLSearchParams
}

export type GuardState = {
  authenticated: boolean
  mode: ServiceMode | null
  location: string
  cartCount: number
  slot: string
  orderCount: number
  hasCakeRequest: boolean
}

export const readHashRoute = (hash: string): RouteSnapshot => {
  const raw = hash.replace(/^#/, '') || '/'
  const [path = '/', query = ''] = raw.split('?')
  return { path: path || '/', params: new URLSearchParams(query) }
}

export const hashPath = (path: string, params?: Record<string, string | undefined>) => {
  const query = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  return `${path}${query.size ? `?${query}` : ''}`
}

export const serviceModeFromParams = (params: URLSearchParams): ServiceMode =>
  params.get('mode') === 'delivery' ? 'delivery' : 'pickup'

export const routeRedirect = (path: string, state: GuardState): string | null => {
  const hasContext = Boolean(state.mode && state.location)
  const needsContext = path === '/catalog' || path.startsWith('/product/') || path === '/cart'
  if (needsContext && !hasContext) return '/mode'
  if (path === '/time') {
    if (!hasContext) return '/mode'
    if (!state.cartCount) return '/catalog'
  }
  if (path === '/checkout' || path === '/payment-error') {
    if (!hasContext) return '/mode'
    if (!state.cartCount) return '/catalog'
    if (!state.slot) return '/time'
    if (!state.authenticated) return '/login?step=phone&next=checkout'
  }
  if (path === '/success' && !state.orderCount) return '/orders?tab=current'
  if (path === '/repeat' && !state.authenticated) return '/login?step=phone&next=repeat'
  if (path === '/cake-confirm' && !state.hasCakeRequest) return '/cake?step=occasion'
  return null
}

export const safeNextRoute = (value: string | null) => {
  const allowed: Record<string, string> = {
    checkout: '/checkout',
    loyalty: '/loyalty',
    orders: '/orders?tab=history',
    repeat: '/repeat',
    profile: '/profile',
  }
  return value ? allowed[value] ?? '/loyalty' : '/loyalty'
}
