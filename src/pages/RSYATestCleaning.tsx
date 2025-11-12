import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Category {
  name: string;
  keywords: string[];
  examples: string;
}

interface ExceptionPreset {
  name: string;
  domains: string[];
}

// Категории для блокировки
const BLOCK_CATEGORIES: Record<string, Category> = {
  apps: {
    name: 'Приложения',
    keywords: ['com.', 'app.', '.apk', 'android', 'ios.'],
    examples: 'com.puzzle.game, app.casino'
  },
  dsp: {
    name: 'DSP площадки',
    keywords: ['dsp', 'rtb', 'ssp', 'adexchange'],
    examples: 'rtb.network, dsp-ads.com'
  },
  vpn: {
    name: 'VPN и прокси',
    keywords: ['vpn', 'proxy', 'tunnel', 'unblocker'],
    examples: 'free.vpn, proxy-service'
  },
  games: {
    name: 'Игры',
    keywords: ['game', 'play', 'casino', 'slot', 'bet'],
    examples: 'casino-online, slot.games'
  },
  torrent: {
    name: 'Торренты',
    keywords: ['torrent', 'download', 'tracker', 'rutracker'],
    examples: 'rutracker.org, torrent-file'
  },
  adult: {
    name: 'Adult',
    keywords: ['xxx', 'adult', 'porn', 'sex', 'dating'],
    examples: 'xxx-site, adult.content'
  },
  spam: {
    name: 'Спам',
    keywords: ['click', 'clk', 'ads', 'redirect', 'traffic'],
    examples: 'clk.traff, redirect-ads'
  }
};

// Популярные исключения (белый список)
const EXCEPTION_PRESETS: Record<string, ExceptionPreset> = {
  popular: {
    name: 'Популярные приложения',
    domains: [
      'com.avito.android',
      'com.vkontakte.android',
      'com.yandex.mobile',
      'com.whatsapp',
      'com.telegram.messenger',
      'com.instagram.android'
    ]
  },
  trusted: {
    name: 'Проверенные площадки',
    domains: [
      'free.vpn.proxy.secure',
      'com.opera.browser',
      'com.chrome.browser',
      'com.yandex.shedevrus'
    ]
  }
};

