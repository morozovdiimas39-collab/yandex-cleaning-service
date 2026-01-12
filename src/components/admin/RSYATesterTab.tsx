import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

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

interface FilterResult extends Platform {
  matched: boolean;
  reason: string;
}

interface TestPreset {
  name: string;
  description: string;
  config: {
    keywords?: string[];
    exceptions?: string[];
    min_impressions?: number;
    max_impressions?: number;
    min_clicks?: number;
    max_clicks?: number;
    min_cpc?: number;
    max_cpc?: number;
    min_ctr?: number;
    max_ctr?: number;
    min_conversions?: number;
    min_cpa?: number;
    max_cpa?: number;
  };
  combineOperator: 'OR' | 'AND';
  testPlatforms: string;
}

const TEST_PRESETS: TestPreset[] = [
  {
    name: '🎯 Простая блокировка VPN',
    description: 'Блокирует все площадки с "vpn" или "dsp" в URL',
    config: {
      keywords: ['vpn', 'dsp']
    },
    combineOperator: 'OR',
    testPlatforms: `vpn-service.com\t50\t1500\t0\t10000
dsp-network.ru\t30\t900\t1\t8000
yandex.ru\t200\t3000\t25\t50000
best-vpn-deals.com\t15\t450\t0\t5000
ozon.ru\t180\t2700\t30\t45000`
  },
  {
    name: '🛡️ Блокировка с исключениями',
    description: 'Блокирует игры, но защищает yandex и vk',
    config: {
      keywords: ['game', 'play'],
      exceptions: ['yandex', 'vk']
    },
    combineOperator: 'OR',
    testPlatforms: `mobile-games.com\t40\t1200\t2\t9000
play-store-ads.net\t25\t750\t0\t6000
games.yandex.ru\t150\t2250\t20\t35000
play.vk.com\t120\t1800\t15\t28000
avito.ru\t160\t2400\t28\t40000`
  },
  {
    name: '📊 Низкий CTR',
    description: 'Блокирует площадки с CTR < 0.5% и показами > 1000',
    config: {
      min_ctr: 0.5,
      min_impressions: 1000
    },
    combineOperator: 'OR',
    testPlatforms: `bad-platform.com\t6\t180\t0\t2000
low-engagement.ru\t3\t90\t0\t1500
good-site.com\t36\t540\t8\t3000
new-platform.net\t0\t0\t0\t500
top-site.ru\t125\t1875\t35\t5000`
  },
  {
    name: '💰 Дорогие клики',
    description: 'Блокирует CPC > 50₽ при кликах > 10',
    config: {
      max_cpc: 50,
      min_clicks: 10
    },
    combineOperator: 'OR',
    testPlatforms: `expensive-ads.com\t15\t1125\t1\t3000
premium-network.ru\t20\t2400\t3\t5000
cheap-traffic.net\t50\t750\t12\t10000
test-platform.com\t5\t400\t0\t1000
normal-site.ru\t100\t2500\t22\t20000`
  },
  {
    name: '🎯 Защита конверсий',
    description: 'Блокирует площадки без конверсий при показах > 5000',
    config: {
      min_conversions: 1,
      min_impressions: 5000
    },
    combineOperator: 'OR',
    testPlatforms: `zero-conv.com\t80\t2400\t0\t10000
waste-money.ru\t50\t1500\t0\t7000
good-platform.net\t90\t2700\t3\t8000
new-site.com\t15\t450\t0\t2000
converting-site.ru\t200\t6000\t25\t15000`
  },
  {
    name: '🔥 Агрессивная чистка (OR)',
    description: 'Любое совпадение: VPN ИЛИ дорого ИЛИ низкий CTR',
    config: {
      keywords: ['vpn', 'proxy'],
      min_ctr: 0.8,
      min_clicks: 20
    },
    combineOperator: 'OR',
    testPlatforms: `vpn-service.com\t100\t3000\t5\t20000
fast-proxy.net\t60\t1800\t2\t12000
bad-site.ru\t30\t900\t0\t6000
good-platform.com\t120\t1800\t25\t10000
new-site.net\t15\t450\t1\t3000`
  },
  {
    name: '🎖️ Строгий режим (AND)',
    description: 'ВСЕ условия: VPN И дорого И без конверсий',
    config: {
      keywords: ['vpn'],
      max_cpc: 30,
      min_conversions: 1,
      min_clicks: 50
    },
    combineOperator: 'AND',
    testPlatforms: `cheap-vpn-trash.com\t60\t2400\t0\t8000
expensive-vpn.ru\t100\t2500\t5\t15000
vpn-premium.net\t20\t700\t0\t4000
bad-site.com\t80\t3200\t0\t12000
good-vpn.org\t80\t1600\t3\t10000`
  },
  {
    name: '🛡️ Защита качественных (AND)',
    description: 'Блокирует только явный мусор: bot+click И дорого И без конверсий',
    config: {
      keywords: ['bot', 'click'],
      max_cpc: 100,
      min_conversions: 1,
      exceptions: ['telegram', 'whatsapp']
    },
    combineOperator: 'AND',
    testPlatforms: `bot-click-farm.com\t50\t7500\t0\t6000
telegram-bot.ru\t80\t2400\t8\t10000
click-tracker.net\t60\t4800\t2\t9000
bot-network.org\t40\t2000\t0\t7000
yandex.ru\t200\t3000\t35\t25000`
  },
  {
    name: '🔥 Максимальная чистка (OR)',
    description: 'Агрессивная блокировка всего подозрительного',
    config: {
      keywords: ['dsp', 'vpn', 'bot', 'click'],
      max_cpc: 80,
      min_ctr: 0.5,
      min_conversions: 1,
      min_clicks: 30,
      exceptions: ['yandex', 'vk']
    },
    combineOperator: 'OR',
    testPlatforms: `vpn-dsp-bot.com\t50\t1500\t0\t8000
expensive-ads.ru\t40\t4800\t2\t6000
low-ctr-site.net\t50\t1500\t1\t25000
zero-conv-platform.org\t100\t3000\t0\t15000
games.yandex.ru\t200\t3000\t10\t20000
good-platform.com\t200\t5000\t10\t16666`
  },
  {
    name: '💎 Консервативный (AND)',
    description: 'Блокирует только 100% мусор: bot+fake И много показов И дорого',
    config: {
      keywords: ['bot', 'fake'],
      max_cpc: 200,
      min_impressions: 10000,
      min_conversions: 1
    },
    combineOperator: 'AND',
    testPlatforms: `fake-bot-traffic.com\t50\t12500\t0\t15000
bot-network.ru\t100\t15000\t5\t20000
fake-news.net\t30\t900\t0\t5000
click-bot.org\t60\t10800\t0\t12000
good-site.com\t150\t3000\t25\t18000`
  }
];

