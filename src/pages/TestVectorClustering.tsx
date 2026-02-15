import { useState } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

// TODO: добавить в func2url.json ключ (напр. clustering-api) после деплоя в Yandex Cloud
const CLUSTER_API_URL = 'https://functions.poehali.dev/816f5c03-c259-4d9d-9a4b-44d96af0e858';

interface Phrase {
  phrase: string;
  count: number;
  similarity?: number;
}

interface GeoCluster {
  name: string;
  intent: string;
  color: string;
  icon: string;
  phrases: Phrase[];
}

interface ClusterResponse {
  geoClusters: GeoCluster[];
  totalPhrases: number;
  debug: {
    processed_phrases: number;
    total_phrases: number;
    thresholds: {
      exact: number;
      nearby: number;
    };
  };
}

export default function TestVectorClustering() {
  const [address, setAddress] = useState('Ставрополь, Тухачевского 58');
  const [phrases, setPhrases] = useState(`купить квартиру ставрополь тухачевского
новостройки ставрополь промышленный район
жк ставрополь ленина
квартиры москва
продажа квартир ставрополь
недвижимость ставрополь доставка
новостройки петербург`);
  const [regions, setRegions] = useState('Ставрополь');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClusterResponse | null>(null);

  const handleCluster = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const phrasesArray = phrases.split('\n').filter(p => p.trim());
      const regionsArray = regions.split(',').map(r => r.trim()).filter(r => r);

      const response = await fetch(CLUSTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'geo',
          phrases: phrasesArray,
          address: address,
          regions: regionsArray
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка API');
      }

      const data = await response.json();
      setResult(data);
      toast.success('Кластеризация завершена!');
    } catch (error) {
      console.error('Clustering error:', error);
      toast.error('Ошибка при кластеризации');
    } finally {
      setIsLoading(false);
    }
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'bg-emerald-50 border-emerald-200',
      blue: 'bg-blue-50 border-blue-200',
      red: 'bg-red-50 border-red-200',
      purple: 'bg-purple-50 border-purple-200',
      orange: 'bg-orange-50 border-orange-200'
    };
    return colors[color] || 'bg-gray-50 border-gray-200';
  };

  const getTextColorClass = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'text-emerald-700',
      blue: 'text-blue-700',
      red: 'text-red-700',
      purple: 'text-purple-700',
      orange: 'text-orange-700'
    };
    return colors[color] || 'text-gray-700';
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <div className="flex-1">
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🧪 Тест векторной кластеризации</h1>
          <p className="text-slate-600">
            Проверь как работает геокластеризация на основе AI embeddings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Параметры кластеризации</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Адрес объекта
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Город, улица, дом"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Регионы (через запятую)
                  </label>
                  <Input
                    value={regions}
                    onChange={(e) => setRegions(e.target.value)}
                    placeholder="Москва, Санкт-Петербург"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Фразы (по одной на строку)
                  </label>
                  <Textarea
                    value={phrases}
                    onChange={(e) => setPhrases(e.target.value)}
                    rows={12}
                    placeholder="купить квартиру москва&#10;новостройки петербург"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {phrases.split('\n').filter(p => p.trim()).length} фраз
                  </p>
                </div>

                <Button 
                  onClick={handleCluster}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                      Кластеризация...
                    </>
                  ) : (
                    <>
                      <Icon name="Sparkles" className="mr-2 h-4 w-4" />
                      Запустить кластеризацию
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {result && (
              <Card className="p-6 bg-slate-50">
                <h3 className="text-sm font-semibold mb-3">📊 Отладка</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Обработано фраз:</span>
                    <span className="font-mono">{result.debug.processed_phrases} / {result.debug.total_phrases}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Порог "Ваша локация":</span>
                    <span className="font-mono">&gt; {result.debug.thresholds.exact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Порог "Близкие районы":</span>
                    <span className="font-mono">&gt; {result.debug.thresholds.nearby}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div>
            {result ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Результаты кластеризации</h2>
                
                {result.geoClusters.map((cluster, idx) => (
                  <Card 
                    key={idx} 
                    className={`p-6 border-2 ${getColorClass(cluster.color)}`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Icon name={cluster.icon as any} className={`h-5 w-5 ${getTextColorClass(cluster.color)}`} />
                      <h3 className={`text-lg font-semibold ${getTextColorClass(cluster.color)}`}>
                        {cluster.name}
                      </h3>
                      <span className="ml-auto text-sm text-slate-500">
                        {cluster.phrases.length} фраз
                      </span>
                    </div>

                    <div className="space-y-2">
                      {cluster.phrases.map((phrase, pidx) => (
                        <div 
                          key={pidx}
                          className="flex items-center justify-between bg-white/50 rounded px-3 py-2"
                        >
                          <span className="text-sm">{phrase.phrase}</span>
                          {phrase.similarity !== undefined && (
                            <span className="text-xs font-mono text-slate-500 ml-2">
                              {(phrase.similarity * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Icon name="Sparkles" className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">
                  Введи параметры слева и нажми "Запустить кластеризацию"
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}