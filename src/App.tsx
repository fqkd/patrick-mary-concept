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
  Sparkles,
  Store,
  Utensils,
  WalletCards,
  X,
} from 'lucide-react'
import { addLine, changeQuantity, reconcileRepeat, total, type CartLine, type ServiceMode } from './lib/order'

type DemoState = {
  mode: ServiceMode | null
  location: string
  cart: CartLine[]
  slot: string
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
  { id: 'syrniki', name: 'Сырники классические', note: 'Демонстрационная порция', category: 'Завтраки', price: 390, image: 'assets/food/breakfast.jpg' },
  { id: 'salad', name: 'Салат из свежих овощей', note: 'Демонстрационная позиция', category: 'Салаты, закуски', price: 340, image: 'assets/food/salads.jpg' },
  { id: 'bakery', name: 'Свежая выпечка', note: 'Демонстрационная позиция', category: 'Выпечка', price: 190, image: 'assets/food/bakery.jpg' },
  { id: 'cake', name: 'Торт к вашему событию', note: 'Размер и оформление на выбор', category: 'Торты', price: 2400, image: 'assets/food/cakes.jpg' },
]

const emptyState: DemoState = { mode: null, location: '', cart: [], slot: '' }

const demoCart: CartLine[] = [
  { id: 'syrniki', name: 'Сырники классические', price: 390, quantity: 1 },
  { id: 'bakery', name: 'Свежая выпечка', price: 190, quantity: 2 },
]

const routeFromHash = () => {
  const raw = window.location.hash.slice(1) || '/'
  return raw.split('?')[0] || '/'
}

const navigate = (path: string) => {
  window.location.hash = path
}

