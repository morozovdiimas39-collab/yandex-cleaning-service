import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

export const MINUS_FILTER_TYPES = [
  { 
    id: 'informational', 
    label: 'Убрать информационные', 
    description: 'отзывы, обзор, рейтинг, что такое, как выбрать, сравнение',
    words: ['отзыв', 'обзор', 'рейтинг', 'сравнение', 'как', 'что', 'такое', 'выбрать', 'какой', 'лучше', 'топ', 'обсуждение', 'форум', 'мнение']
  },
  { 
    id: 'cities', 
    label: 'Убрать другие города', 
    description: 'Исключить города вне выбранного региона',
    words: [] // Заполняется динамически
  },
  { 
    id: 'diy', 
    label: 'Убрать DIY запросы', 
    description: 'своими руками, сделать самому, инструкция, чертежи',
    words: ['своими', 'руками', 'самому', 'сам', 'инструкция', 'чертеж', 'схема', 'самостоятельно']
  },
  { 
    id: 'jobs', 
    label: 'Убрать вакансии', 
    description: 'работа, резюме, зарплата, вакансия, требуется',
    words: ['работа', 'вакансия', 'резюме', 'зарплата', 'требуется', 'ищу', 'hh', 'соискатель']
  },
  { 
    id: 'education', 
    label: 'Убрать обучение', 
    description: 'курсы, обучение, тренинг, семинар, вебинар',
    words: ['курсы', 'обучение', 'тренинг', 'семинар', 'вебинар', 'учиться', 'школа', 'преподаватель']
  },
  { 
    id: 'used', 
    label: 'Убрать б/у товары', 
    description: 'бу, б/у, с рук, авито, юла',
    words: ['бу', 'б/у', 'рук', 'авито', 'юла', 'дром']
  },
  { 
    id: 'free', 
    label: 'Убрать бесплатное', 
    description: 'бесплатно, даром, отдам, в дар',
    words: ['бесплатно', 'даром', 'отдам', 'дар', 'халява']
  },
  { 
    id: 'media', 
    label: 'Убрать медиа-запросы', 
    description: 'фото, картинки, видео, скачать, смотреть',
    words: ['фото', 'картинки', 'видео', 'скачать', 'смотреть', 'изображение', 'рисунок', 'обои']
  },
  { 
    id: 'academic', 
    label: 'Убрать академические', 
    description: 'реферат, курсовая, доклад, презентация, диплом',
    words: ['реферат', 'курсовая', 'доклад', 'презентация', 'диплом', 'дипломная']
  }
];

interface MinusFiltersStepProps {
  selectedFilters: string[];
  toggleFilter: (filterId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function MinusFiltersStep({
  selectedFilters,
  toggleFilter,
  onNext,
  onBack
}: MinusFiltersStepProps) {
  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-br from-slate-50 to-white">
        <CardTitle className="text-2xl text-slate-800">Автоматическая минусовка</CardTitle>
        <CardDescription className="text-slate-500">
          Выберите типы фраз, которые нужно автоматически добавить в минус-слова
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          {MINUS_FILTER_TYPES.map(filter => (
            <div
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedFilters.includes(filter.id)
                  ? 'border-red-500 bg-red-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedFilters.includes(filter.id)}
                  onCheckedChange={() => toggleFilter(filter.id)}
                  onClick={(e) => e.stopPropagation()}
                  className={`mt-1 ${
                    selectedFilters.includes(filter.id) 
                      ? 'data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500' 
                      : ''
                  }`}
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                    {filter.label}
                    {selectedFilters.includes(filter.id) && (
                      <Icon name="Ban" className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    {filter.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2 text-blue-800">
            <Icon name="Info" className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm">
              Выбранные фильтры добавят одиночные минус-слова и сразу применятся ко всем фразам
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onBack}
            variant="outline"
            className="flex-1 border-slate-200 hover:bg-slate-50"
          >
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <Button 
            onClick={onNext}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Запустить сегментацию
            <Icon name="Sparkles" className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}