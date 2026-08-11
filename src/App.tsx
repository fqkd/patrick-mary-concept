import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CakeSlice,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Home,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  SignalLow,
  Smartphone,
  Store,
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
  reconcileRepeat,
  total,
  type CakeRequest,
  type CartLine,
  type ConfirmedOrder,
  type ServiceMode,
} from './lib/order'

type DemoState = {
  mode: ServiceMode | null
  location: string
  cart: CartLine[]
  slot: string
  orders: ConfirmedOrder[]
  cakeRequest: CakeRequest | null
}

type Product = {
  id: string
  name: string
  note: string
  category: string
  price: number
  image: string
}

const products: Product[] = [
  { id: 'syrniki', name: 'Сырники классические', note: 'Творожные, с ванильной ноткой', category: 'Завтраки', price: 390, image: 'https://api.patrickmary.ru/api/file/Nomenclature729x475/10754/6f116cfa-e348-11db-a154-0011671aa2d0_99-0005168_729x475.jpg' },
  { id: 'salad', name: 'Салат с курицей и овощами', note: 'Зелень, томаты и хрустящие сухарики', category: 'Салаты, закуски', price: 340, image: 'assets/food/salads.jpg' },
  { id: 'bakery', name: 'Пирог с орехами', note: 'Свежая выпечка к чаю', category: 'Выпечка', price: 190, image: 'assets/food/bakery.jpg' },
  { id: 'cake', name: 'Ягодный торт на заказ', note: 'Размер и оформление — по заявке', category: 'Торты на заказ', price: 0, image: 'assets/food/cakes.jpg' },
]

const emptyState: DemoState = { mode: null, location: '', cart: [], slot: '', orders: [], cakeRequest: null }

const demoCart: CartLine[] = [
  { id: 'syrniki', name: 'Сырники классические', price: 390, quantity: 1 },
  { id: 'bakery', name: 'Пирог с орехами', price: 190, quantity: 2 },
]

const routeFromHash = () => {
  const raw = window.location.hash.slice(1) || '/'
  return raw.split('?')[0] || '/'
}

const navigate = (path: string) => {
  window.location.hash = path
}

