import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';
import { BACKEND_URLS } from '@/config/backend-urls';

interface Platform {
  domain: string;
  clicks: number;
  cost: number;
  conversions: number;
  impressions?: number;
  cpc?: number;
  ctr?: number;
  cpa?: number;
}

interface Task {
  id: number;
  description: string;
  config: any;
  enabled: boolean;
}

interface FilterResult extends Platform {
  matched: boolean;
  matchedTasks: string[];
}

const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'] || '';

export default function RSYAFilterTester() {
  const { id: projectId } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [platformsInput, setPlatformsInput] = useState('');
  const [results, setResults] = useState<FilterResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const uid = userStr ? JSON.parse(userStr).id.toString() : '1';
    setUserId(uid);
    loadTasks(uid);
  }, [projectId]);

  const loadTasks = async (uid: string) => {
    try {
      const response = await fetch(`${RSYA_PROJECTS_URL}?project_id=${projectId}`, {
        headers: { 'X-User-Id': uid }
      });
      
      if (!response.ok) {
        toast({ title: 'Проект не найден', variant: 'destructive' });
        return;
      }
      
      const data = await response.json();
      setTasks(data.project.tasks || []);
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  // ТОЧНАЯ КОПИЯ функции из rsya-batch-worker/index.py (строки 329-382)
  const matchesTaskFilters = (platform: Platform, config: any): boolean => {
    const domain = platform.domain.toLowerCase();
    
    // 1. Проверка ключевых слов (обязательна если указаны)
    const keywords = config.keywords || [];
    if (keywords.length > 0) {
      const hasKeyword = keywords.some((kw: string) => domain.includes(kw.toLowerCase()));
      if (!hasKeyword) return false;
    }
    
    // 2. Проверка исключений (самое сильное правило)
    const exceptions = config.exceptions || [];
    if (exceptions.length > 0) {
      const hasException = exceptions.some((exc: string) => domain.includes(exc.toLowerCase()));
      if (hasException) return false;
    }
    
    // 3. Защита конверсий
    if (config.protect_conversions && platform.conversions > 0) {
      return false;
    }
    
    // 4. Фильтры по метрикам
    if (config.min_impressions && (platform.impressions || 0) < config.min_impressions) return false;
    if (config.max_impressions && (platform.impressions || 0) > config.max_impressions) return false;
    
    if (config.min_clicks && platform.clicks < config.min_clicks) return false;
    if (config.max_clicks && platform.clicks > config.max_clicks) return false;
    
    if (config.min_cpc && (platform.cpc || 0) < config.min_cpc) return false;
    if (config.max_cpc && (platform.cpc || 0) > config.max_cpc) return false;
    
    if (config.min_ctr && (platform.ctr || 0) < config.min_ctr) return false;
    if (config.max_ctr && (platform.ctr || 0) > config.max_ctr) return false;
    
    if (config.min_conversions && platform.conversions < config.min_conversions) return false;
    
    if (config.min_cpa && (platform.cpa || 0) < config.min_cpa) return false;
    if (config.max_cpa && (platform.cpa || 0) > config.max_cpa) return false;
    
    return true;
  };

  const parsePlatforms = (input: string): Platform[] => {
    const lines = input.trim().split('\n').filter(line => line.trim());
    const platforms: Platform[] = [];

    for (const line of lines) {
      const parts = line.split('\t').map(p => p.trim());
      
      if (parts.length >= 4) {
        const domain = parts[0];
        const clicks = parseInt(parts[1]) || 0;
        const cost = parseFloat(parts[2]) || 0;
        const conversions = parseInt(parts[3]) || 0;
        
        const platform: Platform = {
          domain,
          clicks,
          cost,
          conversions,
          impressions: parts[4] ? parseInt(parts[4]) : undefined,
          cpc: clicks > 0 ? cost / clicks : 0,
          ctr: 0,
          cpa: conversions > 0 ? cost / conversions : 0
        };
        
        platforms.push(platform);
      }
    }

    return platforms;
  };

  const testFilters = () => {
    setLoading(true);
    
    try {
      const platforms = parsePlatforms(platformsInput);
      
      if (platforms.length === 0) {
        toast({ title: 'Ошибка', description: 'Не удалось распарсить площадки', variant: 'destructive' });
        return;
      }

      const enabledTasks = tasks.filter(t => t.enabled);
      
      if (enabledTasks.length === 0) {
        toast({ title: 'Ошибка', description: 'Нет активных задач', variant: 'destructive' });
        return;
      }

      const results: FilterResult[] = platforms.map(platform => {
        const matchedTasks: string[] = [];
        
        for (const task of enabledTasks) {
          if (matchesTaskFilters(platform, task.config)) {
            matchedTasks.push(task.description);
          }
        }
        
        return {
          ...platform,
          matched: matchedTasks.length > 0,
          matchedTasks
        };
      });

      setResults(results);
      
      const blockedCount = results.filter(r => r.matched).length;
      toast({ 
        title: 'Проверка завершена', 
        description: `Заблокировано: ${blockedCount} из ${results.length} площадок` 
      });
      
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const blockedCount = results.filter(r => r.matched).length;
  const passedCount = results.length - blockedCount;

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <div className="flex-1 overflow-auto ml-64">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Тестер фильтров площадок</h1>
            <p className="text-muted-foreground">
              Проверьте какие площадки будут заблокированы на основе активных задач
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="FileText" size={20} />
                  Список площадок
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Активных задач: {tasks.filter(t => t.enabled).length}</Label>
                  <div className="mt-2 space-y-2">
                    {tasks.filter(t => t.enabled).map(task => (
                      <div key={task.id} className="text-sm p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="font-semibold">{task.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.config.keywords?.length > 0 && `Ключевые слова: ${task.config.keywords.join(', ')}`}
                          {task.config.exceptions?.length > 0 && ` • Исключения: ${task.config.exceptions.join(', ')}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Введите список площадок (TSV формат)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Формат: Домен [TAB] Клики [TAB] Расход [TAB] Конверсии
                  </p>
                  <Textarea
                    value={platformsInput}
                    onChange={(e) => setPlatformsInput(e.target.value)}
                    placeholder="example.com	10	150.50	2&#10;test.ru	5	80.00	0"
                    className="font-mono text-sm h-64"
                  />
                </div>

                <Button 
                  onClick={testFilters} 
                  disabled={loading || !platformsInput.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Проверка...
                    </>
                  ) : (
                    <>
                      <Icon name="Play" size={16} className="mr-2" />
                      Проверить фильтры
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="CheckCircle" size={20} />
                  Результаты проверки
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="Search" size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Введите площадки и нажмите "Проверить фильтры"</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-3xl font-bold text-red-600">{blockedCount}</div>
                        <div className="text-sm text-muted-foreground">Заблокировано</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-3xl font-bold text-green-600">{passedCount}</div>
                        <div className="text-sm text-muted-foreground">Пропущено</div>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.map((result, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg border ${
                            result.matched 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-green-50 border-green-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className={`font-mono text-sm ${result.matched ? 'line-through text-red-600' : 'text-green-600'}`}>
                                {result.domain}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {result.clicks} кликов • ₽{result.cost.toFixed(2)} • {result.conversions} конв.
                                {result.cpc && ` • CPC: ₽${result.cpc.toFixed(2)}`}
                              </div>
                              {result.matchedTasks.length > 0 && (
                                <div className="text-xs mt-1 text-red-600 font-semibold">
                                  Задачи: {result.matchedTasks.join(', ')}
                                </div>
                              )}
                            </div>
                            <div>
                              {result.matched ? (
                                <Icon name="XCircle" size={20} className="text-red-500" />
                              ) : (
                                <Icon name="CheckCircle" size={20} className="text-green-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
