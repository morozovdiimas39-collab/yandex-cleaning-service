import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

const INTENT_TYPES = [
  { id: 'commercial', label: 'Коммерческие', description: 'купить, заказать, цена, стоимость' },
  { id: 'informational', label: 'Информационные', description: 'как, что такое, инструкция, пошагово' },
  { id: 'navigational', label: 'Навигационные', description: 'циан, авито, домклик, сайт компании' },
  { id: 'transactional', label: 'Транзакционные', description: 'скачать, регистрация, заявка, консультация' }
];

interface IntentsStepProps {
  selectedIntents: string[];
  toggleIntent: (intentId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function IntentsStep({
  selectedIntents,
  toggleIntent,
  onNext,
  onBack
}: IntentsStepProps) {
  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-br from-slate-50 to-white">
        <CardTitle className="text-2xl text-slate-800">Сбор ключей</CardTitle>
        <CardDescription className="text-slate-500">
          Выберите типы запросов, которые нужно включить в сегментацию
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          {INTENT_TYPES.map(intent => (
            <div
              key={intent.id}
              onClick={() => toggleIntent(intent.id)}
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedIntents.includes(intent.id)
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedIntents.includes(intent.id)}
                  onCheckedChange={() => toggleIntent(intent.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-800 mb-1">
                    {intent.label}
                  </div>
                  <div className="text-sm text-slate-500">
                    {intent.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedIntents.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <Icon name="AlertCircle" className="h-4 w-4" />
              <span className="text-sm font-medium">Выберите хотя бы один тип интента</span>
            </div>
          </div>
        )}

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
            disabled={selectedIntents.length === 0}
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