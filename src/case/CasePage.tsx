import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CakeSlice, Check, Clock3, MapPin, PackageCheck, RefreshCw, Store, WalletCards } from 'lucide-react'

const slidesCount = 12
const proto = (route: string) => `../?seed=case#${route}`

const readSlide = () => {
  const found = window.location.hash.match(/slide-(\d+)/)
  return Math.min(slidesCount, Math.max(1, Number(found?.[1] ?? 1)))
}

export function CasePage() {
  const [slide, setSlide] = useState(readSlide)

  useEffect(() => {
    const onHash = () => setSlide(readSlide())
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'PageDown') go(Math.min(slidesCount, readSlide() + 1))
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') go(Math.max(1, readSlide() - 1))
    }
    window.addEventListener('hashchange', onHash)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('keydown', onKey) }
  }, [])

  const go = (next: number) => { window.location.hash = `slide-${next}`; window.scrollTo(0, 0) }
  const content = useMemo(() => renderSlide(slide), [slide])

  return (
    <main className={`deck slide-${slide}`}>
      <div className="case-brand">ПАТРИК <i>&</i> МАРИ <span>×</span> ЭРГОХАВЭН</div>
      <div className="slide-progress"><i style={{ width: `${slide / slidesCount * 100}%` }} /></div>
      <div className="case-slide" key={slide}>{content}</div>
      <nav className="case-nav" aria-label="Навигация по презентации">
        <button aria-label="Предыдущий раздел" disabled={slide === 1} onClick={() => go(slide - 1)}><ArrowLeft /></button>
        <span>{String(slide).padStart(2, '0')} <i>/</i> {slidesCount}</span>
        <button aria-label="Следующий раздел" disabled={slide === slidesCount} onClick={() => go(slide + 1)}><ArrowRight /></button>
      </nav>
    </main>
  )
}

function renderSlide(slide: number): ReactNode {
  switch (slide) {
    case 1: return <Cover />
    case 2: return <Studied />
    case 3: return <Friction />
    case 4: return <Idea />
    case 5: return <OrderScenario />
    case 6: return <LoyaltyScenario />
    case 7: return <CakeScenario />
    case 8: return <BusinessFit />
    case 9: return <Pilot />
    case 10: return <Metrics />
    case 11: return <Scope />
    default: return <Contact />
  }
}

function SectionLabel({ number, children }: { number: string; children: ReactNode }) {
  return <div className="section-label"><span>{number}</span>{children}</div>
}

