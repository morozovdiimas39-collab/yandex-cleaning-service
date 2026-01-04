import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface Project {
  id: number;
  name: string;
  goals?: any[];
}

interface FilterResult extends Platform {
  matched: boolean;
  matchedTasks: string[];
}

const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'] || '';

export default function RSYAFilterTester() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string>('');
  const [project, setProject] = useState<Project | null>(null);
  const [platformsInput, setPlatformsInput] = useState('');
  const [results, setResults] = useState<FilterResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [createMode, setCreateMode] = useState<'smart' | 'expert'>('expert');
  const [activeModules, setActiveModules] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    description: 'Тест',
    keywords: '',
    exceptions: '',
    goal_id: 'all',
    min_impressions: '',
    max_impressions: '',
    min_clicks: '',
    max_clicks: '',
    min_cpc: '',
    max_cpc: '',
    min_ctr: '',
    max_ctr: '',
    min_cpa: '',
    max_cpa: '',
    min_conversions: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const uid = userStr ? JSON.parse(userStr).id.toString() : '1';
    setUserId(uid);
    loadProject(uid);
  }, [projectId]);

  const loadProject = async (uid: string) => {
    try {
      const response = await fetch(`${RSYA_PROJECTS_URL}?project_id=${projectId}`, {
        headers: { 'X-User-Id': uid }
      });
      
      if (!response.ok) {
        toast({ title: 'Проект не найден', variant: 'destructive' });
        navigate('/rsya');
        return;
      }
      
      const data = await response.json();
      setProject(data.project);
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

      // Формируем config из formData
      const config: any = {
        goal_id: formData.goal_id
      };

      if (createMode === 'expert') {
        if (formData.keywords.trim()) {
          config.keywords = formData.keywords.split(',').map(k => k.trim()).filter(Boolean);
        }
        if (formData.exceptions.trim()) {
          config.exceptions = formData.exceptions.split(',').map(e => e.trim()).filter(Boolean);
        }
        if (formData.min_impressions) config.min_impressions = parseInt(formData.min_impressions);
        if (formData.max_impressions) config.max_impressions = parseInt(formData.max_impressions);
        if (formData.min_clicks) config.min_clicks = parseInt(formData.min_clicks);
        if (formData.max_clicks) config.max_clicks = parseInt(formData.max_clicks);
        if (formData.min_cpc) config.min_cpc = parseFloat(formData.min_cpc);
        if (formData.max_cpc) config.max_cpc = parseFloat(formData.max_cpc);
        if (formData.min_ctr) config.min_ctr = parseFloat(formData.min_ctr);
        if (formData.max_ctr) config.max_ctr = parseFloat(formData.max_ctr);
        if (formData.min_cpa) config.min_cpa = parseFloat(formData.min_cpa);
        if (formData.max_cpa) config.max_cpa = parseFloat(formData.max_cpa);
        if (formData.min_conversions) config.min_conversions = parseInt(formData.min_conversions);
      }

      const results: FilterResult[] = platforms.map(platform => {
        const matched = matchesTaskFilters(platform, config);
        
        return {
          ...platform,
          matched,
          matchedTasks: matched ? [formData.description] : []
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
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Тестер фильтров площадок</h1>
              <p className="text-muted-foreground">
                Проверьте какие площадки будут заблокированы на основе условий
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/rsya/${projectId}`)}
              className="gap-2"
            >
              <Icon name="ArrowLeft" className="h-4 w-4" />
              Назад к задачам
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* ЛЕВАЯ КОЛОНКА - ФИЛЬТРЫ (КАК В СОЗДАНИИ ЗАДАЧИ) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Settings" size={20} />
                  Настройка фильтров
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">Название теста</Label>
                  <Input
                    id="description"
                    placeholder="Например: Блокировка дорогих площадок"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-11"
                  />
                </div>

                <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as 'smart' | 'expert')}>
                  <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100">
                    <TabsTrigger value="smart" className="flex items-center gap-2 data-[state=active]:bg-white">
                      <Icon name="Sparkles" className="h-4 w-4" />
                      <span>Умная очистка</span>
                    </TabsTrigger>
                    <TabsTrigger value="expert" className="flex items-center gap-2 data-[state=active]:bg-white">
                      <Icon name="Settings" className="h-4 w-4" />
                      <span>Режим эксперта</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="smart" className="space-y-4 mt-6">
                    <div className="relative p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 overflow-hidden">
                      <div className="relative flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <Icon name="Sparkles" className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-900 text-lg mb-2">Автоматическая оптимизация</h4>
                          <p className="text-sm text-blue-700 leading-relaxed">
                            Система автоматически заблокирует площадки с низкой эффективностью на основе машинного обучения.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Icon name="Target" className="h-5 w-5 text-purple-500" />
                        <Label htmlFor="goal_id_smart" className="text-base font-semibold">Цель оптимизации</Label>
                      </div>
                      {(!project?.goals || project.goals.length === 0) ? (
                        <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ Сначала настройте счетчики Метрики в настройках проекта для загрузки целей
                          </p>
                        </div>
                      ) : (
                        <select
                          id="goal_id_smart"
                          value={formData.goal_id}
                          onChange={(e) => setFormData({ ...formData, goal_id: e.target.value })}
                          className="w-full h-11 px-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        >
                          <option value="all">🎯 Все конверсии</option>
                          {project.goals.map((goal: any) => (
                            <option key={goal.id} value={goal.id}>
                              {goal.name} (ID: {goal.id})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="expert" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b">
                        <Icon name="Blocks" className="h-5 w-5 text-gray-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Модули условий</h3>
                          <p className="text-sm text-gray-500">Добавьте условия блокировки — они суммируются</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const newModules = new Set(activeModules);
                            if (newModules.has('keywords')) newModules.delete('keywords');
                            else newModules.add('keywords');
                            setActiveModules(newModules);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            activeModules.has('keywords')
                              ? 'border-red-400 bg-red-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              activeModules.has('keywords') ? 'bg-red-500' : 'bg-gray-100'
                            }`}>
                              <Icon name="ShieldOff" className={`h-5 w-5 ${
                                activeModules.has('keywords') ? 'text-white' : 'text-gray-500'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">Блокировка</div>
                              <div className="text-xs text-gray-500">По вхождениям в URL</div>
                            </div>
                            <Icon name={activeModules.has('keywords') ? 'Check' : 'Plus'} className={`h-5 w-5 ${
                              activeModules.has('keywords') ? 'text-red-500' : 'text-gray-400'
                            }`} />
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const newModules = new Set(activeModules);
                            if (newModules.has('exceptions')) newModules.delete('exceptions');
                            else newModules.add('exceptions');
                            setActiveModules(newModules);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            activeModules.has('exceptions')
                              ? 'border-green-400 bg-green-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              activeModules.has('exceptions') ? 'bg-green-500' : 'bg-gray-100'
                            }`}>
                              <Icon name="ShieldCheck" className={`h-5 w-5 ${
                                activeModules.has('exceptions') ? 'text-white' : 'text-gray-500'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">Исключения</div>
                              <div className="text-xs text-gray-500">Никогда не блокировать</div>
                            </div>
                            <Icon name={activeModules.has('exceptions') ? 'Check' : 'Plus'} className={`h-5 w-5 ${
                              activeModules.has('exceptions') ? 'text-green-500' : 'text-gray-400'
                            }`} />
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const newModules = new Set(activeModules);
                            if (newModules.has('metrics')) newModules.delete('metrics');
                            else newModules.add('metrics');
                            setActiveModules(newModules);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            activeModules.has('metrics')
                              ? 'border-blue-400 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              activeModules.has('metrics') ? 'bg-blue-500' : 'bg-gray-100'
                            }`}>
                              <Icon name="TrendingDown" className={`h-5 w-5 ${
                                activeModules.has('metrics') ? 'text-white' : 'text-gray-500'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">Метрики</div>
                              <div className="text-xs text-gray-500">CPC, клики, показы</div>
                            </div>
                            <Icon name={activeModules.has('metrics') ? 'Check' : 'Plus'} className={`h-5 w-5 ${
                              activeModules.has('metrics') ? 'text-blue-500' : 'text-gray-400'
                            }`} />
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const newModules = new Set(activeModules);
                            if (newModules.has('conversions')) newModules.delete('conversions');
                            else newModules.add('conversions');
                            setActiveModules(newModules);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            activeModules.has('conversions')
                              ? 'border-purple-400 bg-purple-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              activeModules.has('conversions') ? 'bg-purple-500' : 'bg-gray-100'
                            }`}>
                              <Icon name="Target" className={`h-5 w-5 ${
                                activeModules.has('conversions') ? 'text-white' : 'text-gray-500'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">Конверсии</div>
                              <div className="text-xs text-gray-500">CPA, защита</div>
                            </div>
                            <Icon name={activeModules.has('conversions') ? 'Check' : 'Plus'} className={`h-5 w-5 ${
                              activeModules.has('conversions') ? 'text-purple-500' : 'text-gray-400'
                            }`} />
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* БЛОКИРОВКА */}
                    {activeModules.has('keywords') && (
                      <div className="p-5 bg-red-50 border-2 border-red-200 rounded-xl space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                            <Icon name="ShieldOff" className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Блокировка</h4>
                            <p className="text-sm text-gray-600">Площадки с этими словами в URL будут заблокированы</p>
                          </div>
                        </div>
                        <div>
                          <Label>Ключевые слова (через запятую)</Label>
                          <Input
                            placeholder="Например: casino, gambling, adult"
                            value={formData.keywords}
                            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    )}

                    {/* ИСКЛЮЧЕНИЯ */}
                    {activeModules.has('exceptions') && (
                      <div className="p-5 bg-green-50 border-2 border-green-200 rounded-xl space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                            <Icon name="ShieldCheck" className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Исключения</h4>
                            <p className="text-sm text-gray-600">Эти площадки НИКОГДА не будут заблокированы</p>
                          </div>
                        </div>
                        <div>
                          <Label>Исключения (через запятую)</Label>
                          <Input
                            placeholder="Например: avito, dzen, vk"
                            value={formData.exceptions}
                            onChange={(e) => setFormData({ ...formData, exceptions: e.target.value })}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    )}

                    {/* МЕТРИКИ */}
                    {activeModules.has('metrics') && (
                      <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-xl space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                            <Icon name="TrendingDown" className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Метрики</h4>
                            <p className="text-sm text-gray-600">Фильтры по показателям эффективности</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Min клики</Label>
                            <Input type="number" value={formData.min_clicks} onChange={(e) => setFormData({ ...formData, min_clicks: e.target.value })} />
                          </div>
                          <div>
                            <Label>Max клики</Label>
                            <Input type="number" value={formData.max_clicks} onChange={(e) => setFormData({ ...formData, max_clicks: e.target.value })} />
                          </div>
                          <div>
                            <Label>Min CPC (₽)</Label>
                            <Input type="number" step="0.01" value={formData.min_cpc} onChange={(e) => setFormData({ ...formData, min_cpc: e.target.value })} />
                          </div>
                          <div>
                            <Label>Max CPC (₽)</Label>
                            <Input type="number" step="0.01" value={formData.max_cpc} onChange={(e) => setFormData({ ...formData, max_cpc: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* КОНВЕРСИИ */}
                    {activeModules.has('conversions') && (
                      <div className="p-5 bg-purple-50 border-2 border-purple-200 rounded-xl space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                            <Icon name="Target" className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Конверсии</h4>
                            <p className="text-sm text-gray-600">Фильтры по конверсиям и CPA</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Min конверсии</Label>
                            <Input type="number" value={formData.min_conversions} onChange={(e) => setFormData({ ...formData, min_conversions: e.target.value })} />
                          </div>
                          <div>
                            <Label>Max CPA (₽)</Label>
                            <Input type="number" step="0.01" value={formData.max_cpa} onChange={(e) => setFormData({ ...formData, max_cpa: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="pt-4 border-t">
                  <Label>Список площадок (TSV формат)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Формат: Домен [TAB] Клики [TAB] Расход [TAB] Конверсии
                  </p>
                  <Textarea
                    value={platformsInput}
                    onChange={(e) => setPlatformsInput(e.target.value)}
                    placeholder="example.com	10	150.50	2&#10;test.ru	5	80.00	0"
                    className="font-mono text-sm h-32"
                  />
                </div>

                <Button 
                  onClick={testFilters} 
                  disabled={loading || !platformsInput.trim()}
                  className="w-full"
                  size="lg"
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

            {/* ПРАВАЯ КОЛОНКА - РЕЗУЛЬТАТЫ */}
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

                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
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
                              <div className={`font-mono text-sm font-semibold ${result.matched ? 'line-through text-red-600' : 'text-green-600'}`}>
                                {result.domain}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {result.clicks} кликов • ₽{result.cost.toFixed(2)} • {result.conversions} конв.
                                {result.cpc && ` • CPC: ₽${result.cpc.toFixed(2)}`}
                              </div>
                              {result.matchedTasks.length > 0 && (
                                <div className="text-xs mt-1 text-red-600 font-semibold">
                                  Попал под фильтр: {result.matchedTasks.join(', ')}
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
