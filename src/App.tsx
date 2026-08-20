import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CakeSlice,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  Heart,
  Home,
  LayoutGrid,
  LogIn,
  MapPin,
  MessageSquare,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Smartphone,
  Store,
  UserRound,
  Utensils,
  WalletCards,
  X,
} from 'lucide-react'
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
  type CakeDraft,
  type CakeRequest,
  type CartLine,
  type ConfirmedOrder,
  type ServiceMode,
} from './lib/order'
import { hashPath, readHashRoute, routeRedirect, safeNextRoute, serviceModeFromParams } from './lib/navigation'
import { officialCategories, products, type Product } from './data/menu'

type PendingSwitch = {
  mode: ServiceMode
  location: string
  unavailable: CartLine[]
}

type DemoState = {
  authenticated: boolean
  phone: string
  payment: string
  mode: ServiceMode | null
  location: string
  cart: CartLine[]
  slot: string
  orders: ConfirmedOrder[]
  cakeDraft: CakeDraft
  cakeRequest: CakeRequest | null
  favorites: string[]
  basketNotice: string
  pendingSwitch: PendingSwitch | null
}

const initialCakeDraft: CakeDraft = {
  occasion: 'День рождения',
  guests: '8–10 гостей',
  design: 'Светлое оформление',
  date: '',
  phone: '',
  comment: '',
}

const emptyState: DemoState = {
  authenticated: false,
  phone: '+7 900 000 00 24',
  payment: 'Карта • 4242',
  mode: null,
  location: '',
  cart: [],
  slot: '',
  orders: [],
  cakeDraft: initialCakeDraft,
  cakeRequest: null,
  favorites: [],
  basketNotice: '',
  pendingSwitch: null,
}

const demoCart: CartLine[] = [
  { id: 'syrniki', name: 'Сырник творожный', price: 150, quantity: 1 },
  { id: 'bakery', name: 'Киш из песочного теста с рыбой', price: 1132, quantity: 2 },
]

const previousOrder: CartLine[] = [
  { id: 'syrniki', name: 'Сырник творожный', price: 140, quantity: 1 },
  { id: 'bakery', name: 'Киш из песочного теста с рыбой', price: 1090, quantity: 2 },
  { id: 'seasonal', name: 'Сезонная позиция', price: 260, quantity: 1 },
]

const categoryIds = [
  'school', 'banquet', 'drinks', 'breakfasts', 'croissants', 'kids', 'combos', 'salads', 'hot',
  'soups', 'frozen', 'bread', 'bakery', 'cakes', 'cake-slices', 'pastries', 'candy', 'flowers-cookies', 'candles',
] as const
const categoryOptions = officialCategories.map((label, index) => ({ label, id: categoryIds[index] }))
const categoryFromId = (id: string | null) => categoryOptions.find((item) => item.id === id)?.label ?? 'Всё'
const categoryIdFromName = (name: string) => categoryOptions.find((item) => item.label === name)?.id ?? 'all'

const cakeStyles = [
  { name: 'Светлое оформление', image: products.find((item) => item.id === 'sour-cream-cake')?.image ?? 'assets/food/cakes.jpg' },
  { name: 'Оформление с ягодами', image: products.find((item) => item.id === 'royal-velvet-cake')?.image ?? 'assets/food/cakes.jpg' },
  { name: 'Оформление с надписью', image: products.find((item) => item.id === 'school-sweet-lesson')?.image ?? 'assets/food/cakes.jpg' },
]

const pickupLocations = [
  { address: 'ул. Красная, 155', hours: 'Сегодня до 22:00', x: 42, y: 25 },
  { address: 'ул. Кубанская набережная, 35', hours: 'Режим работы уточняется', x: 14, y: 82 },
  { address: 'ул. 40-летия Победы, 117', hours: 'Сегодня до 22:00', x: 84, y: 14 },
]
const deliveryLocations = ['ул. Красная, 64', 'ул. Зиповская, 8', 'ул. Ставропольская, 129']

