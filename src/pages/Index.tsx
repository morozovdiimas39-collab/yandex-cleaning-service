import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';

export default function Index() {
  const navigate = useNavigate();

  const features = [
    {
      icon: 'Search',
      title: 'AI Сбор семантики',
      description: 'Автоматическая сегментация ключевых фраз через OpenAI и Yandex Wordstat',
      gradient: 'from-emerald-500 to-green-500',
      action: () => navigate('/clustering')
    },
    {
      icon: 'ShieldOff',
      title: 'Чистка РСЯ',
      description: 'Умная фильтрация площадок для рекламной сети Яндекса',
      gradient: 'from-blue-500 to-cyan-500',
      action: () => navigate('/rsya')
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Введите ключевые фразы',
      description: 'Добавьте список ключевых слов вручную или соберите через Wordstat'
    },
    {
      number: '2',
      title: 'OpenAI предложит сегменты',
      description: 'GPT-4 проанализирует фразы и предложит названия для групп'
    },
    {
      number: '3',
      title: 'Получите готовые сегменты',
      description: 'Экспортируйте результат для загрузки в Яндекс Директ'
    }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50">
      <AppSidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl mb-4">
              <Icon name="Sparkles" size={48} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Добро пожаловать в DirectKit
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Инструменты для автоматизации работы с Яндекс Директ через искусственный интеллект
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-200"
                onClick={feature.action}
              >
                <div className="p-8 space-y-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon name={feature.icon as any} size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-green-600 group-hover:from-emerald-700 group-hover:to-green-700">
                    Начать работу
                    <Icon name="ArrowRight" size={18} className="ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-800">Как это работает?</h2>
              <p className="text-slate-600">Простой процесс в три шага</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{step.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-emerald-300 to-transparent -ml-3" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-gradient-to-br from-emerald-500 to-green-500 text-white border-0">
            <div className="p-8 text-center space-y-4">
              <Icon name="Zap" size={48} className="mx-auto" />
              <h2 className="text-3xl font-bold">Готовы начать?</h2>
              <p className="text-emerald-50 text-lg max-w-2xl mx-auto">
                Выберите инструмент выше и начните экономить время на рутинных задачах
              </p>
              <Button 
                onClick={() => navigate('/clustering')}
                className="bg-white text-emerald-600 hover:bg-emerald-50 text-lg px-8 py-6"
              >
                Попробовать AI сбор семантики
                <Icon name="ArrowRight" size={20} className="ml-2" />
              </Button>
            </div>
          </Card>

        </div>
      </main>
    </div>
  );
}