export default function RSYATestCleaning() {
  const { toast } = useToast();
  
  // Шаг 1: Что чистим
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showCustomKeywords, setShowCustomKeywords] = useState(false);
  const [customKeywords, setCustomKeywords] = useState('');
  
  // Исключения
  const [selectedExceptions, setSelectedExceptions] = useState<Set<string>>(new Set());
  const [showCustomExceptions, setShowCustomExceptions] = useState(false);
  const [customExceptions, setCustomExceptions] = useState('');
  
  // Шаг 2: Критерии (свернуты по умолчанию)
  const [showCriteria, setShowCriteria] = useState(false);
  const [useCTR, setUseCTR] = useState(false);
  const [maxCTR, setMaxCTR] = useState('1.5');
  const [useCPC, setUseCPC] = useState(false);
  const [maxCPC, setMaxCPC] = useState('50');
  const [useCPA, setUseCPA] = useState(false);
  const [maxCPA, setMaxCPA] = useState('1000');
  const [useMinImpressions, setUseMinImpressions] = useState(false);
  const [minImpressions, setMinImpressions] = useState('1000');
  
  // Шаг 3: Защита конверсий
  const [protectConversions, setProtectConversions] = useState(false);
  const [goalId, setGoalId] = useState('all');
  
  const mockGoals = [
    { id: 'all', name: 'Все цели' },
    { id: '1', name: 'Спасибо за заявку' },
    { id: '2', name: 'Покупка' },
    { id: '3', name: 'Регистрация' }
  ];
  
  const toggleCategory = (categoryId: string) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(categoryId)) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);
    }
    setSelectedCategories(newSet);
  };
  
  const toggleException = (presetId: string) => {
    const newSet = new Set(selectedExceptions);
    if (newSet.has(presetId)) {
      newSet.delete(presetId);
    } else {
      newSet.add(presetId);
    }
    setSelectedExceptions(newSet);
  };
  
  const getAllKeywords = (): string[] => {
    const keywords: string[] = [];
    
    selectedCategories.forEach(catId => {
      const category = BLOCK_CATEGORIES[catId];
      if (category) {
        keywords.push(...category.keywords);
      }
    });
    
    if (customKeywords.trim()) {
      const custom = customKeywords.split(',').map(k => k.trim()).filter(Boolean);
      keywords.push(...custom);
    }
    
    return keywords;
  };
  
  const getAllExceptions = (): string[] => {
    const exceptions: string[] = [];
    
    selectedExceptions.forEach(presetId => {
      const preset = EXCEPTION_PRESETS[presetId];
      if (preset) {
        exceptions.push(...preset.domains);
      }
    });
    
    if (customExceptions.trim()) {
      const custom = customExceptions.split(',').map(e => e.trim()).filter(Boolean);
      exceptions.push(...custom);
    }
    
    return exceptions;
  };
  
  const handleCreateTask = () => {
    const config: any = {};
    
    const keywords = getAllKeywords();
    if (keywords.length > 0) {
      config.keywords = keywords;
    }
    
    const exceptions = getAllExceptions();
    if (exceptions.length > 0) {
      config.exceptions = exceptions;
    }
    
    if (useCTR) {
      config.max_ctr = parseFloat(maxCTR);
    }
    
    if (useCPC) {
      config.max_cpc = parseFloat(maxCPC);
    }
    
    if (useCPA) {
      config.max_cpa = parseFloat(maxCPA);
    }
    
    if (useMinImpressions) {
      config.min_impressions = parseInt(minImpressions);
    }
    
    if (protectConversions && goalId !== 'all') {
      config.protect_conversions = true;
      config.goal_id = goalId;
    }
    
    console.log('📋 Конфиг задачи:', config);
    
    toast({
      title: 'Задача создана',
      description: 'Конфиг выведен в консоль (F12)'
    });
  };
  
  const allKeywords = getAllKeywords();
  const allExceptions = getAllExceptions();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Конструктор чистки РСЯ</h1>
          <p className="text-sm text-slate-600">Соберите задачу за 1 минуту</p>
        </div>
        
        <div className="space-y-4">
          
          {/* БЛОК 1: ЧТО ЧИСТИМ */}
          <Card className="border-blue-300 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Icon name="Target" className="text-white" size={16} />
                  </div>
                  <div>
                    <CardTitle className="text-base">Что блокируем</CardTitle>
                    <CardDescription className="text-xs">Выберите категории площадок</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              
              {/* Категории кнопками */}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(BLOCK_CATEGORIES).map(([id, category]) => (
                  <Button
                    key={id}
                    variant={selectedCategories.has(id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleCategory(id)}
                    className="h-auto py-1.5 px-3 rounded-full relative group"
                  >
                    {selectedCategories.has(id) && (
                      <Icon 
                        name="X" 
                        size={12} 
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(id);
                        }}
                      />
                    )}
                    <div className="text-left">
                      <div className="font-medium text-xs leading-tight">{category.name}</div>
                      <div className="text-[10px] opacity-70 font-normal leading-tight">{category.examples}</div>
                    </div>
                  </Button>
                ))}
              </div>
              
              {/* Кнопка добавления своих */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomKeywords(!showCustomKeywords)}
                className="rounded-full text-xs h-auto py-1.5 px-3"
              >
                <Icon name="Plus" size={14} className="mr-1" />
                Добавить свои
              </Button>
              
              {showCustomKeywords && (
                <div className="pt-2">
                  <Textarea
                    placeholder="Введите свои ключевые слова через запятую"
                    value={customKeywords}
                    onChange={(e) => setCustomKeywords(e.target.value)}
                    className="h-16 text-sm"
                  />
                </div>
              )}
              
              {allKeywords.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-xs font-medium text-blue-900 mb-1">Выбрано ({allKeywords.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {allKeywords.map((k, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{k}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* ИСКЛЮЧЕНИЯ */}
          <Card className="border-green-300 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Icon name="Shield" className="text-white" size={16} />
                </div>
                <div>
                  <CardTitle className="text-base">Исключения (белый список)</CardTitle>
                  <CardDescription className="text-xs">Эти площадки не будут блокироваться</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              
              {/* Пресеты исключений */}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(EXCEPTION_PRESETS).map(([id, preset]) => (
                  <Button
                    key={id}
                    variant={selectedExceptions.has(id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleException(id)}
                    className="h-auto py-1.5 px-3 rounded-full relative group"
                  >
                    {selectedExceptions.has(id) && (
                      <Icon 
                        name="X" 
                        size={12} 
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleException(id);
                        }}
                      />
                    )}
                    <div className="text-left">
                      <div className="font-medium text-xs leading-tight">{preset.name}</div>
                      <div className="text-[10px] opacity-70 font-normal leading-tight">{preset.domains.length} доменов</div>
                    </div>
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomExceptions(!showCustomExceptions)}
                className="rounded-full text-xs h-auto py-1.5 px-3"
              >
                <Icon name="Plus" size={14} className="mr-1" />
                Добавить свои
              </Button>
              
              {showCustomExceptions && (
                <div className="pt-2">
                  <Textarea
                    placeholder="Введите домены через запятую (точное совпадение)"
                    value={customExceptions}
                    onChange={(e) => setCustomExceptions(e.target.value)}
                    className="h-16 text-sm"
                  />
                </div>
              )}
              
              {allExceptions.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <p className="text-xs font-medium text-green-900 mb-1">Защищено ({allExceptions.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {allExceptions.map((e, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-green-400">{e}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* БЛОК 2: КРИТЕРИИ (СВЕРНУТЫЙ) */}
          <Card className="border-purple-300 shadow-sm">
            <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowCriteria(!showCriteria)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Icon name="SlidersHorizontal" className="text-white" size={16} />
                  </div>
                  <div>
                    <CardTitle className="text-base">Дополнительные критерии</CardTitle>
                    <CardDescription className="text-xs">CTR, CPC, CPA (необязательно)</CardDescription>
                  </div>
                </div>
                <Icon name={showCriteria ? "ChevronUp" : "ChevronDown"} size={20} />
              </div>
            </CardHeader>
            
            {showCriteria && (
              <CardContent className="space-y-2">
                
                {/* CTR */}
                <div className="flex items-center gap-3 p-2 bg-white rounded border text-sm">
                  <Checkbox
                    checked={useCTR}
                    onCheckedChange={(checked) => setUseCTR(!!checked)}
                  />
                  <div className="flex-1">
                    <Label className="cursor-pointer font-medium" onClick={() => setUseCTR(!useCTR)}>
                      CTR больше {useCTR && maxCTR}%
                    </Label>
                    {useCTR && (
                      <Input
                        type="number"
                        step="0.1"
                        value={maxCTR}
                        onChange={(e) => setMaxCTR(e.target.value)}
                        className="w-20 h-7 mt-1"
                      />
                    )}
                  </div>
                </div>
                
                {/* CPC */}
                <div className="flex items-center gap-3 p-2 bg-white rounded border text-sm">
                  <Checkbox
                    checked={useCPC}
                    onCheckedChange={(checked) => setUseCPC(!!checked)}
                  />
                  <div className="flex-1">
                    <Label className="cursor-pointer font-medium" onClick={() => setUseCPC(!useCPC)}>
                      CPC больше {useCPC && maxCPC}₽
                    </Label>
                    {useCPC && (
                      <Input
                        type="number"
                        step="1"
                        value={maxCPC}
                        onChange={(e) => setMaxCPC(e.target.value)}
                        className="w-20 h-7 mt-1"
                      />
                    )}
                  </div>
                </div>
                
                {/* CPA */}
                <div className="flex items-center gap-3 p-2 bg-white rounded border text-sm">
                  <Checkbox
                    checked={useCPA}
                    onCheckedChange={(checked) => setUseCPA(!!checked)}
                  />
                  <div className="flex-1">
                    <Label className="cursor-pointer font-medium" onClick={() => setUseCPA(!useCPA)}>
                      CPA больше {useCPA && maxCPA}₽
                    </Label>
                    {useCPA && (
                      <Input
                        type="number"
                        step="10"
                        value={maxCPA}
                        onChange={(e) => setMaxCPA(e.target.value)}
                        className="w-24 h-7 mt-1"
                      />
                    )}
                  </div>
                </div>
                
                {/* Min impressions */}
                <div className="flex items-center gap-3 p-2 bg-white rounded border text-sm">
                  <Checkbox
                    checked={useMinImpressions}
                    onCheckedChange={(checked) => setUseMinImpressions(!!checked)}
                  />
                  <div className="flex-1">
                    <Label className="cursor-pointer font-medium" onClick={() => setUseMinImpressions(!useMinImpressions)}>
                      Минимум показов {useMinImpressions && minImpressions}
                    </Label>
                    {useMinImpressions && (
                      <Input
                        type="number"
                        step="100"
                        value={minImpressions}
                        onChange={(e) => setMinImpressions(e.target.value)}
                        className="w-28 h-7 mt-1"
                      />
                    )}
                  </div>
                </div>
                
              </CardContent>
            )}
          </Card>
          
          {/* БЛОК 3: ЗАЩИТА КОНВЕРСИЙ */}
          <Card className="border-amber-300 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Icon name="ShieldCheck" className="text-white" size={16} />
                </div>
                <div>
                  <CardTitle className="text-base">Защита конверсий</CardTitle>
                  <CardDescription className="text-xs">Не блокировать площадки с заявками</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              
              <div className="flex items-start gap-3 p-2 bg-white rounded border">
                <Checkbox
                  checked={protectConversions}
                  onCheckedChange={(checked) => setProtectConversions(!!checked)}
                  className="mt-0.5"
                />
                <Label className="cursor-pointer text-sm font-medium" onClick={() => setProtectConversions(!protectConversions)}>
                  Не чистить площадки с конверсиями
                </Label>
              </div>
              
              {protectConversions && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Выберите цель</Label>
                  <Select value={goalId} onValueChange={setGoalId}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockGoals.map(goal => (
                        <SelectItem key={goal.id} value={goal.id} className="text-sm">
                          {goal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {goalId === 'all' ? (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <Icon name="AlertTriangle" size={12} />
                      Выберите конкретную цель
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <Icon name="CheckCircle2" size={12} />
                      Защита активна для цели "{mockGoals.find(g => g.id === goalId)?.name}"
                    </p>
                  )}
                </div>
              )}
              
            </CardContent>
          </Card>
          
          {/* ПРЕВЬЮ */}
          {allKeywords.length > 0 && (
            <Card className="border-slate-300 bg-slate-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Превью задачи</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-slate-900">Будут заблокированы площадки если:</p>
                  <ul className="space-y-1 text-slate-700">
                    {allKeywords.length > 0 && (
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={14} className="text-green-600 mt-0.5" />
                        <span className="text-xs">Домен содержит: {allKeywords.slice(0, 5).join(', ')}{allKeywords.length > 5 && ` и ещё ${allKeywords.length - 5}`}</span>
                      </li>
                    )}
                    
                    {allExceptions.length > 0 && (
                      <li className="flex items-start gap-2">
                        <Icon name="Shield" size={14} className="text-blue-600 mt-0.5" />
                        <span className="text-xs">НО НЕ совпадает с {allExceptions.length} исключениями</span>
                      </li>
                    )}
                    
                    {useCTR && (
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={14} className="text-green-600 mt-0.5" />
                        <span className="text-xs">CTR &gt; {maxCTR}%</span>
                      </li>
                    )}
                    
                    {useCPC && (
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={14} className="text-green-600 mt-0.5" />
                        <span className="text-xs">CPC &gt; {maxCPC}₽</span>
                      </li>
                    )}
                    
                    {useCPA && (
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={14} className="text-green-600 mt-0.5" />
                        <span className="text-xs">CPA &gt; {maxCPA}₽</span>
                      </li>
                    )}
                    
                    {useMinImpressions && (
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={14} className="text-green-600 mt-0.5" />
                        <span className="text-xs">Показов &gt; {minImpressions}</span>
                      </li>
                    )}
                    
                    {protectConversions && goalId !== 'all' && (
                      <li className="flex items-start gap-2">
                        <Icon name="Shield" size={14} className="text-green-600 mt-0.5" />
                        <span className="text-xs">И НЕТ конверсий по цели "{mockGoals.find(g => g.id === goalId)?.name}"</span>
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* КНОПКА СОЗДАНИЯ */}
          <Button 
            onClick={handleCreateTask}
            className="w-full h-11"
            disabled={allKeywords.length === 0}
            size="lg"
          >
            <Icon name="Play" className="mr-2" size={18} />
            Создать задачу
          </Button>
          
        </div>
      </div>
    </div>
  );
}