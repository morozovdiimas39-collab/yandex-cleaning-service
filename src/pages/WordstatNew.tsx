import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';
import AppSidebar from '@/components/layout/AppSidebar';
import ExcelClustersTable from '@/components/wordstat/ExcelClustersTable';
import { useAuth } from '@/contexts/AuthContext';
import { BACKEND_URLS } from '@/config/backend-urls';

interface TopRequest {
  phrase: string;
  count: number;
}

interface Cluster {
  cluster_name: string;
  total_count: number;
  phrases_count: number;
  avg_words: number;
  max_frequency: number;
  min_frequency: number;
  intent: string;
  phrases: TopRequest[];
}

type WorkflowStep = 'input' | 'editing';

export default function WordstatNew() {
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [minusPhrases, setMinusPhrases] = useState<TopRequest[]>([]);
  const [region, setRegion] = useState('213');
  const [mode, setMode] = useState<'context' | 'seo'>('context');
  const [step, setStep] = useState<WorkflowStep>('input');
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const regions = [
    { id: '225', name: 'Россия' },
    { id: '213', name: 'Москва' },
    { id: '1', name: 'Москва и область' },
    { id: '2', name: 'Санкт-Петербург' },
    { id: '10174', name: 'Санкт-Петербург и область' },
    { id: '65', name: 'Новосибирск' },
    { id: '54', name: 'Екатеринбург' },
    { id: '43', name: 'Казань' },
    { id: '47', name: 'Нижний Новгород' },
    { id: '35', name: 'Краснодар' },
    { id: '10995', name: 'Ставрополь' },
    { id: '39', name: 'Ростов-на-Дону' },
    { id: '75', name: 'Владивосток' },
    { id: '51', name: 'Самара' },
    { id: '66', name: 'Омск' },
    { id: '56', name: 'Челябинск' },
    { id: '172', name: 'Уфа' }
  ];

  // Проверка подписки при монтировании компонента
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(BACKEND_URLS.subscription, {
          method: 'GET',
          headers: {
            'X-User-Id': user.id
          }
        });

        if (response.status === 403) {
          toast({
            title: 'Доступ ограничен',
            description: 'Требуется активная подписка',
            variant: 'destructive'
          });
          navigate('/subscription');
          return;
        }

        const data = await response.json();

        if (data.code === 'SUBSCRIPTION_REQUIRED' || data.hasAccess === false) {
          toast({
            title: 'Доступ ограничен',
            description: 'Требуется активная подписка',
            variant: 'destructive'
          });
          navigate('/subscription');
        }
      } catch (error) {
        console.error('Ошибка проверки подписки:', error);
      }
    };

    checkSubscription();
  }, [user, navigate, toast]);

  const fetchClusters = async () => {
    if (!keywords.trim()) {
      toast({ title: 'Ошибка', description: 'Введите ключевые слова', variant: 'destructive' });
      return;
    }

    if (!user?.id) {
      toast({ title: 'Ошибка', description: 'Пользователь не авторизован', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const keywordsList = keywords.split('\n').filter(k => k.trim());
      const regionNum = parseInt(region);
      
      const allPhrases: TopRequest[] = [];
      
      const response = await fetch(BACKEND_URLS['wordstat-parser'], {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user.id
        },
        body: JSON.stringify({
          keywords: keywordsList,
          regions: [regionNum],
          numPhrases: 2000,
          devices: ['all']
        })
      });

      if (response.status === 403) {
        toast({
          title: 'Доступ ограничен',
          description: 'Требуется активная подписка',
          variant: 'destructive'
        });
        navigate('/subscription');
        return;
      }

      if (!response.ok) throw new Error('Ошибка запроса');

      const data = await response.json();
      
      console.log('Wordstat API response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.results && data.results.length > 0) {
        for (const result of data.results) {
          if (result.data && result.data.topRequests) {
            const phrases = result.data.topRequests.map((item: any) => ({
              phrase: item.phrase,
              count: item.count
            }));
            allPhrases.push(...phrases);
          }
        }
      }
      
      console.log('Parsed phrases:', allPhrases.length, allPhrases.slice(0, 5));
      
      const userKeysCluster: Cluster = {
        cluster_name: 'Все ключи',
        total_count: keywordsList.length,
        phrases_count: keywordsList.length,
        avg_words: keywordsList.length > 0 ? Math.round(keywordsList.reduce((sum, k) => sum + k.split(' ').length, 0) / keywordsList.length * 10) / 10 : 0,
        max_frequency: 0,
        min_frequency: 0,
        intent: 'user_input',
        phrases: keywordsList.map((k, i) => ({ phrase: k, count: 0 }))
      };

      const wordstatCluster: Cluster = {
        cluster_name: 'Сегмент',
        total_count: allPhrases.reduce((sum, p) => sum + p.count, 0),
        phrases_count: allPhrases.length,
        avg_words: allPhrases.length > 0 ? Math.round(allPhrases.reduce((sum, p) => sum + p.phrase.split(' ').length, 0) / allPhrases.length * 10) / 10 : 0,
        max_frequency: allPhrases.length > 0 ? Math.max(...allPhrases.map(p => p.count)) : 0,
        min_frequency: allPhrases.length > 0 ? Math.min(...allPhrases.map(p => p.count)) : 0,
        intent: 'commercial',
        phrases: allPhrases
      };

      setClusters([userKeysCluster, wordstatCluster]);
      setMinusPhrases([]);
      setStep('editing');
      
      toast({ 
        title: 'Готово!', 
        description: `Собрано ${allPhrases.length} фраз` 
      });
    } catch (error) {
      toast({ 
        title: 'Ошибка', 
        description: error instanceof Error ? error.message : 'Не удалось получить данные',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };



  if (step === 'input') {
    return (
      <>
        <AppSidebar />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 p-6 ml-64">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Icon name="Sparkles" size={32} className="text-purple-500" />
              Сбор ключей Wordstat
            </h1>
            <p className="text-muted-foreground">
              Быстрая сборка и сегментация ключевых слов
            </p>
          </div>

          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ключевые слова (каждое с новой строки)</label>
              <Textarea
                placeholder="пластиковые окна&#10;ремонт квартир&#10;натяжные потолки"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                rows={8}
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Регион</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Режим</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'context' | 'seo')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="context">Контекстная реклама</option>
                  <option value="seo">SEO-оптимизация</option>
                </select>
              </div>
            </div>

            <Button 
              onClick={fetchClusters} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                  Анализирую...
                </>
              ) : (
                <>
                  <Icon name="Sparkles" size={20} className="mr-2" />
                  Кластеризовать с AI
                </>
              )}
            </Button>
          </Card>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-4">
              <Icon name="Info" size={24} className="text-blue-600 mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold">Как работает AI-кластеризация?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ Понимает смысл фраз, а не только статистику слов</li>
                  <li>✅ Автоматически выделяет минус-слова (мусор, нерелевантные фразы)</li>
                  <li>✅ Разделяет планировки (1-комн, 2-комн, 3-комн) отдельно</li>
                  <li>✅ Группирует конкурентов и агрегаторы в отдельный кластер</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <AppSidebar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 p-6 ml-64">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Icon name="Table" size={32} className="text-emerald-500" />
              Excel-редактор кластеров
            </h1>
            <p className="text-muted-foreground">
              Перетаскивайте фразы между кластерами, начиная вводить текст
            </p>
          </div>
          <Button variant="outline" onClick={() => setStep('input')}>
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Новый запрос
          </Button>
        </div>

        <ExcelClustersTable 
          initialClusters={clusters}
          initialMinusPhrases={minusPhrases}
        />
      </div>
    </div>
    </>
  );
}