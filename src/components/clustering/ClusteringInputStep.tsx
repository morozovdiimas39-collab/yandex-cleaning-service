import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface ClusteringInputStepProps {
  keywords: string;
  setKeywords: (value: string) => void;
  loading: boolean;
  onAnalyze: () => void;
}

export default function ClusteringInputStep({ 
  keywords, 
  setKeywords, 
  loading, 
  onAnalyze 
}: ClusteringInputStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">AI Сегментация</h1>
        <p className="text-lg text-slate-600">
          Умная группировка ключевых слов для контекстной рекламы
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Введите ключевые слова (по одному в строке)
            </label>
            <Textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="купить квартиру&#10;купить квартиру москва&#10;купить квартиру недорого"
              className="min-h-[300px] font-mono text-sm"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onAnalyze}
              disabled={loading || !keywords.trim()}
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {loading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Анализирую...
                </>
              ) : (
                <>
                  <Icon name="Sparkles" className="mr-2 h-4 w-4" />
                  Сегментировать
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Icon name="Brain" className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">AI-группировка</h3>
              <p className="text-sm text-slate-600">
                Автоматическое разделение фраз по смыслу и интенту
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Icon name="Filter" className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Минус-слова</h3>
              <p className="text-sm text-slate-600">
                Автоматический подбор нерелевантных запросов
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Icon name="Download" className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Экспорт</h3>
              <p className="text-sm text-slate-600">
                Выгрузка готовых сегментов для Директа
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}