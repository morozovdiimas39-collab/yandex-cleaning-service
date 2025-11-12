import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Helmet } from 'react-helmet-async';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>DirectKit — Wordstat Парсер и Сегментация Запросов для Яндекс.Директ</title>
        <meta name="description" content="Автоматический сбор семантики из Wordstat, сегментация ключевых слов по интентам, операторы соответствия Директа. Чистка РСЯ площадок и минус-слова. Бесплатный триал 7 дней." />
        <meta name="keywords" content="wordstat парсер, сегментация запросов, парсинг wordstat, сбор семантики, яндекс директ инструменты, операторы соответствия, минус слова директ, чистка рся, сегментатор ключевых слов, группировка запросов" />
        <link rel="canonical" href="https://directkit.ru/" />
      </Helmet>
      <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl mb-6 shadow-lg">
            <Icon name="Search" size={40} className="text-white" />
          </div>
          <h1 className="text-6xl font-bold text-slate-900 mb-6">Wordstat Парсер и Сегментация для Яндекс.Директ</h1>
          <p className="text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">Парсинг запросов из Wordstat, автоматическая сегментация по интентам, операторы соответствия "фраза" [порядок] !форма +предлог, чистка РСЯ площадок</p>
          <Button 
            onClick={() => navigate('/auth')} 
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6 h-auto shadow-lg"
          >Попробовать бесплатно — 7 дней</Button>
          <p className="text-slate-500 mt-4">Без привязки карты • Полный доступ ко всем инструментам</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Почему DirectKit?</h2>
          <p className="text-xl text-center text-slate-600 mb-16 max-w-3xl mx-auto">
            Профессиональный инструмент для специалистов по контекстной рекламе и владельцев бизнеса
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Clock" size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Экономия времени</h3>
              <p className="text-slate-600 text-lg">
                Соберите 10 000+ запросов за 30 минут вместо недели ручной работы
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Target" size={32} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Точный таргетинг</h3>
              <p className="text-slate-600 text-lg">
                Операторы соответствия "фраза", [порядок], !форма, +предлог для максимальной релевантности
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="TrendingDown" size={32} className="text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Снижение CPC</h3>
              <p className="text-slate-600 text-lg">
                Правильная структура семантики снижает стоимость клика на 30-50%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-green-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-5xl font-bold mb-2">2500+</div>
              <p className="text-emerald-100 text-lg">Активных пользователей</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">150M+</div>
              <p className="text-emerald-100 text-lg">Обработанных запросов</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">35%</div>
              <p className="text-emerald-100 text-lg">Экономия рекламного бюджета</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">4.8/5</div>
              <p className="text-emerald-100 text-lg">Средняя оценка сервиса</p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Как работает платформа</h2>
          <Card className="border-0 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/20 transition">
                    <Icon name="Play" size={40} className="text-white ml-1" />
                  </div>
                  <p className="text-xl font-medium">Видео демонстрация работы DirectKit</p>
                  <p className="text-slate-300 mt-2">3 минуты • Полный обзор функционала</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">Полный набор инструментов</h2>
          <div className="space-y-20">
            {/* Feature 1 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Database" size={28} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Сбор семантики из Wordstat</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Автоматический парсинг всех связанных запросов с указанием частотности. Поддержка выбора региона, глубины выгрузки и фильтрации по минимальной частоте.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Icon name="CheckCircle2" size={20} className="text-emerald-600 flex-shrink-0 mt-1" />
                    <span className="text-slate-700">Работа с любыми регионами России</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="CheckCircle2" size={20} className="text-emerald-600 flex-shrink-0 mt-1" />
                    <span className="text-slate-700">Фильтрация по минимальной частотности</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="CheckCircle2" size={20} className="text-emerald-600 flex-shrink-0 mt-1" />
                    <span className="text-slate-700">Выгрузка до 10 000+ запросов за раз</span>
                  </li>
                </ul>
              </div>
              <Card className="border-0 shadow-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <div className="text-center text-blue-800">
                      <Icon name="Search" size={64} className="mx-auto mb-3 opacity-60" />
                      <p className="font-semibold text-xl">Интерфейс сбора запросов</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature 2 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <Card className="border-0 shadow-xl overflow-hidden md:order-1">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    <div className="text-center text-purple-800">
                      <Icon name="Grid3x3" size={64} className="mx-auto mb-3 opacity-60" />
                      <p className="font-semibold text-xl">Результаты сегментизации</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="md:order-0">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Grid3x3" size={28} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Умная сегментация</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Автоматическая группировка запросов по намерениям пользователей. Система анализирует каждый запрос и создает релевантные группы для объявлений.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Icon name="CheckCircle2" size={20} className="text-emerald-600 flex-shrink-0 mt-1" />
                    <span className="text-slate-700">Группировка по интентам покупателей</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="CheckCircle2" size={20} className="text-emerald-600 flex-shrink-0 mt-1" />
                    <span className="text-slate-700">Автоматический подбор минус-слов</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="CheckCircle2" size={20} className="text-emerald-600 flex-shrink-0 mt-1" />
                    <span className="text-slate-700">Готовые группы для импорта в Директ</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Code" size={28} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Операторы соответствия</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Полная поддержка всех операторов Яндекс.Директ для максимально точного таргетинга на целевую аудиторию.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <code className="px-3 py-1 bg-slate-100 rounded font-mono text-emerald-600 font-semibold">"фраза"</code>
                    <span className="text-slate-700">Учет всех словоформ фразы</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="px-3 py-1 bg-slate-100 rounded font-mono text-emerald-600 font-semibold">[порядок]</code>
                    <span className="text-slate-700">Фиксация порядка слов</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="px-3 py-1 bg-slate-100 rounded font-mono text-emerald-600 font-semibold">!форма</code>
                    <span className="text-slate-700">Фиксация словоформы</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="px-3 py-1 bg-slate-100 rounded font-mono text-emerald-600 font-semibold">+предлог</code>
                    <span className="text-slate-700">Обязательное присутствие слова</span>
                  </div>
                </div>
              </div>
              <Card className="border-0 shadow-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                    <div className="text-center text-orange-800">
                      <Icon name="Code" size={64} className="mx-auto mb-3 opacity-60" />
                      <p className="font-semibold text-xl">Операторы в действии</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Что говорят наши клиенты</h2>
          <p className="text-xl text-center text-slate-600 mb-16 max-w-3xl mx-auto">
            Реальные отзывы специалистов по контекстной рекламе
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    АК
                  </div>
                  <div>
                    <div className="font-semibold">Александр Ковалёв</div>
                    <div className="text-sm text-slate-500">PPC-специалист, 5 лет опыта</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Icon key={i} name="Star" size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "Раньше на сбор семантики уходило 2-3 дня. С DirectKit делаю это за пару часов. Сегментация по интентам экономит массу времени при создании структуры кампаний."
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    МС
                  </div>
                  <div>
                    <div className="font-semibold">Мария Соколова</div>
                    <div className="text-sm text-slate-500">Владелица интернет-магазина</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Icon key={i} name="Star" size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "Никогда не работала с контекстом, но благодаря простому интерфейсу DirectKit смогла сама настроить рекламу. CPC снизился на 40%, а заявок стало в 2 раза больше!"
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    ДП
                  </div>
                  <div>
                    <div className="font-semibold">Дмитрий Петров</div>
                    <div className="text-sm text-slate-500">Руководитель digital-агентства</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Icon key={i} name="Star" size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "Используем для всех клиентов агентства. Особенно нравится чистка РСЯ - экономим клиентам до 30% бюджета, отсекая нецелевые площадки."
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">DirectKit vs Ручная работа</h2>
          <p className="text-xl text-center text-slate-600 mb-16 max-w-3xl mx-auto">
            Сравните скорость и качество работы с автоматизацией
          </p>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left p-6 text-slate-600 font-medium">Задача</th>
                    <th className="text-center p-6 bg-emerald-50">
                      <div className="font-bold text-emerald-600 text-lg mb-1">DirectKit</div>
                      <div className="text-sm text-slate-500 font-normal">Автоматизация</div>
                    </th>
                    <th className="text-center p-6">
                      <div className="font-bold text-slate-700 text-lg mb-1">Вручную</div>
                      <div className="text-sm text-slate-500 font-normal">Традиционный подход</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="p-6 text-slate-700">Сбор 10 000 запросов из Wordstat</td>
                    <td className="p-6 text-center bg-emerald-50">
                      <div className="font-bold text-emerald-600 text-2xl mb-1">30 мин</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="font-bold text-slate-700 text-2xl mb-1">3 дня</div>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-6 text-slate-700">Сегментация по интентам</td>
                    <td className="p-6 text-center bg-emerald-50">
                      <div className="font-bold text-emerald-600 text-2xl mb-1">5 мин</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="font-bold text-slate-700 text-2xl mb-1">1 день</div>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-6 text-slate-700">Расстановка операторов соответствия</td>
                    <td className="p-6 text-center bg-emerald-50">
                      <div className="font-bold text-emerald-600 text-2xl mb-1">1 мин</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="font-bold text-slate-700 text-2xl mb-1">4 часа</div>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-6 text-slate-700">Чистка РСЯ площадок</td>
                    <td className="p-6 text-center bg-emerald-50">
                      <div className="font-bold text-emerald-600 text-2xl mb-1">10 мин</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="font-bold text-slate-700 text-2xl mb-1">2 часа</div>
                    </td>
                  </tr>
                  <tr className="bg-gradient-to-r from-emerald-50 to-green-50">
                    <td className="p-6 font-bold text-slate-900">Итого времени на проект</td>
                    <td className="p-6 text-center">
                      <div className="font-bold text-emerald-600 text-3xl">~1 час</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="font-bold text-slate-700 text-3xl">~4 дня</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button 
              onClick={() => navigate('/auth')} 
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6 h-auto shadow-lg"
            >
              Попробовать бесплатно
            </Button>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Кому подходит DirectKit</h2>
          <p className="text-xl text-center text-slate-600 mb-16 max-w-3xl mx-auto">
            Решение для специалистов любого уровня — от новичков до агентств
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="User" size={24} className="text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Специалистам по контексту</CardTitle>
                <CardDescription className="text-base">
                  Автоматизируйте рутинные задачи и увеличьте количество обрабатываемых проектов
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Building" size={24} className="text-blue-600" />
                </div>
                <CardTitle className="text-xl">Рекламным агентствам</CardTitle>
                <CardDescription className="text-base">
                  Масштабируйте процессы работы с семантикой для множества клиентов одновременно
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Briefcase" size={24} className="text-purple-600" />
                </div>
                <CardTitle className="text-xl">Владельцам бизнеса</CardTitle>
                <CardDescription className="text-base">
                  Соберите семантику самостоятельно без найма специалистов и больших бюджетов
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="GraduationCap" size={24} className="text-orange-600" />
                </div>
                <CardTitle className="text-xl">Новичкам</CardTitle>
                <CardDescription className="text-base">
                  Простой интерфейс и автоматизация помогут начать работу с контекстом без опыта
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Посчитайте экономию с DirectKit</h2>
          <p className="text-xl text-center text-slate-600 mb-12 max-w-3xl mx-auto">
            Сколько вы экономите на автоматизации рутинных задач
          </p>
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-slate-700">Ваша ставка (₽/час)</h3>
                    <div className="text-4xl font-bold text-slate-900">2 000 ₽</div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-slate-700">Проектов в месяц</h3>
                    <div className="text-4xl font-bold text-slate-900">10</div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-slate-700">Экономия времени на проект</h3>
                    <div className="text-4xl font-bold text-emerald-600">32 часа</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-8 text-white flex flex-col justify-center">
                  <div className="text-center">
                    <div className="text-lg mb-2 opacity-90">Экономия в месяц</div>
                    <div className="text-6xl font-bold mb-4">640 000 ₽</div>
                    <div className="text-lg opacity-90 mb-6">при стоимости подписки 1 990 ₽</div>
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                      <Icon name="TrendingUp" size={20} />
                      <span className="font-semibold">ROI: 32 000%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 bg-white border-y">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 items-center">
            <div className="text-center">
              <Icon name="Shield" size={40} className="text-emerald-600 mx-auto mb-3" />
              <div className="font-semibold text-slate-900 mb-1">Безопасность данных</div>
              <div className="text-sm text-slate-600">SSL-шифрование</div>
            </div>
            <div className="text-center">
              <Icon name="Clock" size={40} className="text-emerald-600 mx-auto mb-3" />
              <div className="font-semibold text-slate-900 mb-1">Работаем 24/7</div>
              <div className="text-sm text-slate-600">Без выходных</div>
            </div>
            <div className="text-center">
              <Icon name="HeadphonesIcon" size={40} className="text-emerald-600 mx-auto mb-3" />
              <div className="font-semibold text-slate-900 mb-1">Техподдержка</div>
              <div className="text-sm text-slate-600">Ответ в течение часа</div>
            </div>
            <div className="text-center">
              <Icon name="RefreshCw" size={40} className="text-emerald-600 mx-auto mb-3" />
              <div className="font-semibold text-slate-900 mb-1">Гарантия возврата</div>
              <div className="text-sm text-slate-600">14 дней</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Как это работает</h2>
          <p className="text-xl text-center text-slate-600 mb-16 max-w-3xl mx-auto">
            Четыре простых шага от запросов до готового семантического ядра
          </p>
          <div className="space-y-12">
            <div className="flex gap-6 items-start">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg">
                1
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Добавьте ключевые слова</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Введите базовые запросы, описывающие ваш товар или услугу. Например: "купить кроссовки", "доставка пиццы", "ремонт квартир". Можно добавить сразу несколько запросов через Enter.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg">
                2
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Настройте параметры сбора</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Выберите регион показа рекламы, минимальную частотность запросов и глубину выгрузки. Система покажет примерное количество запросов, которые будут собраны.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg">
                3
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Получите сегментизацию</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  DirectKit автоматически сгруппирует все собранные запросы по намерениям пользователей, подберет минус-слова и применит операторы соответствия для максимальной релевантности.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg">
                4
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Экспортируйте в Яндекс.Директ</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Скачайте готовый Excel-файл с семантическим ядром, структурированным по группам объявлений. Загрузите его в Яндекс.Директ через импорт и запустите рекламу.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency - Limited Offer */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-full mb-6">
            <Icon name="Zap" size={32} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Специальное предложение для новых пользователей</h2>
          <p className="text-xl mb-8 opacity-90">
            Зарегистрируйтесь сейчас и получите первый месяц со скидкой 50% + бонусные 10 000 бесплатных запросов
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <div className="flex items-center gap-3 text-lg">
              <Icon name="CheckCircle2" size={24} />
              <span>7 дней бесплатно</span>
            </div>
            <div className="flex items-center gap-3 text-lg">
              <Icon name="CheckCircle2" size={24} />
              <span>Без привязки карты</span>
            </div>
            <div className="flex items-center gap-3 text-lg">
              <Icon name="CheckCircle2" size={24} />
              <span>Отмена в любой момент</span>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/auth')} 
            size="lg"
            className="bg-white text-orange-600 hover:bg-slate-100 text-lg px-10 py-6 h-auto shadow-xl"
          >
            Начать бесплатно →
          </Button>
          <p className="text-sm opacity-75 mt-4">⏰ Предложение действительно ограниченное время</p>
        </div>
      </section>

      {/* Case Study Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Реальные результаты наших клиентов</h2>
          <p className="text-xl text-center text-slate-600 mb-16 max-w-3xl mx-auto">
            Кейсы из практики: как DirectKit помог бизнесу вырасти
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-emerald-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="text-sm text-emerald-600 font-semibold mb-2">E-COMMERCE</div>
                <CardTitle className="text-2xl mb-4">Интернет-магазин электроники</CardTitle>
                <CardDescription className="text-base leading-relaxed mb-6">
                  Оптимизация рекламных кампаний с помощью точной сегментизации и операторов соответствия
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-slate-600">CPC снизился</span>
                    <span className="text-2xl font-bold text-emerald-600">-42%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-slate-600">Конверсия выросла</span>
                    <span className="text-2xl font-bold text-emerald-600">+65%</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-600">ROI увеличился</span>
                    <span className="text-2xl font-bold text-emerald-600">+180%</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-2 border-blue-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="text-sm text-blue-600 font-semibold mb-2">УСЛУГИ</div>
                <CardTitle className="text-2xl mb-4">Сеть стоматологических клиник</CardTitle>
                <CardDescription className="text-base leading-relaxed mb-6">
                  Региональная сегментация и чистка РСЯ для сети из 12 клиник в разных городах
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-slate-600">Бюджет сэкономлен</span>
                    <span className="text-2xl font-bold text-blue-600">-38%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-slate-600">Запросы обработано</span>
                    <span className="text-2xl font-bold text-blue-600">45K+</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-600">Заявок больше</span>
                    <span className="text-2xl font-bold text-blue-600">+92%</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-2 border-purple-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="text-sm text-purple-600 font-semibold mb-2">АГЕНТСТВО</div>
                <CardTitle className="text-2xl mb-4">Digital-агентство "Контекст Про"</CardTitle>
                <CardDescription className="text-base leading-relaxed mb-6">
                  Масштабирование работы с 50+ клиентами благодаря автоматизации процессов
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-slate-600">Время на проект</span>
                    <span className="text-2xl font-bold text-purple-600">-85%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-slate-600">Клиентов больше</span>
                    <span className="text-2xl font-bold text-purple-600">+3x</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-600">Выручка выросла</span>
                    <span className="text-2xl font-bold text-purple-600">+240%</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
          <div className="text-center mt-10">
            <Button 
              onClick={() => navigate('/cases')} 
              variant="outline"
              size="lg"
              className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              Смотреть все кейсы →
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">Частые вопросы</h2>
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Сколько стоит использование?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Первые 7 дней — бесплатно с полным доступом ко всем функциям. После триала подписка стоит 1990 ₽/месяц. Без скрытых платежей и комиссий.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Нужна ли привязка карты для триала?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Нет, для активации пробного периода карта не требуется. Вы получаете полный доступ сразу после регистрации.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Сколько запросов можно собрать?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Ограничений на количество собираемых запросов нет. В среднем один проект содержит от 1 000 до 50 000 запросов, в зависимости от тематики.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Работает ли с другими рекламными платформами?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  DirectKit заточен под Яндекс.Директ с поддержкой всех операторов соответствия. Собранную семантику можно адаптировать и для других платформ (Google Ads, VK Реклама).
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Есть ли техподдержка?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Да, мы помогаем с настройкой и решением любых вопросов через Telegram-чат в рабочее время (пн-пт, 10:00-19:00 МСК).
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Money Back Guarantee */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-5xl mx-auto px-6">
          <Card className="border-2 border-emerald-200 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                <div className="bg-gradient-to-br from-emerald-600 to-green-600 p-12 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Icon name="ShieldCheck" size={80} className="mx-auto mb-6" />
                    <div className="text-6xl font-bold mb-4">100%</div>
                    <div className="text-2xl font-semibold">Гарантия возврата</div>
                  </div>
                </div>
                <div className="p-12 bg-white">
                  <h3 className="text-3xl font-bold mb-6 text-slate-900">Никакого риска для вас</h3>
                  <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                    Если в течение 14 дней вы поймете, что DirectKit вам не подходит — мы вернем деньги. Никаких вопросов и условий.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Icon name="CheckCircle2" size={24} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">Возврат в течение 14 дней</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Icon name="CheckCircle2" size={24} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">Без объяснения причин</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Icon name="CheckCircle2" size={24} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">Моментальный возврат на карту</span>
                    </li>
                  </ul>
                  <Button 
                    onClick={() => navigate('/auth')} 
                    className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-lg py-6 h-auto"
                  >
                    Попробовать без риска
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Comparison with Competitors */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Почему DirectKit лучше конкурентов</h2>
          <p className="text-xl text-center text-slate-600 mb-16 max-w-3xl mx-auto">
            Честное сравнение с популярными альтернативами
          </p>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-slate-100">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left p-6 text-slate-700 font-semibold text-lg w-1/3">Возможность</th>
                      <th className="text-center p-6 bg-emerald-50 border-x-2 border-emerald-200">
                        <div className="font-bold text-emerald-700 text-xl mb-2">DirectKit</div>
                        <div className="text-sm text-slate-600 font-normal">1 990 ₽/мес</div>
                      </th>
                      <th className="text-center p-6">
                        <div className="font-semibold text-slate-700 text-lg mb-2">KeyCollector</div>
                        <div className="text-sm text-slate-500 font-normal">26 000 ₽</div>
                      </th>
                      <th className="text-center p-6">
                        <div className="font-semibold text-slate-700 text-lg mb-2">Rush Analytics</div>
                        <div className="text-sm text-slate-500 font-normal">3 990 ₽/мес</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-center">
                    <tr className="border-b border-slate-100">
                      <td className="text-left p-6 text-slate-700 font-medium">Парсинг Wordstat</td>
                      <td className="p-6 bg-emerald-50/50 border-x border-emerald-100">
                        <Icon name="CheckCircle2" size={28} className="text-emerald-600 mx-auto" />
                      </td>
                      <td className="p-6">
                        <Icon name="CheckCircle2" size={28} className="text-slate-400 mx-auto" />
                      </td>
                      <td className="p-6">
                        <Icon name="CheckCircle2" size={28} className="text-slate-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <td className="text-left p-6 text-slate-700 font-medium">Сегментация по интентам</td>
                      <td className="p-6 bg-emerald-50/50 border-x border-emerald-100">
                        <Icon name="CheckCircle2" size={28} className="text-emerald-600 mx-auto" />
                      </td>
                      <td className="p-6">
                        <Icon name="X" size={28} className="text-red-400 mx-auto" />
                      </td>
                      <td className="p-6">
                        <Icon name="CheckCircle2" size={28} className="text-slate-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="text-left p-6 text-slate-700 font-medium">Операторы соответствия</td>
                      <td className="p-6 bg-emerald-50/50 border-x border-emerald-100">
                        <Icon name="CheckCircle2" size={28} className="text-emerald-600 mx-auto" />
                      </td>
                      <td className="p-6">
                        <Icon name="CheckCircle2" size={28} className="text-slate-400 mx-auto" />
                      </td>
                      <td className="p-6">
                        <Icon name="X" size={28} className="text-red-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <td className="text-left p-6 text-slate-700 font-medium">Чистка РСЯ</td>
                      <td className="p-6 bg-emerald-50/50 border-x border-emerald-100">
                        <Icon name="CheckCircle2" size={28} className="text-emerald-600 mx-auto" />
                      </td>
                      <td className="p-6">
                        <Icon name="X" size={28} className="text-red-400 mx-auto" />
                      </td>
                      <td className="p-6">
                        <Icon name="X" size={28} className="text-red-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="text-left p-6 text-slate-700 font-medium">Работает в браузере</td>
                      <td className="p-6 bg-emerald-50/50 border-x border-emerald-100">
                        <Icon name="CheckCircle2" size={28} className="text-emerald-600 mx-auto" />
                      </td>
                      <td className="p-6">
                        <Icon name="X" size={28} className="text-red-400 mx-auto" />
                      </td>
                      <td className="p-6">
                        <Icon name="CheckCircle2" size={28} className="text-slate-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <td className="text-left p-6 text-slate-700 font-medium">Обновления бесплатно</td>
                      <td className="p-6 bg-emerald-50/50 border-x border-emerald-100">
                        <Icon name="CheckCircle2" size={28} className="text-emerald-600 mx-auto" />
                      </td>
                      <td className="p-6">
                        <Icon name="X" size={28} className="text-red-400 mx-auto" />
                      </td>
                      <td className="p-6">
                        <Icon name="CheckCircle2" size={28} className="text-slate-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="bg-gradient-to-r from-emerald-50 to-green-50">
                      <td className="text-left p-6 text-slate-900 font-bold">Итоговая цена за год</td>
                      <td className="p-6 border-x-2 border-emerald-200">
                        <div className="text-3xl font-bold text-emerald-600">23 880 ₽</div>
                        <div className="text-sm text-slate-500 mt-1">при годовой оплате</div>
                      </td>
                      <td className="p-6">
                        <div className="text-3xl font-bold text-slate-700">26 000 ₽</div>
                        <div className="text-sm text-slate-500 mt-1">единоразово</div>
                      </td>
                      <td className="p-6">
                        <div className="text-3xl font-bold text-slate-700">47 880 ₽</div>
                        <div className="text-sm text-slate-500 mt-1">за год использования</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="text-center mt-10">
            <Button 
              onClick={() => navigate('/auth')} 
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-10 py-6 h-auto shadow-lg"
            >
              Выбрать DirectKit
            </Button>
          </div>
        </div>
      </section>

      {/* Internal Links Section for SEO */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Полезные инструменты для Яндекс.Директ</h2>
          <p className="text-xl text-center text-slate-600 mb-16 max-w-3xl mx-auto">
            Всё необходимое для эффективной работы с контекстной рекламой в одном месте
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/wordstat-parser')}>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Database" size={24} className="text-blue-600" />
                </div>
                <CardTitle className="text-xl">Парсер Wordstat</CardTitle>
                <CardDescription className="text-base">
                  Автоматический сбор семантики из Яндекс Wordstat. Парсинг 10 000+ запросов с частотностью за 30 минут. Фильтрация по регионам и частоте.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/klasterizaciya-zaprosov')}>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Grid3x3" size={24} className="text-purple-600" />
                </div>
                <CardTitle className="text-xl">Сегментация Запросов</CardTitle>
                <CardDescription className="text-base">
                  Умная группировка ключевых слов по интентам. Автоматическая сегментация семантического ядра для создания структуры рекламных кампаний.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/operatory-sootvetstviya')}>
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Code" size={24} className="text-orange-600" />
                </div>
                <CardTitle className="text-xl">Операторы Соответствия</CardTitle>
                <CardDescription className="text-base">
                  Полная поддержка всех операторов Яндекс.Директ: "фраза", [порядок], !форма, +предлог. Точный таргетинг на целевую аудиторию.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/minus-slova')}>
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Shield" size={24} className="text-red-600" />
                </div>
                <CardTitle className="text-xl">Генератор Минус-Слов</CardTitle>
                <CardDescription className="text-base">
                  Автоматический подбор и кросс-минусовка для Директа. Готовые шаблоны минус-слов для разных ниш. Экономия бюджета на нецелевых кликах.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/chistka-rsya')}>
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Filter" size={24} className="text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Чистка РСЯ Площадок</CardTitle>
                <CardDescription className="text-base">
                  Автоматическая блокировка неэффективных площадок РСЯ. Мониторинг и анализ качества трафика. Оптимизация расхода рекламного бюджета.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="TrendingUp" size={24} className="text-teal-600" />
                </div>
                <CardTitle className="text-xl">Автоматизация Директа</CardTitle>
                <CardDescription className="text-base">
                  Комплексная автоматизация работы с Яндекс.Директ. API интеграция, массовые операции, управление ставками, отчетность.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact / Lead Form */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">Остались вопросы?</h2>
            <p className="text-xl text-slate-600">
              Оставьте заявку — мы свяжемся с вами в течение часа и ответим на все вопросы
            </p>
          </div>
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ваше имя</label>
                  <input 
                    type="text"
                    placeholder="Иван"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Телефон или Telegram</label>
                  <input 
                    type="text"
                    placeholder="+7 (900) 123-45-67"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Ваш вопрос (необязательно)</label>
                <textarea 
                  rows={4}
                  placeholder="Расскажите, что хотите узнать о DirectKit..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
                />
              </div>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6 h-auto"
              >
                Отправить заявку
              </Button>
              <p className="text-sm text-slate-500 text-center mt-4">
                Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-emerald-500 to-green-500 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-5xl font-bold mb-6">Начните работу прямо сейчас</h2>
          <p className="text-xl mb-10 opacity-90">
            7 дней бесплатного доступа • Без привязки карты • Отмена в любой момент
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            variant="secondary"
            className="text-lg px-10 py-6 h-auto shadow-xl hover:scale-105 transition-transform"
          >
            Попробовать бесплатно
            <Icon name="ArrowRight" size={20} className="ml-2" />
          </Button>
          <p className="text-sm mt-6 opacity-80">
            Присоединяйтесь к 500+ специалистам, которые уже используют DirectKit
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                  <Icon name="Zap" size={20} className="text-white" />
                </div>
                <span className="font-bold text-xl">DirectKit</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Профессиональный инструмент для работы с семантикой Яндекс.Директ
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Продукт</h3>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => navigate('/auth')} className="hover:text-white transition">Вход</button></li>
                <li><button onClick={() => navigate('/pricing')} className="hover:text-white transition">Цены</button></li>
                <li><button onClick={() => navigate('/about-us')} className="hover:text-white transition">О нас</button></li>
                <li><button onClick={() => navigate('/cases')} className="hover:text-white transition">Кейсы</button></li>
                <li><button onClick={() => navigate('/blog')} className="hover:text-white transition">Блог</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Инструменты</h3>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => navigate('/wordstat-parser')} className="hover:text-white transition">Wordstat Парсер</button></li>
                <li><button onClick={() => navigate('/klasterizaciya-zaprosov')} className="hover:text-white transition">Сегментация</button></li>
                <li><button onClick={() => navigate('/operatory-sootvetstviya')} className="hover:text-white transition">Операторы Директа</button></li>
                <li><button onClick={() => navigate('/minus-slova')} className="hover:text-white transition">Минус-слова</button></li>
                <li><button onClick={() => navigate('/chistka-rsya')} className="hover:text-white transition">Чистка РСЯ</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Поддержка</h3>
              <ul className="space-y-2 text-slate-400">
                <li>Telegram: @directkit_support</li>
                <li>Email: support@directkit.ru</li>
                <li>Пн-Пт: 10:00-19:00 МСК</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>© 2024 DirectKit. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}