import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';

export default function YandexDirectOperatorsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="Операторы Соответствия Яндекс.Директ | Фраза Порядок Форма Предлог"
        description="Полное руководство по операторам соответствия Яндекс.Директ: фраза, порядок, форма, предлог. Как использовать операторы для снижения CPC и повышения CTR. Примеры и лучшие практики."
        keywords="операторы яндекс директ, операторы соответствия, фраза директ, порядок слов директ, форма слова директ, предлог директ, как использовать операторы директ"
        canonical="https://directkit.ru/yandex-direct-operators"
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
            Начать работу
          </Button>
        </div>
      </header>

      <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">Операторы Соответствия Яндекс.Директ</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Полное руководство по операторам "фраза", [порядок], !форма и +предлог для точного таргетинга в контекстной рекламе. Снизьте CPC на 30-50% с правильным использованием операторов.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Основные операторы Яндекс.Директ</h2>
          
          <div className="space-y-8">
            <Card className="border-2 border-orange-100 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <code className="text-white text-2xl font-bold">" "</code>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-3">Оператор "фраза" (кавычки)</CardTitle>
                    <CardDescription className="text-lg leading-relaxed">
                      Фразовое соответствие — реклама показывается на запросы, которые содержат все слова ключевой фразы в любом порядке и с любыми словоформами.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-slate-50 p-6 rounded-xl mb-4">
                  <p className="text-sm text-slate-600 mb-2 font-semibold">Пример:</p>
                  <code className="text-lg text-orange-600 font-mono">"купить кроссовки nike"</code>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                      <Icon name="Check" size={20} />
                      Покажется на запросы:
                    </p>
                    <ul className="space-y-1 text-slate-600">
                      <li>• купить кроссовки nike мужские</li>
                      <li>• кроссовки nike купить в москве</li>
                      <li>• где купить кроссовки найк</li>
                      <li>• кроссовок nike купить дешево</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                      <Icon name="X" size={20} />
                      НЕ покажется:
                    </p>
                    <ul className="space-y-1 text-slate-600">
                      <li>• купить кроссовки adidas</li>
                      <li>• кроссовки для бега</li>
                      <li>• купить найк</li>
                      <li>• обувь nike</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <code className="text-white text-2xl font-bold">[ ]</code>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-3">Оператор [порядок] (квадратные скобки)</CardTitle>
                    <CardDescription className="text-lg leading-relaxed">
                      Фиксация порядка слов — показы только на запросы, где слова идут строго в указанном порядке. Можно комбинировать с кавычками.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-slate-50 p-6 rounded-xl mb-4">
                  <p className="text-sm text-slate-600 mb-2 font-semibold">Пример:</p>
                  <code className="text-lg text-blue-600 font-mono">"[квартиры москва] цены"</code>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                      <Icon name="Check" size={20} />
                      Покажется:
                    </p>
                    <ul className="space-y-1 text-slate-600">
                      <li>• квартиры москва цены 2024</li>
                      <li>• квартиры москва центр цены</li>
                      <li>• купить квартиры москва цены</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                      <Icon name="X" size={20} />
                      НЕ покажется:
                    </p>
                    <ul className="space-y-1 text-slate-600">
                      <li>• москва квартиры цены</li>
                      <li>• цены квартиры москва</li>
                      <li>• цены на квартиры в москве</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <code className="text-white text-2xl font-bold">!</code>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-3">Оператор !форма (восклицательный знак)</CardTitle>
                    <CardDescription className="text-lg leading-relaxed">
                      Фиксация словоформы — реклама показывается только на запросы с точной формой слова (падеж, число). Используется для исключения нецелевых форм.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-slate-50 p-6 rounded-xl mb-4">
                  <p className="text-sm text-slate-600 mb-2 font-semibold">Пример:</p>
                  <code className="text-lg text-purple-600 font-mono">"!ремонт квартир"</code>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                      <Icon name="Check" size={20} />
                      Покажется:
                    </p>
                    <ul className="space-y-1 text-slate-600">
                      <li>• ремонт квартир под ключ</li>
                      <li>• ремонт квартир цены</li>
                      <li>• ремонт квартир москва</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                      <Icon name="X" size={20} />
                      НЕ покажется:
                    </p>
                    <ul className="space-y-1 text-slate-600">
                      <li>• ремонта квартир (родительный падеж)</li>
                      <li>• ремонту квартир (дательный падеж)</li>
                      <li>• ремонтом квартир (творительный)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <code className="text-white text-2xl font-bold">+</code>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-3">Оператор +предлог (плюс)</CardTitle>
                    <CardDescription className="text-lg leading-relaxed">
                      Обязательное присутствие слова — показы только когда указанный предлог или стоп-слово точно присутствует в запросе пользователя.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-slate-50 p-6 rounded-xl mb-4">
                  <p className="text-sm text-slate-600 mb-2 font-semibold">Пример:</p>
                  <code className="text-lg text-green-600 font-mono">"доставка +из москвы"</code>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                      <Icon name="Check" size={20} />
                      Покажется:
                    </p>
                    <ul className="space-y-1 text-slate-600">
                      <li>• доставка из москвы по россии</li>
                      <li>• быстрая доставка из москвы</li>
                      <li>• доставка товаров из москвы</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                      <Icon name="X" size={20} />
                      НЕ покажется:
                    </p>
                    <ul className="space-y-1 text-slate-600">
                      <li>• доставка в москву</li>
                      <li>• доставка по москве</li>
                      <li>• доставка москва</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Когда использовать операторы соответствия</h2>
          <p className="text-xl text-center text-slate-600 mb-12 max-w-3xl mx-auto">
            Правильный выбор операторов снижает стоимость клика и повышает конверсию
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="TrendingDown" size={24} className="text-orange-600" />
                </div>
                <CardTitle className="text-xl">Снижение CPC</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Операторы фраза и порядок отсекают нецелевые показы, что снижает стоимость клика на 30-50%. Особенно эффективно в высококонкурентных нишах.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Target" size={24} className="text-blue-600" />
                </div>
                <CardTitle className="text-xl">Точный таргетинг</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Операторы форма и предлог позволяют показываться строго целевой аудитории. Меньше кликов, но выше качество трафика и конверсия.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="BarChart" size={24} className="text-purple-600" />
                </div>
                <CardTitle className="text-xl">Повышение CTR</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Правильное использование операторов соответствия повышает релевантность объявлений, что увеличивает CTR и показатель качества в Директе.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Лучшие практики операторов</h2>
          <p className="text-xl text-center text-slate-600 mb-12 max-w-3xl mx-auto">
            Как комбинировать операторы для максимальной эффективности
          </p>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-8 rounded-2xl border-2 border-orange-100">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Icon name="Lightbulb" size={28} className="text-orange-600" />
                Комбинирование операторов
              </h3>
              <p className="text-lg text-slate-700 mb-4">
                Операторы можно комбинировать для ещё более точного таргетинга. Например:
              </p>
              <div className="bg-white p-4 rounded-xl">
                <code className="text-lg text-orange-600 font-mono">"[!купить кроссовки] +в москве"</code>
              </div>
              <p className="text-slate-600 mt-4">
                Этот запрос покажется только на "купить кроссовки в москве" со словом "купить" в именительном падеже, словами в указанном порядке и обязательным предлогом "в".
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border-2 border-blue-100">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Icon name="AlertCircle" size={28} className="text-blue-600" />
                Частые ошибки
              </h3>
              <ul className="space-y-3 text-lg text-slate-700">
                <li className="flex items-start gap-3">
                  <Icon name="X" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span><strong>Чрезмерное использование операторов</strong> — слишком строгий таргетинг может обнулить охват</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="X" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span><strong>Игнорирование тестов</strong> — всегда тестируйте варианты с операторами и без через A/B-тесты</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="X" size={20} className="text-red-500 flex-shrink-0 mt-1" />
                  <span><strong>Неправильный синтаксис</strong> — пробелы внутри операторов ["купить дом"] работают не так как [купить дом]</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl border-2 border-green-100">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Icon name="CheckCircle2" size={28} className="text-green-600" />
                Рекомендации по нишам
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-slate-700">
                <div>
                  <p className="font-semibold mb-2">E-commerce (интернет-магазины):</p>
                  <p className="text-base">Используйте фразу + форма для товарных запросов. Например: <code className="bg-white px-2 py-1 rounded text-sm">"!купить !телефон samsung"</code></p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Услуги (B2B/B2C):</p>
                  <p className="text-base">Фраза + предлог для географического таргетинга. Например: <code className="bg-white px-2 py-1 rounded text-sm">"ремонт +в москве"</code></p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Высокая конкуренция:</p>
                  <p className="text-base">Комбинируйте все операторы для снижения CPC. Строгий таргетинг = дешевле клики.</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Низкая конкуренция:</p>
                  <p className="text-base">Достаточно фразы или вообще без операторов. Широкий охват при низкой стоимости.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Вопросы об операторах</h2>
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Какой оператор выбрать для начала?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Начните с оператора "фраза" — он даёт оптимальный баланс между охватом и точностью. Потом добавляйте другие операторы по мере анализа статистики и нецелевых показов.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Насколько операторы снижают стоимость клика?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  В среднем правильное использование операторов соответствия снижает CPC на 30-50% в высококонкурентных нишах. В низкоконкурентных эффект может быть меньше, но CTR и конверсия всё равно растут.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Можно ли использовать все операторы сразу?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Можно, но будьте осторожны — слишком строгий таргетинг может обнулить показы. Рекомендуем комбинировать максимум 2-3 оператора и тестировать результаты через A/B-тесты в Директе.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Как автоматизировать добавление операторов?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  DirectKit автоматически применяет операторы соответствия к кластеризованной семантике. Система анализирует запросы и подбирает оптимальные операторы для каждой группы — экономия времени в 10 раз.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-5xl font-bold mb-6">Начните использовать операторы правильно</h2>
          <p className="text-xl mb-10 opacity-90">
            1 день бесплатного доступа • Автоматическое применение операторов • Снижение CPC до 50%
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            variant="secondary"
            className="text-lg px-10 py-6 h-auto shadow-xl hover:scale-105 transition-transform"
          >
            Попробовать DirectKit
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
          <p className="text-slate-400 mb-4">Инструменты для работы с Яндекс.Директ</p>
          <div className="border-t border-slate-800 pt-6 text-slate-400">
            <p>© 2024 DirectKit. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}