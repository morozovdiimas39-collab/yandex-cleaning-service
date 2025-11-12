import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';

export default function MinusWordsGeneratorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="Генератор Минус-Слов для Яндекс.Директ | Подбор и Кросс-Минусовка"
        description="Автоматический генератор минус-слов для Яндекс.Директ. Подбор минус-фраз из поисковых запросов. Кросс-минусовка между кампаниями. Готовые списки минус-слов для товаров и услуг. Снизьте расход бюджета на нецелевые клики."
        keywords="минус слова яндекс директ, генератор минус слов, подбор минус слов, кросс минусовка директ, минус фразы, списки минус слов"
        canonical="https://directkit.ru/minus-words-generator"
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
            Подобрать минус-слова
          </Button>
        </div>
      </header>

      <section className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">Генератор Минус-Слов для Яндекс.Директ</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Автоматический подбор минус-слов из поисковых запросов. Кросс-минусовка между группами и кампаниями. Готовые списки универсальных минус-фраз. Экономьте до 40% бюджета на отсечении нецелевого трафика.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Как работает генератор минус-слов</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-red-100">
              <CardHeader>
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Upload" size={28} className="text-red-600" />
                </div>
                <CardTitle className="text-2xl mb-3">1. Загрузите запросы</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Импортируйте данные из Яндекс.Метрики, статистики поисковых запросов Директа или просто добавьте свои ключевые слова для анализа.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-rose-100">
              <CardHeader>
                <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Sparkles" size={28} className="text-rose-600" />
                </div>
                <CardTitle className="text-2xl mb-3">2. Система проанализирует</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Генератор найдёт все нецелевые слова: "бесплатно", "своими руками", "работа", "вакансии", "скачать", "отзывы" и сотни других стоп-слов.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-pink-100">
              <CardHeader>
                <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Download" size={28} className="text-pink-600" />
                </div>
                <CardTitle className="text-2xl mb-3">3. Получите минус-слова</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Скачайте готовый список минус-фраз в Excel или импортируйте напрямую в Яндекс.Директ. Кросс-минусовка между группами — автоматически.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Что такое минус-слова и зачем они нужны</h2>
          <p className="text-xl text-center text-slate-600 mb-12 max-w-4xl mx-auto">
            Минус-слова (стоп-слова) в Яндекс.Директ — это список слов, при наличии которых в поисковом запросе ваша реклама НЕ показывается. Они отсекают нецелевой трафик и экономят бюджет.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-green-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="CheckCircle2" size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-green-700">С минус-словами</h3>
                  <p className="text-slate-600 text-lg leading-relaxed mb-4">
                    Ваша реклама показывается только целевой аудитории. Высокий CTR, низкий CPC, хорошая конверсия. Бюджет тратится эффективно.
                  </p>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 font-semibold mb-2">Пример запроса:</p>
                    <p className="text-green-700 font-mono">"купить iphone 15 pro"</p>
                    <p className="text-xs text-slate-500 mt-2">✅ Целевой запрос — клиент готов покупать</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-red-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="XCircle" size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-red-700">Без минус-слов</h3>
                  <p className="text-slate-600 text-lg leading-relaxed mb-4">
                    Реклама показывается на любые запросы, включая нецелевые. Бюджет сливается на пустые клики. Низкий ROI и высокая стоимость лида.
                  </p>
                  <div className="bg-red-50 p-4 rounded-xl space-y-2">
                    <div>
                      <p className="text-red-700 font-mono text-sm">"купить iphone 15 pro чехол"</p>
                      <p className="text-xs text-slate-500">❌ Нецелевой — ищет аксессуары</p>
                    </div>
                    <div>
                      <p className="text-red-700 font-mono text-sm">"купить iphone 15 pro б/у"</p>
                      <p className="text-xs text-slate-500">❌ Нецелевой — ищет б/у</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Возможности генератора</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Database" size={24} className="text-blue-600" />
                </div>
                <CardTitle className="text-xl">Готовые списки</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Универсальные минус-слова для любой ниши: бесплатно, своими руками, работа, вакансии, скачать, отзывы и 500+ других.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Shuffle" size={24} className="text-purple-600" />
                </div>
                <CardTitle className="text-xl">Кросс-минусовка</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Автоматическая кросс-минусовка между группами объявлений и кампаниями. Избегайте конкуренции с самим собой.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Search" size={24} className="text-green-600" />
                </div>
                <CardTitle className="text-xl">Анализ запросов</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Подбор минус-слов из статистики поисковых запросов Директа и Метрики. Находите реальные нецелевые клики.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Target" size={24} className="text-orange-600" />
                </div>
                <CardTitle className="text-xl">Шаблоны по нишам</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Специализированные списки минус-слов для e-commerce, услуг B2B, B2C, недвижимости, туризма и других ниш.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Filter" size={24} className="text-red-600" />
                </div>
                <CardTitle className="text-xl">Минус-фразы</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Не только отдельные слова, но и целые минус-фразы. Например: "своими руками", "б/у недорого", "работа вакансии".
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="FileSpreadsheet" size={24} className="text-teal-600" />
                </div>
                <CardTitle className="text-xl">Экспорт списков</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Выгрузка минус-слов в Excel для импорта в Яндекс.Директ. Поддержка общих и персональных минус-слов.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Универсальные минус-слова</h2>
          <p className="text-xl text-center text-slate-600 mb-12 max-w-3xl mx-auto">
            Готовые списки минус-слов, которые подходят для большинства коммерческих кампаний
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Icon name="Ban" size={24} className="text-red-600" />
                Информационные запросы
              </h3>
              <p className="text-slate-600 mb-4">Отсекают пользователей, которые ищут информацию, а не товар/услугу:</p>
              <div className="flex flex-wrap gap-2">
                {['что такое', 'как сделать', 'своими руками', 'самостоятельно', 'инструкция', 'пошагово', 'видео', 'урок', 'обучение', 'курсы', 'статья', 'блог'].map(word => (
                  <span key={word} className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Icon name="DollarSign" size={24} className="text-orange-600" />
                Ценовые исключения
              </h3>
              <p className="text-slate-600 mb-4">Отсекают поиск бесплатного или очень дешёвого:</p>
              <div className="flex flex-wrap gap-2">
                {['бесплатно', 'даром', 'безвозмездно', 'дёшево', 'недорого', 'за копейки', 'распродажа', 'акция', 'скидка', 'промокод', 'купон'].map(word => (
                  <span key={word} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium">
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Icon name="Briefcase" size={24} className="text-blue-600" />
                Работа и вакансии
              </h3>
              <p className="text-slate-600 mb-4">Исключают поиск работы и вакансий:</p>
              <div className="flex flex-wrap gap-2">
                {['работа', 'вакансия', 'вакансии', 'резюме', 'зарплата', 'устроиться', 'требуется', 'ищу работу', 'hh.ru', 'superjob'].map(word => (
                  <span key={word} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Icon name="Download" size={24} className="text-purple-600" />
                Загрузки и пиратство
              </h3>
              <p className="text-slate-600 mb-4">Блокируют поиск пиратского контента:</p>
              <div className="flex flex-wrap gap-2">
                {['скачать', 'торрент', 'бесплатно скачать', 'download', 'crack', 'взлом', 'пиратка', 'кряк', 'активация'].map(word => (
                  <span key={word} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Icon name="Star" size={24} className="text-pink-600" />
                Отзывы и обзоры
              </h3>
              <p className="text-slate-600 mb-4">Для тех, кто не продаёт информацию:</p>
              <div className="flex flex-wrap gap-2">
                {['отзывы', 'отзыв', 'обзор', 'мнение', 'рейтинг', 'сравнение', 'форум', 'обсуждение', 'комментарии'].map(word => (
                  <span key={word} className="px-3 py-1 bg-pink-50 text-pink-700 rounded-lg text-sm font-medium">
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Icon name="Wrench" size={24} className="text-green-600" />
                Б/у и ремонт
              </h3>
              <p className="text-slate-600 mb-4">Для продавцов нового товара:</p>
              <div className="flex flex-wrap gap-2">
                {['б/у', 'бу', 'бывший', 'поломка', 'сломался', 'ремонт', 'починить', 'запчасти', 'разборка', 'авито'].map(word => (
                  <span key={word} className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Что такое кросс-минусовка</h2>
          <p className="text-xl text-center text-slate-600 mb-12 max-w-3xl mx-auto">
            Кросс-минусовка — это добавление минус-слов между группами объявлений, чтобы они не конкурировали друг с другом в аукционе.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border-2 border-blue-200 mb-8">
            <h3 className="text-2xl font-bold mb-4">Пример проблемы без кросс-минусовки:</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl">
                <p className="font-semibold text-blue-700 mb-2">Группа 1: "купить iphone"</p>
                <p className="text-slate-600">Запросы: купить iphone, iphone купить, купить айфон</p>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <p className="font-semibold text-purple-700 mb-2">Группа 2: "купить iphone 15"</p>
                <p className="text-slate-600">Запросы: купить iphone 15, iphone 15 купить, купить айфон 15</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                <p className="font-semibold text-red-700 mb-2">⚠️ Проблема:</p>
                <p className="text-slate-700">На запрос "купить iphone 15 pro" показываются ОБЕ группы → они конкурируют → повышается CPC → вы платите больше сами себе!</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl border-2 border-green-200">
            <h3 className="text-2xl font-bold mb-4">Решение с кросс-минусовкой:</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl">
                <p className="font-semibold text-green-700 mb-2">Группа 1: "купить iphone"</p>
                <p className="text-slate-600">Минус-слова: 15, 14, 13, pro, max</p>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <p className="font-semibold text-green-700 mb-2">Группа 2: "купить iphone 15"</p>
                <p className="text-slate-600">Минус-слова: 14, 13, 12, (без "15")</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                <p className="font-semibold text-green-700 mb-2">✅ Результат:</p>
                <p className="text-slate-700">Каждая группа показывается на свои запросы → нет конкуренции → CPC ниже на 30-40% → экономия бюджета!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Вопросы о минус-словах</h2>
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Сколько минус-слов нужно добавить?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Минимум — 50-100 универсальных минус-слов (бесплатно, работа, своими руками). Оптимально — 300-500 минус-слов с учётом специфики ниши. Максимум в Директе — 20 000 минус-слов на кампанию.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Как часто обновлять минус-слова?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Анализируйте статистику поисковых запросов в Директе раз в неделю и добавляйте новые минус-слова. DirectKit автоматически подбирает минус-слова из отчётов Метрики и Директа — проверяйте раз в 7-10 дней.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Что такое общие и персональные минус-слова?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Общие минус-слова применяются ко всем группам объявлений в кампании (например, "бесплатно", "работа"). Персональные — только к конкретной группе (например, минус-слово "15" для группы с запросами про iPhone 14).
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Можно ли использовать минус-фразы?</CardTitle>
                <CardDescription className="text-base leading-relaxed pt-2">
                  Да, Яндекс.Директ поддерживает минус-фразы из нескольких слов. Например, минус-фраза "своими руками" отсечёт любые запросы с этой комбинацией. DirectKit автоматически генерирует популярные минус-фразы для вашей ниши.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-red-500 to-pink-500">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-5xl font-bold mb-6">Начните экономить на минус-словах</h2>
          <p className="text-xl mb-10 opacity-90">
            1 день бесплатного доступа • Готовые списки • Кросс-минусовка • Экономия до 40% бюджета
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            variant="secondary"
            className="text-lg px-10 py-6 h-auto shadow-xl hover:scale-105 transition-transform"
          >
            Попробовать генератор
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
          <p className="text-slate-400 mb-4">Генератор минус-слов и инструменты для Яндекс.Директ</p>
          <div className="border-t border-slate-800 pt-6 text-slate-400">
            <p>© 2024 DirectKit. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