const navigate = (path: string) => { window.location.hash = path }
const money = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`
const formatContext = (state: Pick<DemoState, 'mode' | 'location'>) => state.mode && state.location
  ? `${state.mode === 'delivery' ? 'Доставка' : 'Самовывоз'} · ${state.location}`
  : 'Выберите способ получения'

const readFavoriteIds = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem('pm-favorites') ?? '[]') as unknown
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string' && products.some((product) => product.id === id)) : []
  } catch {
    return []
  }
}

const normalizeState = (saved: Partial<DemoState>): DemoState => ({
  ...emptyState,
  ...saved,
  cart: (saved.cart ?? []).flatMap((line) => {
    const product = products.find((item) => item.id === line.id)
    return product ? [{ ...line, name: product.name, price: product.price }] : []
  }),
  orders: saved.orders ?? [],
  cakeDraft: { ...initialCakeDraft, ...saved.cakeDraft },
  cakeRequest: saved.cakeRequest?.occasion ? saved.cakeRequest : null,
  favorites: [...new Set(saved.favorites ?? readFavoriteIds())].filter((id) => products.some((product) => product.id === id)),
  pendingSwitch: saved.pendingSwitch ?? null,
})

const seedState = (): DemoState => {
  const seed = new URLSearchParams(window.location.search).get('seed')
  if (seed) {
    const seededOrder = createConfirmedOrder('PM-024', 'pickup', 'ул. Красная, 155', 'Сегодня · 19:10–19:25', demoCart)
    const cakeDraft = { ...initialCakeDraft, date: '2026-08-22', phone: '+7 900 000 00 24' }
    return {
      ...emptyState,
      authenticated: true,
      mode: 'pickup',
      location: 'ул. Красная, 155',
      cart: demoCart,
      slot: 'Сегодня · 19:10–19:25',
      orders: [seededOrder],
      cakeDraft,
      cakeRequest: createCakeRequest(cakeDraft),
      favorites: readFavoriteIds(),
    }
  }
  try {
    const saved = window.sessionStorage.getItem('pm-demo-state')
    return saved ? normalizeState(JSON.parse(saved) as Partial<DemoState>) : { ...emptyState, favorites: readFavoriteIds() }
  } catch {
    return { ...emptyState, favorites: readFavoriteIds() }
  }
}

const lineIsAvailable = (id: string, mode: ServiceMode) => !(mode === 'delivery' && id === 'stuffed-duck')

export function App() {
  const [route, setRoute] = useState(() => readHashRoute(window.location.hash))
  const [state, setState] = useState<DemoState>(seedState)

  useEffect(() => {
    const onHash = () => setRoute(readHashRoute(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    window.sessionStorage.setItem('pm-demo-state', JSON.stringify(state))
    window.localStorage.setItem('pm-favorites', JSON.stringify(state.favorites))
  }, [state])

  useEffect(() => {
    const redirect = routeRedirect(route.path, {
      authenticated: state.authenticated,
      mode: state.mode,
      location: state.location,
      cartCount: state.cart.reduce((sum, line) => sum + line.quantity, 0),
      slot: state.slot,
      orderCount: state.orders.length,
      hasCakeRequest: Boolean(state.cakeRequest),
    })
    if (redirect && window.location.hash.slice(1) !== redirect) navigate(redirect)
  }, [route.path, state.authenticated, state.mode, state.location, state.cart, state.slot, state.orders.length, state.cakeRequest])

  const chooseMode = (mode: ServiceMode) => navigate(hashPath('/location', { mode }))

  const chooseLocation = (mode: ServiceMode, location: string) => {
    const changed = state.mode !== mode || state.location !== location
    const unavailable = changed ? state.cart.filter((line) => !lineIsAvailable(line.id, mode)) : []
    if (unavailable.length) {
      setState((current) => ({ ...current, pendingSwitch: { mode, location, unavailable } }))
      navigate('/basket-check')
      return
    }
    setState((current) => ({
      ...current,
      mode,
      location,
      slot: changed ? '' : current.slot,
      basketNotice: changed && current.cart.length
        ? mode === 'delivery' ? 'Адрес доставки изменён. Корзина сохранена.' : 'Кулинария изменена. Корзина сохранена.'
        : '',
    }))
    navigate(hashPath('/catalog', { category: 'all' }))
  }

  const resolveSwitch = (replace: boolean) => {
    setState((current) => {
      if (!current.pendingSwitch) return current
      const unavailableIds = new Set(current.pendingSwitch.unavailable.map((line) => line.id))
      let cart = current.cart.filter((line) => !unavailableIds.has(line.id))
      if (replace) {
        const replacement = products.find((item) => item.id === 'meat-platter')!
        for (const line of current.pendingSwitch.unavailable) {
          for (let count = 0; count < line.quantity; count += 1) cart = addLine(cart, { id: replacement.id, name: replacement.name, price: replacement.price })
        }
      }
      return {
        ...current,
        mode: current.pendingSwitch.mode,
        location: current.pendingSwitch.location,
        cart,
        slot: '',
        pendingSwitch: null,
        basketNotice: replace
          ? 'Недоступные товары заменены. Остальная корзина сохранена.'
          : 'Недоступные товары удалены. Остальная корзина сохранена.',
      }
    })
    navigate('/catalog?category=all')
  }

  const addProduct = (product: Product) => setState((current) => ({
    ...current,
    cart: addLine(current.cart, { id: product.id, name: product.name, price: product.price }),
  }))
  const changeLine = (id: string, delta: number) => setState((current) => ({ ...current, cart: changeQuantity(current.cart, id, delta) }))
  const toggleFavorite = (id: string) => setState((current) => ({ ...current, favorites: toggleFavoriteId(current.favorites, id) }))

  const confirmOrder = () => {
    if (!state.mode || !state.location || !state.slot || state.cart.length === 0) return
    const order = createConfirmedOrder('PM-024', state.mode, state.location, state.slot, state.cart)
    setState((current) => ({ ...current, cart: [], slot: '', orders: [order, ...current.orders.filter((item) => item.id !== order.id)] }))
    window.setTimeout(() => navigate('/success'), 0)
  }

  const activeNav = route.path === '/catalog' ? 'catalog'
    : route.path === '/favorites' ? 'favorites'
      : route.path === '/orders' ? 'orders'
        : route.path === '/loyalty' ? 'bonuses'
          : route.path === '/' ? 'home' : null

  let content: ReactNode
  if (route.path === '/mode') content = <ModeScreen onChoose={chooseMode} />
  else if (route.path === '/location') {
    const urlMode = serviceModeFromParams(route.params)
    content = <LocationScreen mode={urlMode} authenticated={state.authenticated} selected={state.mode === urlMode ? state.location : ''} onChoose={(location) => chooseLocation(urlMode, location)} />
  }
  else if (route.path === '/basket-check') content = <BasketCheckScreen pending={state.pendingSwitch} onResolve={resolveSwitch} />
  else if (route.path === '/catalog') content = <CatalogScreen state={state} categoryId={route.params.get('category')} onAdd={addProduct} onToggleFavorite={toggleFavorite} />
  else if (route.path === '/favorites') content = <FavoritesScreen state={state} onAdd={addProduct} onToggleFavorite={toggleFavorite} />
  else if (route.path.startsWith('/product/')) {
    const product = products.find((item) => item.id === route.path.split('/').at(-1)) ?? products[0]
    content = <ProductScreen product={product} quantity={state.cart.find((line) => line.id === product.id)?.quantity ?? 0} favorite={state.favorites.includes(product.id)} onAdd={addProduct} onToggleFavorite={toggleFavorite} />
  }
  else if (route.path === '/cart') content = <CartScreen state={state} onChange={changeLine} />
  else if (route.path === '/time') content = <TimeScreen state={state} onSelect={(slot) => setState((current) => ({ ...current, slot }))} />
  else if (route.path === '/checkout') content = <CheckoutScreen state={state} onPhone={() => setState((current) => ({ ...current, phone: current.phone.includes('24') ? '+7 918 555 18 40' : '+7 900 000 00 24' }))} onPayment={() => setState((current) => ({ ...current, payment: current.payment.includes('4242') ? 'СБП' : 'Карта • 4242' }))} />
  else if (route.path === '/payment-error') content = <PaymentErrorScreen state={state} onConfirm={confirmOrder} />
  else if (route.path === '/success') content = <SuccessScreen order={state.orders[0]} />
  else if (route.path === '/repeat') content = <RepeatScreen currentCart={state.cart} onUse={(cart) => { setState((current) => ({ ...current, mode: 'pickup', location: 'ул. Красная, 155', cart, slot: '', basketNotice: 'Товары из прошлого заказа добавлены по текущим ценам.' })); navigate('/cart') }} />
  else if (route.path === '/cake') content = <CakeScreen step={route.params.get('step')} authenticated={state.authenticated} draft={state.cakeDraft} onDraft={(patch) => setState((current) => ({ ...current, cakeDraft: { ...current.cakeDraft, ...patch } }))} onSave={() => { setState((current) => ({ ...current, cakeRequest: createCakeRequest(current.cakeDraft) })); navigate('/cake-confirm') }} />
  else if (route.path === '/cake-confirm') content = <CakeConfirmScreen request={state.cakeRequest} />
  else if (route.path === '/loyalty') content = <LoyaltyScreen authenticated={state.authenticated} />
  else if (route.path === '/login') content = <LoginScreen step={route.params.get('step')} next={route.params.get('next')} phone={state.phone} onPhone={(phone) => setState((current) => ({ ...current, phone }))} onAuthenticated={() => { setState((current) => ({ ...current, authenticated: true, cakeDraft: { ...current.cakeDraft, phone: current.cakeDraft.phone || current.phone } })); navigate(safeNextRoute(route.params.get('next'))) }} />
  else if (route.path === '/profile') content = <ProfileScreen state={state} onLogout={() => { setState((current) => ({ ...current, authenticated: false })); navigate('/') }} />
  else if (route.path === '/orders') content = <OrdersScreen authenticated={state.authenticated} orders={state.orders} tab={route.params.get('tab')} />
  else content = <HomeScreen state={state} onMode={chooseMode} />

  return <DeviceStage activeNav={activeNav}>{content}</DeviceStage>
}

function DeviceStage({ children, activeNav }: { children: ReactNode; activeNav: 'home' | 'catalog' | 'favorites' | 'orders' | 'bonuses' | null }) {
  return (
    <div className="device-stage">
      <div className={`phone-shell${activeNav ? ' has-bottom-nav' : ''}`}>{children}{activeNav && <BottomNav active={activeNav} />}</div>
      <aside className="desktop-note">
        <span className="eyebrow">Интерактивная концепция</span>
        <h1>Патрик <i>&</i> Мари</h1>
        <p>Выберите доставку или самовывоз, соберите корзину и оформите заказ. Первая попытка оплаты покажет ошибку, вторая завершит заказ.</p>
        <div className="desktop-tip"><Smartphone /><span><strong>Инструкция к демо</strong>Для входа введите любой четырёхзначный код.</span></div>
        <a href="case/">Открыть презентацию <ArrowRight size={17} /></a>
      </aside>
    </div>
  )
}

function Header({ title, back = '/', action }: { title: string; back?: string; action?: ReactNode }) {
  return <header className="app-header"><button className="icon-button" aria-label="Назад" onClick={() => navigate(back)}><ArrowLeft /></button><strong>{title}</strong><div className="header-action">{action}</div></header>
}

function BottomNav({ active }: { active: 'home' | 'catalog' | 'favorites' | 'orders' | 'bonuses' }) {
  const items = [
    { id: 'home', label: 'Главная', icon: Home, path: '/' },
    { id: 'catalog', label: 'Меню', icon: Utensils, path: '/catalog?category=all' },
    { id: 'favorites', label: 'Избранное', icon: Heart, path: '/favorites' },
    { id: 'orders', label: 'Заказы', icon: ShoppingBag, path: '/orders?tab=current' },
    { id: 'bonuses', label: 'Бонусы', icon: WalletCards, path: '/loyalty' },
  ] as const
  return <nav className="bottom-nav" aria-label="Основная навигация">{items.map((item) => { const Icon = item.icon; return <button key={item.id} aria-label={item.label} className={active === item.id ? 'active' : ''} onClick={() => navigate(item.path)}><Icon /><span>{item.label}</span></button> })}</nav>
}

function HomeScreen({ state, onMode }: { state: DemoState; onMode: (mode: ServiceMode) => void }) {
  return (
    <div className="screen with-nav home-screen">
      <div className="brand-row"><div className="wordmark">ПАТРИК <i>&</i> МАРИ</div><button className="avatar" aria-label={state.authenticated ? 'Профиль' : 'Войти'} onClick={() => navigate(state.authenticated ? '/profile' : '/login?step=phone&next=profile')}>{state.authenticated ? 'А' : <LogIn />}</button></div>
      <button className="context-pill" onClick={() => navigate('/mode')}><span><MapPin />{formatContext(state)}</span><ChevronRight /></button>
      <section className="welcome-card"><span className="eyebrow">Готовая еда каждый день</span><h1>Закажите готовую<br />еду</h1><p>Выберите доставку или самовывоз. Покажем меню и время для выбранного места.</p><div className="welcome-actions"><button className="primary light" onClick={() => onMode('delivery')}><PackageCheck /> Доставка</button><button className="primary ghost-light" onClick={() => onMode('pickup')}><Store /> Самовывоз</button></div></section>
      <section className="quick-grid">
        <button className={`loyalty-tile${state.authenticated ? '' : ' guest'}`} onClick={() => navigate(state.authenticated ? '/loyalty' : '/login?step=phone&next=loyalty')}><span><WalletCards /> Бонусы</span>{state.authenticated ? <><strong>1 240</strong><small>баллов · показать QR-код</small></> : <><strong>Войти</strong><small>Открыть виртуальную карту</small></>}</button>
        <button className="cake-tile" onClick={() => navigate('/cake?step=occasion')}><img className="cake-tile-image" src={products.find((product) => product.id === 'sour-cream-cake')?.image} alt="" /><span className="cake-tile-kicker">Торт на заказ</span><strong>Оставить заявку</strong><small>Повод, гости, оформление и дата</small><span className="cake-tile-arrow"><ArrowRight /></span></button>
      </section>
      {state.authenticated ? <section className="section-block"><div className="section-title"><div><span className="eyebrow">Прошлый заказ</span><h2>Заказать снова</h2></div><button onClick={() => navigate('/repeat')}>Проверить заказ</button></div><button className="repeat-card" onClick={() => navigate('/repeat')}><div className="repeat-images"><img src={products.find((product) => product.id === 'syrniki')?.image} alt="Сырник творожный" /><img src={products.find((product) => product.id === 'bakery')?.image} alt="Киш с рыбой" /></div><div><strong>4 товара · {money(total(previousOrder))} в прошлый раз</strong><span>Проверить текущие цены и наличие</span></div><ChevronRight /></button></section> : <section className="section-block guest-section"><UserRound /><div><strong>Войдите, чтобы открыть заказы и адреса</strong><span>После входа можно посмотреть историю и повторить заказ.</span></div><button onClick={() => navigate('/login?step=phone&next=orders')}>Войти</button></section>}
      <section className="section-block"><div className="section-title"><div><span className="eyebrow">Самовывоз</span><h2>Забрать сегодня</h2></div></div><div className="editorial-card"><img src="assets/food/salads.jpg" alt="Салат с курицей и овощами" /><div><span>Готовая еда</span><strong>Выберите ближайшую кулинарию</strong><button onClick={() => onMode('pickup')}>Найти кулинарию <ArrowRight /></button></div></div></section>
    </div>
  )
}

function ModeScreen({ onChoose }: { onChoose: (mode: ServiceMode) => void }) {
  return <div className="screen paper-screen"><Header title="Способ получения" /><div className="screen-body"><span className="eyebrow">Получение заказа</span><h1>Доставка или<br />самовывоз?</h1><p className="lead">После выбора укажите адрес доставки или кулинарию. Покажем доступные товары и время.</p><button className="mode-card delivery" onClick={() => onChoose('delivery')}><span className="mode-icon"><PackageCheck /></span><span><strong>Доставка</strong><small>Указать адрес доставки</small></span><ChevronRight /></button><button className="mode-card pickup" onClick={() => onChoose('pickup')}><span className="mode-icon"><Store /></span><span><strong>Самовывоз</strong><small>Выбрать кулинарию</small></span><ChevronRight /></button></div></div>
}

function PickupMap({ active, onActive }: { active: number; onActive: (index: number) => void }) {
  return <div className="pickup-map" aria-label="Карта ближайших кулинарий"><img src="assets/maps/krasnodar-pickup.svg" alt="Карта центра Краснодара с тремя кулинариями" />{pickupLocations.map((location, index) => <button key={location.address} className={`map-marker${active === index ? ' selected' : ''}`} style={{ left: `${location.x}%`, top: `${location.y}%` }} aria-label={`Точка ${index + 1}: ${location.address}`} onClick={() => onActive(index)}>{index + 1}</button>)}<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></div>
}

function DeliveryPinMap({ address }: { address: string }) {
  return <div className="delivery-map" aria-label={`Выбран адрес ${address}`}><i className="road r1" /><i className="road r2" /><i className="road r3" /><MapPin /><strong>{address}</strong></div>
}

function LocationScreen({ mode, authenticated, selected, onChoose }: { mode: ServiceMode; authenticated: boolean; selected: string; onChoose: (location: string) => void }) {
  const [query, setQuery] = useState('')
  const [activeLocation, setActiveLocation] = useState(selected)
  const pickup = mode === 'pickup'
  const activePickup = Math.max(0, pickupLocations.findIndex((item) => item.address === activeLocation))
  const deliveryShown = filterLocations(deliveryLocations, query)
  return (
    <div className="screen paper-screen location-screen"><Header title={pickup ? 'Выберите кулинарию' : 'Куда доставить?'} back="/mode" /><div className="screen-body"><label className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={pickup ? 'Адрес или район' : 'Введите адрес доставки'} aria-label={pickup ? 'Поиск кулинарии' : 'Поиск адреса доставки'} /></label>
      {pickup ? <><PickupMap active={activePickup} onActive={(index) => setActiveLocation(pickupLocations[index].address)} /><div className="location-heading"><strong>Ближайшие кулинарии</strong><a href="https://patrickmary.ru/shops" target="_blank" rel="noreferrer">Показать все <ExternalLink /></a></div><div className="location-list">{pickupLocations.filter((item) => filterLocations([item.address], query).length).map((location) => { const index = pickupLocations.indexOf(location); const active = activeLocation === location.address; return <button key={location.address} className={active ? 'active' : ''} onClick={() => setActiveLocation(location.address)}><span className="location-index">{index + 1}</span><span><strong>{location.address}</strong><small>{location.hours}</small></span>{active ? <Check /> : <ChevronRight />}</button> })}</div></> : <>{activeLocation && <DeliveryPinMap address={activeLocation} />}<div className="location-heading"><strong>{authenticated ? 'Сохранённые адреса' : query ? 'Подходящие адреса' : 'Укажите улицу и дом'}</strong></div>{authenticated || query ? <div className="location-list">{deliveryShown.map((location, index) => { const active = activeLocation === location; return <button key={location} className={active ? 'active' : ''} onClick={() => setActiveLocation(location)}><span className="location-index"><MapPin /></span><span><strong>{location}</strong><small>{authenticated ? index === 0 ? 'Дом' : 'Адрес доставки' : 'Найденный адрес'}</small></span>{active ? <Check /> : <ChevronRight />}</button> })}{query && deliveryShown.length === 0 && <button onClick={() => setActiveLocation(query)}><span className="location-index"><MapPin /></span><span><strong>{query}</strong><small>Доставить по этому адресу</small></span><ChevronRight /></button>}</div> : <div className="address-prompt"><MapPin /><strong>Введите адрес доставки</strong><span>Укажите улицу и дом, затем выберите адрес из списка.</span></div>}</>}
      </div><div className="bottom-cta"><button className="primary" disabled={!activeLocation} onClick={() => onChoose(activeLocation)}>{pickup ? 'Выбрать эту кулинарию' : 'Доставить по этому адресу'} <ArrowRight /></button></div></div>
  )
}

function BasketCheckScreen({ pending, onResolve }: { pending: PendingSwitch | null; onResolve: (replace: boolean) => void }) {
  if (!pending) return <div className="screen result-screen"><h1>Корзина уже обновлена</h1><button className="primary" onClick={() => navigate('/catalog?category=all')}>Вернуться в меню</button></div>
  const place = pending.mode === 'delivery' ? `Для доставки по адресу ${pending.location}` : `В кулинарии по адресу ${pending.location}`
  return <div className="screen paper-screen"><Header title="Проверка корзины" back="/mode" /><div className="screen-body"><span className="eyebrow">Новое место получения</span><h1>Некоторых товаров<br />здесь нет</h1><p className="lead">{place} недоступны:</p><div className="compare-list">{pending.unavailable.map((line) => <div className="unavailable" key={line.id}><span><X /><strong>{line.name} · {line.quantity} шт.</strong></span><span>Можно заменить на «Ассорти Буженина и рулеты» или удалить из корзины.</span></div>)}</div><div className="why-note"><RefreshCw /><p><strong>Остальные товары останутся в корзине.</strong> Перед продолжением пересчитаем сумму.</p></div></div><div className="bottom-cta basket-actions"><button className="primary" onClick={() => onResolve(true)}>Заменить на ассорти</button><button className="secondary" onClick={() => onResolve(false)}>Удалить эти товары</button></div></div>
}

function CatalogScreen({ state, categoryId, onAdd, onToggleFavorite }: { state: DemoState; categoryId: string | null; onAdd: (product: Product) => void; onToggleFavorite: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [showCategories, setShowCategories] = useState(false)
  const category = categoryFromId(categoryId)
  const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU')
  const shown = products.filter((product) => (!normalizedQuery || `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase('ru-RU').includes(normalizedQuery)) && (normalizedQuery || category === 'Всё' || product.category === category))
  const selectCategory = (value: string) => { setQuery(''); setShowCategories(false); navigate(hashPath('/catalog', { category: categoryIdFromName(value) })) }
  const heading = normalizedQuery ? 'Результаты поиска' : category === 'Всё' ? 'Всё меню' : category
  return <div className="screen with-nav catalog-screen"><Header title="Меню" action={<button className="bag-button" aria-label="Корзина" onClick={() => navigate('/cart')}><ShoppingBag />{state.cart.length > 0 && <b>{state.cart.reduce((sum, item) => sum + item.quantity, 0)}</b>}</button>} /><button className="catalog-context" onClick={() => navigate('/mode')}>{formatContext(state)} <ChevronRight /></button><div className="catalog-body">{state.basketNotice && <div className="basket-notice" role="status"><Check />{state.basketNotice}</div>}<label className="real-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти в меню" aria-label="Поиск по меню" /></label><div className="menu-heading"><div><span className="eyebrow">Каталог</span><h1>{heading}</h1><small>{shown.length} {positionWord(shown.length)} · {category === 'Всё' && !normalizedQuery ? `${officialCategories.length} категорий` : 'актуальный ассортимент'}</small></div><button className="categories-button" aria-expanded={showCategories} onClick={() => setShowCategories((visible) => !visible)}><LayoutGrid /> Категории</button></div>{showCategories && <div className="category-panel" aria-label="Все категории"><button className={category === 'Всё' ? 'active all' : 'all'} onClick={() => selectCategory('Всё')}><span>Всё меню</span><small>{products.length}</small></button>{categoryOptions.map((item) => <button key={item.id} className={category === item.label ? 'active' : ''} onClick={() => selectCategory(item.label)}><span>{item.label}</span><small>{products.filter((product) => product.category === item.label).length}</small></button>)}</div>}{shown.length === 0 ? <EmptySearch onReset={() => { setQuery(''); navigate('/catalog?category=all') }} /> : normalizedQuery || category !== 'Всё' ? <div className="product-grid">{shown.map((product) => <ProductCard key={product.id} product={product} favorite={state.favorites.includes(product.id)} onToggleFavorite={() => onToggleFavorite(product.id)} onAdd={() => onAdd(product)} />)}</div> : <div className="menu-category-list">{categoryOptions.map((item) => { const categoryProducts = products.filter((product) => product.category === item.label); return <section className="menu-category-section" key={item.id}><header><div><h2>{item.label}</h2><span>{categoryProducts.length} {positionWord(categoryProducts.length)}</span></div><button onClick={() => selectCategory(item.label)}>Открыть <ArrowRight /></button></header><div className="product-grid">{categoryProducts.map((product) => <ProductCard key={product.id} product={product} favorite={state.favorites.includes(product.id)} onToggleFavorite={() => onToggleFavorite(product.id)} onAdd={() => onAdd(product)} />)}</div></section> })}</div>}</div>{state.cart.length > 0 && <button className="floating-cart" onClick={() => navigate('/cart')}><span><ShoppingBag /> Корзина · {state.cart.reduce((sum, item) => sum + item.quantity, 0)}</span><strong>{money(total(state.cart))}</strong></button>}</div>
}