const money = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`

const formatContext = (state: Pick<DemoState, 'mode' | 'location'>) => {
  if (!state.mode || !state.location) return 'Сначала выберите получение'
  return `${state.mode === 'delivery' ? 'Доставка' : 'Самовывоз'} · ${state.location}`
}

const normalizeState = (saved: Partial<DemoState>): DemoState => ({
  ...emptyState,
  ...saved,
  cart: saved.cart ?? [],
  orders: saved.orders ?? [],
  cakeRequest: saved.cakeRequest ?? null,
})

const seedState = (): DemoState => {
  const seed = new URLSearchParams(window.location.search).get('seed')
  if (seed) {
    const seededOrder = createConfirmedOrder('PM-024', 'pickup', 'ул. Красная, 155', 'Сегодня · 19:10–19:25', demoCart)
    return {
      mode: 'pickup',
      location: 'ул. Красная, 155',
      cart: demoCart,
      slot: 'Сегодня · 19:10–19:25',
      orders: [seededOrder],
      cakeRequest: createCakeRequest('На 8–10 гостей', 'Светлое оформление'),
    }
  }
  try {
    const saved = window.sessionStorage.getItem('pm-demo-state')
    return saved ? normalizeState(JSON.parse(saved) as Partial<DemoState>) : emptyState
  } catch {
    return emptyState
  }
}

export function App() {
  const [route, setRoute] = useState(routeFromHash)
  const [state, setState] = useState<DemoState>(seedState)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    window.sessionStorage.setItem('pm-demo-state', JSON.stringify(state))
  }, [state])

  const chooseMode = (mode: ServiceMode) => {
    setState((current) => ({ ...current, mode, location: '' }))
    navigate(`/location?mode=${mode}`)
  }

  const chooseLocation = (location: string) => {
    setLoading(true)
    window.setTimeout(() => {
      setState((current) => ({ ...current, location }))
      setLoading(false)
      navigate('/catalog')
    }, 420)
  }

  const addProduct = (product: Product) => {
    setState((current) => ({
      ...current,
      cart: addLine(current.cart, { id: product.id, name: product.name, price: product.price }),
    }))
  }

  const changeLine = (id: string, delta: number) => {
    setState((current) => ({ ...current, cart: changeQuantity(current.cart, id, delta) }))
  }

  const confirmOrder = () => {
    setState((current) => {
      if (!current.mode || !current.location || !current.slot || current.cart.length === 0) return current
      const order = createConfirmedOrder('PM-024', current.mode, current.location, current.slot, current.cart)
      return { ...current, cart: [], slot: '', orders: [order, ...current.orders.filter((item) => item.id !== order.id)] }
    })
    navigate('/success')
  }

  const activeNav = route === '/catalog' ? 'catalog'
    : route === '/orders' ? 'orders'
      : route === '/loyalty' ? 'card'
        : route === '/' ? 'home' : null

  let content: ReactNode
  if (route === '/mode') content = <ModeScreen onChoose={chooseMode} />
  else if (route === '/location') content = <LocationScreen mode={state.mode} loading={loading} onChoose={chooseLocation} />
  else if (route === '/catalog') content = <CatalogScreen state={state} onAdd={addProduct} />
  else if (route.startsWith('/product/')) {
    const product = products.find((item) => item.id === route.split('/').at(-1)) ?? products[0]
    content = <ProductScreen product={product} quantity={state.cart.find((line) => line.id === product.id)?.quantity ?? 0} onAdd={addProduct} />
  }
  else if (route === '/cart') content = <CartScreen state={state} onChange={changeLine} />
  else if (route === '/time') content = <TimeScreen state={state} onSelect={(slot) => setState((current) => ({ ...current, slot }))} />
  else if (route === '/checkout') content = <CheckoutScreen state={state} />
  else if (route === '/payment-error') content = <PaymentErrorScreen state={state} onConfirm={confirmOrder} />
  else if (route === '/success') content = <SuccessScreen order={state.orders[0]} />
  else if (route === '/repeat') content = <RepeatScreen currentCart={state.cart} onUse={(cart) => { setState((current) => ({ ...current, mode: 'pickup', location: 'ул. Красная, 155', cart, slot: '' })); navigate('/cart') }} />
  else if (route === '/cake') content = <CakeScreen onSave={(size, design) => { setState((current) => ({ ...current, cakeRequest: createCakeRequest(size, design) })); navigate('/cake-confirm') }} />
  else if (route === '/cake-confirm') content = <CakeConfirmScreen request={state.cakeRequest} />
  else if (route === '/loyalty') content = <LoyaltyScreen />
  else if (route === '/login') content = <LoginScreen />
  else if (route === '/orders') content = <OrdersScreen orders={state.orders} />
  else content = <HomeScreen state={state} onMode={chooseMode} />

  return <DeviceStage activeNav={activeNav}>{content}</DeviceStage>
}

function DeviceStage({ children, activeNav }: { children: ReactNode; activeNav: 'home' | 'catalog' | 'orders' | 'card' | null }) {
  return (
    <div className="device-stage">
      <div className={`phone-shell${activeNav ? ' has-bottom-nav' : ''}`}>
        {children}
        {activeNav && <BottomNav active={activeNav} />}
      </div>
      <aside className="desktop-note">
        <span className="eyebrow">Интерактивная концепция</span>
        <h1>Патрик <i>&</i> Мари</h1>
        <p>Выберите формат получения, соберите корзину и проверьте восстановление после ошибки оплаты.</p>
        <a href="case/">Открыть презентацию <ArrowRight size={17} /></a>
      </aside>
    </div>
  )
}

function Header({ title, back = '/', action }: { title: string; back?: string; action?: ReactNode }) {
  return (
    <header className="app-header">
      <button className="icon-button" aria-label="Назад" onClick={() => navigate(back)}><ArrowLeft size={21} /></button>
      <strong>{title}</strong>
      <div className="header-action">{action}</div>
    </header>
  )
}

function BottomNav({ active }: { active: 'home' | 'catalog' | 'orders' | 'card' }) {
  const items = [
    { id: 'home', label: 'Главная', icon: Home, path: '/' },
    { id: 'catalog', label: 'Меню', icon: Utensils, path: '/catalog' },
    { id: 'orders', label: 'Заказы', icon: ShoppingBag, path: '/orders' },
    { id: 'card', label: 'Карта', icon: WalletCards, path: '/loyalty' },
  ] as const
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {items.map((item) => {
        const Icon = item.icon
        return <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => navigate(item.path)}><Icon size={21} /><span>{item.label}</span></button>
      })}
    </nav>
  )
}

function HomeScreen({ state, onMode }: { state: DemoState; onMode: (mode: ServiceMode) => void }) {
  return (
    <div className="screen with-nav home-screen">
      <div className="brand-row">
        <div className="wordmark">ПАТРИК <i>&</i> МАРИ</div>
        <button className="avatar" aria-label="Войти" onClick={() => navigate('/login')}>А</button>
      </div>
      <button className="context-pill" onClick={() => navigate('/mode')}>
        <span><MapPin size={16} />{formatContext(state)}</span><ChevronRight size={17} />
      </button>

      <section className="welcome-card">
        <span className="eyebrow">Готовая еда на каждый день</span>
        <h1>Что приготовим<br />для вашего дня?</h1>
        <p>Сначала проверим точку и время — затем покажем доступное.</p>
        <div className="welcome-actions">
          <button className="primary light" onClick={() => onMode('delivery')}><PackageCheck size={18} /> Доставка</button>
          <button className="primary ghost-light" onClick={() => onMode('pickup')}><Store size={18} /> Самовывоз</button>
        </div>
      </section>

      <section className="quick-grid">
        <button className="loyalty-tile" onClick={() => navigate('/loyalty')}>
          <span><WalletCards size={22} /> Карта</span>
          <strong>1 240</strong><small>баллов · код сохранён на устройстве</small>
        </button>
        <button className="cake-tile" onClick={() => navigate('/cake')}>
          <CakeSlice size={23} /><span>Торт<br /><strong>к событию</strong></span><ChevronRight size={17} />
        </button>
      </section>

      <section className="section-block">
        <div className="section-title"><div><span className="eyebrow">В прошлый раз</span><h2>Повторить к ужину</h2></div><button onClick={() => navigate('/repeat')}>Проверить</button></div>
        <button className="repeat-card" onClick={() => navigate('/repeat')}>
          <div className="repeat-images"><img src={products[0].image} alt="Сырники классические" /><img src="assets/food/bakery.jpg" alt="Пирог с орехами" /></div>
          <div><strong>2 позиции</strong><span>Проверим цену и наличие</span></div><ChevronRight size={19} />
        </button>
      </section>

      <section className="section-block">
        <div className="section-title"><div><span className="eyebrow">Сегодня</span><h2>Можно забрать по пути</h2></div></div>
        <div className="editorial-card"><img src="assets/food/salads.jpg" alt="Салат с курицей и овощами" /><div><span>На сегодня</span><strong>Ужин без лишней готовки</strong><button onClick={() => onMode('pickup')}>Выбрать кулинарию <ArrowRight size={16} /></button></div></div>
      </section>
    </div>
  )
}

function ModeScreen({ onChoose }: { onChoose: (mode: ServiceMode) => void }) {
  return (
    <div className="screen paper-screen">
      <Header title="Как получите заказ?" />
      <div className="screen-body">
        <span className="eyebrow">До корзины</span>
        <h1>Сначала место<br />и способ получения</h1>
        <p className="lead">Так каталог сможет показать ассортимент выбранной точки и доступное время.</p>
        <button className="mode-card delivery" onClick={() => onChoose('delivery')}><span className="mode-icon"><PackageCheck /></span><span><strong>Доставка</strong><small>Укажем адрес и проверим зону</small></span><ChevronRight /></button>
        <button className="mode-card pickup" onClick={() => onChoose('pickup')}><span className="mode-icon"><Store /></span><span><strong>Самовывоз</strong><small>Выберем конкретную кулинарию</small></span><ChevronRight /></button>
        <div className="why-note"><Clock3 size={19} /><p><strong>Корзина ещё пуста.</strong> Ничего не потеряется, если способ получения понадобится изменить позже.</p></div>
      </div>
    </div>
  )
}

function LocationScreen({ mode, loading, onChoose }: { mode: ServiceMode | null; loading: boolean; onChoose: (location: string) => void }) {
  const [query, setQuery] = useState('')
  const pickup = mode !== 'delivery'
  const locations = pickup
    ? ['ул. Красная, 155', 'ул. Кубанская набережная, 35', 'ул. 40-летия Победы, 117']
    : ['ул. Красная, 64', 'ул. Зиповская, 8', 'ул. Ставропольская, 129']
  const shownLocations = filterLocations(locations, query)
  return (
    <div className="screen paper-screen">
      <Header title={pickup ? 'Выберите кулинарию' : 'Куда доставить?'} back="/mode" />
      <div className="screen-body">
        <label className="search-field"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={pickup ? 'Адрес или район' : 'Введите адрес доставки'} aria-label={pickup ? 'Поиск кулинарии' : 'Поиск адреса доставки'} /></label>
        {loading ? <div className="loading-list" aria-label="Загрузка"><span /><span /><span /></div> : (
          <>
            <div className="map-abstract"><div className="map-line one" /><div className="map-line two" /><MapPin size={34} /><span>{pickup ? 'Выберите удобную кулинарию' : 'Выберите адрес из списка'}</span></div>
            <div className="location-list">
              {shownLocations.map((location, index) => (
                <button key={location} onClick={() => onChoose(location)}>
                  <span className="location-index">{index + 1}</span><span><strong>{location}</strong><small>{pickup ? `${6 + index * 4} мин пешком · сегодня до 21:00` : index === 0 ? 'Доступно для выбора' : 'Сохранённый адрес'}</small></span><ChevronRight size={18} />
                </button>
              ))}
              {shownLocations.length === 0 && <div className="empty-inline"><Search /><span><strong>Адрес не найден</strong><small>Измените запрос или очистите поле.</small></span></div>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CatalogScreen({ state, onAdd }: { state: DemoState; onAdd: (product: Product) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Всё')
  const categories = ['Всё', 'Завтраки', 'Готовая еда', 'Выпечка', 'Торты на заказ']
  const categoryMatches = (product: Product) => category === 'Всё'
    || product.category === category
    || (category === 'Готовая еда' && product.category === 'Салаты, закуски')
  const shown = products.filter((product) => categoryMatches(product)
    && (product.name.toLowerCase().includes(query.toLowerCase()) || product.category.toLowerCase().includes(query.toLowerCase())))
  return (
    <div className="screen with-nav catalog-screen">
      <Header title="Готовая еда" back="/" action={<button className="bag-button" aria-label="Корзина" onClick={() => navigate('/cart')}><ShoppingBag size={20} />{state.cart.length > 0 && <b>{state.cart.reduce((sum, item) => sum + item.quantity, 0)}</b>}</button>} />
      <button className="catalog-context" onClick={() => navigate('/mode')}><span>{state.mode === 'delivery' ? 'Доставка' : 'Самовывоз'} · {state.location || 'точка не выбрана'}</span><ChevronRight size={16} /></button>
      <div className="catalog-body">
        <label className="real-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти в меню" aria-label="Поиск по меню" /></label>
        <div className="category-chips">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        {shown.length === 0 ? <div className="empty-state"><Search size={36} /><h2>Ничего не нашли</h2><p>Попробуйте название категории или вернитесь ко всему меню.</p><button className="primary" onClick={() => { setQuery(''); setCategory('Всё') }}>Показать всё</button></div> : (
          <div className="product-grid">
            {shown.map((product) => <ProductCard key={product.id} product={product} onAdd={() => onAdd(product)} />)}
          </div>
        )}
      </div>
      {state.cart.length > 0 && <button className="floating-cart" onClick={() => navigate('/cart')}><span><ShoppingBag size={19} /> Корзина · {state.cart.reduce((sum, item) => sum + item.quantity, 0)}</span><strong>{money(total(state.cart))}</strong></button>}
    </div>
  )
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const isCake = product.id === 'cake'
  const open = () => navigate(isCake ? '/cake' : `/product/${product.id}`)
  return (
    <article className="product-card">
      <button className="product-photo" onClick={open}><img src={product.image} alt={product.name} /><span>{product.category}</span></button>
      <button className="product-copy" onClick={open}><strong>{product.name}</strong><small>{product.note}</small></button>
      <div className="product-bottom"><b>{isCake ? 'По заявке' : money(product.price)}</b><button aria-label={isCake ? `Открыть заявку: ${product.name}` : `Добавить ${product.name}`} onClick={isCake ? open : onAdd}>{isCake ? <ArrowRight size={20} /> : <Plus size={20} />}</button></div>
    </article>
  )
}

function ProductScreen({ product, quantity, onAdd }: { product: Product; quantity: number; onAdd: (product: Product) => void }) {
  return (
    <div className="screen product-screen">
      <div className="product-hero"><img src={product.image} alt={product.name} /><button className="icon-button overlay" onClick={() => navigate('/catalog')} aria-label="Назад"><ArrowLeft /></button><span>{product.category}</span></div>
      <div className="product-detail"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p>{product.note}.</p><div className="detail-facts"><span><strong>Состав</strong><small>уточняется для точки</small></span><span><strong>Наличие</strong><small>доступно сейчас</small></span></div></div>
      <div className="sticky-action"><strong>{money(product.price)}</strong><button className="primary" onClick={() => quantity > 0 ? navigate('/cart') : onAdd(product)}>{quantity > 0 ? <><ShoppingBag size={19} /> Открыть корзину · {quantity}</> : <><Plus size={19} /> Добавить</>}</button></div>
    </div>
  )
}

function CartScreen({ state, onChange }: { state: DemoState; onChange: (id: string, delta: number) => void }) {
  return (
    <div className="screen paper-screen cart-screen">
      <Header title="Корзина" back="/catalog" />
      <div className="screen-body">
        {state.cart.length === 0 ? <div className="empty-state tall"><ShoppingBag size={42} /><h1>Корзина ждёт</h1><p>Сначала выберите способ получения и добавьте позиции из доступного каталога.</p><button className="primary" onClick={() => navigate('/mode')}>Начать заказ</button></div> : (
          <>
            <button className="order-context" onClick={() => navigate('/mode')}><span><small>{state.mode === 'delivery' ? 'Доставка' : 'Самовывоз'}</small><strong>{state.location}</strong></span><ChevronRight /></button>
            <div className="cart-lines">{state.cart.map((line) => (
              <div className="cart-line" key={line.id}><img src={products.find((item) => item.id === line.id)?.image ?? 'assets/food/bakery.jpg'} alt="" /><span><strong>{line.name}</strong><small>{money(line.price)}</small></span><div className="stepper"><button aria-label="Уменьшить" onClick={() => onChange(line.id, -1)}><Minus /></button><b>{line.quantity}</b><button aria-label="Увеличить" onClick={() => onChange(line.id, 1)}><Plus /></button></div></div>
            ))}</div>
            <div className="cart-note"><Clock3 size={19} /><span><strong>Следующий шаг — время.</strong><small>Доступные интервалы зависят от выбранной точки.</small></span></div>
            <div className="summary"><span>Позиции</span><b>{money(total(state.cart))}</b><span>Получение</span><b>уточним дальше</b><div /><div /></div>
          </>
        )}
      </div>
      {state.cart.length > 0 && <div className="bottom-cta"><button className="primary" onClick={() => navigate('/time')}>Выбрать время <ArrowRight size={18} /></button></div>}
    </div>
  )
}

function TimeScreen({ state, onSelect }: { state: DemoState; onSelect: (slot: string) => void }) {
  const slots = ['Как можно скорее · 45–60 мин', 'Сегодня · 19:10–19:25', 'Сегодня · 20:00–20:15']
  return (
    <div className="screen paper-screen">
      <Header title="Время получения" back="/cart" />
      <div className="screen-body"><span className="eyebrow">{formatContext(state)}</span><h1>Когда будет удобно?</h1><p className="lead">Выберите доступный интервал получения.</p><div className="slot-list">{slots.map((slot) => <button key={slot} className={state.slot === slot ? 'selected' : ''} onClick={() => onSelect(slot)}><Clock3 /><span>{slot}</span>{state.slot === slot ? <Check /> : <ChevronRight />}</button>)}</div></div>
      <div className="bottom-cta"><button className="primary" disabled={!state.slot} onClick={() => navigate('/checkout')}>Перейти к оформлению <ArrowRight size={18} /></button></div>
    </div>
  )
}

function CheckoutScreen({ state }: { state: DemoState }) {
  return (
    <div className="screen paper-screen">
      <Header title="Оформление" back="/time" />
      <div className="screen-body checkout-body"><div className="checkout-card"><span><MapPin /><small>Получение</small><strong>{formatContext(state)}</strong></span><span><Clock3 /><small>Время</small><strong>{state.slot}</strong></span></div><div className="checkout-card"><span><Smartphone /><small>Получатель</small><strong>+7 900 ••• •• 24</strong></span><span><CreditCard /><small>Оплата</small><strong>Карта • 4242</strong></span></div><div className="simulation-note"><SignalLow /><span>Проверка интерфейса: заказ и оплата никуда не отправятся.</span></div><div className="summary"><span>Заказ</span><b>{money(total(state.cart))}</b><span>Итого</span><b>{money(total(state.cart))}</b></div></div>
      <div className="bottom-cta"><button className="primary" onClick={() => navigate('/payment-error')}>Проверить оплату <ArrowRight size={18} /></button></div>
    </div>
  )
}

function PaymentErrorScreen({ state, onConfirm }: { state: DemoState; onConfirm: () => void }) {
  return (
    <div className="screen result-screen error-result"><div className="result-icon"><X /></div><span className="eyebrow">Ошибка оплаты</span><h1>Оплата не прошла,<br />корзина сохранена</h1><p>Все {state.cart.reduce((sum, line) => sum + line.quantity, 0)} позиции, {state.slot || 'выбранное время'} и адрес остались на месте.</p><div className="saved-box"><RefreshCw /><span><strong>Можно продолжить без повторного сбора</strong><small>{formatContext(state)} · {money(total(state.cart))}</small></span></div><button className="primary" onClick={onConfirm}>Повторить оплату <ArrowRight size={18} /></button><button className="text-button" onClick={() => navigate('/cart')}>Проверить корзину</button></div>
  )
}

function SuccessScreen({ order }: { order?: ConfirmedOrder }) {
  if (!order) return <div className="screen result-screen success-result"><div className="result-icon"><ShoppingBag /></div><h1>Подтверждённых заказов пока нет</h1><button className="primary" onClick={() => navigate('/catalog')}>Перейти в меню</button></div>
  return (
    <div className="screen result-screen success-result"><div className="result-icon"><Check /></div><span className="eyebrow">Готово</span><h1>Заказ подтверждён</h1><p>Заказ сохранён в разделе «Заказы». Корзина очищена.</p><div className="receipt"><span><small>Номер</small><strong>{order.id}</strong></span><span><small>Получение</small><strong>{order.mode === 'delivery' ? 'Доставка' : 'Самовывоз'}</strong></span><span><small>Адрес</small><strong>{order.location}</strong></span><span><small>Время</small><strong>{order.slot}</strong></span><span><small>Состав</small><strong>{order.lines.map((line) => `${line.name} × ${line.quantity}`).join(', ')}</strong></span><span><small>Сумма</small><strong>{money(order.amount)}</strong></span></div><button className="primary" onClick={() => navigate('/orders')}>Посмотреть историю</button><button className="text-button" onClick={() => navigate('/')}>На главную</button></div>
  )
}

function RepeatScreen({ currentCart, onUse }: { currentCart: CartLine[]; onUse: (cart: CartLine[]) => void }) {
  const previous: CartLine[] = [
    { id: 'syrniki', name: 'Сырники классические', price: 350, quantity: 1 },
    { id: 'bakery', name: 'Пирог с орехами', price: 190, quantity: 2 },
    { id: 'seasonal', name: 'Сезонная позиция', price: 260, quantity: 1 },
  ]
  const reconciled = reconcileRepeat(previous, { syrniki: 390, bakery: 190 })
  const available = reconciled.filter((line) => line.available)
  return (
    <div className="screen paper-screen">
      <Header title="Повтор заказа" />
      <div className="screen-body"><span className="eyebrow">Перед добавлением</span><h1>Проверили цену<br />и наличие</h1><p className="lead">Проверьте точные количества и сумму перед заменой корзины.</p><div className="compare-list">{reconciled.map((line) => <div key={line.id} className={!line.available ? 'unavailable' : ''}><span>{line.available ? <Check /> : <X />}<strong>{line.name} · {line.quantity} шт.</strong></span><span>{line.available ? `${line.quantity} × ${money(line.price)} = ${money(line.quantity * line.price)}` : 'Сейчас недоступно'}</span></div>)}</div><div className="repeat-summary"><span>В новую корзину</span><strong>{available.reduce((sum, line) => sum + line.quantity, 0)} шт. · {money(total(available))}</strong></div><div className="why-note"><RefreshCw /><p><strong>{currentCart.length > 0 ? 'Текущая корзина будет заменена.' : 'Будет создана новая корзина.'}</strong> Сезонная позиция не попадёт в неё.</p></div></div>
      <div className="bottom-cta"><button className="primary" onClick={() => onUse(available)}>{currentCart.length > 0 ? 'Заменить корзину' : 'Собрать корзину'} · {money(total(available))} <ArrowRight size={18} /></button></div>
    </div>
  )
}

function CakeScreen({ onSave }: { onSave: (size: string, design: string) => void }) {
  const [step, setStep] = useState(1)
  const [size, setSize] = useState('На 8–10 гостей')
  const [design, setDesign] = useState('Светлое оформление')
  return (
    <div className="screen cake-screen">
      <Header title="Торт к событию" />
      <div className="cake-visual"><img src="assets/food/cakes.jpg" alt="Категория тортов Патрик и Мари" /><span>Шаг {step} из 3</span></div>
      <div className="cake-body">
        {step === 1 && <><span className="eyebrow">Размер</span><h1>Сколько будет гостей?</h1><div className="choice-grid">{['На 4–6 гостей', 'На 8–10 гостей', 'На 12–16 гостей'].map((value) => <button className={size === value ? 'selected' : ''} key={value} onClick={() => setSize(value)}>{value}{size === value && <Check />}</button>)}</div></>}
        {step === 2 && <><span className="eyebrow">Оформление</span><h1>Какое настроение?</h1><div className="choice-grid">{['Светлое оформление', 'Ягодный акцент', 'Лаконичная надпись'].map((value) => <button className={design === value ? 'selected' : ''} key={value} onClick={() => setDesign(value)}>{value}{design === value && <Check />}</button>)}</div></>}
        {step === 3 && <><span className="eyebrow">Проверка</span><h1>Детали заявки</h1><div className="cake-preview"><img src="assets/food/cakes.jpg" alt={design} /><span>{design}</span></div><div className="receipt"><span><small>Размер</small><strong>{size}</strong></span><span><small>Оформление</small><strong>{design}</strong></span></div><p className="fine-print">Дату, время, точку, состав и стоимость согласуем отдельно.</p></>}
      </div>
      <div className="bottom-cta split">{step > 1 && <button className="secondary" onClick={() => setStep(step - 1)}>Назад</button>}<button className="primary" onClick={() => step < 3 ? setStep(step + 1) : onSave(size, design)}>{step < 3 ? <>Продолжить <ArrowRight size={18} /></> : <>Сохранить заявку <Check size={18} /></>}</button></div>
    </div>
  )
}

function CakeConfirmScreen({ request }: { request: CakeRequest | null }) {
  if (!request) return <div className="screen result-screen success-result"><div className="result-icon"><CakeSlice /></div><h1>Заявка ещё не заполнена</h1><button className="primary" onClick={() => navigate('/cake')}>Выбрать торт</button></div>
  return <div className="screen result-screen success-result"><div className="result-icon"><CakeSlice /></div><span className="eyebrow">Заявка сохранена</span><h1>Выбранные детали<br />на месте</h1><p>Заявка хранится отдельно и не добавляет торт в обычную корзину.</p><div className="receipt"><span><small>Размер</small><strong>{request.size}</strong></span><span><small>Оформление</small><strong>{request.design}</strong></span><span><small>Статус</small><strong>{request.status}</strong></span></div><button className="primary" onClick={() => navigate('/')}>На главную</button><button className="text-button" onClick={() => navigate('/cake')}>Изменить заявку</button></div>
}

function LoyaltyScreen() {
  return (
    <div className="screen with-nav loyalty-screen"><Header title="Карта лояльности" /><div className="loyalty-card"><span className="wordmark">ПАТРИК <i>&</i> МАРИ</span><div className="barcode" aria-label="Код карты лояльности">{Array.from({ length: 22 }, (_, index) => <i key={index} />)}</div><div><strong>1 240</strong><small>баллов</small></div></div><div className="offline-banner"><SignalLow /><span><strong>Код карты сохранён на устройстве</strong><small>Покажите его сотруднику до оплаты.</small></span></div><section className="section-block"><div className="section-title"><div><span className="eyebrow">Использование карты</span><h2>Перед оплатой</h2></div></div><div className="info-list"><span><WalletCards /><div><strong>Начислить или списать баллы</strong><small>Покажите код на кассе и назовите нужное действие.</small></div></span><span><RefreshCw /><div><strong>Проверить правила программы</strong><small>Условия начисления и списания могут зависеть от покупки.</small></div></span></div></section></div>
  )
}

function LoginScreen() {
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  return (
    <div className="screen login-screen"><Header title="Вход" /><div className="login-illustration"><Smartphone /></div><div className="screen-body"><span className="eyebrow">Без постоянного пароля</span><h1>{sent ? 'Введите код из СМС' : 'Номер телефона — и вы внутри'}</h1><p className="lead">{sent ? 'Введите любые четыре цифры для продолжения.' : 'Укажите номер, чтобы получить код для входа.'}</p>{!sent ? <><label className="phone-input"><span>+7</span><input defaultValue="900 000 00 24" aria-label="Номер телефона" /></label><button className="primary" onClick={() => setSent(true)}>Получить код</button></> : <><label className="code-input"><input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" aria-label="Код из СМС" /></label><small className="helper">Подойдут любые 4 цифры</small><button className="primary" disabled={code.length !== 4} onClick={() => navigate('/loyalty')}>Войти и открыть карту</button><button className="text-button" onClick={() => setSent(false)}>Изменить номер</button></>}</div></div>
  )
}

function OrdersScreen({ orders }: { orders: ConfirmedOrder[] }) {
  const [tab, setTab] = useState<'history' | 'current'>(orders.length > 0 ? 'current' : 'history')
  return (
    <div className="screen with-nav paper-screen"><Header title="Заказы" /><div className="screen-body"><div className="tabs"><button className={tab === 'history' ? 'active' : ''} aria-pressed={tab === 'history'} onClick={() => setTab('history')}>История</button><button className={tab === 'current' ? 'active' : ''} aria-pressed={tab === 'current'} onClick={() => setTab('current')}>Текущие</button></div>{tab === 'history' ? <button className="history-card" onClick={() => navigate('/repeat')}><span className="history-date">28 июля</span><strong>Самовывоз · ул. Красная, 155</strong><small>Сырники и пирог · 3 шт. · 770 ₽</small><span className="history-action"><RefreshCw size={17} /> Проверить и повторить</span></button> : orders.length > 0 ? <div className="current-orders">{orders.map((order) => <article className="current-order" key={order.id}><span className="order-status"><PackageCheck /> {order.status}</span><h2>{order.mode === 'delivery' ? 'Доставка' : 'Самовывоз'} · {order.location}</h2><p>{order.slot}</p><ul>{order.lines.map((line) => <li key={line.id}><span>{line.name} × {line.quantity}</span><b>{money(line.price * line.quantity)}</b></li>)}</ul><div><span>{order.id}</span><strong>{money(order.amount)}</strong></div></article>)}</div> : <div className="empty-inline"><Clock3 /><span><strong>Текущих заказов нет</strong><small>Подтверждённый заказ появится здесь.</small></span></div>}</div></div>
  )
}
