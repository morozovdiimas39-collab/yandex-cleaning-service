import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="О нас — DirectKit: Автоматизация работы с Яндекс.Директ"
        description="DirectKit — профессиональная платформа для автоматизации контекстной рекламы. Создана специалистами по Директу для специалистов. Более 500 активных пользователей, 10М+ собранных запросов."
        keywords="о directkit, команда directkit, создатели парсера wordstat, о компании"
        canonical="https://directkit.ru/about"
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
            <h1 className="text-5xl font-bold text-slate-900 mb-6">О DirectKit</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Автоматизируем рутинные задачи специалистов по контекстной рекламе с 2021 года
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Наша миссия</h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Мы создаём инструменты, которые освобождают специалистов по контекстной рекламе от рутинных задач. 
                Вместо того, чтобы тратить дни на парсинг WordStat и ручную кластеризацию, наши пользователи 
                фокусируются на стратегии и креативе.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                DirectKit — это не просто набор инструментов. Это экосистема для профессиональной работы с 
                Яндекс.Директ, созданная специалистами для специалистов на основе реального опыта работы 
                с сотнями рекламных кампаний.
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl p-8 flex items-center justify-center">
              <Icon name="Target" size={120} className="text-emerald-600 opacity-50" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="text-5xl font-bold text-emerald-600 mb-3">500+</div>
                <CardTitle className="text-xl mb-2">Активных пользователей</CardTitle>
                <CardDescription className="text-base">
                  Специалисты и агентства по всей России
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="text-5xl font-bold text-emerald-600 mb-3">10М+</div>
                <CardTitle className="text-xl mb-2">Собранных запросов</CardTitle>
                <CardDescription className="text-base">
                  Из WordStat через наш парсер
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="text-5xl font-bold text-emerald-600 mb-3">2021</div>
                <CardTitle className="text-xl mb-2">Год основания</CardTitle>
                <CardDescription className="text-base">
                  3 года опыта в автоматизации Директа
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">История создания</h2>
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Проблема</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Основатели DirectKit работали в агентстве контекстной рекламы и каждый день сталкивались 
                  с рутинной работой: парсинг WordStat вручную занимал часы, кластеризация запросов — дни, 
                  чистка РСЯ требовала постоянного мониторинга. На креатив и стратегию не оставалось времени.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Решение</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  В 2021 году мы создали первую версию парсера WordStat для внутреннего использования. 
                  Инструмент сокращал время сбора семантики с нескольких дней до 30 минут. Результат был 
                  настолько впечатляющим, что коллеги из других агентств попросили доступ.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Развитие</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Мы добавили кластеризацию, операторы соответствия, генератор минус-слов и чистку РСЯ. 
                  Каждая функция решает реальную боль специалистов по Директу. DirectKit превратился в 
                  полноценную платформу для автоматизации контекстной рекламы.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Сегодня</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Более 500 специалистов и агентств используют DirectKit ежедневно. Мы собрали более 
                  10 миллионов запросов, помогли оптимизировать тысячи рекламных кампаний и продолжаем 
                  развивать платформу на основе обратной связи пользователей.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">Наши ценности</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Zap" size={28} className="text-blue-600" />
                </div>
                <CardTitle className="text-xl mb-3">Скорость</CardTitle>
                <CardDescription className="text-base">
                  Автоматизация должна экономить время, а не создавать новые проблемы
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Shield" size={28} className="text-purple-600" />
                </div>
                <CardTitle className="text-xl mb-3">Надёжность</CardTitle>
                <CardDescription className="text-base">
                  Стабильная работа 24/7 без ошибок и сбоев
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="Users" size={28} className="text-green-600" />
                </div>
                <CardTitle className="text-xl mb-3">Поддержка</CardTitle>
                <CardDescription className="text-base">
                  Всегда на связи и готовы помочь решить любые вопросы
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon name="TrendingUp" size={28} className="text-orange-600" />
                </div>
                <CardTitle className="text-xl mb-3">Развитие</CardTitle>
                <CardDescription className="text-base">
                  Постоянные обновления и новые функции на основе обратной связи
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-emerald-500 to-green-500">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-5xl font-bold mb-6">Присоединяйтесь к DirectKit</h2>
          <p className="text-xl mb-10 opacity-90">
            Попробуйте все инструменты бесплатно в течение 7 дней
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            variant="secondary"
            className="text-lg px-10 py-6 h-auto shadow-xl hover:scale-105 transition-transform"
          >
            Начать работу
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