function EmptySearch({ onReset }: { onReset: () => void }) { return <div className="empty-state"><Search /><h2>Ничего не нашли</h2><p>Измените запрос или вернитесь ко всему меню.</p><button className="primary" onClick={onReset}>Показать всё</button></div> }

function ProductCard({ product, favorite, onToggleFavorite, onAdd }: { product: Product; favorite: boolean; onToggleFavorite: () => void; onAdd: () => void }) {
  return <article className="product-card"><button className={`favorite-button${favorite ? ' active' : ''}`} aria-label={favorite ? `Удалить ${product.name} из избранного` : `Добавить ${product.name} в избранное`} aria-pressed={favorite} onClick={onToggleFavorite}><Heart fill={favorite ? 'currentColor' : 'none'} /></button><button className="product-photo" onClick={() => navigate(`/product/${product.id}`)}><img src={product.image} alt={product.name} loading="lazy" /><span>{product.category}</span></button><button className="product-copy" onClick={() => navigate(`/product/${product.id}`)}><strong>{product.name}</strong><small>{product.description}</small></button><div className="product-bottom"><span><b>{money(product.price)}</b><small>{product.weight}</small></span><button aria-label={`Добавить ${product.name}`} onClick={onAdd}><Plus /></button></div></article>
}

function ProductScreen({ product, quantity, favorite, onAdd, onToggleFavorite }: { product: Product; quantity: number; favorite: boolean; onAdd: (product: Product) => void; onToggleFavorite: (id: string) => void }) {
  return <div className="screen product-screen"><div className="product-hero"><img src={product.image} alt={product.name} /><button className="icon-button overlay" onClick={() => navigate(hashPath('/catalog', { category: categoryIdFromName(product.category) }))} aria-label="Назад"><ArrowLeft /></button><button className={`icon-button favorite-detail${favorite ? ' active' : ''}`} aria-label={favorite ? 'Удалить из избранного' : 'Добавить в избранное'} onClick={() => onToggleFavorite(product.id)}><Heart fill={favorite ? 'currentColor' : 'none'} /></button><span>{product.category}</span></div><div className="product-detail"><h1>{product.name}</h1><p>{product.description}</p><div className="detail-facts"><span><strong>Вес</strong><small>{product.weight}</small></span><span><strong>Цена</strong><small>{money(product.price)}</small></span></div></div><div className="sticky-action"><strong>{money(product.price)}</strong><button className="primary" onClick={() => quantity > 0 ? navigate('/cart') : onAdd(product)}>{quantity > 0 ? <><ShoppingBag /> Открыть корзину · {quantity}</> : <><Plus /> Добавить</>}</button></div></div>
}

