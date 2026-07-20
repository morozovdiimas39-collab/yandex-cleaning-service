import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';
import LandingHeader from '@/components/LandingHeader';

type SeoPageKey = 'cleaning' | 'trash' | 'excluded' | 'howToDisable';

interface SeoPageContent {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  badge: string;
  h1: string;
  lead: string;
  painTitle: string;
  painText: string;
  solutionTitle: string;
  solutionText: string;
  steps: string[];
  faq: Array<{ question: string; answer: string }>;
}

const pages: Record<SeoPageKey, SeoPageContent> = {
  cleaning: {
    title: 'Чистка площадок РСЯ — автоматическая блокировка мусорных площадок',
    description: 'DirectKit помогает автоматически чистить площадки РСЯ в Яндекс Директе: фильтры по расходу, кликам, CPA, конверсиям и исключениям. Preview перед блокировкой.',
    keywords: 'чистка площадок РСЯ, автоматическая чистка РСЯ, блокировка площадок РСЯ, площадки Яндекс Директ',
    canonical: 'https://directkit.ru/chistka-ploshchadok-rsya',
    badge: 'Автоматизация РСЯ',
    h1: 'Чистка площадок РСЯ без ручной рутины',
    lead: 'DirectKit регулярно проверяет площадки РСЯ, показывает preview перед запуском и блокирует источники, которые проходят ваши фильтры.',
    painTitle: 'Почему ручная чистка быстро превращается в проблему',
    painText: 'В РСЯ площадки меняются постоянно: сегодня источник выглядит нормально, а завтра начинает тратить бюджет без заявок. Если проверять отчеты вручную раз в неделю, мусор успевает съесть деньги.',
    solutionTitle: 'Что делает DirectKit',
    solutionText: 'Сервис собирает статистику по кампаниям, проверяет площадки по заданным правилам и добавляет плохие источники в исключения через Direct API.',
    steps: [
      'Подключаете рекламный аккаунт Яндекс Директа.',
      'Выбираете РСЯ-кампании и задаете правила чистки.',
      'Проверяете preview: что заблокируется, что останется и что уже в блоке.',
      'Сервис запускает чистку по расписанию и сохраняет историю.'
    ],
    faq: [
      {
        question: 'Можно ли чистить площадки автоматически?',
        answer: 'Да, если у аккаунта есть доступ к Direct API. DirectKit работает через API и добавляет площадки в исключения кампаний.'
      },
      {
        question: 'Как защитить площадки с конверсиями?',
        answer: 'В задаче можно выбрать цели Метрики. Площадки с выбранными конверсиями не будут блокироваться обычными правилами.'
      },
      {
        question: 'Можно ли увидеть список до запуска?',
        answer: 'Да. Перед созданием задачи есть preview с примерами площадок, которые попадут в блок, останутся или уже заблокированы.'
      }
    ]
  },
  trash: {
    title: 'Мусорные площадки РСЯ — как находить и блокировать слив бюджета',
    description: 'Что такое мусорные площадки РСЯ, почему они сливают бюджет в Яндекс Директе и как DirectKit помогает находить их по расходу, кликам и отсутствию конверсий.',
    keywords: 'мусорные площадки РСЯ, плохие площадки РСЯ, слив бюджета РСЯ, фрод площадки Яндекс Директ',
    canonical: 'https://directkit.ru/musornye-ploshchadki-rsya',
    badge: 'Контроль качества трафика',
    h1: 'Мусорные площадки РСЯ: как не отдавать им бюджет',
    lead: 'Мусорные площадки дают клики, но не дают заявок. DirectKit помогает быстрее замечать такие источники и убирать их из показов.',
    painTitle: 'Как выглядит мусор в РСЯ',
    painText: 'Расход есть, клики есть, а конверсий нет. Часто дополнительно видны слабые поведенческие сигналы, высокий CPA или подозрительные домены и мобильные приложения.',
    solutionTitle: 'Как система отделяет мусор от нормальных площадок',
    solutionText: 'Правила можно строить по расходу, кликам, CPC, CTR, CPA, конверсиям, ключевым словам в домене и списку исключений.',
    steps: [
      'Сервис получает отчет по площадкам из Директа.',
      'Сравнивает показатели с фильтрами задачи.',
      'Проверяет, не была ли площадка уже заблокирована.',
      'Блокирует только те источники, которые проходят условия.'
    ],
    faq: [
      {
        question: 'Все площадки без конверсий надо блокировать?',
        answer: 'Нет. Нужны дополнительные условия: расход, клики, CPA, исключения и защита выбранных конверсий.'
      },
      {
        question: 'Можно ли блокировать мобильные приложения?',
        answer: 'Да, если площадка корректно приходит в отчете Direct API и проходит правила задачи.'
      },
      {
        question: 'Что делать с важными площадками?',
        answer: 'Их лучше добавить в исключения. В preview такие площадки нужно проверять особенно внимательно.'
      }
    ]
  },
  excluded: {
    title: 'Запрещенные площадки Яндекс Директ — автоматическое пополнение исключений',
    description: 'Как работают запрещенные площадки в Яндекс Директе и как автоматизировать добавление площадок РСЯ в исключения через DirectKit.',
    keywords: 'запрещенные площадки Яндекс Директ, исключенные площадки РСЯ, ExcludedSites Direct API, черный список площадок',
    canonical: 'https://directkit.ru/zapreshchennye-ploshchadki-yandex-direct',
    badge: 'Исключения в Директе',
    h1: 'Запрещенные площадки Яндекс Директ: как вести список без хаоса',
    lead: 'DirectKit помогает пополнять список запрещенных площадок по правилам, не забывая проверять уже заблокированные источники.',
    painTitle: 'Почему список исключений сложно вести руками',
    painText: 'В нескольких кампаниях быстро появляются разные списки, часть площадок уже заблокирована, часть повторяется, а новые источники продолжают тратить бюджет.',
    solutionTitle: 'Что автоматизируется',
    solutionText: 'Сервис проверяет текущие ExcludedSites, не дублирует уже заблокированные площадки и показывает результат по каждому запуску.',
    steps: [
      'Задача получает список кампаний для отслеживания.',
      'Worker собирает площадки и текущие исключения кампании.',
      'Алгоритм оставляет только новые площадки для блокировки.',
      'История блокировок сохраняется для админки и контроля.'
    ],
    faq: [
      {
        question: 'DirectKit дублирует площадки в исключениях?',
        answer: 'Нет. Перед блокировкой система проверяет, есть ли площадка уже в ExcludedSites кампании.'
      },
      {
        question: 'Есть ли ограничение на количество запрещенных площадок?',
        answer: 'Да, ограничения зависят от возможностей Директа. Поэтому важно блокировать не все подряд, а только площадки, которые реально проходят фильтры.'
      },
      {
        question: 'Можно ли посмотреть историю?',
        answer: 'Да. В админке и логах сохраняются запуски, ошибки и примеры обработанных площадок.'
      }
    ]
  },
  howToDisable: {
    title: 'Как отключить площадки РСЯ — ручной способ и автоматизация',
    description: 'Разбираем, как отключать площадки РСЯ в Яндекс Директе вручную и когда удобнее использовать автоматическую чистку DirectKit.',
    keywords: 'как отключить площадки РСЯ, отключение площадок Яндекс Директ, убрать площадки РСЯ, исключить площадки РСЯ',
    canonical: 'https://directkit.ru/kak-otklyuchit-ploshchadki-rsya',
    badge: 'Практика Яндекс Директа',
    h1: 'Как отключить площадки РСЯ и не потерять рабочий трафик',
    lead: 'Отключать площадки можно вручную в Директе, но при регулярной работе с проектами удобнее автоматизировать проверку и блокировки.',
    painTitle: 'Главный риск ручного отключения',
    painText: 'Если блокировать площадки слишком широко, можно убрать не только мусор, но и источники с заявками. Особенно опасны правила без учета конверсий и исключений.',
    solutionTitle: 'Как делать аккуратнее',
    solutionText: 'Сначала строится preview, затем проверяются конверсии, уже заблокированные площадки и исключения. Только после этого площадки отправляются в блок.',
    steps: [
      'Соберите статистику по площадкам.',
      'Отфильтруйте источники по расходу, кликам и конверсиям.',
      'Проверьте исключения и важные площадки.',
      'Добавьте плохие площадки в запрещенные или запустите автоматическую задачу.'
    ],
    faq: [
      {
        question: 'Можно ли отключать площадки только по домену?',
        answer: 'Можно, но лучше использовать точные правила и исключения. Например, фильтр по слову может задеть полезные источники.'
      },
      {
        question: 'Что лучше: ручная чистка или автоматическая?',
        answer: 'Для одного маленького проекта подойдет ручная проверка. Для регулярной работы с клиентами удобнее автоматическая чистка по расписанию.'
      },
      {
        question: 'Можно ли пропускать площадки с конверсиями?',
        answer: 'Да. В DirectKit можно выбрать цели, которые будут защищать площадки от блокировки.'
      }
    ]
  }
};