const money = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`

const seedState = (): DemoState => {
  const seed = new URLSearchParams(window.location.search).get('seed')
  if (seed) return { mode: 'pickup', location: 'ул. Красная, 155', cart: demoCart, slot: 'Сегодня, 19:10' }
  try {
    const saved = window.sessionStorage.getItem('pm-demo-state')
    return saved ? JSON.parse(saved) as DemoState : emptyState
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

  let content: ReactNode
  if (route === '/mode') content = <ModeScreen onChoose={chooseMode} />
  else if (route === '/location') content = <LocationScreen mode={state.mode} loading={loading} onChoose={chooseLocation} />
  else if (route === '/catalog') content = <CatalogScreen state={state} onAdd={addProduct} />
  else if (route.startsWith('/product/')) content = <ProductScreen product={products.find((item) => item.id === route.split('/').at(-1)) ?? products[0]} onAdd={addProduct} />
  else if (route === '/cart') content = <CartScreen state={state} onChange={changeLine} />
  else if (route === '/time') content = <TimeScreen state={state} onSelect={(slot) => setState((current) => ({ ...current, slot }))} />
  else if (route === '/checkout') content = <CheckoutScreen state={state} />
  else if (route === '/payment-error') content = <PaymentErrorScreen state={state} />
  else if (route === '/success') content = <SuccessScreen state={state} onReset={() => setState(emptyState)} />
  else if (route === '/repeat') content = <RepeatScreen onUse={(cart) => { setState({ mode: 'pickup', location: 'ул. Красная, 155', cart, slot: '' }); navigate('/cart') }} />
  else if (route === '/cake') content = <CakeScreen onAdd={(line) => { setState({ mode: 'pickup', location: 'ул. Красная, 155', cart: [line], slot: '18 августа, 12:00' }); navigate('/cake-confirm') }} />
  else if (route === '/cake-confirm') content = <CakeConfirmScreen state={state} />
  else if (route === '/loyalty') content = <LoyaltyScreen />
  else if (route === '/login') content = <LoginScreen />
  else if (route === '/orders') content = <OrdersScreen />
  else content = <HomeScreen state={state} onMode={chooseMode} />

  return <DeviceStage>{content}</DeviceStage>
}

function DeviceStage({ children }: { children: ReactNode }) {
  return (
    <div className="device-stage">
      <div className="phone-shell">
        <div className="safe-top" aria-hidden="true"><span /></div>
        {children}
      </div>
      <aside className="desktop-note">
        <span className="eyebrow">Интерактивная концепция</span>
        <h1>Патрик <i>&</i> Мари</h1>
        <p>Выберите формат получения, соберите демонстрационную корзину и проверьте восстановление после ошибки оплаты.</p>
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
        <span><MapPin size={16} />{state.location || 'Сначала выберите получение'}</span><ChevronRight size={17} />
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
          <strong>1 240</strong><small>демо-баллов · доступна офлайн</small>
        </button>
        <button className="cake-tile" onClick={() => navigate('/cake')}>
          <CakeSlice size={23} /><span>Торт<br /><strong>к событию</strong></span><ChevronRight size={17} />
        </button>
      </section>

      <section className="section-block">
        <div className="section-title"><div><span className="eyebrow">В прошлый раз</span><h2>Повторить к ужину</h2></div><button onClick={() => navigate('/repeat')}>Проверить</button></div>
        <button className="repeat-card" onClick={() => navigate('/repeat')}>
          <div className="repeat-images"><img src="assets/food/breakfast.jpg" alt="Категория завтраков" /><img src="assets/food/bakery.jpg" alt="Категория выпечки" /></div>
          <div><strong>2 позиции</strong><span>Проверим цену и наличие</span></div><ChevronRight size={19} />
        </button>
      </section>

      <section className="section-block">
        <div className="section-title"><div><span className="eyebrow">Сегодня</span><h2>Можно забрать по пути</h2></div></div>
        <div className="editorial-card"><img src="assets/food/salads.jpg" alt="Категория салатов Патрик и Мари" /><div><span>Демо-подборка</span><strong>Ужин без лишней готовки</strong><button onClick={() => onMode('pickup')}>Выбрать кулинарию <ArrowRight size={16} /></button></div></div>
      </section>
      <BottomNav active="home" />
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
  const pickup = mode !== 'delivery'
  const locations = pickup
    ? ['ул. Красная, 155', 'ул. Кубанская набережная, 35', 'ул. 40-летия Победы, 117']
    : ['Демо-адрес · ул. Красная, 64', 'Демо-адрес · ул. Зиповская, 8', 'Демо-адрес · ул. Ставропольская, 129']
  return (
    <div className="screen paper-screen">
      <Header title={pickup ? 'Выберите кулинарию' : 'Куда доставить?'} back="/mode" />
      <div className="screen-body">
        <div className="search-field"><Search size={19} /><span>{pickup ? 'Адрес или район' : 'Введите адрес доставки'}</span></div>
        {loading ? <div className="loading-list" aria-label="Загрузка"><span /><span /><span /></div> : (
          <>
            <div className="map-abstract"><div className="map-line one" /><div className="map-line two" /><MapPin size={34} /><span>{pickup ? '21 точка на официальной странице' : 'Проверка зоны в демосценарии'}</span></div>
            <div className="location-list">
              {locations.map((location, index) => (
                <button key={location} onClick={() => onChoose(location)}>
                  <span className="location-index">{index + 1}</span><span><strong>{location}</strong><small>{pickup ? `${6 + index * 4} мин пешком · сегодня до 21:00` : index === 0 ? 'Демонстрационный адрес · доступно' : 'Сохранённый демонстрационный адрес'}</small></span><ChevronRight size={18} />
                </button>
              ))}
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
  const categories = ['Всё', 'Завтраки', 'Готовая еда', 'Выпечка', 'Торты']
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
        <label className="real-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти в демонстрационном меню" /></label>
        <div className="category-chips">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="demo-label"><Sparkles size={15} /> Демонстрационные состав и цены</div>
        {shown.length === 0 ? <div className="empty-state"><Search size={36} /><h2>Ничего не нашли</h2><p>Попробуйте название категории или вернитесь ко всему меню.</p><button className="primary" onClick={() => { setQuery(''); setCategory('Всё') }}>Показать всё</button></div> : (
          <div className="product-grid">
            {shown.map((product) => <ProductCard key={product.id} product={product} onAdd={() => onAdd(product)} />)}
          </div>
        )}
      </div>
      {state.cart.length > 0 && <button className="floating-cart" onClick={() => navigate('/cart')}><span><ShoppingBag size={19} /> Корзина · {state.cart.reduce((sum, item) => sum + item.quantity, 0)}</span><strong>{money(total(state.cart))}</strong></button>}
      <BottomNav active="catalog" />
    </div>
  )
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <article className="product-card">
      <button className="product-photo" onClick={() => navigate(`/product/${product.id}`)}><img src={product.image} alt={product.category} /><span>{product.category}</span></button>
      <button className="product-copy" onClick={() => navigate(`/product/${product.id}`)}><strong>{product.name}</strong><small>{product.note}</small></button>
      <div className="product-bottom"><b>{money(product.price)}</b><button aria-label={`Добавить ${product.name}`} onClick={onAdd}><Plus size={20} /></button></div>
    </article>
  )
}

function ProductScreen({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  const [added, setAdded] = useState(false)
  return (
    <div className="screen product-screen">
      <div className="product-hero"><img src={product.image} alt={product.category} /><button className="icon-button overlay" onClick={() => navigate('/catalog')} aria-label="Назад"><ArrowLeft /></button><span>{product.category}</span></div>
      <div className="product-detail"><span className="eyebrow">Демонстрационная карточка</span><h1>{product.name}</h1><p>{product.note}. Состав, вес и цена используются только для показа сценария интерфейса.</p><div className="detail-facts"><span><strong>Состав</strong><small>уточняется для точки</small></span><span><strong>Наличие</strong><small>доступно сейчас</small></span></div></div>
      <div className="sticky-action"><strong>{money(product.price)}</strong><button className="primary" onClick={() => { onAdd(product); setAdded(true) }}>{added ? <><Check size={19} /> В корзине</> : <><Plus size={19} /> Добавить</>}</button></div>
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
      <div className="screen-body"><span className="eyebrow">{state.mode === 'delivery' ? 'Доставка' : 'Самовывоз'}</span><h1>Когда будет удобно?</h1><p className="lead">Слоты демонстрационные. В продукте они будут зависеть от выбранной точки и действующих интеграций.</p><div className="slot-list">{slots.map((slot) => <button key={slot} className={state.slot === slot ? 'selected' : ''} onClick={() => onSelect(slot)}><Clock3 /><span>{slot}</span>{state.slot === slot ? <Check /> : <ChevronRight />}</button>)}</div></div>
      <div className="bottom-cta"><button className="primary" disabled={!state.slot} onClick={() => navigate('/checkout')}>Перейти к оформлению <ArrowRight size={18} /></button></div>
    </div>
  )
}

function CheckoutScreen({ state }: { state: DemoState }) {
  return (
    <div className="screen paper-screen">
      <Header title="Оформление" back="/time" />
      <div className="screen-body checkout-body"><div className="checkout-card"><span><MapPin /><small>Получение</small><strong>{state.location}</strong></span><span><Clock3 /><small>Время</small><strong>{state.slot}</strong></span></div><div className="checkout-card"><span><Smartphone /><small>Получатель</small><strong>+7 900 ••• •• 24</strong></span><span><CreditCard /><small>Оплата</small><strong>Демонстрационная карта • 4242</strong></span></div><label className="consent"><input type="checkbox" defaultChecked /><span>Я понимаю, что заказ и оплата не отправляются: это безопасная симуляция.</span></label><div className="summary"><span>Заказ</span><b>{money(total(state.cart))}</b><span>Итого</span><b>{money(total(state.cart))}</b></div></div>
      <div className="bottom-cta"><button className="primary" onClick={() => navigate('/payment-error')}>Оплатить в демо <ArrowRight size={18} /></button></div>
    </div>
  )
}

function PaymentErrorScreen({ state }: { state: DemoState }) {
  return (
    <div className="screen result-screen error-result"><div className="result-icon"><X /></div><span className="eyebrow">Демонстрационная ошибка</span><h1>Оплата не прошла,<br />корзина сохранена</h1><p>Все {state.cart.reduce((sum, line) => sum + line.quantity, 0)} позиции, {state.slot || 'выбранное время'} и адрес остались на месте.</p><div className="saved-box"><RefreshCw /><span><strong>Можно продолжить без повторного сбора</strong><small>{state.location || 'Демонстрационная точка'} · {money(total(state.cart))}</small></span></div><button className="primary" onClick={() => navigate('/success')}>Повторить оплату <ArrowRight size={18} /></button><button className="text-button" onClick={() => navigate('/cart')}>Проверить корзину</button></div>
  )
}

function SuccessScreen({ state, onReset }: { state: DemoState; onReset: () => void }) {
  return (
    <div className="screen result-screen success-result"><div className="result-icon"><Check /></div><span className="eyebrow">Готово</span><h1>{state.mode === 'delivery' ? 'Демо-заказ подтверждён' : 'Можно забирать по пути'}</h1><p>Симуляция завершена. Реальный заказ, оплата и уведомления не создавались.</p><div className="receipt"><span><small>Номер</small><strong>ДЕМО-024</strong></span><span><small>Получение</small><strong>{state.slot || 'Сегодня'}</strong></span><span><small>Адрес</small><strong>{state.location || 'ул. Красная, 155'}</strong></span></div><button className="primary" onClick={() => { onReset(); navigate('/') }}>На главную</button><button className="text-button" onClick={() => navigate('/orders')}>Посмотреть историю</button></div>
  )
}

function RepeatScreen({ onUse }: { onUse: (cart: CartLine[]) => void }) {
  const previous: CartLine[] = [
    { id: 'syrniki', name: 'Сырники классические', price: 350, quantity: 1 },
    { id: 'bakery', name: 'Свежая выпечка', price: 190, quantity: 2 },
    { id: 'seasonal', name: 'Сезонная позиция', price: 260, quantity: 1 },
  ]
  const reconciled = reconcileRepeat(previous, { syrniki: 390, bakery: 190 })
  const available = reconciled.filter((line) => line.available)
  return (
    <div className="screen paper-screen">
      <Header title="Повтор заказа" />
      <div className="screen-body"><span className="eyebrow">Перед добавлением</span><h1>Проверили цену<br />и наличие</h1><p className="lead">Повтор не переносит прошлую корзину вслепую: изменения видны до подтверждения.</p><div className="compare-list">{reconciled.map((line) => <div key={line.id} className={!line.available ? 'unavailable' : ''}><span>{line.available ? <Check /> : <X />}<strong>{line.name}</strong></span><span>{line.available ? money(line.price) : 'Сейчас недоступно'}</span></div>)}</div><div className="why-note"><RefreshCw /><p><strong>2 из 3 позиций готовы.</strong> Сезонная позиция не попадёт в новую корзину.</p></div></div>
      <div className="bottom-cta"><button className="primary" onClick={() => onUse(available)}>Добавить доступное <ArrowRight size={18} /></button></div>
    </div>
  )
}

function CakeScreen({ onAdd }: { onAdd: (line: CartLine) => void }) {
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
        {step === 3 && <><span className="eyebrow">Проверка</span><h1>Детали заказа</h1><div className="receipt"><span><small>Размер</small><strong>{size}</strong></span><span><small>Вариант</small><strong>{design}</strong></span><span><small>Получение</small><strong>ул. Красная, 155 · 18 августа</strong></span></div><p className="fine-print">Дизайн, состав, доступность и итоговая цена в реальном продукте требуют подтверждения кулинарией.</p></>}
      </div>
      <div className="bottom-cta split">{step > 1 && <button className="secondary" onClick={() => setStep(step - 1)}>Назад</button>}<button className="primary" onClick={() => step < 3 ? setStep(step + 1) : onAdd({ id: 'cake', name: `Демо-торт · ${design}`, price: 2400, quantity: 1 })}>{step < 3 ? <>Продолжить <ArrowRight size={18} /></> : <>Подтвердить демо <Check size={18} /></>}</button></div>
    </div>
  )
}

function CakeConfirmScreen({ state }: { state: DemoState }) {
  return <div className="screen result-screen success-result"><div className="result-icon"><CakeSlice /></div><span className="eyebrow">Заявка собрана</span><h1>Торт сохранён<br />в демосессии</h1><p>{state.cart[0]?.name}. Реальная заявка в кулинарию не отправлялась.</p><div className="receipt"><span><small>Получение</small><strong>{state.location}</strong></span><span><small>Дата</small><strong>{state.slot}</strong></span><span><small>Демо-стоимость</small><strong>{money(total(state.cart))}</strong></span></div><button className="primary" onClick={() => navigate('/')}>На главную</button></div>
}

function LoyaltyScreen() {
  return (
    <div className="screen with-nav loyalty-screen"><Header title="Карта лояльности" /><div className="loyalty-card"><span className="wordmark">ПАТРИК <i>&</i> МАРИ</span><div className="barcode" aria-label="Демонстрационный штрихкод">{Array.from({ length: 22 }, (_, index) => <i key={index} />)}</div><div><strong>1 240</strong><small>демо-баллов</small></div></div><div className="offline-banner"><SignalLow /><span><strong>Карта доступна без сети</strong><small>Сохранённый код открывается сразу. Начисление и списание зависят от действующих правил программы.</small></span></div><section className="section-block"><div className="section-title"><div><span className="eyebrow">Концепция</span><h2>Быстро у кассы</h2></div></div><div className="info-list"><span><Smartphone /><div><strong>Без загрузки новостей</strong><small>Сначала показываем карту, остальное обновляем позже.</small></div></span><span><RefreshCw /><div><strong>Автообновление кода</strong><small>При наличии связи — по правилам действующей системы.</small></div></span></div></section><BottomNav active="card" /></div>
  )
}

function LoginScreen() {
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  return (
    <div className="screen login-screen"><Header title="Вход" /><div className="login-illustration"><Smartphone /></div><div className="screen-body"><span className="eyebrow">Без постоянного пароля</span><h1>{sent ? 'Введите код из СМС' : 'Номер телефона — и вы внутри'}</h1><p className="lead">Безопасная симуляция: код не отправляется и профиль не создаётся.</p>{!sent ? <><label className="phone-input"><span>+7</span><input defaultValue="900 000 00 24" aria-label="Номер телефона" /></label><button className="primary" onClick={() => setSent(true)}>Получить демо-код</button></> : <><label className="code-input"><input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" aria-label="Код из СМС" /></label><small className="helper">Для демо введите любые 4 цифры</small><button className="primary" disabled={code.length !== 4} onClick={() => navigate('/loyalty')}>Войти и открыть карту</button><button className="text-button" onClick={() => setSent(false)}>Изменить номер</button></>}</div></div>
  )
}

function OrdersScreen() {
  const [tab, setTab] = useState<'history' | 'current'>('history')
  return (
    <div className="screen with-nav paper-screen"><Header title="Заказы" /><div className="screen-body"><div className="tabs"><button className={tab === 'history' ? 'active' : ''} aria-pressed={tab === 'history'} onClick={() => setTab('history')}>История</button><button className={tab === 'current' ? 'active' : ''} aria-pressed={tab === 'current'} onClick={() => setTab('current')}>Текущие</button></div>{tab === 'history' ? <button className="history-card" onClick={() => navigate('/repeat')}><span className="history-date">28 июля</span><strong>Самовывоз · Красная, 155</strong><small>Сырники, выпечка и ещё 1 позиция</small><span className="history-action"><RefreshCw size={17} /> Проверить и повторить</span></button> : <div className="empty-inline"><Clock3 /><span><strong>Текущих заказов нет</strong><small>После демо-подтверждения здесь мог бы появиться статус.</small></span></div>}</div><BottomNav active="orders" /></div>
  )
}
