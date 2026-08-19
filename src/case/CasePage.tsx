import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CakeSlice, Check, Clock3, Heart, MapPin, PackageCheck, RefreshCw, Smartphone, Store, WalletCards } from 'lucide-react'

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
      <div className="cover-copy"><SectionLabel number="01">Инициативная концепция</SectionLabel><h1>Готовая еда,<br />бонусы и торт —<br /><em>в одном приложении</em></h1><p>Рабочий прототип приложения «Патрик & Мари». Пользователь выбирает доставку или самовывоз, собирает заказ, открывает карту лояльности и оставляет заявку на торт.</p><div className="button-row"><LinkButton href={proto('/')}>Открыть прототип</LinkButton><LinkButton href="#slide-5" secondary>Посмотреть сценарии</LinkButton></div><small className="disclaimer">Инициативная концепция ООО «ЭРГОХАВЭН» на основе открытых данных. Не является официальным продуктом компании.</small></div>
      <div className="cover-visual"><div className="orange-orbit" /><Phone src="assets/case/home.jpg" alt="Главный экран с выбором доставки и самовывоза" /><div className="float-chip card-chip"><WalletCards /> Бонусы после входа</div><div className="float-chip pickup-chip"><Store /> Кулинария до меню</div></div>
    </section>
  )
}

function Studied() {
  return (
    <section className="standard-layout"><div className="slide-copy"><SectionLabel number="02">Что изучено</SectionLabel><h2>Меню, кулинарии<br />и способы заказа</h2><p>Публичные данные проверены 13 августа 2026 года. Подтверждённые возможности отделены от гипотез концепции.</p></div><div className="study-grid"><article><strong>21</strong><span>адрес на официальной странице кулинарий, включая Краснодар и ст. Динскую</span></article><article><PackageCheck /><strong>Доставка и заказы</strong><span>заказ готовой еды доступен на официальном сайте и заявлен в приложении</span></article><article><WalletCards /><strong>Карта лояльности</strong><span>виртуальная карта заявлена официально; для точных правил нужны внутренние данные</span></article><article><CakeSlice /><strong>Торты на заказ</strong><span>на официальном сайте и в описании приложения это отдельное направление</span></article><article className="wide"><Smartphone /><div><strong>App Store, Google Play и RuStore</strong><span>Проверены страницы приложения, опубликованные версии и 40 отзывов в RuStore. Отдельные отзывы использованы только для формулировки гипотез.</span></div></article></div><div className="source-line">Источники и даты проверки — в <a href="https://github.com/fqkd/patrick-mary-concept/blob/main/SOURCES.md" target="_blank" rel="noreferrer">SOURCES.md</a></div></section>
  )
}

function Friction() {
  return (
    <section className="standard-layout"><div className="slide-copy"><SectionLabel number="03">Гипотезы для проверки</SectionLabel><h2>Три шага,<br />где нужна ясность</h2><p>Это не оценка действующего продукта. Гипотезы нужно проверить по аналитике и на пользовательских тестах.</p></div><div className="friction-flow"><article><span>01</span><div><strong>До корзины</strong><p>Способ получения и место лучше выбрать заранее, чтобы сразу показать доступные товары и время.</p></div><MapPin /></article><article><span>02</span><div><strong>У кассы</strong><p>В отдельных отзывах пользователи упоминают повторный вход и проблемы с загрузкой карты при нестабильной сети.</p></div><Smartphone /></article><article><span>03</span><div><strong>После ошибки оплаты</strong><p>Если корзина и данные получения сохранены, пользователь может сразу попробовать оплатить ещё раз.</p></div><RefreshCw /></article></div><div className="hypothesis-note">Для проверки нужны события действующего приложения и модерируемые тесты.</div></section>
  )
}

function Idea() {
  return (
    <section className="idea-layout"><div className="slide-copy"><SectionLabel number="04">Основная идея</SectionLabel><h2>Три вопроса<br />до оформления</h2><p>Перед открытием меню пользователь выбирает способ и место получения заказа.</p><LinkButton href={proto('/mode')}>Выбрать получение</LinkButton></div><div className="question-stack"><article><span>Как получить?</span><strong>Доставка по адресу или самовывоз из выбранной кулинарии.</strong><PackageCheck /></article><article><span>Что можно заказать?</span><strong>Товары и время для выбранного места получения.</strong><Store /></article><article><span>Как заказать снова?</span><strong>Сначала проверить текущие цены и наличие товаров.</strong><RefreshCw /></article></div></section>
  )
}

