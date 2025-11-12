import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';

export default function ClusteringKeywordsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="Сегментация Ключевых Слов Онлайн | Группировка Запросов по Интентам"
        description="Автоматическая сегментация семантики для Яндекс.Директ. Группировка ключевых слов по интентам, сегментация по топ-10, soft и hard методы. Экспорт сегментов в Excel для импорта в Директ."
        keywords="сегментация ключевых слов, сегментация запросов онлайн, автоматическая сегментация, группировка ключевых слов, сегментатор семантики, сегментация по интентам"
        canonical="https://directkit.ru/clustering-keywords"
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
            Начать сегментацию
          </Button>
        </div>
      </header>

      <section className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">Сегментация Ключевых Слов: Умная Группировка Запросов</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Автоматическая сегментация семантического ядра по интентам пользователей. Группировка 50 000+ запросов за 5 минут для создания структуры рекламных кампаний Яндекс.Директ.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Что такое сегментация ключевых слов</h2>
          <p className="text-xl text-center text-slate-600 mb-12 max-w-4xl mx-auto">
            Сегментация запросов — это автоматическая группировка ключевых слов по общему смыслу и поисковой выдаче. Система анализирует топ-10 результатов поиска и объединяет запросы с похожими намерениями пользователей в одну группу.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-purple-100">
              <CardHeader>
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Upload" size={28} className="text-purple-600" />
                </div>
                <CardTitle className="text-2xl mb-3">Загрузите семантику</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Импортируйте ключевые слова из Excel или напрямую из парсера WordStat. Сегментизатор поддерживает любые объёмы — от 100 до 100 000 запросов.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-pink-100">
              <CardHeader>
                <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Grid3x3" size={28} className="text-pink-600" />
                </div>
                <CardTitle className="text-2xl mb-3">Получите сегменты</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Система автоматически сгруппирует запросы по интентам, проанализировав поисковую выдачу Яндекса. Настройте порог сегментизации под ваши цели.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-indigo-100">
              <CardHeader>
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Download" size={28} className="text-indigo-600" />
                </div>
                <CardTitle className="text-2xl mb-3">Экспортируйте в Директ</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Скачайте готовую структуру рекламных кампаний в Excel. Каждый сегмент — это отдельная группа объявлений с релевантными запросами.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Методы сегментизации запросов</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-purple-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="Sparkles" size={24} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">Soft сегментация</h3>
                  <p className="text-slate-600 text-lg leading-relaxed mb-4">
                    Мягкая группировка ключевых слов — один запрос может входить в несколько сегментов одновременно. Используется для широких тематик и информационных запросов.
                  </p>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start gap-2">
                      <Icon name="Check" size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Больше охват целевой аудитории</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="Check" size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Подходит для широких ниш</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="Check" size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Меньше пропущенных запросов</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-pink-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="Target" size={24} className="text-pink-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">Hard сегментация</h3>
                  <p className="text-slate-600 text-lg leading-relaxed mb-4">
                    Жёсткая группировка — каждый запрос попадает только в один сегмент. Оптимальна для коммерческих кампаний с чёткой структурой товаров или услуг.
                  </p>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start gap-2">
                      <Icon name="Check" size={20} className="text-pink-600 flex-shrink-0 mt-0.5" />
                      <span>Чёткая структура кампаний</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="Check" size={20} className="text-pink-600 flex-shrink-0 mt-0.5" />
                      <span>Нет дублирования запросов</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="Check" size={20} className="text-pink-600 flex-shrink-0 mt-0.5" />
                      <span>Проще управлять ставками</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-8 rounded-2xl text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="Brain" size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Сегментация по интентам</h3>
                <p className="text-lg leading-relaxed opacity-90">
                  Самый продвинутый метод группировки ключевых слов. Система определяет намерение пользователя (купить, узнать, сравнить, найти) и создаёт сегменты на основе поведенческих факторов. Идеально для e-commerce и услуг.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Возможности сегментизатора</h2>
          <p className="text-xl text-center text-slate-600 mb-12 max-w-3xl mx-auto">
            Профессиональные инструменты для работы с семантическим ядром
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Sliders" size={24} className="text-blue-600" />
                </div>
                <CardTitle className="text-xl">Настройка порога</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Гибкая настройка точности сегментизации от 1 до 10. Чем выше порог — тем строже группировка запросов.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Search" size={24} className="text-green-600" />
                </div>
                <CardTitle className="text-xl">Анализ топ-10 и топ-30</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Выберите глубину анализа поисковой выдачи. Топ-10 — строже, топ-30 — больше совпадений между запросами.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Users" size={24} className="text-purple-600" />
                </div>
                <CardTitle className="text-xl">Группировка по смыслу</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Семантическая сегментация учитывает синонимы и близкие по смыслу запросы для точной группировки.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Minus" size={24} className="text-orange-600" />
                </div>
                <CardTitle className="text-xl">Автоматические минус-слова</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Сегментизатор подбирает минус-слова для кросс-минусовки между группами объявлений.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="MapPin" size={24} className="text-red-600" />
                </div>
                <CardTitle className="text-xl">Региональная сегментация</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Группировка запросов с учётом региональной специфики для мультирегиональных кампаний.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="FileSpreadsheet" size={24} className="text-teal-600" />
                </div>
                <CardTitle className="text-xl">Экспорт сегментов</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Выгрузка готовых сегментов в Excel для импорта в Яндекс.Директ или дальнейшей обработки.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Вопросы о сегментизации</h2>
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Зачем нужна сегментация ключевых слов?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Сегментация запросов позволяет создать правильную структуру рекламных кампаний в Яндекс.Директ. Каждая группа объявлений содержит запросы с одинаковым интентом, что повышает CTR, Quality Score и снижает стоимость клика на 30-50%.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Как работает автоматическая сегментация?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Система отправляет каждый запрос в Яндекс, анализирует топ-10 результатов поиска и сравнивает их между собой. Если два запроса показывают похожие сайты в выдаче — они попадают в один сегмент. Это называется сегментация по поисковой выдаче.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Сколько времени занимает группировка ключевых слов?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Сегментация 1000 запросов занимает около 3-5 минут, 10 000 запросов — 20-30 минут, 50 000 запросов — до 2 часов. Скорость зависит от количества запросов и выбранного метода сегментизации (soft или hard).
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Какой порог сегментизации выбрать?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Для коммерческих запросов рекомендуем порог 4-5 (строгая группировка). Для информационных — 2-3 (мягкая группировка). Можно экспериментировать и смотреть на результат — DirectKit позволяет перезапустить сегментизацию с другими настройками за минуту.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Можно ли сегментизовать семантику для Google Ads?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Да, сегментизатор работает на основе поисковой выдачи Яндекса, но полученные группы запросов подходят и для Google Ads, и для VK Рекламы. Просто адаптируйте операторы соответствия под выбранную платформу.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-purple-500 to-pink-500">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-5xl font-bold mb-6">Начните сегментизацию прямо сейчас</h2>
          <p className="text-xl mb-10 opacity-90">
            1 день бесплатного доступа • Без привязки карты • Неограниченная сегментация
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
            Более 500 специалистов используют DirectKit для сегментизации семантики
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
          <p className="text-slate-400 mb-4">Сегментация ключевых слов и инструменты для Яндекс.Директ</p>
          <div className="border-t border-slate-800 pt-6 text-slate-400">
            <p>© 2024 DirectKit. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}