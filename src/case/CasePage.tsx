import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CakeSlice, Check, Clock3, MapPin, PackageCheck, RefreshCw, SignalLow, Smartphone, Store, WalletCards } from 'lucide-react'

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
  return <figure className={`phone-shot ${tone}`}><span /><img src={resolved} alt={alt} /></figure>
}

function Cover() {
  return (
    <section className="cover-layout">
      <div className="cover-copy"><SectionLabel number="01">Инициативная концепция</SectionLabel><h1>Готовая еда,<br />карта и торт —<br /><em>без лишнего круга</em></h1><p>Рабочий прототип приложения «Патрик & Мари»: место и способ получения проверяются до корзины, повтор сохраняет контроль, а ошибка оплаты не обнуляет заказ.</p><div className="button-row"><LinkButton href={proto('/')}>Открыть прототип</LinkButton><LinkButton href="#slide-5" secondary>Смотреть сценарии</LinkButton></div><small className="disclaimer">Инициативная концепция ООО «ЭРГОХАВЭН» на основе открытых данных. Не является официальным продуктом компании.</small></div>
      <div className="cover-visual"><div className="orange-orbit" /><Phone src="assets/case/home.jpg" alt="Главный экран концепции" /><div className="float-chip card-chip"><WalletCards /> Карта сразу</div><div className="float-chip pickup-chip"><Store /> Точка до меню</div></div>
    </section>
  )
}

function Studied() {
  return (
    <section className="standard-layout"><div className="slide-copy"><SectionLabel number="02">Что изучено</SectionLabel><h2>Меню, точки<br />и сервисы заказа.</h2><p>Проверили актуальные публичные сервисы на 11 августа 2026 года и отделили подтверждённые возможности от продуктовых гипотез.</p></div><div className="study-grid"><article><strong>21</strong><span>адрес на официальной странице кулинарий, включая Краснодар и ст. Динскую</span></article><article><PackageCheck /><strong>Доставка и заказы</strong><span>официальный сайт и страницы приложения подтверждают сценарий заказа</span></article><article><WalletCards /><strong>Лояльность</strong><span>официально заявлена виртуальная карта; детали правил требуют внутренних данных</span></article><article><CakeSlice /><strong>Торты на заказ</strong><span>отдельное направление на официальном сайте и в описании приложения</span></article><article className="wide"><Smartphone /><div><strong>App Store, Google Play и RuStore</strong><span>страницы приложения, актуальные версии и 40 отзывов RuStore просмотрены; единичные отзывы используются только как основания для гипотез.</span></div></article></div><div className="source-line">Источники и даты проверки — в <a href="https://github.com/fqkd/patrick-mary-concept/blob/main/SOURCES.md" target="_blank" rel="noreferrer">SOURCES.md</a></div></section>
  )
}

function Friction() {
  return (
    <section className="standard-layout"><div className="slide-copy"><SectionLabel number="03">Проверяемые точки роста</SectionLabel><h2>Три момента,<br />где важен контекст</h2><p>Это не диагноз действующему продукту. Это гипотезы для сравнения по аналитике и пользовательским тестам.</p></div><div className="friction-flow"><article><span>01</span><div><strong>До корзины</strong><p>Если способ получения и точка неизвестны, доступность и время могут уточняться слишком поздно.</p></div><MapPin /></article><article><span>02</span><div><strong>У кассы</strong><p>По отдельным свежим отзывам, повторный вход и загрузка карты при нестабильной сети создают дополнительные действия.</p></div><SignalLow /></article><article><span>03</span><div><strong>После ошибки</strong><p>Сохранённые позиции, адрес и время дают понятный путь к повторной оплате без сбора заказа заново.</p></div><RefreshCw /></article></div><div className="hypothesis-note">Гипотезы требуют проверки на событиях действующего приложения и в модерируемых тестах.</div></section>
  )
}

