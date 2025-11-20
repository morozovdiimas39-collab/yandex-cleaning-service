import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

const PROCESSING_STAGES = [
  { label: 'Анализ ключевых фраз...', duration: 1500 },
  { label: 'Определение интентов...', duration: 2000 },
  { label: 'Группировка в сегменты...', duration: 2500 },
  { label: 'Выделение минус-слов...', duration: 1500 }
];

interface ProcessingStepProps {
  progress: number;
  currentStage: number;
}

export default function ProcessingStep({ progress, currentStage }: ProcessingStepProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-br from-slate-50 to-white text-center">
          <div className="w-16 h-16 mx-auto bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
            <Icon name="Sparkles" className="h-8 w-8 text-white" />
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-8 space-y-8">
          <div className="space-y-3">
            <Progress value={progress} className="h-3" />
            <div className="text-center text-slate-600 font-medium">
              {Math.round(progress)}%
            </div>
          </div>

          <div className="space-y-3">
            {PROCESSING_STAGES.map((stage, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  idx === currentStage 
                    ? 'bg-emerald-50 border-2 border-emerald-200' 
                    : idx < currentStage
                      ? 'bg-slate-50'
                      : 'bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  idx < currentStage 
                    ? 'bg-emerald-500' 
                    : idx === currentStage
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-slate-200'
                }`}>
                  {idx < currentStage ? (
                    <Icon name="Check" className="h-4 w-4 text-white" />
                  ) : idx === currentStage ? (
                    <Icon name="Loader2" className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <span className="text-xs text-slate-500">{idx + 1}</span>
                  )}
                </div>
                <span className={`flex-1 ${
                  idx === currentStage 
                    ? 'text-slate-800 font-medium' 
                    : 'text-slate-600'
                }`}>
                  {stage.label}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-sm text-slate-500">
              Это может занять несколько минут. Не закрывайте страницу.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}