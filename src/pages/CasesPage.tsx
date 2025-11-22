import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';
import LandingHeader from '@/components/LandingHeader';

export default function CasesPage() {
  const navigate = useNavigate();

  const cases = [
    {
      title: 'Интернет-магазин спортивной одежды',
      industry: 'E-commerce',
      challenge: 'Высокая стоимость клика и низкая конверсия из-за неструктурированной семантики',
      solution: 'Собрали 15 000 запросов через парсер WordStat, провели кластеризацию по интентам и применили операторы соответствия',
      results: [
        { metric: 'CPC снижен на', value: '42%' },
        { metric: 'CTR вырос на', value: '68%' },
        { metric: 'Конверсия увеличилась на', value: '34%' }
      ],
      icon: 'ShoppingBag',
      color: 'blue'
    },
    {
      title: 'Рекламное агентство (50+ клиентов)',
      industry: 'Маркетинг',
      challenge: 'Парсинг и кластеризация для каждого клиента занимали 2-3 дня работы специалиста',
      solution: 'Внедрили DirectKit для всей команды. Автоматизировали сбор семантики и кластеризацию',
      results: [
        { metric: 'Время на подготовку снижено на', value: '87%' },
        { metric: 'Пропускная способность выросла на', value: '3x' },
        { metric: 'Экономия в месяц', value: '250тыс₽' }
      ],
      icon: 'Building',
      color: 'purple'
    },
    {
      title: 'Сеть стоматологических клиник',
      industry: 'Медицина',
      challenge: 'Рекламный бюджет утекал на нецелевые запросы и неэффективные площадки РСЯ',
      solution: 'Настроили автоматическую чистку РСЯ и добавили 500+ минус-слов через кросс-минусовку',
      results: [
        { metric: 'Расход бюджета снижен на', value: '31%' },
        { metric: 'Качество трафика выросло на', value: '54%' },
        { metric: 'Звонков стало больше на', value: '47%' }
      ],
      icon: 'Heart',
      color: 'red'
    },
    {
      title: 'Производитель мебели',
      industry: 'Производство',
      challenge: 'Запросы в Директе конкурировали друг с другом, бюджет распределялся неэффективно',
      solution: 'Провели глубокую кластеризацию, разделили по интентам покупки и применили кросс-минусовку',
      results: [
        { metric: 'Внутренняя конкуренция снижена на', value: '78%' },
        { metric: 'CTR по всей кампании вырос на', value: '52%' },
        { metric: 'Стоимость заявки снизилась на', value: '39%' }
      ],
      icon: 'Home',
      color: 'orange'
    },
    {
      title: 'Образовательная платформа',
      industry: 'Образование',
      challenge: 'Семантическое ядро из 3 000 запросов разрослось до неуправляемых 30 000',
      solution: 'Автоматизировали парсинг и кластеризацию. Создали структуру из 120 тематических групп',
      results: [
        { metric: 'Охват увеличился на', value: '10x' },
        { metric: 'Показатель качества вырос до', value: '8.5' },
        { metric: 'Записей на курсы больше на', value: '126%' }
      ],
      icon: 'GraduationCap',
      color: 'green'
    },
    {
      title: 'Сервис доставки еды',
      industry: 'Food Tech',
      challenge: 'Нужно было быстро масштабировать рекламу на 20 новых городов с локальной семантикой',
      solution: 'Собрали региональную семантику через парсер WordStat для каждого города за 1 день',
      results: [
        { metric: 'Время запуска снижено с', value: '3нед до 2дн' },
        { metric: 'Покрытие запросов', value: '95%' },
        { metric: 'ROI вырос на', value: '67%' }
      ],
      icon: 'Utensils',
      color: 'emerald'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
      red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="Кейсы и Отзывы — Результаты использования DirectKit"
        description="Реальные кейсы использования DirectKit для Яндекс.Директ. Снижение CPC на 42%, рост конверсии на 126%, экономия времени на 87%. Отзывы клиентов и агентств."
        keywords="кейсы directkit, отзывы парсер wordstat, результаты кластеризации, примеры использования директ инструменты"
        canonical="https://directkit.ru/cases"
      />

      <LandingHeader />

      <section className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">Кейсы и Результаты</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Реальные истории клиентов, которые улучшили эффективность рекламы с помощью DirectKit
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="space-y-12">
            {cases.map((caseItem, index) => {
              const colors = getColorClasses(caseItem.color);
              return (
                <Card key={index} className={`border-2 ${colors.border} shadow-xl`}>
                  <CardHeader>
                    <div className="flex items-start gap-6">
                      <div className={`flex-shrink-0 w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center`}>
                        <Icon name={caseItem.icon as any} size={32} className={colors.text} />
                      </div>
                      <div className="flex-grow">
                        <div className={`inline-block px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-sm font-semibold mb-3`}>
                          {caseItem.industry}
                        </div>
                        <CardTitle className="text-3xl mb-3">{caseItem.title}</CardTitle>
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                              <Icon name="AlertCircle" size={18} className="text-red-500" />
                              Проблема
                            </h4>
                            <CardDescription className="text-base">
                              {caseItem.challenge}
                            </CardDescription>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                              <Icon name="CheckCircle2" size={18} className="text-green-500" />
                              Решение
                            </h4>
                            <CardDescription className="text-base">
                              {caseItem.solution}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h4 className="font-semibold text-slate-900 mb-4 text-lg">Результаты:</h4>
                      <div className="grid md:grid-cols-3 gap-6">
                        {caseItem.results.map((result, idx) => (
                          <div key={idx} className="text-center">
                            <div className={`text-4xl font-bold ${colors.text} mb-2`}>
                              {result.value}
                            </div>
                            <div className="text-slate-600">{result.metric}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">Отзывы пользователей</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    А
                  </div>
                  <div>
                    <CardTitle className="text-lg">Алексей М.</CardTitle>
                    <CardDescription>Специалист по контекстной рекламе</CardDescription>
                  </div>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "DirectKit сэкономил мне недели работы. Раньше на сбор семантики для крупного проекта 
                  уходило 3-4 дня, сейчас делаю это за час. Кластеризация работает отлично."
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    М
                  </div>
                  <div>
                    <CardTitle className="text-lg">Мария К.</CardTitle>
                    <CardDescription>Руководитель отдела маркетинга</CardDescription>
                  </div>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "Мы агентство с 15 клиентами. DirectKit позволил масштабировать процессы и взять ещё 
                  5 новых проектов без расширения команды. Окупился за первый месяц."
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    Д
                  </div>
                  <div>
                    <CardTitle className="text-lg">Дмитрий П.</CardTitle>
                    <CardDescription>Владелец интернет-магазина</CardDescription>
                  </div>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "Не нанимал дорогого специалиста, сам собрал семантику и запустил рекламу. 
                  Интерфейс понятный, всё логично. Поддержка отвечает быстро и по делу."
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Станьте следующим кейсом успеха</h2>
          <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
            Присоединяйтесь к 500+ специалистам, которые уже улучшили эффективность своих рекламных кампаний
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-lg px-10 py-6 h-auto shadow-lg"
          >
            Попробовать бесплатно 7 дней
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