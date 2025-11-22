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
        title="Автоматическая Чистка РСЯ — Блокировка Мусорных Площадок 24/7"
        description="Автоматизированный мониторинг и блокировка неэффективных площадок РСЯ. Снизьте CPA на 40%, уберите фрод-трафик, повысьте ROI. Работает 3 раза в день без участия."
        keywords="чистка рся автоматическая, блокировка площадок рся, excluded sites автоматизация, мусорные площадки яндекс, оптимизация рся"
        canonical="https://directkit.ru/rsya-auto-cleaning"
      />

      <header className="border-b bg-white sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src="https://cdn.poehali.dev/projects/e8511f31-5a6a-4fd5-9a7c-5620b5121f26/files/16625d69-4f43-4dfb-a302-c6efe2ad9bc7.jpg" 
              alt="DirectKit Logo" 
              className="w-10 h-10 rounded-xl object-cover shadow-sm"
            />
            <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              DirectKit
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate('/rsya-cleaning')} className="text-slate-600 hover:text-emerald-600 transition font-medium">
              Чистка РСЯ
            </button>
            <button onClick={() => navigate('/pricing')} className="text-slate-600 hover:text-emerald-600 transition font-medium">
              Цены
            </button>
            <button onClick={() => navigate('/cases')} className="text-slate-600 hover:text-emerald-600 transition font-medium">
              Кейсы
            </button>
            <button onClick={() => navigate('/blog')} className="text-slate-600 hover:text-emerald-600 transition font-medium">
              Блог
            </button>
            <button onClick={() => navigate('/about-us')} className="text-slate-600 hover:text-emerald-600 transition font-medium">
              О нас
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/login')} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
              Войти
            </Button>
            <Button onClick={() => navigate('/auth')} className="bg-emerald-600 hover:bg-emerald-700">
              Регистрация
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-24">
        <div className="absolute inset-0 bg-grid-slate-900/[0.02] bg-[size:40px_40px]" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Icon name="Sparkles" size={16} />
              Автоматизация чистки РСЯ
            </div>
            <h1 className="text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Автоматическая Чистка<br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Площадок РСЯ 24/7
              </span>
            </h1>
            <p className="text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10">
              Система мониторит рекламу 3 раза в день, анализирует 15+ метрик и автоматически блокирует мусорные площадки. Снижение CPA на 30-50% без вашего участия.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')} 
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-lg px-8 py-6 shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all"
              >
                <Icon name="Rocket" size={20} className="mr-2" />
                Начать бесплатно
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-lg px-8 py-6 border-2 hover:bg-slate-50"
              >
                Как это работает
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-emerald-100 shadow-lg">
              <div className="text-4xl font-bold text-emerald-600 mb-2">-40%</div>
              <p className="text-slate-700 font-medium">CPA после чистки</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-teal-100 shadow-lg">
              <div className="text-4xl font-bold text-teal-600 mb-2">3x/день</div>
              <p className="text-slate-700 font-medium">Автоматический мониторинг</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-cyan-100 shadow-lg">
              <div className="text-4xl font-bold text-cyan-600 mb-2">15+</div>
              <p className="text-slate-700 font-medium">Метрик анализа</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Как работает автоматическая чистка — видео обзор</h2>
          <Card className="border-0 shadow-2xl overflow-hidden mb-20">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="Play" size={40} className="text-white ml-1" />
                  </div>
                  <p className="text-xl font-medium">Видео будет добавлено — отправьте ссылку</p>
                  <p className="text-sm text-slate-400 mt-2">YouTube или Vimeo iframe</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">Проблема РСЯ: 40-60% бюджета — мусор</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Рекламная Сеть Яндекса — это тысячи сайтов-партнёров. Но 60% из них сливают ваш бюджет на ботов, случайные клики и фрод-трафик.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-16">
            <div className="bg-gradient-to-br from-red-50 to-rose-50 p-10 rounded-3xl border-2 border-red-200 shadow-xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Icon name="AlertTriangle" size={32} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-2 text-red-700">Без автоматизации</h3>
                  <p className="text-slate-600">Ручная чистка РСЯ — это боль</p>
                </div>
              </div>
              <ul className="space-y-4 text-slate-700">
                <li className="flex items-start gap-3">
                  <Icon name="XCircle" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">40-60% бюджета уходит на мусорные площадки</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="XCircle" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">Нужно 2-3 часа в неделю на ручной анализ</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="XCircle" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">Боты и фрод съедают бюджет пока вы спите</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="XCircle" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">Высокий CPA и низкая конверсия</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="XCircle" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">ROI рекламы — отрицательный или около нуля</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-10 rounded-3xl border-2 border-emerald-200 shadow-xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Icon name="CheckCircle2" size={32} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-2 text-emerald-700">С автоматической чисткой</h3>
                  <p className="text-slate-600">Система работает за вас 24/7</p>
                </div>
              </div>
              <ul className="space-y-4 text-slate-700">
                <li className="flex items-start gap-3">
                  <Icon name="Check" size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">Трафик только с качественных площадок</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="Check" size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">Мониторинг 3 раза в день — автоматически</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="Check" size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">Блокировка мусора в течение 8 часов</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="Check" size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">CPA снижается на 30-50%</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="Check" size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">ROI становится положительным и растёт</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-12 rounded-3xl text-white shadow-2xl">
            <h3 className="text-4xl font-bold mb-8 text-center">Реальные результаты наших клиентов</h3>
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <div className="text-6xl font-bold mb-3">40%</div>
                <p className="text-xl opacity-95">Экономия бюджета после первого месяца</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <div className="text-6xl font-bold mb-3">2.8x</div>
                <p className="text-xl opacity-95">Рост конверсии при работе с чистыми площадками</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <div className="text-6xl font-bold mb-3">350+</div>
                <p className="text-xl opacity-95">Площадок блокируется в среднем за месяц</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <div className="text-6xl font-bold mb-3">0 мин</div>
                <p className="text-xl opacity-95">Времени на ручную работу — всё автоматически</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">Как работает автоматическая чистка</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Система работает 24/7 без вашего участия. Анализирует рекламу 3 раза в день и блокирует мусор по 15+ метрикам.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-2 border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="BarChart3" size={32} className="text-emerald-600" />
                </div>
                <div className="text-4xl font-bold text-emerald-600 mb-2">Шаг 1</div>
                <CardTitle className="text-2xl mb-3">Мониторинг 3 раза в день</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-700">
                  Система автоматически собирает статистику по всем площадкам РСЯ каждые 8 часов. Анализирует: конверсии, клики, отказы, время на сайте, CPA, CPC, CTR и ещё 10+ метрик.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-teal-100 hover:border-teal-300 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="AlertCircle" size={32} className="text-teal-600" />
                </div>
                <div className="text-4xl font-bold text-teal-600 mb-2">Шаг 2</div>
                <CardTitle className="text-2xl mb-3">Выявление мусора</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-700">
                  Алгоритм находит неэффективные площадки по триггерам: нет конверсий + 100 руб потрачено, высокий показатель отказов (&gt;70%), подозрительно дешёвый CPC, паттерны фрод-трафика.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-cyan-100 hover:border-cyan-300 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="ShieldCheck" size={32} className="text-cyan-600" />
                </div>
                <div className="text-4xl font-bold text-cyan-600 mb-2">Шаг 3</div>
                <CardTitle className="text-2xl mb-3">Автоматическая блокировка</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-700">
                  Площадки добавляются в Excluded Sites (чёрный список) через API Яндекса. Лимит 1000 сайтов на кампанию. Если лимит превышен — система ротирует: удаляет наименее вредные, добавляет самые дорогие.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-12 rounded-3xl text-white shadow-2xl">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Icon name="Zap" size={40} />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-4">Умная ротация при лимите 1000 площадок</h3>
                <p className="text-xl text-slate-300 leading-relaxed mb-6">
                  Яндекс разрешает блокировать максимум 1000 площадок на кампанию. Когда лимит достигнут, система автоматически ротирует: разблокирует наименее вредные площадки (с минимальным расходом) и добавляет новые самые дорогие мусорные сайты.
                </p>
                <div className="flex items-center gap-3 text-emerald-400">
                  <Icon name="Check" size={24} />
                  <span className="text-lg font-medium">Всегда заблокированы самые дорогие мусорные площадки</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">15+ метрик для выявления мусора</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Система анализирует каждую площадку по множеству параметров. Создаёте свои правила — она автоматически блокирует.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-2xl border-2 border-red-200">
              <Icon name="DollarSign" size={32} className="text-red-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Финансовые метрики</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-red-500 flex-shrink-0 mt-1" />
                  <span>CPA (стоимость конверсии)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-red-500 flex-shrink-0 mt-1" />
                  <span>CPC (стоимость клика)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-red-500 flex-shrink-0 mt-1" />
                  <span>Расход без конверсий</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-red-500 flex-shrink-0 mt-1" />
                  <span>CPM (цена 1000 показов)</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-2xl border-2 border-blue-200">
              <Icon name="MousePointer2" size={32} className="text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Поведенческие метрики</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-blue-500 flex-shrink-0 mt-1" />
                  <span>Показатель отказов (Bounce Rate)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-blue-500 flex-shrink-0 mt-1" />
                  <span>Время на сайте</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-blue-500 flex-shrink-0 mt-1" />
                  <span>Глубина просмотра</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-blue-500 flex-shrink-0 mt-1" />
                  <span>CTR (кликабельность)</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border-2 border-purple-200">
              <Icon name="TrendingUp" size={32} className="text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Конверсионные метрики</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-purple-500 flex-shrink-0 mt-1" />
                  <span>Количество конверсий</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-purple-500 flex-shrink-0 mt-1" />
                  <span>Conversion Rate</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-purple-500 flex-shrink-0 mt-1" />
                  <span>ROI и ROAS</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-purple-500 flex-shrink-0 mt-1" />
                  <span>Количество показов и кликов</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-amber-50 to-yellow-50 p-10 rounded-3xl border-2 border-amber-200">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Icon name="Sparkles" size={32} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-3 text-slate-900">Настройте свои правила блокировки</h3>
                <p className="text-xl text-slate-700 leading-relaxed mb-4">
                  Создавайте задачи с любыми условиями: "Блокировать если нет конверсий и потрачено &gt;100₽", "CPA выше 5000₽", "Bounce Rate &gt; 80%". Система будет автоматически применять ваши правила.
                </p>
                <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white">
                  Настроить правила
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">Почему выбирают DirectKit</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Единственный сервис автоматической чистки РСЯ на рынке с полной автоматизацией.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="Zap" size={40} className="text-emerald-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Полная автоматизация</h3>
              <p className="text-slate-600 leading-relaxed">
                Настройте один раз — система работает 24/7. Никаких ежедневных проверок и ручной работы.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="Clock" size={40} className="text-teal-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Мониторинг 3 раза в день</h3>
              <p className="text-slate-600 leading-relaxed">
                Проверка каждые 8 часов: утром, днём, вечером. Мусор блокируется максимально быстро.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="Brain" size={40} className="text-cyan-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Умные алгоритмы</h3>
              <p className="text-slate-600 leading-relaxed">
                15+ метрик анализа, паттерны фрода, автоматическая ротация при лимите 1000 площадок.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="LineChart" size={40} className="text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Подробная аналитика</h3>
              <p className="text-slate-600 leading-relaxed">
                Смотрите сколько сэкономили, какие площадки заблокированы, динамику CPA и ROI.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="Shield" size={40} className="text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Безопасность</h3>
              <p className="text-slate-600 leading-relaxed">
                Работаем через официальный API Яндекса. Доступ только на чтение статистики и управление Excluded Sites.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="Settings" size={40} className="text-orange-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Гибкие настройки</h3>
              <p className="text-slate-600 leading-relaxed">
                Создавайте свои правила блокировки по любым метрикам. Исключения, пороги, ключевые слова.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="Rocket" size={40} className="text-rose-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Быстрый старт</h3>
              <p className="text-slate-600 leading-relaxed">
                Подключение за 5 минут: авторизация в Яндексе, выбор кампаний, создание задач. Готово!
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="HeartHandshake" size={40} className="text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Поддержка 24/7</h3>
              <p className="text-slate-600 leading-relaxed">
                Помогаем настроить, ответим на вопросы, подскажем как снизить CPA ещё больше.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">Частые вопросы</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all">
              <h3 className="text-2xl font-bold mb-3 text-slate-900 flex items-center gap-3">
                <Icon name="HelpCircle" size={28} className="text-emerald-600" />
                Как это работает технически?
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                Система использует официальный API Яндекс.Директ. Каждые 8 часов получает статистику по площадкам РСЯ, анализирует метрики по вашим задачам, блокирует неэффективные площадки через параметр "Excluded Sites" (чёрный список).
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all">
              <h3 className="text-2xl font-bold mb-3 text-slate-900 flex items-center gap-3">
                <Icon name="HelpCircle" size={28} className="text-teal-600" />
                Безопасно ли давать доступ к аккаунту?
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                Да. Вы авторизуетесь через OAuth Яндекса (как "Войти через Яндекс"). Мы получаем только токен для чтения статистики и управления Excluded Sites. Не можем изменить ставки, бюджеты, тексты объявлений — только блокировать площадки.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all">
              <h3 className="text-2xl font-bold mb-3 text-slate-900 flex items-center gap-3">
                <Icon name="HelpCircle" size={28} className="text-cyan-600" />
                Что если система заблокирует хорошую площадку?
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                Вы контролируете правила блокировки. Можно добавить исключения: "Не блокировать домены с ключевыми словами: yandex, mail, rambler". Плюс видите все заблокированные площадки и можете вручную разблокировать.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all">
              <h3 className="text-2xl font-bold mb-3 text-slate-900 flex items-center gap-3">
                <Icon name="HelpCircle" size={28} className="text-purple-600" />
                Сколько это стоит?
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                Бесплатный тариф: 1 проект, 3 кампании. Платные тарифы от 990₽/мес: неограниченные проекты и кампании, приоритетная поддержка. Экономия бюджета окупает подписку в первую неделю.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all">
              <h3 className="text-2xl font-bold mb-3 text-slate-900 flex items-center gap-3">
                <Icon name="HelpCircle" size={28} className="text-orange-600" />
                Что такое лимит 1000 площадок в Яндексе?
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                Яндекс.Директ разрешает блокировать максимум 1000 площадок РСЯ на одну кампанию. Когда лимит достигнут, наша система автоматически ротирует: разблокирует наименее вредные площадки (с минимальным расходом), добавляет новые самые дорогие мусорные сайты.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Icon name="Rocket" size={16} />
            Начните экономить уже сегодня
          </div>
          <h2 className="text-6xl font-bold text-white mb-6 leading-tight">
            Попробуйте бесплатно<br />прямо сейчас
          </h2>
          <p className="text-2xl text-white/90 mb-10 leading-relaxed">
            Настройка за 5 минут. Первые результаты — через 8 часов. Снижение CPA на 30-50% — через неделю.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')} 
              className="bg-white text-emerald-600 hover:bg-slate-50 text-xl px-10 py-7 shadow-2xl hover:shadow-3xl transition-all font-bold"
            >
              <Icon name="Sparkles" size={24} className="mr-2" />
              Начать бесплатно
            </Button>
          </div>
          <p className="text-white/80 mt-6 text-lg">
            Не требуется кредитная карта · Подключение за 5 минут
          </p>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                  <Icon name="Zap" size={20} className="text-white" />
                </div>
                <span className="font-bold text-xl">DirectKit</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Автоматизация оптимизации контекстной рекламы
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-lg">Продукт</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="/rsya-cleaning" className="hover:text-white transition-colors">Чистка РСЯ</a></li>
                <li><a href="/pricing" className="hover:text-white transition-colors">Тарифы</a></li>
                <li><a href="/cases" className="hover:text-white transition-colors">Кейсы</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-lg">Компания</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="/about-us" className="hover:text-white transition-colors">О нас</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors">Блог</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-lg">Поддержка</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="/how-to-use" className="hover:text-white transition-colors">Как использовать</a></li>
                <li><a href="mailto:support@directkit.ru" className="hover:text-white transition-colors">support@directkit.ru</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2025 DirectKit. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}