import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';
import LandingHeader from '@/components/LandingHeader';
import { generateWordstatPDF, generateRSYAPDF } from '@/utils/pdfGenerator';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeProduct, setActiveProduct] = useState<'wordstat' | 'rsya'>('wordstat');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DirectKit',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '1990',
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '2500',
      bestRating: '5',
      worstRating: '1'
    },
    description: 'Профессиональные инструменты для автоматизации Яндекс.Директ. Парсер Wordstat, автоматическая чистка РСЯ, кластеризация запросов.',
    featureList: [
      'Парсер Wordstat - сбор 10000+ запросов за 30 минут',
      'Автоматическая чистка РСЯ 24/7',
      'Кластеризация запросов',
      'Снижение CPA на 40%'
    ],
    creator: {
      '@type': 'Organization',
      name: 'DirectKit',
      url: 'https://directkit.ru'
    }
  };

  return (
    <>
      <SEOHead 
        title="DirectKit — Автоматизация Яндекс.Директ: Парсер Wordstat и Чистка РСЯ"
        description="Профессиональные инструменты для Яндекс.Директ. Парсинг Wordstat за 30 минут, автоматическая чистка РСЯ 24/7. Снижение CPA на 40%, экономия времени в 10 раз."
        keywords="directkit, парсер wordstat, чистка рся, автоматизация директ, яндекс директ инструменты, парсинг вордстат, блокировка площадок рся, кластеризация запросов"
        canonical="https://directkit.ru/"
        ogTitle="DirectKit — Автоматизация Яндекс.Директ"
        ogDescription="Парсинг Wordstat, чистка РСЯ, кластеризация. Снижение CPA на 40%. 2500+ пользователей."
        ogType="website"
        jsonLd={jsonLd}
      />
      <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl mb-6 shadow-lg">
              <Icon name="Zap" size={40} className="text-white" />
            </div>
            <h1 className="text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Автоматизация<br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Яндекс.Директ
              </span>
            </h1>
            <p className="text-2xl text-slate-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              Профессиональные инструменты для работы с контекстной рекламой. Парсинг Wordstat, автоматическая чистка РСЯ, кластеризация запросов — всё в одном сервисе.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button 
                onClick={() => navigate('/auth')} 
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-lg px-8 py-6 shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all"
              >
                <Icon name="Rocket" size={20} className="mr-2" />
                Попробовать бесплатно
              </Button>
              <Button 
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 hover:bg-slate-50"
              >
                Наши инструменты
              </Button>
            </div>
            <p className="text-slate-500 mt-6 text-lg">7 дней бесплатно • Без привязки карты • Полный доступ</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-emerald-100 shadow-lg text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">2500+</div>
              <p className="text-slate-700 font-medium">Активных пользователей</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-teal-100 shadow-lg text-center">
              <div className="text-4xl font-bold text-teal-600 mb-2">150M+</div>
              <p className="text-slate-700 font-medium">Запросов обработано</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-green-100 shadow-lg text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">-40%</div>
              <p className="text-slate-700 font-medium">Средний CPA после оптимизации</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-emerald-100 shadow-lg text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">24/7</div>
              <p className="text-slate-700 font-medium">Автоматическая работа</p>
            </div>
          </div>
        </div>
      </section>

      {/* About DirectKit */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">Что такое DirectKit?</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Единая платформа для автоматизации работы с Яндекс.Директ — от сбора семантики до оптимизации рекламных кампаний
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-2 border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="Zap" size={32} className="text-emerald-600" />
                </div>
                <CardTitle className="text-2xl mb-3">Полная автоматизация</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-700">
                  Настройте один раз — система работает 24/7 без вашего участия. Парсинг, кластеризация, чистка РСЯ выполняются автоматически по расписанию.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-teal-100 hover:border-teal-300 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="Target" size={32} className="text-teal-600" />
                </div>
                <CardTitle className="text-2xl mb-3">Точные инструменты</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-700">
                  Работаем через официальный API Яндекса. Все операторы соответствия, 15+ метрик анализа, умные алгоритмы фильтрации мусорного трафика.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="TrendingDown" size={32} className="text-green-600" />
                </div>
                <CardTitle className="text-2xl mb-3">Реальная экономия</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-700">
                  Снижение CPA на 30-50%, экономия 90% времени на рутине, окупаемость подписки за первую неделю использования.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 p-12 rounded-3xl text-white shadow-2xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-4xl font-bold mb-6">Для кого DirectKit?</h3>
                <ul className="space-y-4 text-lg">
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={24} className="flex-shrink-0 mt-1" />
                    <span><strong>PPC-специалистам</strong> — автоматизация рутины, больше клиентов</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={24} className="flex-shrink-0 mt-1" />
                    <span><strong>Агентствам</strong> — масштабирование работы с семантикой</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={24} className="flex-shrink-0 mt-1" />
                    <span><strong>Владельцам бизнеса</strong> — экономия на найме специалистов</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={24} className="flex-shrink-0 mt-1" />
                    <span><strong>Новичкам</strong> — простой интерфейс, быстрый старт</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl text-center">
                <div className="text-7xl font-bold mb-4">95%</div>
                <p className="text-2xl mb-6">Экономия времени на рутинных задачах</p>
                <div className="text-lg opacity-90">
                  То, что раньше занимало неделю, теперь делается за час
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">Наши продукты</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Два мощных инструмента для полного цикла работы с Яндекс.Директ
            </p>
          </div>

          {/* Product Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            <Button
              onClick={() => setActiveProduct('wordstat')}
              size="lg"
              variant={activeProduct === 'wordstat' ? 'default' : 'outline'}
              className={activeProduct === 'wordstat' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-lg px-8 py-6'
                : 'text-lg px-8 py-6 border-2'
              }
            >
              <Icon name="Database" size={20} className="mr-2" />
              Парсер Wordstat
            </Button>
            <Button
              onClick={() => setActiveProduct('rsya')}
              size="lg"
              variant={activeProduct === 'rsya' ? 'default' : 'outline'}
              className={activeProduct === 'rsya' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-lg px-8 py-6'
                : 'text-lg px-8 py-6 border-2'
              }
            >
              <Icon name="ShieldCheck" size={20} className="mr-2" />
              Чистка РСЯ
            </Button>
          </div>

          {/* Wordstat Product */}
          {activeProduct === 'wordstat' && (
            <div className="animate-in fade-in duration-500">
              <Card className="border-0 shadow-2xl overflow-hidden mb-12">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-2">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-12 text-white flex items-center">
                      <div>
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                          <Icon name="Database" size={40} />
                        </div>
                        <h3 className="text-4xl font-bold mb-4">Парсер Wordstat</h3>
                        <p className="text-xl opacity-90 mb-6 leading-relaxed">
                          Соберите 10 000+ запросов из Яндекс Вордстат за 30 минут. Без капчи, с фильтрацией по регионам и частотности.
                        </p>
                        <div className="space-y-3 mb-8">
                          <div className="flex items-center gap-3">
                            <Icon name="Check" size={20} />
                            <span>Парсинг через API — никаких капч</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Icon name="Check" size={20} />
                            <span>До 50 000 запросов за раз</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Icon name="Check" size={20} />
                            <span>Выгрузка в Excel за 1 клик</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Icon name="Check" size={20} />
                            <span>Фильтры по региону и частоте</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => navigate('/wordstat-parser')}
                            variant="secondary"
                            size="lg"
                            className="bg-white text-emerald-600 hover:bg-slate-100"
                          >
                            Подробнее
                          </Button>
                          <Button 
                            onClick={generateWordstatPDF}
                            variant="outline"
                            size="lg"
                            className="border-2 border-white text-white hover:bg-white/10"
                          >
                            <Icon name="FileDown" size={20} className="mr-2" />
                            Скачать PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-12 bg-white">
                      <h4 className="text-2xl font-bold mb-6 text-slate-900">Ключевые возможности</h4>
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <Icon name="Zap" size={20} className="text-emerald-600" />
                            </div>
                            <h5 className="font-semibold text-lg">Максимальная скорость</h5>
                          </div>
                          <p className="text-slate-600 ml-13">10 000 запросов за 30 минут — быстрее всех конкурентов</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                              <Icon name="MapPin" size={20} className="text-teal-600" />
                            </div>
                            <h5 className="font-semibold text-lg">Все регионы</h5>
                          </div>
                          <p className="text-slate-600 ml-13">Локальная частотность для любого города России</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Icon name="Filter" size={20} className="text-green-600" />
                            </div>
                            <h5 className="font-semibold text-lg">Умные фильтры</h5>
                          </div>
                          <p className="text-slate-600 ml-13">Минус-слова при парсинге, фильтрация по частотности</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <Icon name="FileSpreadsheet" size={20} className="text-emerald-600" />
                            </div>
                            <h5 className="font-semibold text-lg">Готовый экспорт</h5>
                          </div>
                          <p className="text-slate-600 ml-13">Excel и CSV с метриками, готово для импорта в Директ</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border-2 border-emerald-100 shadow-lg text-center">
                  <div className="text-5xl font-bold text-emerald-600 mb-2">95%</div>
                  <p className="text-slate-700">Экономия времени на сборе</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-teal-100 shadow-lg text-center">
                  <div className="text-5xl font-bold text-teal-600 mb-2">10x</div>
                  <p className="text-slate-700">Больше запросов чем вручную</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-green-100 shadow-lg text-center">
                  <div className="text-5xl font-bold text-green-600 mb-2">0</div>
                  <p className="text-slate-700">Ошибок при сборе данных</p>
                </div>
              </div>
            </div>
          )}

          {/* RSYA Product */}
          {activeProduct === 'rsya' && (
            <div className="animate-in fade-in duration-500">
              <Card className="border-0 shadow-2xl overflow-hidden mb-12">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-2">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-12 text-white flex items-center">
                      <div>
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                          <Icon name="ShieldCheck" size={40} />
                        </div>
                        <h3 className="text-4xl font-bold mb-4">Автоматическая Чистка РСЯ</h3>
                        <p className="text-xl opacity-90 mb-6 leading-relaxed">
                          Система мониторит рекламу 3 раза в день и автоматически блокирует мусорные площадки. Снижение CPA на 30-50%.
                        </p>
                        <div className="space-y-3 mb-8">
                          <div className="flex items-center gap-3">
                            <Icon name="Check" size={20} />
                            <span>Мониторинг 24/7 — каждые 8 часов</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Icon name="Check" size={20} />
                            <span>15+ метрик анализа площадок</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Icon name="Check" size={20} />
                            <span>Автоблокировка мусорного трафика</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Icon name="Check" size={20} />
                            <span>Умная ротация при лимите 1000</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => navigate('/rsya-cleaning')}
                            variant="secondary"
                            size="lg"
                            className="bg-white text-emerald-600 hover:bg-slate-100"
                          >
                            Подробнее
                          </Button>
                          <Button 
                            onClick={generateRSYAPDF}
                            variant="outline"
                            size="lg"
                            className="border-2 border-white text-white hover:bg-white/10"
                          >
                            <Icon name="FileDown" size={20} className="mr-2" />
                            Скачать PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-12 bg-white">
                      <h4 className="text-2xl font-bold mb-6 text-slate-900">Ключевые возможности</h4>
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <Icon name="BarChart3" size={20} className="text-emerald-600" />
                            </div>
                            <h5 className="font-semibold text-lg">Глубокий анализ</h5>
                          </div>
                          <p className="text-slate-600 ml-13">15+ метрик: конверсии, CPA, отказы, время, CTR, CPC</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                              <Icon name="AlertCircle" size={20} className="text-teal-600" />
                            </div>
                            <h5 className="font-semibold text-lg">Выявление мусора</h5>
                          </div>
                          <p className="text-slate-600 ml-13">Паттерны фрода, подозрительный CPC, высокие отказы</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Icon name="Shield" size={20} className="text-green-600" />
                            </div>
                            <h5 className="font-semibold text-lg">Автоблокировка</h5>
                          </div>
                          <p className="text-slate-600 ml-13">Добавление в Excluded Sites через API Яндекса</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <Icon name="RefreshCw" size={20} className="text-emerald-600" />
                            </div>
                            <h5 className="font-semibold text-lg">Умная ротация</h5>
                          </div>
                          <p className="text-slate-600 ml-13">Управление лимитом 1000 площадок — всегда блокированы самые дорогие</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border-2 border-emerald-100 shadow-lg text-center">
                  <div className="text-5xl font-bold text-emerald-600 mb-2">-40%</div>
                  <p className="text-slate-700">Снижение CPA</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-teal-100 shadow-lg text-center">
                  <div className="text-5xl font-bold text-teal-600 mb-2">3x/день</div>
                  <p className="text-slate-700">Автоматический мониторинг</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-green-100 shadow-lg text-center">
                  <div className="text-5xl font-bold text-green-600 mb-2">0 мин</div>
                  <p className="text-slate-700">Времени на ручную работу</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">Как работает DirectKit</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Простой процесс из 3 шагов — от регистрации до первых результатов
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-2 border-emerald-100 hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="UserPlus" size={32} className="text-emerald-600" />
                </div>
                <div className="text-4xl font-bold text-emerald-600 mb-2">1</div>
                <CardTitle className="text-2xl mb-3">Регистрация</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-700">
                  Создайте аккаунт за 30 секунд. Без привязки карты, без SMS, без капчи. Сразу получаете полный доступ на 7 дней.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-teal-100 hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="Settings" size={32} className="text-teal-600" />
                </div>
                <div className="text-4xl font-bold text-teal-600 mb-2">2</div>
                <CardTitle className="text-2xl mb-3">Настройка</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-700">
                  Подключите аккаунт Яндекс.Директ через OAuth, выберите кампании, настройте правила работы. Занимает 5-10 минут.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-green-100 hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="TrendingUp" size={32} className="text-green-600" />
                </div>
                <div className="text-4xl font-bold text-green-600 mb-2">3</div>
                <CardTitle className="text-2xl mb-3">Результаты</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-700">
                  Система работает автоматически. Парсинг за 30 минут, первая чистка РСЯ через 8 часов. Снижение CPA через неделю.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center">
            <Button 
              onClick={() => navigate('/auth')} 
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-lg px-10 py-6 shadow-xl"
            >
              <Icon name="Rocket" size={20} className="mr-2" />
              Начать сейчас — бесплатно
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">Что говорят клиенты</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Реальные отзывы специалистов, агентств и владельцев бизнеса
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    АК
                  </div>
                  <div>
                    <div className="font-semibold">Александр Ковалёв</div>
                    <div className="text-sm text-slate-500">PPC-специалист</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Icon key={i} name="Star" size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "На сбор семантики уходило 2-3 дня. С DirectKit делаю за пару часов. Чистка РСЯ работает сама — CPA снизился на 35%."
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
                    <div className="text-sm text-slate-500">Владелица магазина</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Icon key={i} name="Star" size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "Никогда не работала с рекламой, но DirectKit оказался очень простым. CPC снизился на 40%, заявок в 2 раза больше!"
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
                    <div className="text-sm text-slate-500">Digital-агентство</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Icon key={i} name="Star" size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "Используем для всех клиентов. Особенно ценим автоматическую чистку — экономим до 30% бюджета на каждом проекте."
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 via-teal-600 to-green-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Icon name="Rocket" size={16} />
            Начните экономить уже сегодня
          </div>
          <h2 className="text-6xl font-bold text-white mb-6 leading-tight">
            Попробуйте DirectKit<br />бесплатно
          </h2>
          <p className="text-2xl text-white/90 mb-10 leading-relaxed">
            7 дней полного доступа ко всем инструментам. Без привязки карты. Отмена в любой момент.
          </p>
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')} 
              className="bg-white text-emerald-600 hover:bg-slate-50 text-xl px-10 py-7 shadow-2xl hover:shadow-3xl transition-all font-bold"
            >
              <Icon name="Sparkles" size={24} className="mr-2" />
              Начать бесплатно
            </Button>
            <Button 
              size="lg" 
              onClick={() => navigate('/pricing')}
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 text-xl px-10 py-7"
            >
              Посмотреть цены
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-lg">
            <div className="flex items-center gap-2">
              <Icon name="Check" size={20} />
              <span>Без кредитной карты</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Check" size={20} />
              <span>Полный функционал</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Check" size={20} />
              <span>Поддержка 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="https://cdn.poehali.dev/projects/e8511f31-5a6a-4fd5-9a7c-5620b5121f26/files/16625d69-4f43-4dfb-a302-c6efe2ad9bc7.jpg" 
                  alt="DirectKit Logo" 
                  className="w-10 h-10 rounded-xl object-cover shadow-sm"
                />
                <span className="font-bold text-xl">DirectKit</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Профессиональная автоматизация Яндекс.Директ
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-lg">Продукты</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="/wordstat-parser" className="hover:text-white transition-colors">Парсер WordStat</a></li>
                <li><a href="/rsya-cleaning" className="hover:text-white transition-colors">Чистка РСЯ</a></li>
                <li><a href="/clustering-keywords" className="hover:text-white transition-colors">Кластеризация</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-lg">Компания</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="/pricing" className="hover:text-white transition-colors">Тарифы</a></li>
                <li><a href="/cases" className="hover:text-white transition-colors">Кейсы</a></li>
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
    </>
  );
}