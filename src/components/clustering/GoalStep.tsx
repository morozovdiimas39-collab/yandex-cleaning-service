import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

type Goal = 'context' | 'seo';

interface GoalStepProps {
  goal: Goal;
  setGoal: (goal: Goal) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function GoalStep({ goal, setGoal, onNext, onBack }: GoalStepProps) {
  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-br from-slate-50 to-white">
        <CardTitle className="text-2xl text-slate-800">Сбор ключей</CardTitle>
        <CardDescription className="text-slate-500">
          От цели зависит стратегия группировки запросов
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div
            onClick={() => setGoal('context')}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
              goal === 'context'
                ? 'border-emerald-500 bg-emerald-50/50 shadow-md'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                goal === 'context' ? 'bg-emerald-500' : 'bg-slate-100'
              }`}>
                <Icon 
                  name="Target" 
                  className={`h-6 w-6 ${goal === 'context' ? 'text-white' : 'text-slate-600'}`}
                />
              </div>
              <div>
                <div className="font-semibold text-lg text-slate-800 mb-1">Контекстная реклама</div>
                <div className="text-sm text-slate-600 leading-relaxed">
                  Группировка по интенту и смыслу для создания рекламных кампаний. 
                  Оптимально для Яндекс.Директ и Google Ads — каждый сегмент становится 
                  отдельной группой объявлений.
                </div>
              </div>
            </div>
          </div>

          <div
            onClick={() => setGoal('seo')}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
              goal === 'seo'
                ? 'border-emerald-500 bg-emerald-50/50 shadow-md'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                goal === 'seo' ? 'bg-emerald-500' : 'bg-slate-100'
              }`}>
                <Icon 
                  name="TrendingUp" 
                  className={`h-6 w-6 ${goal === 'seo' ? 'text-white' : 'text-slate-600'}`}
                />
              </div>
              <div>
                <div className="font-semibold text-lg text-slate-800 mb-1">SEO-продвижение</div>
                <div className="text-sm text-slate-600 leading-relaxed">
                  Группировка для создания посадочных страниц и структуры сайта. 
                  Каждый сегмент — отдельная страница или раздел, оптимизированный 
                  под группу близких запросов.
                </div>
              </div>
            </div>
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
            Далее
            <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}