function Idea() {
  return (
    <section className="idea-layout"><div className="slide-copy"><SectionLabel number="04">Основная идея</SectionLabel><h2>Приложение отвечает<br />на три вопроса</h2><p>Главный экран начинает с регулярной задачи: формат получения, точка и доступная для неё витрина.</p><LinkButton href={proto('/mode')}>Проверить первый шаг</LinkButton></div><div className="question-stack"><article><span>Где и когда?</span><strong>Доставка или конкретная кулинария — до наполнения корзины.</strong><PackageCheck /></article><article><span>Что доступно?</span><strong>Меню и интервалы для выбранной точки.</strong><Store /></article><article><span>Как повторить?</span><strong>Прошлый заказ проходит новую проверку цены и наличия.</strong><RefreshCw /></article></div></section>
  )
}

function OrderScenario() {
  return (
    <section className="scenario-layout"><div className="slide-copy"><SectionLabel number="05">Ключевой сценарий № 1</SectionLabel><h2>Корзина переживает<br />ошибку оплаты</h2><p>Формат получения → точка → доступный каталог → позиция → корзина → время → оплата → ошибка → повтор без потери контекста.</p><div className="flow-tags"><span>Точка</span><i /><span>Корзина</span><i /><span>Время</span><i /><span>Восстановление</span></div><LinkButton href={proto('/payment-error')}>Открыть восстановление</LinkButton></div><div className="phones-trio"><Phone src="assets/case/catalog.jpg" alt="Каталог выбранной точки" /><Phone src="assets/case/cart.jpg" alt="Сохранённая корзина" tone="front" /><Phone src="assets/case/payment-error.jpg" alt="Ошибка оплаты и восстановление" /></div></section>
  )
}

function LoyaltyScenario() {
  return (
    <section className="scenario-layout reverse"><div className="phones-pair"><Phone src="assets/case/login.jpg" alt="Вход по коду" /><Phone src="assets/case/loyalty.jpg" alt="Сохранённая карта лояльности" tone="front" /></div><div className="slide-copy"><SectionLabel number="06">Ключевой сценарий № 2</SectionLabel><h2>Карта открывается<br />раньше контента</h2><p>Вход по одноразовому коду не требует постоянного пароля. Сохранённый код карты показывается сразу, даже если новости и предложения ещё обновляются.</p><ul className="check-list"><li><Check /> код из СМС вместо постоянного пароля</li><li><Check /> карта не ждёт загрузки главной</li><li><Check /> офлайн-состояние явно объяснено</li></ul><LinkButton href={proto('/loyalty')}>Открыть карту</LinkButton></div></section>
  )
}

function CakeScenario() {
  return (
    <section className="scenario-layout"><div className="slide-copy"><SectionLabel number="07">Ключевой сценарий № 3</SectionLabel><h2>Торт — отдельный<br />законченный путь</h2><p>Не промо-карточка: пользователь выбирает размер, настроение оформления, точку и дату, затем проверяет детали перед безопасным демо-подтверждением.</p><div className="cake-steps"><span>1<small>Гости</small></span><span>2<small>Оформление</small></span><span>3<small>Получение</small></span></div><LinkButton href={proto('/cake')}>Собрать демо-торт</LinkButton></div><div className="cake-showcase"><Phone src="assets/case/cake.jpg" alt="Сценарий заказа торта" /><div className="cake-card"><CakeSlice /><span>Параметры сохраняются между шагами</span></div></div></section>
  )
}

function BusinessFit() {
  return (
    <section className="standard-layout fit-slide"><div className="slide-copy"><SectionLabel number="08">Связь с бизнесом</SectionLabel><h2>Один интерфейс<br />для разных частот</h2><p>Регулярная готовая еда и редкий торт не конкурируют на одном экране — у каждого сценария свой темп.</p></div><div className="fit-grid"><article className="daily"><span>Каждый день</span><h3>Быстрая готовая еда</h3><p>Место → доступность → корзина → время.</p><div className="mini-path"><PackageCheck /><ArrowRight /><Store /><ArrowRight /><Clock3 /></div></article><article className="habit"><span>Регулярно</span><h3>Карта и повтор</h3><p>Карта доступна сразу; прошлый заказ проверяется перед добавлением.</p><div className="mini-path"><WalletCards /><ArrowRight /><RefreshCw /></div></article><article className="event"><span>К событию</span><h3>Заказ торта</h3><p>Размер, оформление, дата и точка в отдельной последовательности.</p><div className="mini-path"><CakeSlice /><ArrowRight /><Check /></div></article></div></section>
  )
}