export default function RSYATesterTab() {
  const [selectedPreset, setSelectedPreset] = useState<TestPreset | null>(null);
  const [platformsInput, setPlatformsInput] = useState('');
  const [config, setConfig] = useState<any>({});
  const [combineOperator, setCombineOperator] = useState<'OR' | 'AND'>('OR');
  const [results, setResults] = useState<FilterResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const matchesTaskFilters = (platform: Platform, config: any, operator: 'OR' | 'AND'): { matched: boolean; reason: string } => {
    const domain = platform.domain.toLowerCase();
    const reasons: string[] = [];
    let matchCount = 0;
    let totalChecks = 0;

    // 1. Проверка исключений (самое сильное правило)
    const exceptions = config.exceptions || [];
    if (exceptions.length > 0) {
      totalChecks++;
      const hasException = exceptions.some((exc: string) => domain.includes(exc.toLowerCase()));
      if (hasException) {
        return { matched: false, reason: `✅ Исключение: ${exceptions.find((e: string) => domain.includes(e.toLowerCase()))}` };
      }
    }

    // 2. Проверка ключевых слов
    const keywords = config.keywords || [];
    if (keywords.length > 0) {
      totalChecks++;
      const matchedKeyword = keywords.find((kw: string) => domain.includes(kw.toLowerCase()));
      if (matchedKeyword) {
        matchCount++;
        reasons.push(`🔴 Ключевое слово: "${matchedKeyword}"`);
      } else if (operator === 'AND') {
        return { matched: false, reason: '❌ Нет ключевого слова' };
      }
    }

    // 3. Фильтры по метрикам
    if (config.min_impressions !== undefined) {
      totalChecks++;
      if ((platform.impressions || 0) < config.min_impressions) {
        if (operator === 'AND') {
          return { matched: false, reason: `❌ Показы: ${platform.impressions} < ${config.min_impressions}` };
        }
      } else {
        matchCount++;
      }
    }

    if (config.max_impressions !== undefined) {
      totalChecks++;
      if ((platform.impressions || 0) > config.max_impressions) {
        matchCount++;
        reasons.push(`📊 Показы: ${platform.impressions} > ${config.max_impressions}`);
      } else if (operator === 'AND') {
        return { matched: false, reason: `❌ Показы в норме` };
      }
    }

    if (config.min_clicks !== undefined) {
      totalChecks++;
      if (platform.clicks < config.min_clicks) {
        if (operator === 'AND') {
          return { matched: false, reason: `❌ Клики: ${platform.clicks} < ${config.min_clicks}` };
        }
      } else {
        matchCount++;
      }
    }

    if (config.max_clicks !== undefined) {
      totalChecks++;
      if (platform.clicks > config.max_clicks) {
        matchCount++;
        reasons.push(`👆 Клики: ${platform.clicks} > ${config.max_clicks}`);
      } else if (operator === 'AND') {
        return { matched: false, reason: `❌ Клики в норме` };
      }
    }

    if (config.min_cpc !== undefined) {
      totalChecks++;
      if ((platform.cpc || 0) < config.min_cpc) {
        if (operator === 'AND') {
          return { matched: false, reason: `❌ CPC слишком низкий` };
        }
      } else {
        matchCount++;
      }
    }

    if (config.max_cpc !== undefined) {
      totalChecks++;
      if ((platform.cpc || 0) > config.max_cpc) {
        matchCount++;
        reasons.push(`💰 CPC: ${platform.cpc?.toFixed(2)}₽ > ${config.max_cpc}₽`);
      } else if (operator === 'AND') {
        return { matched: false, reason: `❌ CPC в норме` };
      }
    }

    if (config.min_ctr !== undefined) {
      totalChecks++;
      if ((platform.ctr || 0) < config.min_ctr) {
        matchCount++;
        reasons.push(`📉 CTR: ${platform.ctr}% < ${config.min_ctr}%`);
      } else if (operator === 'AND') {
        return { matched: false, reason: `❌ CTR в норме` };
      }
    }

    if (config.max_ctr !== undefined) {
      totalChecks++;
      if ((platform.ctr || 0) > config.max_ctr) {
        matchCount++;
        reasons.push(`📈 CTR: ${platform.ctr}% > ${config.max_ctr}%`);
      } else if (operator === 'AND') {
        return { matched: false, reason: `❌ CTR в норме` };
      }
    }

    if (config.min_conversions !== undefined) {
      totalChecks++;
      if (platform.conversions < config.min_conversions) {
        matchCount++;
        reasons.push(`🎯 Конверсии: ${platform.conversions} < ${config.min_conversions}`);
      } else if (operator === 'AND') {
        return { matched: false, reason: `❌ Есть конверсии` };
      }
    }

    if (config.min_cpa !== undefined) {
      totalChecks++;
      if ((platform.cpa || 0) < config.min_cpa) {
        if (operator === 'AND') {
          return { matched: false, reason: `❌ CPA слишком низкий` };
        }
      } else {
        matchCount++;
      }
    }

    if (config.max_cpa !== undefined) {
      totalChecks++;
      if ((platform.cpa || 0) > config.max_cpa) {
        matchCount++;
        reasons.push(`💸 CPA: ${platform.cpa?.toFixed(2)}₽ > ${config.max_cpa}₽`);
      } else if (operator === 'AND') {
        return { matched: false, reason: `❌ CPA в норме` };
      }
    }

    // Логика OR vs AND
    if (operator === 'OR') {
      const matched = matchCount > 0;
      return {
        matched,
        reason: matched ? reasons.join(' | ') : '✅ Не подходит ни под одно условие'
      };
    } else {
      // AND - все условия должны совпасть
      const matched = matchCount === totalChecks && totalChecks > 0;
      return {
        matched,
        reason: matched ? reasons.join(' + ') : reasons[0] || '❌ Не все условия выполнены'
      };
    }
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
        const impressions = parts[4] ? parseInt(parts[4]) : undefined;

        const platform: Platform = {
          domain,
          clicks,
          cost,
          conversions,
          impressions,
          cpc: clicks > 0 ? cost / clicks : 0,
          ctr: impressions && impressions > 0 ? (clicks / impressions) * 100 : 0,
          cpa: conversions > 0 ? cost / conversions : 0
        };

        platforms.push(platform);
      }
    }

    return platforms;
  };

  const runTest = () => {
    const platforms = parsePlatforms(platformsInput);
    if (platforms.length === 0) {
      alert('Не удалось распарсить площадки. Формат: Домен [TAB] Клики [TAB] Расход [TAB] Конверсии [TAB] Показы');
      return;
    }

    const testResults: FilterResult[] = platforms.map(platform => {
      const { matched, reason } = matchesTaskFilters(platform, config, combineOperator);
      return {
        ...platform,
        matched,
        reason
      };
    });

    setResults(testResults);
    setShowResults(true);
  };

  const loadPreset = (preset: TestPreset) => {
    setSelectedPreset(preset);
    setConfig(preset.config);
    setCombineOperator(preset.combineOperator);
    setPlatformsInput(preset.testPlatforms);
    setShowResults(false);
  };

  const blockedCount = results.filter(r => r.matched).length;
  const passedCount = results.length - blockedCount;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">🧪 Тестер фильтров РСЯ</h2>
        <p className="text-muted-foreground">
          Проверь как работают разные комбинации правил блокировки. Выбери пресет или создай свои условия.
        </p>
      </div>

      {/* Пресеты */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Sparkles" className="h-5 w-5" />
            Готовые тестовые сценарии
          </CardTitle>
          <CardDescription>
            Выбери пресет чтобы увидеть как работают фильтры на реальных примерах
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEST_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => loadPreset(preset)}
                className={`p-4 rounded-lg border-2 text-left transition-all hover:border-blue-400 hover:shadow-md ${
                  selectedPreset?.name === preset.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="font-semibold text-sm mb-1">{preset.name}</div>
                <div className="text-xs text-muted-foreground mb-2">{preset.description}</div>
                <Badge variant={preset.combineOperator === 'OR' ? 'default' : 'secondary'} className="text-xs">
                  {preset.combineOperator}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Конфигурация */}
      {selectedPreset && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Левая колонка: настройки */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Settings" className="h-5 w-5" />
                Конфигурация фильтров
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Icon name="GitBranch" className="h-4 w-4" />
                  Режим комбинирования
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={combineOperator === 'OR' ? 'default' : 'outline'}
                    onClick={() => setCombineOperator('OR')}
                    className="w-full"
                  >
                    ИЛИ (OR)
                  </Button>
                  <Button
                    variant={combineOperator === 'AND' ? 'default' : 'outline'}
                    onClick={() => setCombineOperator('AND')}
                    className="w-full"
                  >
                    И (AND)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {combineOperator === 'OR'
                    ? '🔥 Агрессивно: блокируется при совпадении ЛЮБОГО условия'
                    : '💎 Консервативно: блокируется только при совпадении ВСЕХ условий'}
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm font-semibold mb-3">Активные фильтры:</div>
                <div className="space-y-2">
                  {config.keywords && (
                    <div className="flex items-start gap-2 text-sm">
                      <Icon name="ShieldOff" className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Ключевые слова:</span>{' '}
                        <span className="text-red-600">{config.keywords.join(', ')}</span>
                      </div>
                    </div>
                  )}
                  {config.exceptions && (
                    <div className="flex items-start gap-2 text-sm">
                      <Icon name="ShieldCheck" className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Исключения:</span>{' '}
                        <span className="text-green-600">{config.exceptions.join(', ')}</span>
                      </div>
                    </div>
                  )}
                  {config.min_ctr && (
                    <div className="flex items-start gap-2 text-sm">
                      <Icon name="TrendingDown" className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Min CTR:</span> {config.min_ctr}%
                      </div>
                    </div>
                  )}
                  {config.max_cpc && (
                    <div className="flex items-start gap-2 text-sm">
                      <Icon name="DollarSign" className="h-4 w-4 text-orange-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Max CPC:</span> {config.max_cpc}₽
                      </div>
                    </div>
                  )}
                  {config.min_conversions && (
                    <div className="flex items-start gap-2 text-sm">
                      <Icon name="Target" className="h-4 w-4 text-purple-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Min конверсии:</span> {config.min_conversions}
                      </div>
                    </div>
                  )}
                  {config.min_impressions && (
                    <div className="flex items-start gap-2 text-sm">
                      <Icon name="Eye" className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Min показы:</span> {config.min_impressions}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label>Тестовые площадки (TSV)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Формат: Домен [TAB] Клики [TAB] Расход [TAB] Конверсии [TAB] Показы
                </p>
                <Textarea
                  value={platformsInput}
                  onChange={(e) => setPlatformsInput(e.target.value)}
                  className="font-mono text-xs h-48"
                />
              </div>

              <Button onClick={runTest} className="w-full" size="lg">
                <Icon name="Play" className="h-4 w-4 mr-2" />
                Запустить тест
              </Button>
            </CardContent>
          </Card>

          {/* Правая колонка: результаты */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="BarChart3" className="h-5 w-5" />
                Результаты теста
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showResults ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="PlayCircle" className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Нажми "Запустить тест" чтобы увидеть результаты</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Статистика */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                      <div className="text-3xl font-bold text-red-600">{blockedCount}</div>
                      <div className="text-sm text-muted-foreground">Заблокировано</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <div className="text-3xl font-bold text-green-600">{passedCount}</div>
                      <div className="text-sm text-muted-foreground">Пропущено</div>
                    </div>
                  </div>

                  {/* Список результатов */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {results.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border-2 ${
                          result.matched
                            ? 'bg-red-50 border-red-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {result.matched ? (
                                <Icon name="XCircle" className="h-4 w-4 text-red-500 flex-shrink-0" />
                              ) : (
                                <Icon name="CheckCircle" className="h-4 w-4 text-green-500 flex-shrink-0" />
                              )}
                              <span
                                className={`font-mono text-sm font-semibold truncate ${
                                  result.matched ? 'text-red-700' : 'text-green-700'
                                }`}
                              >
                                {result.domain}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {result.clicks} кликов • ₽{result.cost.toFixed(2)} • {result.conversions} конв
                              {result.cpc && ` • CPC: ₽${result.cpc.toFixed(2)}`}
                              {result.ctr && ` • CTR: ${result.ctr.toFixed(2)}%`}
                            </div>
                            <div className={`text-xs font-medium ${result.matched ? 'text-red-600' : 'text-green-600'}`}>
                              {result.reason}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