function FavoritesScreen({ state, onAdd, onToggleFavorite }: { state: DemoState; onAdd: (product: Product) => void; onToggleFavorite: (id: string) => void }) {
  const favoriteProducts = products.filter((product) => state.favorites.includes(product.id))
  return <div className="screen with-nav paper-screen favorites-screen"><Header title="Избранное" /><div className="favorites-body"><div className="menu-heading"><div><span className="eyebrow">Сохранённые товары</span><h1>Избранное</h1><small>{favoriteProducts.length} {positionWord(favoriteProducts.length)}</small></div></div>{favoriteProducts.length === 0 ? <div className="empty-state tall"><Heart /><h2>В избранном пока пусто</h2><p>Нажмите на сердечко в карточке товара, чтобы сохранить его здесь.</p><button className="primary" onClick={() => navigate('/catalog?category=all')}>Открыть меню</button></div> : <div className="product-grid">{favoriteProducts.map((product) => <ProductCard key={product.id} product={product} favorite onToggleFavorite={() => onToggleFavorite(product.id)} onAdd={() => onAdd(product)} />)}</div>}</div></div>
}

function CartScreen({ state, onChange }: { state: DemoState; onChange: (id: string, delta: number) => void }) {
  return <div className="screen paper-screen cart-screen"><Header title="Корзина" back="/catalog?category=all" /><div className="screen-body">{state.cart.length === 0 ? <div className="empty-state tall"><ShoppingBag /><h1>Корзина пуста</h1><p>Выберите доставку или самовывоз, затем добавьте товары из меню.</p><button className="primary" onClick={() => navigate('/mode')}>Выбрать получение</button></div> : <><button className="order-context" onClick={() => navigate('/mode')}><span><small>{state.mode === 'delivery' ? 'Доставка' : 'Самовывоз'}</small><strong>{state.location}</strong></span><ChevronRight /></button><div className="cart-lines">{state.cart.map((line) => <div className="cart-line" key={line.id}><img src={products.find((item) => item.id === line.id)?.image ?? 'assets/food/bakery.jpg'} alt="" /><span><strong>{line.name}</strong><small>{money(line.price)}</small></span><div className="stepper"><button aria-label={`Уменьшить ${line.name}`} onClick={() => onChange(line.id, -1)}><Minus /></button><b>{line.quantity}</b><button aria-label={`Увеличить ${line.name}`} onClick={() => onChange(line.id, 1)}><Plus /></button></div></div>)}</div><div className="cart-note"><Clock3 /><span><strong>Теперь выберите время получения</strong><small>Покажем интервалы для выбранного места.</small></span></div><div className="summary"><span>Товары</span><b>{money(total(state.cart))}</b><span>Время</span><b>{state.slot || 'ещё не выбрано'}</b></div></>}</div>{state.cart.length > 0 && <div className="bottom-cta"><button className="primary" onClick={() => navigate('/time')}>Выбрать время <ArrowRight /></button></div>}</div>
}