function Pilot() {
  return (
    <section className="pilot-layout"><div className="slide-copy"><SectionLabel number="09">Предлагаемый пилот</SectionLabel><h2>Сначала три пути,<br />которые можно измерить</h2><p>Объём и интеграции определяются после проверки действующих систем. Концепция не предполагает заранее наличие конкретного API.</p></div><div className="pilot-timeline"><article><b>01</b><div><strong>Карта и вход</strong><span>Проверить скорость доступа и долю успешных открытий у кассы.</span></div></article><article><b>02</b><div><strong>Заказ готовой еды</strong><span>Сравнить путь с выбором точки до корзины.</span></div></article><article><b>03</b><div><strong>Ошибка и повтор</strong><span>Проверить долю восстановленных корзин и завершённых повторных заказов.</span></div></article><article className="pilot-result"><Check /><div><strong>Решение по следующему этапу</strong><span>На основании сравнимых данных пилота; целевые проценты заранее не задаются.</span></div></article></div></section>
  )
}

function Metrics() {
  const metrics = ['Конверсия из начатого оформления в подтверждение', 'Время и количество шагов основного сценария', 'Частота ошибок и доля восстановленных корзин', 'Доля успешно завершённых повторных заказов', 'Использование самовывоза и карты лояльности', 'Завершение отдельного сценария заказа торта']
  return (
    <section className="standard-layout"><div className="slide-copy"><SectionLabel number="10">Что сравнивать</SectionLabel><h2>Метрики пилота<br />без выдуманных целей</h2><p>Базовое значение фиксируется на действующем сценарии. После пилота сравнивается тот же показатель и одинаковый сегмент.</p></div><div className="metric-grid">{metrics.map((metric, index) => <article key={metric}><span>{String(index + 1).padStart(2, '0')}</span><strong>{metric}</strong></article>)}</div><div className="metric-footer"><Clock3 /> Целевые проценты определяются только после доступа к текущей аналитике.</div></section>
  )
}

function Scope() {
  return (
    <section className="scope-layout"><div className="slide-copy"><SectionLabel number="11">Что берём на себя</SectionLabel><h2>От продуктовой проверки<br />до поддержки</h2><p>ООО «ЭРГОХАВЭН» — аккредитованная ИТ-компания из Краснодара. Можно начать с пилота по нескольким приоритетным сценариям.</p></div><div className="scope-wheel"><div className="scope-core">ЭРГО<br />ХАВЭН</div><span className="s1">Продуктовая<br />аналитика</span><span className="s2">UX/UI-<br />дизайн</span><span className="s3">Разработка<br />и интеграции</span><span className="s4">Публикация<br />и обновления</span><span className="s5">Техническая<br />поддержка</span></div><div className="scope-note">Сроки, стоимость и состав интеграций определяются после технического обследования.</div></section>
  )
}

function Contact() {
  return (
    <section className="contact-layout"><div className="contact-orbit"><Smartphone /><span>Рабочий прототип<br />уже можно пройти</span></div><div className="contact-copy"><SectionLabel number="12">Следующий шаг</SectionLabel><h2>Покажем прототип<br /><em>лично в Краснодаре</em></h2><p>Предлагаем начать с пилота по карте, заказу готовой еды и восстановлению корзины: вместе пройдём сценарии и определим данные для сравнения.</p><div className="contact-links"><a href="mailto:hello@eh.works">hello@eh.works <ArrowRight /></a><a href="https://eh.works" target="_blank" rel="noreferrer">eh.works <ArrowRight /></a><a href="https://t.me/andrey_ergohaven" target="_blank" rel="noreferrer">Telegram · @andrey_ergohaven <ArrowRight /></a><a href="https://max.ru/id5041212966_biz" target="_blank" rel="noreferrer">MAX · +7 988 154-04-00 <ArrowRight /></a></div><LinkButton href={proto('/')}>Открыть прототип</LinkButton><small className="contact-scope">ООО «ЭРГОХАВЭН» · аккредитованная ИТ-компания из Краснодара<br />Продуктовая аналитика · UX/UI-дизайн · разработка · интеграции · публикация · обновления · техническая поддержка<br />Готовы лично приехать и показать прототип.</small></div></section>
  )
}
