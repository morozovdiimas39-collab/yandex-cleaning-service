import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';

interface Cluster {
  cluster_name: string;
  total_count: number;
  phrases_count: number;
  avg_words: number;
  max_frequency: number;
  min_frequency: number;
  intent: string;
  phrases: Array<{ phrase: string; count: number }>;
}

interface WordstatResult {
  Keyword: string;
  Shows: number;
  TopRequests?: Array<{ phrase: string; count: number }>;
  Clusters?: Cluster[];
}

export default function Wordstat() {
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<WordstatResult[]>([]);
  const [region, setRegion] = useState('213');
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const regions = [
    { id: '213', name: 'Москва' },
    { id: '2', name: 'Санкт-Петербург' },
    { id: '225', name: 'Россия' },
    { id: '11316', name: 'Новосибирск' },
    { id: '54', name: 'Екатеринбург' },
    { id: '63', name: 'Казань' },
    { id: '65', name: 'Нижний Новгород' }
  ];

  const toggleCluster = (clusterName: string) => {
    setExpandedClusters(prev => {
      const next = new Set(prev);
      if (next.has(clusterName)) {
        next.delete(clusterName);
      } else {
        next.add(clusterName);
      }
      return next;
    });
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'commercial': return 'bg-green-100 text-green-800 border-green-200';
      case 'informational': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIntentLabel = (intent: string) => {
    switch (intent) {
      case 'commercial': return '💰 Коммерческий';
      case 'informational': return 'ℹ️ Информационный';
      default: return '📊 Общий';
    }
  };

  const handleSearch = async () => {
    if (!keywords.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите ключевые слова',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/8b141446-430c-4c0b-b347-a0a2057c0ee8', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywords: keywords.split('\n').map(k => k.trim()).filter(k => k),
          regions: [parseInt(region)]
        })
      });

      const data = await response.json();
      console.log('🔥 API Response:', data);

      if (data.success && data.data?.SearchQuery) {
        setResults(data.data.SearchQuery);
        const clusters = data.data.SearchQuery[0]?.Clusters;
        console.log('🔥 Clusters found:', clusters?.length || 0);
        toast({
          title: 'Успех',
          description: `Найдено ${clusters?.length || 0} сегментов`
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось получить данные',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('🔥 Error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить запрос',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const clusters = results[0]?.Clusters || [];

  return (
    <>
      <AppSidebar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 p-8 ml-64">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Search" size={24} />
              Сбор ключей Wordstat
            </CardTitle>
            <CardDescription>
              Быстрая сборка и сегментация ключевых слов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Регион</label>
              <select
                className="w-full p-2 border rounded-md"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ключевое слово</label>
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-md resize-y"
                placeholder="купить квартиру"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>

            <Button onClick={handleSearch} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Icon name="Search" size={20} className="mr-2" />
                  Анализировать
                </>
              )}
            </Button>

            {clusters.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-semibold">Найдено {clusters.length} сегментов:</h3>
                {clusters.map((cluster) => (
                  <Card key={cluster.cluster_name} className="overflow-hidden">
                    <button
                      onClick={() => toggleCluster(cluster.cluster_name)}
                      className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon 
                            name={expandedClusters.has(cluster.cluster_name) ? "ChevronDown" : "ChevronRight"} 
                            size={20} 
                          />
                          <div>
                            <div className="font-semibold text-lg">{cluster.cluster_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {cluster.phrases_count} фраз · {cluster.total_count.toLocaleString()} показов
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getIntentColor(cluster.intent)}`}>
                            {getIntentLabel(cluster.intent)}
                          </span>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>Макс: {cluster.max_frequency.toLocaleString()}</div>
                            <div>Мин: {cluster.min_frequency.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                    
                    {expandedClusters.has(cluster.cluster_name) && (
                      <div className="border-t">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/30">
                              <th className="text-left p-3 text-sm font-medium">Фраза</th>
                              <th className="text-right p-3 text-sm font-medium">Показов</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cluster.phrases.map((phrase, idx) => (
                              <tr key={idx} className="border-t hover:bg-muted/20">
                                <td className="p-3">{phrase.phrase}</td>
                                <td className="p-3 text-right text-muted-foreground">
                                  {phrase.count.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}