function TimeScreen({ state, onSelect }: { state: DemoState; onSelect: (slot: string) => void }) {
  const slots = ['Как можно скорее · 45–60 мин', 'Сегодня · 19:10–19:25', 'Сегодня · 20:00–20:15']
  return <div className="screen paper-screen"><Header title="Время получения" back="/cart" /><div className="screen-body"><span className="eyebrow">{formatContext(state)}</span><h1>Когда получить заказ?</h1><p className="lead">Выберите один из доступных интервалов.</p><div className="slot-list">{slots.map((slot) => <button key={slot} className={state.slot === slot ? 'selected' : ''} onClick={() => onSelect(slot)}><Clock3 /><span>{slot}</span>{state.slot === slot ? <Check /> : <ChevronRight />}</button>)}</div></div><div className="bottom-cta"><button className="primary" disabled={!state.slot} onClick={() => navigate(state.authenticated ? '/checkout' : '/login?step=phone&next=checkout')}>Перейти к оформлению <ArrowRight /></button></div></div>
}

function CheckoutScreen({ state, onPhone, onPayment }: { state: DemoState; onPhone: () => void; onPayment: () => void }) {
  return <div className="screen paper-screen"><Header title="Оформление" back="/time" /><div className="screen-body checkout-body"><section className="checkout-section"><h2>Получение</h2><div className="setting-row"><MapPin /><span><small>{state.mode === 'delivery' ? 'Доставка' : 'Самовывоз'}</small><strong>{state.location}</strong></span><button onClick={() => navigate(hashPath('/location', { mode: state.mode ?? 'pickup' }))}>Изменить</button></div><div className="setting-row"><Clock3 /><span><small>Время</small><strong>{state.slot}</strong></span><button onClick={() => navigate('/time')}>Изменить</button></div></section><section className="checkout-section"><h2>Ваш заказ</h2><ul className="checkout-lines">{state.cart.map((line) => <li key={line.id}><span>{line.name} × {line.quantity}</span><b>{money(line.price * line.quantity)}</b></li>)}</ul></section><section className="checkout-section"><div className="setting-row"><Phone /><span><small>Получатель</small><strong>{state.phone}</strong></span><button onClick={onPhone}>Изменить</button></div><div className="setting-row"><CreditCard /><span><small>Способ оплаты</small><strong>{state.payment}</strong></span><button onClick={onPayment}>Изменить</button></div></section><div className="summary"><span>Товары</span><b>{money(total(state.cart))}</b><span>Итого</span><b>{money(total(state.cart))}</b></div></div><div className="bottom-cta"><button className="primary" onClick={() => navigate('/payment-error')}>Оплатить {money(total(state.cart))} <ArrowRight /></button></div></div>
}

