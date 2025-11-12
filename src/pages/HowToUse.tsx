import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Icon from '@/components/ui/icon';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
  details?: string[];
}

export default function HowToUse() {
  const navigate = useNavigate();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const steps: Step[] = [
    {
      number: 1,
      title: 'Соберите базовые ключи',
      description: 'Начните с 5-10 базовых запросов, описывающих ваш продукт или услугу.',
      icon: 'FileText',
      details: [
        'Определите основные темы вашего бизнеса',
        'Подумайте, как клиенты ищут ваши услуги',
        'Не нужно сразу собирать сотни ключей',
        'Примеры: "купить квартиру", "ремонт под ключ", "доставка еды"'
      ]
    },
    {
      number: 2,
      title: 'Расширьте через Wordstat',
      description: 'Используйте кнопку "Собрать из Wordstat" для автоматического сбора всех связанных фраз.',
      icon: 'Zap',
      details: [
        'Вордстат покажет все варианты запросов',
        'Система соберёт частотность по каждой фразе',
        'Можно собрать до 1000+ ключей за раз',
        'Данные обновляются в реальном времени'
      ]
    },
    {
      number: 3,
      title: 'Выберите регионы показа',
      description: 'Укажите города, где будет показываться реклама. Частотность собирается по каждому региону.',
      icon: 'MapPin',
      details: [
        'Выбирайте только целевые регионы',
        'Для федеральных кампаний выберите "Россия"',
        'Можно указать несколько городов',
        'Частотность покажет спрос в каждом регионе'
      ]
    },
    {
      number: 4,
      title: 'Примените минус-фильтры',
      description: 'Отсейте нецелевой трафик: вакансии, обучение, РСЯ-мусор готовыми фильтрами.',
      icon: 'Filter',
      details: [
        'Вакансии: уберёт "работа", "вакансия", "резюме"',
        'Обучение: отсеет "курсы", "обучение", "как сделать"',
        'РСЯ: удалит информационные запросы',
        'Чужие города: очистит от других регионов'
      ]
    },
    {
      number: 5,
      title: 'Дождитесь кластеризации',
      description: 'Система автоматически сгруппирует фразы по смыслу и создаст понятные сегменты.',
      icon: 'Sparkles',
      details: [
        'AI анализирует смысл каждой фразы',
        'Похожие запросы группируются в сегменты',
        'Сегменты получают понятные названия',
        'Обработка занимает 2-3 минуты'
      ]
    },
    {
      number: 6,
      title: 'Отредактируйте результаты',
      description: 'Переименуйте сегменты, перенесите фразы между группами, добавьте минус-слова.',
      icon: 'Edit',
      details: [
        'Двойной клик по названию — переименовать',
        'Перетащите фразы между сегментами',
        'Используйте поиск для массового переноса',
        'Добавляйте минус-слова через строку поиска',
        'Зачёркнутые фразы можно удалить одной кнопкой'
      ]
    },
    {
      number: 7,
      title: 'Выгрузите в Excel',
      description: 'Скачайте готовую структуру с частотностью для импорта в Яндекс.Директ.',
      icon: 'Download',
      details: [
        'Включите "Выгрузить частотность" для показов',
        'Каждый сегмент — отдельный столбец',
        'Минус-фразы выгружаются в последнем столбце',
        'Формат готов для импорта в Директ'
      ]
    },
    {
      number: 8,
      title: 'Создайте кампанию в Директе',
      description: 'Импортируйте сегменты как отдельные группы объявлений с готовыми минус-словами.',
      icon: 'Rocket',
      details: [
        'Каждый сегмент = 1 группа объявлений',
        'Используйте название сегмента для объявления',
        'Минус-слова добавьте на уровень кампании',
        'Установите ставки по частотности'
      ]
    }
  ];

  const toggleStep = (stepNumber: number) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl mb-4">
              <Icon name="BookOpen" size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
              Как собрать семантическое ядро
            </h1>
            <p className="text-lg text-slate-600">
              Пошаговая инструкция от базовых ключей до готовой кампании
            </p>
          </div>

          {/* Видео-инструкция */}
          <Card className="mb-8 border-2 border-emerald-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Icon name="Play" size={24} className="text-red-500" />
                Видео: Сбор семантики за 5 минут
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-100">
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="Как собрать семантическое ядро"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <p className="text-sm text-slate-500 mt-4 text-center">
                Полный разбор: от первых ключей до выгрузки в Excel
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4 mb-8">
            {steps.map((step) => (
              <Card 
                key={step.number} 
                className={`border-0 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                  expandedStep === step.number ? 'ring-2 ring-emerald-500' : ''
                }`}
                onClick={() => toggleStep(step.number)}
              >
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Icon name={step.icon} size={20} className="text-emerald-600" />
                      {step.title}
                    </CardTitle>
                  </div>
                  <Icon 
                    name={expandedStep === step.number ? "ChevronUp" : "ChevronDown"} 
                    size={20} 
                    className="text-slate-400 flex-shrink-0"
                  />
                </CardHeader>
                <CardContent className="pl-20">
                  <p className="text-slate-600 mb-4">{step.description}</p>
                  
                  {expandedStep === step.number && step.details && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      {step.details.map((detail, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                          <Icon name="ArrowRight" size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-2 border-emerald-200 bg-emerald-50/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Lightbulb" size={24} className="text-amber-500" />
                Важные советы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <div className="flex items-start gap-2">
                <Icon name="Check" size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Не собирайте слишком много:</strong> 500-1000 ключей достаточно для старта</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="Check" size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Проверяйте частотность:</strong> фразы с частотой &lt;10 обычно не нужны</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="Check" size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Минус-слова критичны:</strong> они экономят 30-50% бюджета</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="Check" size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Называйте сегменты понятно:</strong> это будущие названия групп объявлений</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="Check" size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Используйте операторы:</strong> ! для точной формы, - для исключений, [] для порядка слов</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-orange-50/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="AlertCircle" size={24} className="text-orange-500" />
                Частые ошибки новичков
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <div className="flex items-start gap-2">
                <Icon name="X" size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Собирают семантику без минус-слов — 50% бюджета уходит в РСЯ-мусор</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="X" size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Игнорируют частотность — запускают фразы с 0 показов</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="X" size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Не группируют по смыслу — получается каша вместо структуры</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="X" size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Собирают семантику для всей России — высокая конкуренция и цена</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4 mt-8">
            <Button
              onClick={() => navigate('/clustering')}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
              size="lg"
            >
              <Icon name="ArrowRight" size={20} className="mr-2" />
              Начать сбор семантики
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
            >
              На главную
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}