import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';

export default function RSYACleaningPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="Чистка РСЯ Площадок | Автоматическая Блокировка Неэффективных Сайтов"
        description="Автоматическая чистка площадок РСЯ (Рекламная Сеть Яндекса). Мониторинг и блокировка мусорных площадок. Аналитика эффективности сайтов РСЯ. Excluded sites автоматизация. Снижение CPA и повышение ROI рекламы в сетях."
        keywords="чистка рся, блокировка площадок рся, excluded sites яндекс, мусорные площадки рся, оптимизация рся, неэффективные площадки"
        canonical="https://directkit.ru/rsya-cleaning"
      />

      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
              <Icon name="Zap" size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              DirectKit
            </span>
          </div>
          <Button onClick={() => navigate('/auth')} className="bg-emerald-600 hover:bg-emerald-700">
            Начать чистку РСЯ
          </Button>
        </div>
      </header>

      <section className="bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">Автоматическая Чистка Площадок РСЯ</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Мониторинг и блокировка неэффективных площадок Рекламной Сети Яндекса. Анализ статистики, определение мусорных сайтов и автоматическое добавление в Excluded Sites. Снизьте CPA на 40% и повысьте ROI рекламы в РСЯ.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Что такое РСЯ и зачем чистить площадки</h2>
          <p className="text-xl text-center text-slate-600 mb-12 max-w-4xl mx-auto">
            РСЯ (Рекламная Сеть Яндекса) — это тысячи сайтов-партнёров, где показывается ваша реклама. Но не все площадки качественные — многие сливают бюджет на ботов и случайные клики.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-2xl border-2 border-red-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="AlertTriangle" size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-red-700">Без чистки РСЯ</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <Icon name="XCircle" size={16} className="text-red-500 flex-shrink-0 mt-1" />
                      <span>40-60% бюджета уходит на мусорные площадки</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="XCircle" size={16} className="text-red-500 flex-shrink-0 mt-1" />
                      <span>Боты и фрод-трафик съедают бюджет</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="XCircle" size={16} className="text-red-500 flex-shrink-0 mt-1" />
                      <span>Высокий CPA и низкая конверсия</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="XCircle" size={16} className="text-red-500 flex-shrink-0 mt-1" />
                      <span>ROI рекламы в РСЯ — отрицательный</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border-2 border-green-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="CheckCircle2" size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-green-700">С чисткой РСЯ</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <Icon name="Check" size={16} className="text-green-500 flex-shrink-0 mt-1" />
                      <span>Трафик идёт только с качественных площадок</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="Check" size={16} className="text-green-500 flex-shrink-0 mt-1" />
                      <span>CPA снижается на 30-50%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="Check" size={16} className="text-green-500 flex-shrink-0 mt-1" />
                      <span>Конверсия растёт в 2-3 раза</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="Check" size={16} className="text-green-500 flex-shrink-0 mt-1" />
                      <span>ROI становится положительным</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 p-8 rounded-2xl text-white">
            <h3 className="text-3xl font-bold mb-4 text-center">Статистика чистки РСЯ</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-5xl font-bold mb-2">40%</div>
                <p className="text-lg opacity-90">Экономия бюджета после блокировки мусорных площадок</p>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">2.5x</div>
                <p className="text-lg opacity-90">Рост конверсии при работе только с качественными сайтами</p>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">300+</div>
                <p className="text-lg opacity-90">Средняя площадок в чёрном списке после месяца оптимизации</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Как работает автоматическая чистка РСЯ</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-cyan-100">
              <CardHeader>
                <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="BarChart3" size={28} className="text-cyan-600" />
                </div>
                <CardTitle className="text-2xl mb-3">1. Мониторинг площадок</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Система ежедневно анализирует статистику по всем площадкам РСЯ: конверсии, показы, клики, отказы, время на сайте и другие метрики качества трафика.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-teal-100">
              <CardHeader>
                <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="AlertCircle" size={28} className="text-teal-600" />
                </div>
                <CardTitle className="text-2xl mb-3">2. Определение мусора</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Алгоритм выявляет неэффективные площадки по триггерам: нет конверсий, высокий отказ, подозрительно дешёвые клики, ботовый трафик, фрод-паттерны.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-emerald-100">
              <CardHeader>
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Ban" size={28} className="text-emerald-600" />
                </div>
                <CardTitle className="text-2xl mb-3">3. Блокировка сайтов</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Автоматическое добавление мусорных площадок в Excluded Sites через API Яндекс.Директ. Реклама перестаёт показываться на заблокированных сайтах.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Признаки мусорных площадок РСЯ</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="TrendingDown" size={24} className="text-red-600" />
                </div>
                <CardTitle className="text-xl">Нулевая конверсия</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Площадка получила 50+ кликов, но не принесла ни одной конверсии. Трафик либо ботовый, либо совсем нецелевой. Немедленная блокировка.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="MousePointerClick" size={24} className="text-orange-600" />
                </div>
                <CardTitle className="text-xl">Высокий отказ</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Bounce rate выше 90% — пользователи моментально уходят с лендинга. Признак случайных кликов или кликбейтных площадок с вводящими в заблуждение креативами.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Clock" size={24} className="text-yellow-600" />
                </div>
                <CardTitle className="text-xl">Низкое время на сайте</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Среднее время на сайте меньше 5-10 секунд. Пользователи не читают контент и не изучают предложение — значит трафик некачественный или фродовый.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="DollarSign" size={24} className="text-purple-600" />
                </div>
                <CardTitle className="text-xl">Подозрительно дешёвые клики</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  CPC в 5-10 раз ниже среднего по кампании. Такие площадки часто используют фрод-схемы и генерируют ботовый трафик для получения выплат от Яндекса.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Activity" size={24} className="text-blue-600" />
                </div>
                <CardTitle className="text-xl">Странные паттерны кликов</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Все клики приходят в одно и то же время суток, с одинаковым интервалом или из одного города. Явный признак ботовой активности — блокировать немедленно.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="ShieldAlert" size={24} className="text-pink-600" />
                </div>
                <CardTitle className="text-xl">Известные мусорные площадки</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Площадки из чёрных списков сообщества: сайты-однодневки, пиратский контент, спам-ресурсы, сомнительные рекламные сети. DirectKit знает тысячи таких сайтов.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Возможности инструмента чистки РСЯ</h2>
          <p className="text-xl text-center text-slate-600 mb-12 max-w-3xl mx-auto">
            Профессиональные функции для мониторинга и оптимизации РСЯ кампаний
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Eye" size={24} className="text-cyan-600" />
                </div>
                <CardTitle className="text-xl">Ежедневный мониторинг</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Автоматическая проверка всех площадок РСЯ каждый день. Новые мусорные сайты блокируются сразу после обнаружения.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Database" size={24} className="text-teal-600" />
                </div>
                <CardTitle className="text-xl">База площадок</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Готовый чёрный список из 10 000+ проверенных мусорных площадок РСЯ от сообщества рекламодателей.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Zap" size={24} className="text-emerald-600" />
                </div>
                <CardTitle className="text-xl">API интеграция</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Прямая работа через API Яндекс.Директ. Массовая блокировка площадок одним кликом, без ручного копирования URL.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="LineChart" size={24} className="text-blue-600" />
                </div>
                <CardTitle className="text-xl">Аналитика площадок</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Детальная статистика по каждой площадке: конверсии, CPA, ROI, качество трафика. Понятные дашборды и отчёты.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Settings" size={24} className="text-purple-600" />
                </div>
                <CardTitle className="text-xl">Гибкие правила</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Настройте условия блокировки под свою нишу: минимум кликов, максимальный CPA, порог отказов и другие триггеры.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Shield" size={24} className="text-red-600" />
                </div>
                <CardTitle className="text-xl">Белый список</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Защитите качественные площадки от случайной блокировки. Белый список гарантирует показы на проверенных сайтах.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Вопросы о чистке РСЯ</h2>
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Как часто нужно чистить площадки РСЯ?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Оптимально — еженедельно проверять новые площадки и блокировать неэффективные. DirectKit делает это автоматически каждый день, анализируя статистику за последние 24 часа и блокируя мусор по заданным правилам.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Сколько площадок нужно заблокировать?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  В среднем после месяца чистки РСЯ в чёрном списке оказывается 200-500 площадок. Для крупных аккаунтов с большим охватом — до 1000-2000 сайтов. Яндекс позволяет блокировать до 50 000 площадок на аккаунт.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Как блокировать площадки через Excluded Sites?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  В интерфейсе Яндекс.Директ: Инструменты → Excluded Sites → добавить URL сайтов. В DirectKit это автоматизировано через API — система сама добавляет мусорные площадки в список исключений без вашего участия.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Уменьшится ли охват после блокировки площадок?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Да, охват немного уменьшится (на 10-20%), но это нормально — вы отсекаете нецелевой и фродовый трафик. Взамен вы получаете снижение CPA на 30-50%, рост конверсии и положительный ROI. Качество важнее количества.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Можно ли разблокировать площадку?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Да, в любой момент можно удалить сайт из Excluded Sites и дать ему второй шанс. DirectKit позволяет экспортировать/импортировать списки площадок и управлять белым/чёрным списками гибко.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-cyan-500 to-teal-500">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-5xl font-bold mb-6">Начните чистить РСЯ автоматически</h2>
          <p className="text-xl mb-10 opacity-90">
            1 день бесплатного доступа • Мониторинг 24/7 • База из 10 000+ мусорных площадок • Снижение CPA на 40%
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            variant="secondary"
            className="text-lg px-10 py-6 h-auto shadow-xl hover:scale-105 transition-transform"
          >
            Подключить чистку РСЯ
            <Icon name="ArrowRight" size={20} className="ml-2" />
          </Button>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
              <Icon name="Zap" size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl">DirectKit</span>
          </div>
          <p className="text-slate-400 mb-4">Чистка РСЯ и инструменты для Яндекс.Директ</p>
          <div className="border-t border-slate-800 pt-6 text-slate-400">
            <p>© 2024 DirectKit. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