function LinkButton({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <a className={secondary ? 'case-button secondary' : 'case-button'} href={href} target="_blank" rel="noreferrer">{children}<ArrowRight /></a>
}

function Phone({ src, alt, tone = '' }: { src: string; alt: string; tone?: string }) {
  const resolved = src.startsWith('assets/') ? `../${src}` : src
  return <figure className={`phone-shot ${tone}`}><img src={resolved} alt={alt} /></figure>
}

function Cover() {
  return (
    <section className="cover-layout">
      <div className="cover-copy"><SectionLabel number="01">Инициативная концепция</SectionLabel><h1>Каким может быть новое приложение <em>«Патрик & Мари»</em></h1><p>Мы собрали рабочий прототип с доставкой, самовывозом, бонусной картой, повтором заказа и заявкой на торт.</p><div className="button-row"><LinkButton href={proto('/')}>Открыть прототип</LinkButton><LinkButton href="#slide-5" secondary>Посмотреть сценарии</LinkButton></div><small className="disclaimer">Инициативная концепция ООО «ЭРГОХАВЭН» на основе открытых данных. Не является официальным приложением «Патрик & Мари».</small></div>
      <div className="cover-visual"><div className="orange-orbit" /><Phone src="assets/case/home.jpg" alt="Главный экран с выбором доставки и самовывоза" /><div className="float-chip card-chip"><WalletCards /> Бонусная карта всегда под рукой</div><div className="float-chip pickup-chip"><Store /> Меню выбранной кулинарии</div></div>
    </section>
  )
}

function Studied() {
  return (
    <section className="standard-layout"><div className="slide-copy"><SectionLabel number="02">Что мы учли</SectionLabel><h2>Что уже есть у «Патрик & Мари»</h2><p>Перед работой над прототипом мы изучили сайт, приложение и открытые материалы «Патрик & Мари».</p></div><div className="study-grid"><article><strong className="study-count"><b>21</b> кулинария</strong><span>Столько кулинарий указано на официальном сайте.</span></article><article><PackageCheck /><strong>Доставка и самовывоз</strong><span>Готовую еду можно заказать на сайте и в приложении.</span></article><article><WalletCards /><strong>Бонусная карта</strong><span>В приложении доступна виртуальная карта с QR-кодом.</span></article><article><CakeSlice /><strong>Торты на заказ</strong><span>На сайте для них предусмотрен отдельный раздел.</span></article></div><div className="source-line">Источники и дата проверки — в <a href="https://github.com/fqkd/patrick-mary-concept/blob/main/SOURCES.md" target="_blank" rel="noreferrer">SOURCES.md</a>.</div></section>
  )
}

function Friction() {
  return (
    <section className="standard-layout"><div className="slide-copy"><SectionLabel number="03">Что мы проработали</SectionLabel><h2>Три сценария, которые можно упростить</h2><p>В прототипе мы показали, как сделать выбор кулинарии, бонусную карту и повтор оплаты понятнее.</p></div><div className="friction-flow"><article><span>01</span><div><strong>Выбор до каталога</strong><p>Пользователь заранее выбирает доставку или самовывоз и сразу видит доступные товары и время.</p></div><MapPin /></article><article><span>02</span><div><strong>Бонусная карта</strong><p>Карта с QR-кодом открывается сразу — её не нужно искать перед кассой.</p></div><WalletCards /></article><article><span>03</span><div><strong>Повтор оплаты</strong><p>Если оплата не прошла, корзина и данные заказа сохраняются — остаётся нажать «Оплатить» ещё раз.</p></div><RefreshCw /></article></div></section>
  )
}

function Idea() {
  return (
    <section className="idea-layout"><div className="slide-copy"><SectionLabel number="04">Основной сценарий</SectionLabel><h2>Сначала — способ и место получения</h2><p>Перед открытием меню пользователь выбирает доставку или самовывоз. После этого приложение показывает доступный ассортимент и время получения.</p><LinkButton href={proto('/mode')}>Посмотреть сценарий</LinkButton></div><div className="question-stack"><article><span>Способ получения</span><strong>Доставка по адресу или самовывоз из выбранной кулинарии.</strong><PackageCheck /></article><article><span>Доступный ассортимент</span><strong>Товары и время с учётом выбранного места получения.</strong><Store /></article><article><span>Повтор заказа</span><strong>Перед добавлением прошлого заказа проверяются цены и наличие.</strong><RefreshCw /></article></div></section>
  )
}

function OrderScenario() {
  return (
    <section className="scenario-layout"><div className="slide-copy"><SectionLabel number="05">Сценарий № 1</SectionLabel><h2>Корзина сохраняется после ошибки оплаты</h2><p>Если оплата не прошла, товары, место и время получения остаются выбранными. Пользователь может сразу повторить оплату.</p><div className="flow-tags"><span>Корзина</span><i /><span>Оплата</span><i /><span>Ошибка</span><i /><span>Повтор оплаты</span></div><LinkButton href={proto('/payment-error')}>Посмотреть сценарий</LinkButton></div><div className="phones-trio"><Phone src="assets/case/cart.jpg" alt="Корзина с тремя товарами на сумму 2 414 рублей" /><Phone src="assets/case/checkout.jpg" alt="Оформление заказа с теми же товарами" /><Phone src="assets/case/payment-error.jpg" alt="Ошибка оплаты и кнопка повторной оплаты 2 414 рублей" tone="front" /></div></section>
  )
}

function LoyaltyScenario() {
  return (
    <section className="scenario-layout reverse"><div className="phones-pair"><Phone src="assets/case/login.jpg" alt="Введённый код из СМС и активная кнопка входа" /><Phone src="assets/case/loyalty.jpg" alt="Горизонтальная бонусная карта с балансом и демонстрационным QR-кодом" tone="front" /></div><div className="slide-copy"><SectionLabel number="06">Сценарий № 2</SectionLabel><h2>Вход по номеру и бонусная карта</h2><p>Пользователь подтверждает номер кодом из СМС. После входа он видит баланс и QR-код, который можно показать на кассе.</p><div className="flow-tags"><span>Номер телефона</span><i /><span>Код из СМС</span><i /><span>Бонусная карта</span></div><LinkButton href={proto('/login?step=phone')}>Посмотреть сценарий</LinkButton></div></section>
  )
}

function CakeScenario() {
  return (
    <section className="scenario-layout"><div className="slide-copy"><SectionLabel number="07">Сценарий № 3</SectionLabel><h2>Заявка на торт</h2><p>Пользователь выбирает повод, количество гостей, оформление и дату, а затем оставляет контактный номер. После отправки сотрудник уточняет детали и стоимость.</p><div className="flow-tags"><span>Повод</span><i /><span>Гости</span><i /><span>Оформление</span><i /><span>Дата и контакты</span><i /><span>Проверка</span></div><LinkButton href={proto('/cake?step=occasion')}>Посмотреть сценарий</LinkButton></div><div className="phones-pair cake-pair"><Phone src="assets/case/cake.jpg" alt="Выберите оформление торта" /><Phone src="assets/case/cake-confirm.jpg" alt="Заявка отправлена" tone="front" /></div></section>
  )
}

function BusinessFit() {
  return (
    <section className="standard-layout fit-slide"><div className="slide-copy"><SectionLabel number="08">Возможности приложения</SectionLabel><h2>Заказ, повтор и заявка на торт</h2><p>Готовую еду можно выбрать в каталоге, прошлый заказ — повторить из истории, а для торта — заполнить отдельную заявку.</p></div><div className="fit-grid"><article className="daily"><span>Готовая еда</span><h3>Заказ готовой еды</h3><p>Способ получения → кулинария → меню → корзина → время.</p></article><article className="habit"><span>Избранное и повтор заказа</span><h3>Сохранить и заказать снова</h3><p>Товары можно сохранить в избранное, а прошлый заказ — повторить после проверки цен и наличия.</p></article><article className="event"><span>Заявка на торт</span><h3>Торт к событию</h3><p>Пользователь указывает повод, количество гостей, оформление, дату и телефон.</p></article></div></section>
  )
}

function Pilot() {
  return (
    <section className="pilot-layout"><div className="slide-copy"><SectionLabel number="09">Пилот</SectionLabel><h2>Что проверить на пилоте</h2><p>Предлагаем начать с трёх основных сценариев. Необходимые интеграции определим после знакомства с действующими системами.</p></div><div className="pilot-timeline"><article><b>01</b><div><strong>Вход и бонусная карта</strong><span>Проверить, легко ли пользователю войти и открыть QR-код на кассе.</span></div></article><article><b>02</b><div><strong>Заказ готовой еды</strong><span>Проверить, понятен ли выбор способа и места получения перед открытием меню.</span></div></article><article><b>03</b><div><strong>Повтор оплаты</strong><span>Проверить, можно ли после ошибки повторить оплату без повторного оформления заказа.</span></div></article><article className="pilot-result"><Check /><div><strong>После пилота</strong><span>Зафиксируем результаты, необходимые доработки и состав следующего этапа.</span></div></article></div></section>
  )
}

function Metrics() {
  const metrics = [
    { title: 'Вход и бонусная карта', points: ['время от входа до открытия QR-кода', 'доля пользователей, успешно открывших карту после входа'] },
    { title: 'Заказ готовой еды', points: ['доля начатых оформлений, завершившихся заказом', 'время и количество шагов до оформления'] },
    { title: 'Повтор оплаты', points: ['доля корзин, сохранённых после ошибки оплаты', 'доля заказов, оплаченных со второй попытки'] },
  ]
  return (
    <section className="standard-layout"><div className="slide-copy"><SectionLabel number="10">Оценка пилота</SectionLabel><h2>Как оценим результат пилота</h2><p>До начала пилота зафиксируем показатели текущего приложения. После запуска сравним результаты за сопоставимый период.</p></div><div className="metric-grid">{metrics.map((metric) => <article key={metric.title}><strong>{metric.title}</strong><ul>{metric.points.map((point) => <li key={point}>{point}</li>)}</ul></article>)}</div><div className="metric-footer"><Clock3 /> Целевые значения согласуем после анализа текущих данных.</div></section>
  )
}

function Scope() {
  const stages = ['Исследование и аналитика', 'UX/UI-дизайн', 'Разработка и интеграции', 'Публикация и обновления', 'Техническая поддержка']
  return (
    <section className="scope-layout"><div className="slide-copy"><SectionLabel number="11">Что мы берём на себя</SectionLabel><h2>Разработаем приложение и будем его поддерживать</h2><p>Мы — аккредитованная ИТ-компания из Краснодара. Можем начать с пилотной версии, а затем развивать приложение, выпускать обновления и обеспечивать техническую поддержку.</p><p className="scope-note">Сроки и стоимость определим после уточнения требований и знакомства с текущими системами.</p></div><div className="scope-process"><div className="eh-mark" aria-label="Эргохавэн">Эргохавэн</div>{stages.map((stage, index) => <div className="scope-stage" key={stage}><span>{index + 1}</span><strong>{stage}</strong></div>)}</div></section>
  )
}

function Contact() {
  return (
    <section className="contact-layout"><div className="contact-visual"><Phone src="assets/case/home.jpg" alt="Главный экран рабочего прототипа" /></div><div className="contact-copy"><SectionLabel number="12">Следующий шаг</SectionLabel><h2>Готовы показать прототип и обсудить пилот</h2><p>Можем встретиться в Краснодаре или созвониться. Покажем прототип, обсудим ваши пожелания и определим, какие сценарии войдут в пилот.</p><LinkButton href={proto('/')}>Открыть прототип</LinkButton><div className="adaptation-note"><strong>Добавим ваши сценарии</strong><span>Расскажите, что ещё важно учесть. Мы добавим эти сценарии в прототип и покажем, как они будут выглядеть и работать.</span></div><div className="contact-links"><a href="mailto:hello@eh.works">hello@eh.works <ArrowRight /></a><a href="https://t.me/andrey_ergohaven" target="_blank" rel="noreferrer">Telegram · @andrey_ergohaven <ArrowRight /></a><a href="tel:+79881540400">+7 988 154-04-00 <ArrowRight /></a></div><small className="contact-scope">ООО «ЭРГОХАВЭН» · аккредитованная ИТ-компания из Краснодара</small></div></section>
  )
}