function OrderScenario() {
  return (
    <section className="scenario-layout"><div className="slide-copy"><SectionLabel number="05">Сценарий № 1</SectionLabel><h2>После ошибки заказ<br />не нужно собирать заново</h2><p>Пользователь выбирает место получения, товары и время. Если оплата не проходит, корзина и данные получения остаются сохранены.</p><div className="flow-tags"><span>Место</span><i /><span>Корзина</span><i /><span>Время</span><i /><span>Повтор оплаты</span></div><LinkButton href={proto('/payment-error')}>Открыть ошибку оплаты</LinkButton></div><div className="phones-trio"><Phone src="assets/case/catalog.jpg" alt="Каталог для выбранной кулинарии" /><Phone src="assets/case/cart.jpg" alt="Корзина и переход к выбору времени" tone="front" /><Phone src="assets/case/payment-error.jpg" alt="Ошибка оплаты с сохранённой корзиной" /></div></section>
  )
}

function LoyaltyScenario() {
  return (
    <section className="scenario-layout reverse"><div className="phones-pair"><Phone src="assets/case/login.jpg" alt="Экран ввода кода из СМС" /><Phone src="assets/case/loyalty.jpg" alt="Виртуальная карта с балансом и QR-кодом" tone="front" /></div><div className="slide-copy"><SectionLabel number="06">Сценарий № 2</SectionLabel><h2>Карта лояльности<br />доступна после входа</h2><p>До входа баланс и QR-код скрыты. После подтверждения номера пользователь может открыть виртуальную карту.</p><ul className="check-list"><li><Check /> вход по коду из СМС</li><li><Check /> баланс и QR-код доступны только пользователю</li><li><Check /> ссылка ведёт на официальные правила программы</li></ul><LinkButton href={proto('/loyalty')}>Открыть карту</LinkButton></div></section>
  )
}

function CakeScenario() {
  return (
    <section className="scenario-layout"><div className="slide-copy"><SectionLabel number="07">Сценарий № 3</SectionLabel><h2>Торт<br />на заказ</h2><p>Пользователь указывает повод, количество гостей, оформление, дату и телефон. Затем проверяет и сохраняет заявку.</p><div className="cake-steps"><span>1<small>Повод</small></span><span>2<small>Гости</small></span><span>3<small>Оформление</small></span><span>4<small>Дата</small></span><span>5<small>Проверка</small></span></div><LinkButton href={proto('/cake?step=occasion')}>Оставить заявку</LinkButton></div><div className="cake-showcase"><Phone src="assets/case/cake.jpg" alt="Выбор оформления торта на заказ" /><div className="cake-card"><CakeSlice /><span>После заявки сотрудник уточнит детали и стоимость</span></div></div></section>
  )
}

function BusinessFit() {
  return (
    <section className="standard-layout fit-slide"><div className="slide-copy"><SectionLabel number="08">Сценарии покупки</SectionLabel><h2>Для обычного заказа<br />и особого события</h2><p>Заказ готовой еды, повтор покупки и заявка на торт начинаются с разных действий и не мешают друг другу.</p></div><div className="fit-grid"><article className="daily"><span>Каждый день</span><h3>Готовая еда</h3><p>Место → категория → корзина → время.</p><div className="mini-path"><PackageCheck /><ArrowRight /><Store /><ArrowRight /><Clock3 /></div></article><article className="habit"><span>Снова</span><h3>Избранное и повтор</h3><p>Товары можно сохранить, а прошлый заказ — проверить и повторить.</p><div className="mini-path"><Heart /><ArrowRight /><RefreshCw /></div></article><article className="event"><span>К событию</span><h3>Торт на заказ</h3><p>Заявка сохраняет повод, оформление, дату и телефон.</p><div className="mini-path"><CakeSlice /><ArrowRight /><Check /></div></article></div></section>
  )
}