const relatedLinks = [
  { href: '/chistka-ploshchadok-rsya', label: 'Чистка площадок РСЯ' },
  { href: '/musornye-ploshchadki-rsya', label: 'Мусорные площадки РСЯ' },
  { href: '/zapreshchennye-ploshchadki-yandex-direct', label: 'Запрещенные площадки' },
  { href: '/kak-otklyuchit-ploshchadki-rsya', label: 'Как отключить площадки РСЯ' }
];

export default function RSYASeoPage({ page }: { page: SeoPageKey }) {
  const navigate = useNavigate();
  const content = pages[page];

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <SEOHead
        title={content.title}
        description={content.description}
        keywords={content.keywords}
        canonical={content.canonical}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: content.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer
            }
          }))
        }}
      />

      <LandingHeader />

      <main>
        <section className="border-b border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#f0fbf6_55%,#e9f8f6_100%)]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm">
                <Icon name="ShieldCheck" className="h-4 w-4" />
                {content.badge}
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                {content.h1}
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
                {content.lead}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => navigate('/auth?mode=register')}
                  className="h-12 rounded-xl bg-emerald-600 px-6 text-base font-black text-white hover:bg-emerald-700"
                >
                  Зарегистрироваться
                  <Icon name="ArrowRight" className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="h-12 rounded-xl border-slate-200 px-6 text-base font-bold"
                >
                  Посмотреть сервис
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-2xl shadow-emerald-900/10">
              <div className="rounded-2xl bg-slate-950 p-5 text-white">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-300">Preview чистки</p>
                    <p className="text-xs text-slate-400">Перед блокировкой в Direct API</p>
                  </div>
                  <Icon name="Shield" className="h-6 w-6 text-emerald-300" />
                </div>
                <div className="space-y-3">
                  {[
                    ['mobile-game-news.ru', 'Блок', 'Расход 940 ₽, конверсий 0', 'bg-red-500/15 text-red-200'],
                    ['weather-fast.online', 'Блок', 'Отказы 88%, время 4 сек', 'bg-red-500/15 text-red-200'],
                    ['market.yandex.ru', 'Оставить', 'Есть конверсии, важная площадка', 'bg-emerald-500/15 text-emerald-200']
                  ].map(([domain, status, reason, className]) => (
                    <div key={domain} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-black">{domain}</p>
                          <p className="mt-1 text-sm text-slate-400">{reason}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-sm font-black ${className}`}>{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-red-100 bg-red-50/40 shadow-sm">
              <CardContent className="p-7">
                <Icon name="AlertTriangle" className="mb-5 h-9 w-9 text-red-500" />
                <h2 className="text-2xl font-black text-slate-950">{content.painTitle}</h2>
                <p className="mt-4 text-base font-medium leading-7 text-slate-600">{content.painText}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-emerald-100 bg-emerald-50/50 shadow-sm">
              <CardContent className="p-7">
                <Icon name="CheckCircle2" className="mb-5 h-9 w-9 text-emerald-600" />
                <h2 className="text-2xl font-black text-slate-950">{content.solutionTitle}</h2>
                <p className="mt-4 text-base font-medium leading-7 text-slate-600">{content.solutionText}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-3xl font-black text-slate-950">Как это работает</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {content.steps.map((step, index) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700">
                    {index + 1}
                  </span>
                  <p className="mt-4 text-sm font-bold leading-6 text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_1fr]">
            <div>
              <h2 className="text-3xl font-black text-slate-950">Вопросы по теме</h2>
              <p className="mt-4 text-base font-medium leading-7 text-slate-600">
                Страница сделана для специалистов, которые уже работают с РСЯ и хотят меньше ручной рутины без риска заблокировать полезные источники.
              </p>
            </div>
            <div className="space-y-4">
              {content.faq.map((item) => (
                <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black text-slate-950">
                    {item.question}
                    <Icon name="ChevronDown" className="h-5 w-5 text-slate-400 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 text-base font-medium leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-14 text-white sm:py-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-black">Запустите чистку РСЯ в DirectKit</h2>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-300">
                7 дней пробного периода, один проект бесплатно. Дальше можно подключать проекты по 250 ₽ за проект.
              </p>
            </div>
            <Button
              onClick={() => navigate('/auth?mode=register')}
              className="h-12 rounded-xl bg-emerald-600 px-6 text-base font-black text-white hover:bg-emerald-700"
            >
              Зарегистрироваться
            </Button>
          </div>
        </section>

        <section className="border-t border-slate-100 bg-white py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Еще по теме</p>
            <div className="flex flex-wrap gap-3">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
