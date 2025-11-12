import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';

export default function WordstatParserPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="Парсер WordStat Онлайн Бесплатно | Сбор Семантики из Яндекс Вордстат"
        description="Автоматический парсер WordStat для сбора ключевых слов. Парсинг Яндекс Вордстата с регионами, фильтрацией по частотности. Выгрузка wordstat в Excel. Быстрый сбор семантики онлайн без капчи."
        keywords="парсер wordstat, вордстат парсер, парсер яндекс wordstat онлайн, wordstat парсер бесплатно, сбор ключевых слов wordstat, парсинг вордстата, wordstat api парсер"
        canonical="https://directkit.ru/wordstat-parser"
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
            Попробовать бесплатно
          </Button>
        </div>
      </header>

      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">Парсер WordStat: Автоматический Сбор Семантики</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Соберите 10 000+ запросов из Яндекс WordStat за 30 минут. Парсинг с регионами, фильтрация по частотности, выгрузка в Excel без капчи и ограничений.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Как работает парсер WordStat</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-blue-100">
              <CardHeader>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="FileText" size={28} className="text-blue-600" />
                </div>
                <CardTitle className="text-2xl mb-3">1. Добавьте запросы</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Введите базовые ключевые слова для парсинга WordStat. Можно добавить несколько запросов сразу — система соберёт всю связанную семантику автоматически.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-purple-100">
              <CardHeader>
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Settings" size={28} className="text-purple-600" />
                </div>
                <CardTitle className="text-2xl mb-3">2. Настройте фильтры</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Выберите регион для парсинга Вордстата, минимальную частотность запросов и глубину сбора. Фильтруйте ненужные слова сразу при парсинге.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-green-100">
              <CardHeader>
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Download" size={28} className="text-green-600" />
                </div>
                <CardTitle className="text-2xl mb-3">3. Выгрузите результат</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Получите готовый файл Excel со всеми собранными запросами и частотностью. Сразу используйте для кластеризации или импорта в Директ.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Возможности парсера WordStat</h2>
          <p className="text-xl text-center text-slate-600 mb-12 max-w-3xl mx-auto">
            Всё необходимое для профессионального сбора семантики из Яндекс Вордстат
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <Icon name="MapPin" size={32} className="text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">Парсинг по регионам</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Соберите семантику для любого региона России. Парсер WordStat поддерживает все города и области — выберите нужный регион и получите локальную частотность запросов.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <Icon name="Filter" size={32} className="text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">Фильтрация по частотности</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Укажите минимальную частоту показов и парсер Вордстата автоматически отфильтрует редкие запросы. Собирайте только коммерчески выгодные ключевые слова.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <Icon name="Layers" size={32} className="text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">Глубокий парсинг</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Настройте глубину выгрузки WordStat — от базовых запросов до полного семантического ядра с хвостами. Соберите до 50 000 ключевых слов за один запуск.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <Icon name="Zap" size={32} className="text-orange-600 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">Без капчи и ограничений</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Парсер работает через API Яндекса — никаких капч, блокировок или лимитов. Быстрый и стабильный сбор семантики в автоматическом режиме 24/7.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <Icon name="FileSpreadsheet" size={32} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">Экспорт в Excel и CSV</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Выгружайте результаты парсинга WordStat в удобном формате. Готовые таблицы с запросами, частотностью и дополнительными метриками для анализа.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <Icon name="Clock" size={32} className="text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">Массовый сбор за минуты</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Парсер обрабатывает сотни запросов параллельно. То, что вручную занимает недели, DirectKit делает за 15-30 минут. Экономьте время на рутине.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Часто задаваемые вопросы</h2>
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Как собрать семантику из WordStat бесплатно?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  DirectKit предоставляет 1 день бесплатного доступа к парсеру WordStat без привязки карты. Вы сможете собрать неограниченное количество запросов и протестировать все функции парсинга Вордстата.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Сколько запросов можно собрать за один раз?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Парсер WordStat в DirectKit может собрать до 50 000 ключевых слов за один запуск. Ограничений по количеству запусков нет — собирайте столько семантики, сколько нужно для вашего проекта.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Парсер работает без капчи?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Да, наш парсер Яндекс WordStat использует официальный API и работает полностью автоматически без капчи, прокси и блокировок. Стабильный сбор данных 24/7.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Можно ли парсить WordStat по разным регионам?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Парсер поддерживает все регионы России. Вы можете собрать региональную частотность для Москвы, Санкт-Петербурга или любого другого города — выберите нужный регион в настройках парсинга.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">В каком формате выгружаются данные?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Результаты парсинга WordStat выгружаются в Excel (XLSX) и CSV форматах. Таблица содержит запросы, частотность, регион и другие параметры — готово к использованию в Директе или для кластеризации.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-blue-500 to-purple-500">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-5xl font-bold mb-6">Начните парсинг WordStat прямо сейчас</h2>
          <p className="text-xl mb-10 opacity-90">
            1 день бесплатного доступа • Без привязки карты • Неограниченный сбор семантики
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            variant="secondary"
            className="text-lg px-10 py-6 h-auto shadow-xl hover:scale-105 transition-transform"
          >
            Попробовать парсер бесплатно
            <Icon name="ArrowRight" size={20} className="ml-2" />
          </Button>
          <p className="text-sm mt-6 opacity-80">
            Более 500 специалистов уже используют DirectKit для сбора семантики
          </p>
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
          <p className="text-slate-400 mb-4">Парсер WordStat и инструменты для контекстной рекламы</p>
          <div className="border-t border-slate-800 pt-6 text-slate-400">
            <p>© 2024 DirectKit. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
