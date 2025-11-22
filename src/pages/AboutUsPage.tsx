import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';
import LandingHeader from '@/components/LandingHeader';

export default function AboutUsPage() {
  const navigate = useNavigate();

  const team = [
    {
      name: 'Алексей Иванов',
      role: 'CEO & Founder',
      description: '10+ лет в контекстной рекламе, ex-руководитель PPC-отдела крупного агентства',
      icon: 'User',
      color: 'blue'
    },
    {
      name: 'Мария Петрова',
      role: 'Head of Product',
      description: 'Эксперт по автоматизации маркетинга, создала 15+ инструментов для Яндекс.Директ',
      icon: 'Sparkles',
      color: 'purple'
    },
    {
      name: 'Дмитрий Соколов',
      role: 'Lead Developer',
      description: 'Архитектор высоконагруженных систем, 8 лет опыта разработки SaaS-платформ',
      icon: 'Code',
      color: 'emerald'
    },
    {
      name: 'Анна Смирнова',
      role: 'Head of Support',
      description: 'Помогает клиентам достичь максимальных результатов, сертифицированный Яндекс.Директ специалист',
      icon: 'HeartHandshake',
      color: 'orange'
    }
  ];

  const values = [
    {
      title: 'Автоматизация',
      description: 'Мы верим, что рутинные задачи должны выполняться роботами, а специалисты — заниматься стратегией и творчеством',
      icon: 'Zap',
      color: 'emerald'
    },
    {
      title: 'Прозрачность',
      description: 'Честные цены, открытая документация, понятные метрики. Никаких скрытых платежей и сложных условий',
      icon: 'Eye',
      color: 'blue'
    },
    {
      title: 'Эффективность',
      description: 'Каждая функция DirectKit создана для реального роста бизнеса: снижение CPA, увеличение ROI, экономия времени',
      icon: 'TrendingUp',
      color: 'green'
    },
    {
      title: 'Поддержка',
      description: 'Мы на связи 24/7. Помогаем настроить, отвечаем на вопросы, делимся экспертизой в контекстной рекламе',
      icon: 'MessageCircle',
      color: 'purple'
    }
  ];

  const milestones = [
    { year: '2021', event: 'Запуск первой версии парсера WordStat', icon: 'Rocket' },
    { year: '2022', event: 'Добавлена автоматическая кластеризация запросов', icon: 'Grid3x3' },
    { year: '2023', event: 'Выпуск модуля автоматической чистки РСЯ', icon: 'ShieldCheck' },
    { year: '2024', event: '2500+ активных пользователей, 150M+ обработанных запросов', icon: 'Users' }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="О нас — DirectKit: команда, миссия и ценности"
        description="Узнайте больше о DirectKit: кто мы, наша миссия автоматизации Яндекс.Директ, команда экспертов и история создания платформы. Более 2500 клиентов доверяют нам оптимизацию контекстной рекламы."
        keywords="о directkit, команда directkit, история создания, миссия компании, эксперты яндекс директ"
        canonical="https://directkit.ru/about-us"
      />

      <LandingHeader />

      <section className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">О DirectKit</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Мы создаём инструменты, которые делают работу с Яндекс.Директ в 10 раз быстрее и эффективнее
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Наша миссия</h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                Мы верим, что контекстная реклама не должна отнимать недели работы на рутину. 
                Парсинг семантики, кластеризация запросов, чистка РСЯ — всё это можно и нужно автоматизировать.
              </p>
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                DirectKit родился из боли тысяч PPC-специалистов, которые тратят 80% времени 
                на механические задачи вместо стратегии и креатива. Мы создали платформу, 
                которая возвращает специалистам время и даёт бизнесу реальные результаты.
              </p>
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-xl">
                <p className="text-emerald-900 font-semibold text-lg">
                  "Автоматизировать рутину. Дать время на стратегию. Увеличить ROI в 10 раз."
                </p>
                <p className="text-emerald-700 mt-2">— Команда DirectKit</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-12 text-white shadow-2xl">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-5xl font-bold mb-2">2500+</div>
                  <p className="text-white/90">Активных пользователей</p>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2">150M+</div>
                  <p className="text-white/90">Запросов обработано</p>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2">-40%</div>
                  <p className="text-white/90">Средний CPA</p>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2">95%</div>
                  <p className="text-white/90">Экономия времени</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">Наши ценности</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const colors = getColorClasses(value.color);
                return (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardHeader>
                      <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center mb-4`}>
                        <Icon name={value.icon as any} size={32} className={colors.text} />
                      </div>
                      <CardTitle className="text-2xl mb-3">{value.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        {value.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">История развития</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative">
                  <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-emerald-300 transition-all">
                    <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                      <Icon name={milestone.icon as any} size={28} className="text-emerald-600" />
                    </div>
                    <div className="text-3xl font-bold text-emerald-600 mb-3">{milestone.year}</div>
                    <p className="text-slate-700 leading-relaxed">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">Наша команда</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => {
                const colors = getColorClasses(member.color);
                return (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardHeader>
                      <div className={`w-20 h-20 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Icon name={member.icon as any} size={40} className={colors.text} />
                      </div>
                      <CardTitle className="text-xl text-center mb-2">{member.name}</CardTitle>
                      <div className="text-emerald-600 font-semibold text-center mb-3">{member.role}</div>
                      <CardDescription className="text-sm leading-relaxed text-center">
                        {member.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Присоединяйтесь к нам</h2>
          <p className="text-xl text-slate-600 mb-10">
            Станьте частью сообщества специалистов, которые автоматизировали работу с Яндекс.Директ
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6"
            >
              <Icon name="Rocket" size={20} className="mr-2" />
              Попробовать бесплатно
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 border-2"
            >
              <Icon name="MessageCircle" size={20} className="mr-2" />
              Связаться с нами
            </Button>
          </div>
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
                Автоматизация Яндекс.Директ
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
  );
}