function Pilot() {
  return (
    <section className="pilot-layout"><div className="slide-copy"><SectionLabel number="09">Предлагаемый пилот</SectionLabel><h2>Три сценария<br />для первого запуска</h2><p>Состав пилота и интеграций можно определить после проверки действующих систем. Концепция не предполагает наличие конкретного API.</p></div><div className="pilot-timeline"><article><b>01</b><div><strong>Вход и карта лояльности</strong><span>Измерить время до открытия карты и долю успешных открытий у кассы.</span></div></article><article><b>02</b><div><strong>Заказ готовой еды</strong><span>Сравнить сценарий с выбором места получения до корзины.</span></div></article><article><b>03</b><div><strong>Ошибка оплаты</strong><span>Измерить, сколько пользователей сохраняют корзину и завершают оплату со второй попытки.</span></div></article><article className="pilot-result"><Check /><div><strong>Решение о следующем этапе</strong><span>Принимается по результатам пилота. Целевые значения заранее не задаются.</span></div></article></div></section>
  )
}

function Metrics() {
  const metrics = ['Конверсия из оформления в принятый заказ', 'Время и количество шагов до заказа', 'Частота ошибок оплаты и доля сохранённых корзин', 'Доля завершённых повторных заказов', 'Использование самовывоза и карты лояльности', 'Доля сохранённых заявок на торт на заказ']
  return (
    <section className="standard-layout"><div className="slide-copy"><SectionLabel number="10">Показатели пилота</SectionLabel><h2>Что сравнить<br />до и после запуска</h2><p>Сначала фиксируется показатель действующего сценария. После пилота тот же показатель сравнивается на сопоставимом сегменте.</p></div><div className="metric-grid">{metrics.map((metric, index) => <article key={metric}><span>{String(index + 1).padStart(2, '0')}</span><strong>{metric}</strong></article>)}</div><div className="metric-footer"><Clock3 /> Целевые значения можно определить после доступа к текущей аналитике.</div></section>
  )
}

function Scope() {
  return (
    <section className="scope-layout"><div className="slide-copy"><SectionLabel number="11">Что берём на себя</SectionLabel><h2>Пилот, разработка<br />и дальнейшая поддержка</h2><p>ООО «ЭРГОХАВЭН» — аккредитованная ИТ-компания из Краснодара. Можем начать с пилота по приоритетным сценариям.</p></div><div className="scope-wheel"><div className="scope-core">ЭРГО<br />ХАВЭН</div><span className="s1">Продуктовая<br />аналитика</span><span className="s2">UX/UI-<br />дизайн</span><span className="s3">Разработка<br />и интеграции</span><span className="s4">Публикация<br />и обновления</span><span className="s5">Техническая<br />поддержка</span></div><div className="scope-note">Сроки, стоимость и состав интеграций определяются после технического обследования.</div></section>
  )
}

function Contact() {
  return (
    <section className="contact-layout"><div className="contact-orbit"><Smartphone /><span>Рабочий прототип<br />готов к просмотру</span></div><div className="contact-copy"><SectionLabel number="12">Следующий шаг</SectionLabel><h2>Пройдём прототип<br /><em>вместе в Краснодаре</em></h2><p>Покажем сценарии входа, заказа готовой еды и повторной оплаты. Затем определим состав пилота и данные для сравнения.</p><div className="adaptation-note"><strong>Прототип можно адаптировать</strong><span>Сейчас в прототипе показан один из вариантов приложения. Расскажите, что ещё важно учесть, — мы добавим это в прототип и покажем, как оно будет выглядеть и работать.</span></div><div className="contact-links"><a href="mailto:hello@eh.works">hello@eh.works <ArrowRight /></a><a href="https://eh.works" target="_blank" rel="noreferrer">eh.works <ArrowRight /></a><a href="https://t.me/andrey_ergohaven" target="_blank" rel="noreferrer">Telegram · @andrey_ergohaven <ArrowRight /></a><a href="https://max.ru/id5041212966_biz" target="_blank" rel="noreferrer">MAX · +7 988 154-04-00 <ArrowRight /></a></div><LinkButton href={proto('/')}>Открыть прототип</LinkButton><small className="contact-scope">ООО «ЭРГОХАВЭН» · аккредитованная ИТ-компания из Краснодара<br />Продуктовая аналитика · UX/UI-дизайн · разработка · интеграции · публикация · обновления · техническая поддержка<br />Готовы приехать и показать прототип лично.</small></div></section>
  )
}