function PaymentErrorScreen({ state, onConfirm }: { state: DemoState; onConfirm: () => void }) {
  const count = state.cart.reduce((sum, line) => sum + line.quantity, 0)
  const place = state.mode === 'delivery' ? 'Адрес доставки' : 'Кулинария'
  return <div className="screen result-screen error-result"><div className="result-icon"><X /></div><span className="eyebrow">Ошибка оплаты</span><h1>Оплата не прошла,<br />корзина сохранена</h1><p>В корзине осталось {count} {positionWord(count)}. {place} и время получения тоже сохранены.</p><div className="saved-box"><RefreshCw /><span><strong>Корзина и данные получения сохранены</strong><small>{formatContext(state)} · {money(total(state.cart))}</small></span></div><button className="primary" onClick={onConfirm}>Оплатить {money(total(state.cart))} <ArrowRight /></button><button className="text-button" onClick={() => navigate('/cart')}>Открыть корзину</button></div>
}

function SuccessScreen({ order }: { order?: ConfirmedOrder }) {
  if (!order) return null
  return <div className="screen result-screen success-result"><div className="result-icon"><Check /></div><span className="eyebrow">Готово</span><h1>Заказ принят</h1><p>Статус заказа можно посмотреть в разделе «Текущие».</p><div className="receipt"><span><small>Номер</small><strong>{order.id}</strong></span><span><small>Получение</small><strong>{order.mode === 'delivery' ? 'Доставка' : 'Самовывоз'}</strong></span><span><small>{order.mode === 'delivery' ? 'Адрес доставки' : 'Кулинария'}</small><strong>{order.location}</strong></span><span><small>Время</small><strong>{order.slot}</strong></span><span><small>Состав</small><strong>{order.lines.map((line) => `${line.name} × ${line.quantity}`).join(', ')}</strong></span><span><small>Сумма</small><strong>{money(order.amount)}</strong></span></div><button className="primary" onClick={() => navigate('/orders?tab=current')}>Открыть заказ</button><button className="text-button" onClick={() => navigate('/')}>На главную</button></div>
}

