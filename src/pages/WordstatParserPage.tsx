import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';
import LandingHeader from '@/components/LandingHeader';
import { generateWordstatPDF } from '@/utils/pdfGenerator';

export default function WordstatParserPage() {
  const navigate = useNavigate();

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Как парсер собирает данные из WordStat?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Парсер работает через официальный API Яндекс.Директ. Получает доступ к WordStat после авторизации через OAuth, собирает запросы из правой и левой колонки, фильтрует по вашим настройкам и выгружает в Excel.'
        }
      },
      {
        '@type': 'Question',
        name: 'Почему нет капчи при парсинге?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Мы используем API Яндекса вместо парсинга через браузер. API не показывает капчу и не блокирует запросы. Это официальный способ автоматизации, разрешённый Яндексом.'
        }
      },
      {
        '@type': 'Question',
        name: 'Сколько запросов можно собрать?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Бесплатный тариф: до 1000 запросов. Платные тарифы: от 10 000 до неограниченного количества. Один запуск парсера может собрать до 50 000 ключевых слов из WordStat.'
        }
      },
      {
        '@type': 'Question',
        name: 'В каком формате выгружаются данные?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Excel (.xlsx) и CSV. Таблица содержит: запрос, частотность, регион, дата сбора и дополнительные метрики. Готова для кластеризации или импорта в Яндекс.Директ.'
        }
      },
      {
        '@type': 'Question',
        name: 'Насколько актуальны данные из парсера?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '100% актуальные данные на момент парсинга. Парсер получает частотность напрямую из WordStat API. Рекомендуем обновлять семантику каждые 1-2 месяца для поддержания актуальности.'
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="Парсер WordStat Онлайн Бесплатно | Сбор Семантики из Яндекс Вордстат"
        description="Автоматический парсер WordStat для сбора ключевых слов. Парсинг Яндекс Вордстата с регионами, фильтрацией по частотности. Выгрузка wordstat в Excel. Быстрый сбор семантики онлайн без капчи."
        keywords="парсер wordstat, вордстат парсер, парсер яндекс wordstat онлайн, wordstat парсер бесплатно, сбор ключевых слов wordstat, парсинг вордстата, wordstat api парсер"
        canonical="https://directkit.ru/wordstat-parser"
        jsonLd={faqSchema}
      />

      <LandingHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-24">
        <div className="absolute inset-0 bg-grid-slate-900/[0.02] bg-[size:40px_40px]" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Icon name="Sparkles" size={16} />
              Автоматический сбор семантики
            </div>
            <h1 className="text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Парсинг Wordstat<br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Яндекс
              </span>
            </h1>
            <p className="text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10">
              Соберите 10 000+ запросов из Яндекс Вордстат за 30 минут. Парсинг с регионами, фильтрация по частотности, выгрузка в Excel. Без капчи и ограничений.
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
                onClick={generateWordstatPDF}
                className="text-lg px-8 py-6 border-2 hover:bg-slate-50"
              >
                <Icon name="FileDown" size={20} className="mr-2" />
                Скачать PDF
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-emerald-100 shadow-lg">
              <div className="text-4xl font-bold text-emerald-600 mb-2">10 000+</div>
              <p className="text-slate-700 font-medium">Запросов за 30 минут</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-teal-100 shadow-lg">
              <div className="text-4xl font-bold text-teal-600 mb-2">Без капчи</div>
              <p className="text-slate-700 font-medium">Парсинг через API</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-green-100 shadow-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">Excel</div>
              <p className="text-slate-700 font-medium">Готовая выгрузка</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Как работает парсер WordStat — видео обзор</h2>
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
            <h2 className="text-5xl font-bold text-slate-900 mb-4">Проблема ручного сбора семантики</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Собирать запросы из Яндекс Вордстат вручную — это недели работы. Парсер автоматизирует всё за минуты.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-16">
            <div className="bg-gradient-to-br from-red-50 to-rose-50 p-10 rounded-3xl border-2 border-red-200 shadow-xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Icon name="AlertTriangle" size={32} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-2 text-red-700">Ручной сбор</h3>
                  <p className="text-slate-600">Копипаст из Вордстата — мука</p>
                </div>
              </div>
              <ul className="space-y-4 text-slate-700">
                <li className="flex items-start gap-3">
                  <Icon name="XCircle" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">1-2 недели на сбор 5000 запросов</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="XCircle" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">Капча каждые 50 запросов</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="XCircle" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">Ошибки при копировании данных</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="XCircle" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">Невозможно собрать больше 1000 запросов</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="XCircle" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">Нужно вручную форматировать в Excel</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-10 rounded-3xl border-2 border-emerald-200 shadow-xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Icon name="CheckCircle2" size={32} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-2 text-emerald-700">С парсером Wordstat</h3>
                  <p className="text-slate-600">Автоматизация на 100%</p>
                </div>
              </div>
              <ul className="space-y-4 text-slate-700">
                <li className="flex items-start gap-3">
                  <Icon name="Check" size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">10 000 запросов за 30 минут</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="Check" size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">Никаких капч — парсинг через API</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="Check" size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">100% точность данных</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="Check" size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">До 50 000 запросов за раз</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="Check" size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">Автоматический экспорт в Excel</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 p-12 rounded-3xl text-white shadow-2xl">
            <h3 className="text-4xl font-bold mb-8 text-center">Результаты наших пользователей</h3>
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <div className="text-6xl font-bold mb-3">95%</div>
                <p className="text-xl opacity-95">Экономия времени на сборе семантики</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <div className="text-6xl font-bold mb-3">10x</div>
                <p className="text-xl opacity-95">Больше запросов чем вручную</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <div className="text-6xl font-bold mb-3">0</div>
                <p className="text-xl opacity-95">Ошибок при сборе данных</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <div className="text-6xl font-bold mb-3">30 мин</div>
                <p className="text-xl opacity-95">Вместо 2 недель ручной работы</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">Как работает парсер WordStat</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Простой процесс из 3 шагов — от добавления запросов до готовой выгрузки Excel
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-2 border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="FileText" size={32} className="text-emerald-600" />
                </div>
                <div className="text-4xl font-bold text-emerald-600 mb-2">Шаг 1</div>
                <CardTitle className="text-2xl mb-3">Добавьте запросы</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-700">
                  Введите базовые ключевые слова для парсинга WordStat. Можно добавить несколько запросов сразу — система соберёт всю связанную семантику автоматически с правой и левой колонки Вордстата.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-teal-100 hover:border-teal-300 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="Settings" size={32} className="text-teal-600" />
                </div>
                <div className="text-4xl font-bold text-teal-600 mb-2">Шаг 2</div>
                <CardTitle className="text-2xl mb-3">Настройте параметры</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-700">
                  Выберите регион для парсинга (Россия, Москва, любой город), минимальную частотность запросов, глубину сбора. Фильтруйте минус-слова сразу при парсинге — экономьте время.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="Download" size={32} className="text-green-600" />
                </div>
                <div className="text-4xl font-bold text-green-600 mb-2">Шаг 3</div>
                <CardTitle className="text-2xl mb-3">Скачайте Excel</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-700">
                  Получите готовый файл Excel со всеми собранными запросами, частотностью и метриками. Сразу используйте для кластеризации, группировки или импорта в Яндекс.Директ.
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
                <h3 className="text-3xl font-bold mb-4">Параллельный парсинг сотен запросов</h3>
                <p className="text-xl text-slate-300 leading-relaxed mb-6">
                  Парсер WordStat обрабатывает до 100 запросов одновременно. Система автоматически распределяет нагрузку, обходит лимиты API и собирает семантику в десятки раз быстрее конкурентов. То, что вручную заняло бы недели, DirectKit делает за 15-30 минут.
                </p>
                <div className="flex items-center gap-3 text-blue-400">
                  <Icon name="Check" size={24} />
                  <span className="text-lg font-medium">Максимальная скорость сбора семантики на рынке</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">Возможности парсера WordStat</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Всё необходимое для профессионального сбора семантики из Яндекс Вордстат
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-2xl border-2 border-blue-200">
              <Icon name="MapPin" size={32} className="text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Парсинг по регионам</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-blue-500 flex-shrink-0 mt-1" />
                  <span>Любой город и область России</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-blue-500 flex-shrink-0 mt-1" />
                  <span>Локальная частотность запросов</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-blue-500 flex-shrink-0 mt-1" />
                  <span>Точные данные для гео-рекламы</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border-2 border-purple-200">
              <Icon name="Filter" size={32} className="text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Фильтрация</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-purple-500 flex-shrink-0 mt-1" />
                  <span>Минимальная частотность</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-purple-500 flex-shrink-0 mt-1" />
                  <span>Минус-слова при парсинге</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-purple-500 flex-shrink-0 mt-1" />
                  <span>Только коммерческие запросы</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border-2 border-green-200">
              <Icon name="Layers" size={32} className="text-green-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Глубокий парсинг</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-green-500 flex-shrink-0 mt-1" />
                  <span>До 50 000 запросов за раз</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-green-500 flex-shrink-0 mt-1" />
                  <span>Правая и левая колонка</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-green-500 flex-shrink-0 mt-1" />
                  <span>Полное семантическое ядро</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-2xl border-2 border-orange-200">
              <Icon name="Zap" size={32} className="text-orange-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Без ограничений</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-orange-500 flex-shrink-0 mt-1" />
                  <span>Никаких капч</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-orange-500 flex-shrink-0 mt-1" />
                  <span>Парсинг через API</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-orange-500 flex-shrink-0 mt-1" />
                  <span>Работает 24/7</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border-2 border-emerald-200">
              <Icon name="FileSpreadsheet" size={32} className="text-emerald-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Экспорт</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span>Excel и CSV форматы</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span>Готовые таблицы с метриками</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <span>Импорт в Директ</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50 p-8 rounded-2xl border-2 border-red-200">
              <Icon name="Clock" size={32} className="text-red-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Скорость</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-red-500 flex-shrink-0 mt-1" />
                  <span>10 000 запросов за 30 минут</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-red-500 flex-shrink-0 mt-1" />
                  <span>Параллельная обработка</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Minus" size={16} className="text-red-500 flex-shrink-0 mt-1" />
                  <span>Экономия недель работы</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">Почему выбирают DirectKit</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Лучший парсер WordStat на рынке по скорости, функциональности и удобству
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="Zap" size={40} className="text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Самый быстрый</h3>
              <p className="text-slate-600 leading-relaxed">
                До 100 запросов параллельно. 10 000+ фраз за 30 минут — быстрее всех конкурентов.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="Shield" size={40} className="text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Без блокировок</h3>
              <p className="text-slate-600 leading-relaxed">
                Работаем через официальный API Яндекса. Никаких капч, блокировок или банов.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="Target" size={40} className="text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Точные данные</h3>
              <p className="text-slate-600 leading-relaxed">
                100% актуальная частотность из Вордстата. Никаких приблизительных значений.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="FileSpreadsheet" size={40} className="text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Удобный экспорт</h3>
              <p className="text-slate-600 leading-relaxed">
                Готовые таблицы Excel с метриками. Сразу используйте для кластеризации.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="MapPin" size={40} className="text-orange-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Все регионы</h3>
              <p className="text-slate-600 leading-relaxed">
                Парсинг для любого города России. Локальная частотность для гео-рекламы.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="Filter" size={40} className="text-rose-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Умные фильтры</h3>
              <p className="text-slate-600 leading-relaxed">
                Фильтрация по частотности, минус-слова при парсинге. Только нужное.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="Layers" size={40} className="text-cyan-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Глубокий парсинг</h3>
              <p className="text-slate-600 leading-relaxed">
                До 50 000 запросов. Правая и левая колонка. Полное семантическое ядро.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200">
              <Icon name="HeartHandshake" size={40} className="text-emerald-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Поддержка 24/7</h3>
              <p className="text-slate-600 leading-relaxed">
                Поможем настроить парсинг, ответим на вопросы, подскажем как лучше.
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
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all">
              <h3 className="text-2xl font-bold mb-3 text-slate-900 flex items-center gap-3">
                <Icon name="HelpCircle" size={28} className="text-blue-600" />
                Как парсер собирает данные из WordStat?
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                Парсер работает через официальный API Яндекс.Директ. Получает доступ к WordStat после авторизации через OAuth, собирает запросы из правой и левой колонки, фильтрует по вашим настройкам и выгружает в Excel.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all">
              <h3 className="text-2xl font-bold mb-3 text-slate-900 flex items-center gap-3">
                <Icon name="HelpCircle" size={28} className="text-indigo-600" />
                Почему нет капчи при парсинге?
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                Мы используем API Яндекса вместо парсинга через браузер. API не показывает капчу и не блокирует запросы. Это официальный способ автоматизации, разрешённый Яндексом.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all">
              <h3 className="text-2xl font-bold mb-3 text-slate-900 flex items-center gap-3">
                <Icon name="HelpCircle" size={28} className="text-purple-600" />
                Сколько запросов можно собрать?
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                Бесплатный тариф: до 1000 запросов. Платные тарифы: от 10 000 до неограниченного количества. Один запуск парсера может собрать до 50 000 ключевых слов из WordStat.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all">
              <h3 className="text-2xl font-bold mb-3 text-slate-900 flex items-center gap-3">
                <Icon name="HelpCircle" size={28} className="text-green-600" />
                В каком формате выгружаются данные?
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                Excel (.xlsx) и CSV. Таблица содержит: запрос, частотность, регион, дата сбора и дополнительные метрики. Готова для кластеризации или импорта в Яндекс.Директ.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all">
              <h3 className="text-2xl font-bold mb-3 text-slate-900 flex items-center gap-3">
                <Icon name="HelpCircle" size={28} className="text-orange-600" />
                Насколько актуальны данные из парсера?
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                100% актуальные данные на момент парсинга. Парсер получает частотность напрямую из WordStat API. Рекомендуем обновлять семантику каждые 1-2 месяца для поддержания актуальности.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-emerald-600 via-teal-600 to-green-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Icon name="Rocket" size={16} />
            Начните собирать семантику уже сегодня
          </div>
          <h2 className="text-6xl font-bold text-white mb-6 leading-tight">
            Попробуйте парсер<br />бесплатно
          </h2>
          <p className="text-2xl text-white/90 mb-10 leading-relaxed">
            1000 запросов бесплатно. Настройка за 2 минуты. Первая выгрузка — через 10 минут.
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
            Не требуется кредитная карта · Регистрация за 30 секунд
          </p>
        </div>
      </section>

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
                Автоматизация работы с Яндекс.Директ
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-lg">Инструменты</h4>
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
  );
}