import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';
import LandingHeader from '@/components/LandingHeader';

export default function BlogPage() {
  const navigate = useNavigate();

  const articles = [
    {
      id: 'kak-sobrat-semantiku-dlya-direkt',
      title: 'Как собрать семантику для Яндекс.Директ: пошаговое руководство',
      description: 'Подробная инструкция по сбору семантического ядра для контекстной рекламы. Методы, инструменты и лайфхаки для эффективного парсинга WordStat.',
      date: '2024-11-08',
      category: 'Руководства',
      readTime: '10 мин',
      icon: 'BookOpen',
      color: 'blue'
    },
    {
      id: 'klasterizaciya-zaprosov-chto-eto',
      title: 'Кластеризация запросов: что это и зачем нужно',
      description: 'Разбираем методы кластеризации ключевых слов, алгоритмы группировки по интентам и влияние на эффективность рекламных кампаний.',
      date: '2024-11-07',
      category: 'Аналитика',
      readTime: '8 мин',
      icon: 'Grid3x3',
      color: 'purple'
    },
    {
      id: 'operatory-sootvetstviya-yandex-direct',
      title: 'Операторы соответствия в Яндекс.Директ: полный гайд',
      description: 'Как правильно использовать операторы "фраза", [порядок], !форма и +предлог. Примеры применения и влияние на CTR и конверсию.',
      date: '2024-11-06',
      category: 'Оптимизация',
      readTime: '12 мин',
      icon: 'Code',
      color: 'orange'
    },
    {
      id: 'minus-slova-v-direkte',
      title: 'Минус-слова в Директе: как сэкономить 50% бюджета',
      description: 'Стратегии подбора минус-слов, кросс-минусовка групп объявлений и автоматизация процесса. Практические кейсы экономии рекламного бюджета.',
      date: '2024-11-05',
      category: 'Экономия',
      readTime: '9 мин',
      icon: 'Shield',
      color: 'red'
    },
    {
      id: 'chistka-rsya-ploshchadok',
      title: 'Чистка площадок РСЯ: методы и инструменты',
      description: 'Как выявить и заблокировать неэффективные площадки в рекламной сети Яндекса. Анализ метрик качества трафика и автоматизация мониторинга.',
      date: '2024-11-04',
      category: 'РСЯ',
      readTime: '11 мин',
      icon: 'Filter',
      color: 'green'
    },
    {
      id: 'snizhenie-cpc-yandex-direct',
      title: 'Снижение CPC в Яндекс.Директ: 10 рабочих методов',
      description: 'Проверенные способы уменьшить стоимость клика в контекстной рекламе. От правильной структуры до работы с операторами соответствия.',
      date: '2024-11-03',
      category: 'Оптимизация',
      readTime: '15 мин',
      icon: 'TrendingDown',
      color: 'emerald'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'text-orange-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-600' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'text-emerald-600' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="Блог DirectKit — Статьи о Яндекс.Директ, SEO и контекстной рекламе"
        description="Полезные статьи и руководства по работе с Яндекс.Директ, WordStat, кластеризации запросов, операторам соответствия, минус-словам и чистке РСЯ. Экспертные материалы для специалистов по контекстной рекламе."
        keywords="блог яндекс директ, статьи контекстная реклама, руководства wordstat, гайды по директу, обучение контекстной рекламе"
        canonical="https://directkit.ru/blog"
      />

      <LandingHeader />

      <section className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">Блог DirectKit</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Экспертные статьи и руководства по контекстной рекламе, семантике и оптимизации Яндекс.Директ
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => {
              const colors = getColorClasses(article.color);
              return (
                <Card 
                  key={article.id} 
                  className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => navigate(`/blog/${article.id}`)}
                >
                  <CardHeader>
                    <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon name={article.icon as any} size={28} className={colors.icon} />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-sm font-semibold ${colors.text}`}>{article.category}</span>
                      <span className="text-sm text-slate-500">•</span>
                      <span className="text-sm text-slate-500">{article.readTime}</span>
                    </div>
                    <CardTitle className="text-2xl mb-3 group-hover:text-emerald-600 transition-colors">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {article.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                      <Icon name="Calendar" size={16} />
                      <span>{new Date(article.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 text-slate-900">Хотите получать новые статьи?</h2>
          <p className="text-xl text-slate-600 mb-8">
            Подпишитесь на наш Telegram-канал и получайте полезные материалы по контекстной рекламе
          </p>
          <Button 
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6 h-auto"
          >
            <Icon name="Send" size={20} className="mr-2" />
            Подписаться на канал
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