function RepeatScreen({ currentCart, onUse }: { currentCart: CartLine[]; onUse: (cart: CartLine[]) => void }) {
  const reconciled = reconcileRepeat(previousOrder, { syrniki: 150, bakery: 1132 })
  const available = reconciled.filter((line) => line.available)
  return <div className="screen paper-screen"><Header title="Повтор заказа" /><div className="screen-body"><span className="eyebrow">Заказ от 28 июля</span><h1>Проверьте состав<br />и сумму</h1><p className="lead">В новом заказе будет 3 товара. «Сезонной позиции» сейчас нет — она не добавится.</p><div className="compare-list">{reconciled.map((line) => <div key={line.id} className={!line.available ? 'unavailable' : ''}><span>{line.available ? <Check /> : <X />}<strong>{line.name} · {line.quantity} шт.</strong></span><span>{line.available ? `Было ${money(previousOrder.find((item) => item.id === line.id)!.price * line.quantity)} · сейчас ${money(line.price * line.quantity)}` : `Было ${money(line.price * line.quantity)} · сейчас нет в наличии`}</span></div>)}</div><div className="price-compare"><span><small>В прошлый раз</small><strong>{money(total(previousOrder))}</strong></span><ArrowRight /><span><small>Сейчас</small><strong>{money(total(available))}</strong></span></div>{currentCart.length > 0 && <div className="why-note"><RefreshCw /><p><strong>В корзине уже есть товары.</strong> Если продолжить, их заменят 3 товара из прошлого заказа.</p></div>}</div><div className="bottom-cta"><button className="primary" onClick={() => onUse(available)}>{currentCart.length > 0 ? 'Заменить корзину' : 'Добавить 3 товара'} · {money(total(available))} <ArrowRight /></button></div></div>
}

const cakeStepIds = ['occasion', 'guests', 'style', 'details', 'review'] as const
type CakeStep = typeof cakeStepIds[number]

function CakeScreen({ step, authenticated, draft, onDraft, onSave }: { step: string | null; authenticated: boolean; draft: CakeDraft; onDraft: (patch: Partial<CakeDraft>) => void; onSave: () => void }) {
  const currentStep: CakeStep = cakeStepIds.includes(step as CakeStep) ? step as CakeStep : 'occasion'
  const index = cakeStepIds.indexOf(currentStep)
  const style = cakeStyles.find((item) => item.name === draft.design) ?? cakeStyles[0]
  const next = () => navigate(hashPath('/cake', { step: cakeStepIds[Math.min(cakeStepIds.length - 1, index + 1)] }))
  const back = () => index > 0 ? navigate(hashPath('/cake', { step: cakeStepIds[index - 1] })) : navigate('/')
  const detailsReady = Boolean(draft.date && draft.phone.replace(/\D/g, '').length >= 11)
  return <div className="screen cake-screen"><Header title="Торт на заказ" /><div className="cake-visual"><img src={style.image} alt={`Пример: ${style.name}`} /><span>Шаг {index + 1} из {cakeStepIds.length}</span></div><div className="cake-body">
    {currentStep === 'occasion' && <><span className="eyebrow">Повод</span><h1>Для какого события?</h1><div className="choice-grid">{['День рождения', 'Свадьба', 'Семейный праздник'].map((value) => <button className={draft.occasion === value ? 'selected' : ''} key={value} onClick={() => onDraft({ occasion: value })}>{value}{draft.occasion === value && <Check />}</button>)}</div></>}
    {currentStep === 'guests' && <><span className="eyebrow">Количество гостей</span><h1>На сколько человек?</h1><div className="choice-grid">{['4–6 гостей', '8–10 гостей', '12–16 гостей'].map((value) => <button className={draft.guests === value ? 'selected' : ''} key={value} onClick={() => onDraft({ guests: value })}>{value}{draft.guests === value && <Check />}</button>)}</div></>}
    {currentStep === 'style' && <><span className="eyebrow">Оформление</span><h1>Как оформить торт?</h1><div className="style-grid">{cakeStyles.map((value) => <button className={draft.design === value.name ? 'selected' : ''} key={value.name} onClick={() => onDraft({ design: value.name })}><img src={value.image} alt="" /><span>{value.name}</span>{draft.design === value.name && <Check />}</button>)}</div><p className="fine-print">Фото — пример оформления. Готовый торт может отличаться.</p></>}
    {currentStep === 'details' && <><span className="eyebrow">Дата и телефон</span><h1>На какую дату<br />нужен торт?</h1><label className="form-field"><span><CalendarDays />Желаемая дата</span><input type="date" min="2026-08-14" value={draft.date} onChange={(event) => onDraft({ date: event.target.value })} aria-label="Желаемая дата" /></label><label className="form-field"><span><Phone />Телефон для связи</span><input value={draft.phone} onChange={(event) => onDraft({ phone: event.target.value })} placeholder="+7 900 000 00 00" aria-label="Телефон для связи" /></label><label className="form-field textarea"><span><MessageSquare />Комментарий</span><textarea value={draft.comment} onChange={(event) => onDraft({ comment: event.target.value })} placeholder="Начинка, надпись или пожелания" aria-label="Комментарий к заявке" /></label>{authenticated && <small className="helper">Подставили номер из профиля. Его можно изменить.</small>}</>}
    {currentStep === 'review' && <><span className="eyebrow">Проверка заявки</span><h1>Всё верно?</h1><div className="cake-preview"><img src={style.image} alt={draft.design} /><span>{draft.design}</span></div><div className="receipt"><span><small>Повод</small><strong>{draft.occasion}</strong></span><span><small>Количество гостей</small><strong>{draft.guests}</strong></span><span><small>Оформление</small><strong>{draft.design}</strong></span><span><small>Дата</small><strong>{draft.date}</strong></span><span><small>Телефон</small><strong>{draft.phone}</strong></span>{draft.comment && <span><small>Комментарий</small><strong>{draft.comment}</strong></span>}</div><p className="fine-print">После сохранения сотрудник свяжется с вами, чтобы уточнить начинку, оформление и стоимость.</p></>}
  </div><div className="bottom-cta split"><button className="secondary" onClick={back}>Назад</button><button className="primary" disabled={currentStep === 'details' && !detailsReady} onClick={currentStep === 'review' ? onSave : next}>{currentStep === 'review' ? <>Сохранить заявку <Check /></> : <>Продолжить <ArrowRight /></>}</button></div></div>
}

function CakeConfirmScreen({ request }: { request: CakeRequest | null }) {
  if (!request) return null
  return <div className="screen result-screen success-result"><div className="result-icon"><CakeSlice /></div><span className="eyebrow">Готово</span><h1>Заявка отправлена</h1><p>Сотрудник свяжется с вами, чтобы уточнить детали и стоимость.</p><div className="receipt"><span><small>Повод</small><strong>{request.occasion}</strong></span><span><small>Количество гостей</small><strong>{request.guests}</strong></span><span><small>Оформление</small><strong>{request.design}</strong></span><span><small>Дата</small><strong>{request.date}</strong></span><span><small>Телефон</small><strong>{request.phone}</strong></span></div><button className="primary" onClick={() => navigate('/')}>На главную</button><button className="text-button" onClick={() => navigate('/cake?step=occasion')}>Изменить заявку</button></div>
}

