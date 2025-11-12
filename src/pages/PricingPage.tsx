import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="Цены и Тарифы DirectKit — Парсер WordStat и Кластеризация от 1990₽"
        description="Прозрачное ценообразование на инструменты для Яндекс.Директ. Парсер WordStat, кластеризация запросов, чистка РСЯ. 7 дней бесплатно, от 1990₽/месяц без скрытых платежей."
        keywords="directkit цена, стоимость парсера wordstat, тариф кластеризация, цены на инструменты директ, сколько стоит парсинг wordstat"
        canonical="https://directkit.ru/pricing"
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

      <section className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">Прозрачные Цены и Тарифы</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Все инструменты для работы с Яндекс.Директ в одной подписке. Без скрытых платежей и комиссий.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 border-slate-200 shadow-lg">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="Zap" size={32} className="text-slate-600" />
                </div>
                <CardTitle className="text-2xl mb-2">Триал</CardTitle>
                <CardDescription className="text-base">Протестируйте все возможности</CardDescription>
                <div className="mt-6">
                  <div className="text-5xl font-bold text-slate-900">0₽</div>
                  <div className="text-slate-600 mt-2">7 дней бесплатно</div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full bg-slate-600 hover:bg-slate-700 mb-6"
                  size="lg"
                >
                  Начать бесплатно
                </Button>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Полный доступ ко всем инструментам</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Без привязки карты</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Неограниченный парсинг</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Техподдержка в Telegram</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-500 shadow-2xl relative transform md:scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Популярный
              </div>
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="Rocket" size={32} className="text-emerald-600" />
                </div>
                <CardTitle className="text-2xl mb-2">Месячная подписка</CardTitle>
                <CardDescription className="text-base">Для постоянной работы</CardDescription>
                <div className="mt-6">
                  <div className="text-5xl font-bold text-slate-900">1990₽</div>
                  <div className="text-slate-600 mt-2">в месяц</div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 mb-6"
                  size="lg"
                >
                  Купить подписку
                </Button>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Все функции триала</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Неограниченное количество проектов</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Приоритетная поддержка</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Обновления и новые функции</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Отмена в любой момент</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="Building" size={32} className="text-blue-600" />
                </div>
                <CardTitle className="text-2xl mb-2">Для агентств</CardTitle>
                <CardDescription className="text-base">Индивидуальные условия</CardDescription>
                <div className="mt-6">
                  <div className="text-3xl font-bold text-slate-900">По запросу</div>
                  <div className="text-slate-600 mt-2">от 5 пользователей</div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 mb-6"
                  size="lg"
                >
                  Связаться с нами
                </Button>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Все функции подписки</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Мультиаккаунт для команды</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Персональный менеджер</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Обучение и онбординг</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Индивидуальные настройки</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Что входит в подписку DirectKit</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <Icon name="Database" size={32} className="text-blue-600 mb-3" />
                <CardTitle className="text-xl">Парсер WordStat</CardTitle>
                <CardDescription className="text-base">
                  Неограниченный сбор семантики с выбором региона и фильтрацией по частотности
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <Icon name="Grid3x3" size={32} className="text-purple-600 mb-3" />
                <CardTitle className="text-xl">Кластеризация</CardTitle>
                <CardDescription className="text-base">
                  Автоматическая группировка запросов по интентам для структуры кампаний
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <Icon name="Code" size={32} className="text-orange-600 mb-3" />
                <CardTitle className="text-xl">Операторы соответствия</CardTitle>
                <CardDescription className="text-base">
                  Автоматическое применение всех операторов Яндекс.Директ к запросам
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <Icon name="Shield" size={32} className="text-red-600 mb-3" />
                <CardTitle className="text-xl">Генератор минус-слов</CardTitle>
                <CardDescription className="text-base">
                  Умный подбор минус-слов и кросс-минусовка между группами объявлений
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <Icon name="Filter" size={32} className="text-green-600 mb-3" />
                <CardTitle className="text-xl">Чистка РСЯ</CardTitle>
                <CardDescription className="text-base">
                  Автоматический мониторинг и блокировка неэффективных площадок РСЯ
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <Icon name="FileSpreadsheet" size={32} className="text-emerald-600 mb-3" />
                <CardTitle className="text-xl">Экспорт в Excel</CardTitle>
                <CardDescription className="text-base">
                  Выгрузка всех данных в удобных форматах для импорта в Яндекс.Директ
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Вопросы о ценах</h2>
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Можно ли отменить подписку?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Да, вы можете отменить подписку в любой момент без объяснения причин. Доступ сохранится до конца оплаченного периода.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Есть ли скидки при годовой оплате?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Да, при оплате за год вы получаете скидку 20% — годовая подписка стоит 19 000₽ вместо 23 880₽.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Какие способы оплаты доступны?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Принимаем оплату банковскими картами (Visa, MasterCard, Мир), электронными кошельками, СБП и по счёту для юридических лиц.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Есть ли возврат средств?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Мы возвращаем полную стоимость, если вы не удовлетворены сервисом в течение первых 14 дней после оплаты.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-emerald-500 to-green-500">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-5xl font-bold mb-6">Начните с бесплатного триала</h2>
          <p className="text-xl mb-10 opacity-90">
            7 дней полного доступа ко всем инструментам • Без привязки карты
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
          <p className="text-slate-400 mb-4">Инструменты для контекстной рекламы</p>
          <div className="border-t border-slate-800 pt-6 text-slate-400">
            <p>© 2024 DirectKit. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