function LoyaltyQr() {
  const cells = useMemo(() => {
    const finder = (row: number, col: number, top: number, left: number) => row >= top && row < top + 7 && col >= left && col < left + 7 && (row === top || row === top + 6 || col === left || col === left + 6 || (row >= top + 2 && row <= top + 4 && col >= left + 2 && col <= left + 4))
    return Array.from({ length: 21 * 21 }, (_, index) => { const row = Math.floor(index / 21); const col = index % 21; return finder(row, col, 0, 0) || finder(row, col, 0, 14) || finder(row, col, 14, 0) || ((row * 11 + col * 7 + row * col) % 5 < 2 && !(row < 8 && (col < 8 || col > 12)) && !(row > 12 && col < 8)) })
  }, [])
  return <div className="loyalty-qr" aria-label="QR-код карты"><svg viewBox="0 0 21 21" role="img">{cells.map((dark, index) => dark && <rect key={index} x={index % 21} y={Math.floor(index / 21)} width="1" height="1" />)}</svg></div>
}

function LoyaltyScreen({ authenticated }: { authenticated: boolean }) {
  if (!authenticated) return <div className="screen with-nav paper-screen"><Header title="Бонусы" /><GuestGate icon={<WalletCards />} title="Войдите, чтобы открыть карту" text="После входа здесь появятся баланс и QR-код виртуальной карты." next="loyalty" /></div>
  return <div className="screen with-nav loyalty-screen"><Header title="Бонусы" /><div className="loyalty-card"><div className="loyalty-card-copy"><span className="wordmark">ПАТРИК <i>&</i> МАРИ</span><div className="loyalty-balance"><strong>1 240</strong><small>баллов</small></div></div><div className="loyalty-code"><LoyaltyQr /><small>ДЕМО</small></div></div><section className="section-block"><div className="section-title"><div><span className="eyebrow">Программа лояльности</span><h2>Как использовать карту</h2></div></div><div className="info-list"><span><WalletCards /><div><strong>Покажите QR-код на кассе</strong><small>Условия начисления и списания указаны в правилах программы.</small></div></span><a href="https://patrickmary.ru/bonusy" target="_blank" rel="noreferrer"><ExternalLink /><div><strong>Правила программы</strong><small>Открыть на сайте «Патрик & Мари».</small></div></a></div></section></div>
}

function GuestGate({ icon, title, text, next }: { icon: ReactNode; title: string; text: string; next: string }) {
  return <div className="guest-gate"><div className="guest-icon">{icon}</div><h1>{title}</h1><p>{text}</p><button className="primary" onClick={() => navigate(`/login?step=phone&next=${next}`)}>Войти <ArrowRight /></button></div>
}

function LoginScreen({ step, next, phone, onPhone, onAuthenticated }: { step: string | null; next: string | null; phone: string; onPhone: (phone: string) => void; onAuthenticated: () => void }) {
  const codeStep = step === 'code'
  const [code, setCode] = useState('')
  const [resent, setResent] = useState(false)
  const nextValue = next ?? 'loyalty'
  return <div className="screen login-screen"><Header title="Вход" /><div className="login-illustration"><Smartphone /></div><div className="screen-body"><span className="eyebrow">Вход по номеру телефона</span><h1>{codeStep ? 'Введите код из СМС' : 'Введите номер телефона'}</h1><p className="lead">{codeStep ? `Код отправлен на ${phone}.` : 'Отправим код для входа в СМС.'}</p>{!codeStep ? <><label className="phone-input"><span>+7</span><input value={phone.replace(/^\+7\s*/, '')} onChange={(event) => onPhone(`+7 ${event.target.value}`)} aria-label="Номер телефона" /></label><button className="primary" onClick={() => navigate(`/login?step=code&next=${nextValue}`)}>Получить код</button></> : <><label className="code-input"><input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="0000" aria-label="Код из СМС" /></label><button className="primary" disabled={code.length !== 4} onClick={onAuthenticated}>Войти</button><button className="text-button" onClick={() => setResent(true)}>{resent ? 'Код отправлен повторно' : 'Отправить код повторно'}</button><button className="text-button" onClick={() => navigate(`/login?step=phone&next=${nextValue}`)}>Изменить номер</button></>}</div></div>
}

function ProfileScreen({ state, onLogout }: { state: DemoState; onLogout: () => void }) {
  if (!state.authenticated) return <div className="screen paper-screen"><Header title="Профиль" /><GuestGate icon={<UserRound />} title="Вы ещё не вошли" text="Войдите, чтобы увидеть профиль." next="profile" /></div>
  return <div className="screen paper-screen"><Header title="Профиль" /><div className="profile-card"><div className="profile-avatar">А</div><h1>Андрей</h1><p>{state.phone}</p></div><div className="profile-links"><button onClick={() => navigate('/loyalty')}><WalletCards /><span><strong>Бонусы</strong><small>1 240 баллов и QR-код</small></span><ChevronRight /></button><button onClick={() => navigate('/orders?tab=history')}><ShoppingBag /><span><strong>Заказы</strong><small>Текущие и прошлые заказы</small></span><ChevronRight /></button></div><button className="logout-button" onClick={onLogout}>Выйти</button></div>
}

function OrdersScreen({ authenticated, orders, tab }: { authenticated: boolean; orders: ConfirmedOrder[]; tab: string | null }) {
  if (!authenticated) return <div className="screen with-nav paper-screen"><Header title="Заказы" /><GuestGate icon={<ShoppingBag />} title="Войдите, чтобы посмотреть заказы" text="После входа здесь будут текущие и прошлые заказы." next="orders" /></div>
  const activeTab = tab === 'current' ? 'current' : 'history'
  return <div className="screen with-nav paper-screen"><Header title="Заказы" /><div className="screen-body"><div className="tabs"><button className={activeTab === 'history' ? 'active' : ''} onClick={() => navigate('/orders?tab=history')}>История</button><button className={activeTab === 'current' ? 'active' : ''} onClick={() => navigate('/orders?tab=current')}>Текущие</button></div>{activeTab === 'history' ? <button className="history-card" onClick={() => navigate('/repeat')}><span className="history-date">28 июля</span><strong>Самовывоз · ул. Красная, 155</strong><small>Сырник, киш и сезонная позиция · 4 шт. · {money(total(previousOrder))}</small><span className="history-action"><RefreshCw /> Проверить цену и наличие</span></button> : orders.length > 0 ? <div className="current-orders">{orders.map((order) => <article className="current-order" key={order.id}><span className="order-status"><PackageCheck /> {order.status}</span><h2>{order.mode === 'delivery' ? 'Доставка' : 'Самовывоз'} · {order.location}</h2><p>{order.slot}</p><ul>{order.lines.map((line) => <li key={line.id}><span>{line.name} × {line.quantity}</span><b>{money(line.price * line.quantity)}</b></li>)}</ul><div><span>{order.id}</span><strong>{money(order.amount)}</strong></div></article>)}</div> : <div className="empty-inline"><Clock3 /><span><strong>Текущих заказов нет</strong><small>Здесь появятся принятые заказы.</small></span></div>}</div></div>
}
