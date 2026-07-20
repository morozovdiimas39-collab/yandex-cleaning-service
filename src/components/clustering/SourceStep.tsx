import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { City } from '@/data/russian-cities';
import {
  findCity,
  loadKeywordPlan,
  collectWordstatWithAi,
  AiKeywordCluster,
  KeywordPlan,
  WordstatCollection,
  WordstatPhrase,
  uniq,
} from './keywordPlanner';

type Source = 'manual' | 'website';
type StageKey = 'idle' | 'planning' | 'wordstat' | 'analysis' | 'second-pass' | 'done';

interface SourceStepProps {
  source: Source;
  setSource: (source: Source) => void;
  manualKeywords: string;
  setManualKeywords: (keywords: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  objectAddress: string;
  setObjectAddress: (address: string) => void;
  onNext: () => void;
  onWordstatClick?: () => void;
  onAiApply?: (keywords: string, city?: City, minusWords?: string[], verifiedPhrases?: WordstatPhrase[], clusters?: AiKeywordCluster[]) => void;
  onManualKeywordsEdit?: () => void;
  isLoading?: boolean;
}

const stages: Array<{ key: StageKey; label: string; icon: string }> = [
  { key: 'planning', label: 'AI строит план', icon: 'Brain' },
  { key: 'wordstat', label: 'Wordstat проверяет', icon: 'Search' },
  { key: 'analysis', label: 'AI анализирует', icon: 'ScanSearch' },
  { key: 'second-pass', label: 'Wordstat досбор', icon: 'RefreshCw' },
  { key: 'done', label: 'Готово', icon: 'CheckCircle2' },
];

export default function SourceStep({
  setSource,
  manualKeywords,
  setManualKeywords,
  websiteUrl,
  setWebsiteUrl,
  objectAddress,
  setObjectAddress,
  onNext,
  onAiApply,
  onManualKeywordsEdit,
  isLoading
}: SourceStepProps) {
  const [businessTheme, setBusinessTheme] = useState('');
  const [region, setRegion] = useState('');
  const [details, setDetails] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [audience, setAudience] = useState('b2c');
  const [isCollecting, setIsCollecting] = useState(false);
  const [stage, setStage] = useState<StageKey>('idle');
  const [progress, setProgress] = useState(0);
  const [plan, setPlan] = useState<KeywordPlan | null>(null);
  const [collection, setCollection] = useState<WordstatCollection | null>(null);
  const [phrases, setPhrases] = useState<WordstatPhrase[]>([]);

  const selectedCity = useMemo(() => findCity(region), [region]);
  const smartFieldsVisible = businessTheme.trim().length > 0;
  const keywordCount = manualKeywords.split('\n').filter(k => k.trim()).length;

  const handleCollect = async () => {
    if (!businessTheme.trim()) return;

    setIsCollecting(true);
    setStage('planning');
    setProgress(15);
    setPlan(null);
    setCollection(null);
    setPhrases([]);
    setManualKeywords('');

    try {
      const nextPlan = await loadKeywordPlan({
        theme: businessTheme,
        services: details,
        region,
        exclusions,
        audience,
      });
      setPlan(nextPlan);
      setProgress(35);
      setStage('wordstat');

      const result = await collectWordstatWithAi(nextPlan, region);
      setCollection({
        ...result,
        verifiedPhrases: result.verifiedPhrases,
      });
      setPhrases(result.verifiedPhrases);
      setProgress(68);
      setStage('analysis');

      await new Promise((resolve) => setTimeout(resolve, 350));
      setProgress(84);
      setStage('second-pass');

      await new Promise((resolve) => setTimeout(resolve, 300));
      setProgress(100);
      setStage('done');

      const keywords = uniq(result.verifiedPhrases.map((phrase) => phrase.phrase)).join('\n');

      setSource('manual');
      if (onAiApply) {
        onAiApply(
          keywords,
          selectedCity,
          result.minusWords || nextPlan.minusWords,
          result.verifiedPhrases,
          result.clusters,
        );
      } else {
        setManualKeywords(keywords);
      }
    } finally {
      setIsCollecting(false);
    }
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-br from-slate-50 to-white">
        <CardTitle className="text-2xl text-slate-800">Сбор ключей</CardTitle>
        <CardDescription className="text-slate-500">
          Опишите бизнес: AI управляет сбором, а Wordstat подтверждает реальные фразы
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <Label htmlFor="business-theme" className="text-slate-700">Чем занимаетесь?</Label>
          <div className="relative">
            <Icon name="Sparkles" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
            <Input
              id="business-theme"
              value={businessTheme}
              onChange={(e) => setBusinessTheme(e.target.value)}
              placeholder="Например: купить квартиру, клининг офисов, пластиковые окна"
              className="h-12 pl-10 text-base"
              disabled={isCollecting}
            />
          </div>
        </div>

        <div className={`grid gap-4 transition-all duration-300 ${
          smartFieldsVisible ? 'max-h-[520px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'
        }`}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="business-region">Гео</Label>
              <Input
                id="business-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Ставрополь, Москва, Россия"
                disabled={isCollecting}
              />
              {region && !selectedCity && (
                <p className="text-xs text-amber-600">Не нашел точный регион, использую Россию.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-audience">Аудитория</Label>
              <select
                id="business-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                disabled={isCollecting}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50"
              >
                <option value="b2c">B2C</option>
                <option value="b2b">B2B</option>
                <option value="mixed">B2B + B2C</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="business-details">Уточнения</Label>
              <textarea
                id="business-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Новостройки, квартиры от застройщика, ипотека"
                disabled={isCollecting}
                className="h-24 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-exclusions">Что исключить</Label>
              <textarea
                id="business-exclusions"
                value={exclusions}
                onChange={(e) => setExclusions(e.target.value)}
                placeholder="аренда, вакансии, обучение, самостоятельно"
                disabled={isCollecting}
                className="h-24 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
              />
            </div>
          </div>

          <Button
            onClick={handleCollect}
            disabled={isCollecting || !businessTheme.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isCollecting ? (
              <>
                <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                Собираю фразы...
              </>
            ) : (
              <>
                <Icon name="SearchCheck" className="mr-2 h-4 w-4" />
                Собрать ключи
              </>
            )}
          </Button>
        </div>

        {(stage !== 'idle' || keywordCount > 0) && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {stage === 'idle' ? 'Фразы готовы' : stages.find((item) => item.key === stage)?.label}
                </div>
                <div className="text-xs text-slate-500">
                  {keywordCount > 0 ? `${keywordCount} подтвержденных Wordstat-фраз` : 'AI управляет, Wordstat подтверждает'}
                </div>
              </div>
              {plan && (
                <div className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                  {plan.source === 'openai' ? 'OpenAI' : 'Локальная логика'}
                </div>
              )}
            </div>

            <Progress value={progress} className="h-2" />

            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {stages.map((item) => {
                const active = item.key === stage;
                const complete = stages.findIndex((s) => s.key === item.key) < stages.findIndex((s) => s.key === stage) || stage === 'done';
                return (
                  <div
                    key={item.key}
                    className={`rounded-lg border p-2 text-center text-xs transition-all ${
                      active
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : complete
                          ? 'border-slate-200 bg-white text-slate-700'
                          : 'border-slate-200 bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon name={item.icon as never} className={`mx-auto mb-1 h-4 w-4 ${active && isCollecting ? 'animate-pulse' : ''}`} />
                    {item.label}
                  </div>
                );
              })}
            </div>

            {collection && (
              <div className="space-y-3">
                {plan?.translation && (
                  <div className="rounded-lg border border-emerald-200 bg-white p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      <Icon name="Languages" className="h-3.5 w-3.5" />
                      Перевод бизнеса в спрос клиента
                    </div>
                    <div className="grid gap-2 text-sm md:grid-cols-3">
                      <div>
                        <div className="text-xs text-slate-500">Вы указали</div>
                        <div className="font-medium text-slate-800">{plan.translation.businessDescription}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Клиент ищет</div>
                        <div className="font-medium text-slate-800">{plan.translation.customerSearchIntent}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Не зацикливаемся на</div>
                        <div className="font-medium text-slate-800">
                          {plan.translation.mustNotOverfitTo.length > 0 ? plan.translation.mustNotOverfitTo.join(', ') : 'исходной формулировке'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {plan?.collectionBranches && (
                  <div className="rounded-lg border border-blue-200 bg-white p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      <Icon name="GitBranch" className="h-3.5 w-3.5" />
                      Ветки сбора
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      {plan.collectionBranches.slice(0, 6).map((branch) => (
                        <div key={branch.name} className="rounded-md bg-slate-50 p-2">
                          <div className="text-sm font-medium text-slate-800">{branch.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{branch.seedMasks.slice(0, 3).join(', ')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-emerald-200 bg-white p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    <Icon name="CheckCircle2" className="h-3.5 w-3.5" />
                    Подтверждено
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {collection.verifiedPhrases.slice(0, 45).map((phrase) => (
                      <div key={phrase.phrase} className="flex items-start justify-between gap-3 border-b border-slate-100 py-1.5 last:border-b-0">
                        <span className="text-sm text-slate-800">{phrase.phrase}</span>
                        <span className="shrink-0 font-mono text-xs text-slate-500">{phrase.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-white p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                    <Icon name="Lightbulb" className="h-3.5 w-3.5" />
                    Маски AI
                  </div>
                  <div className="max-h-40 overflow-y-auto text-sm text-slate-700">
                    {collection.candidateMasks.map((mask) => (
                      <div key={mask} className="border-b border-slate-100 py-1.5 last:border-b-0">{mask}</div>
                    ))}
                    {collection.followUpMasks.map((mask) => (
                      <div key={mask} className="border-b border-slate-100 py-1.5 text-blue-700 last:border-b-0">{mask}</div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-rose-200 bg-white p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-700">
                    <Icon name="CircleSlash" className="h-3.5 w-3.5" />
                    Без результата
                  </div>
                  <div className="max-h-40 overflow-y-auto text-sm text-slate-700">
                    {collection.rejectedMasks.length > 0 ? collection.rejectedMasks.map((mask) => (
                      <div key={mask} className="border-b border-slate-100 py-1.5 last:border-b-0">{mask}</div>
                    )) : (
                      <div className="py-1.5 text-slate-400">Пустых масок нет</div>
                    )}
                  </div>
                </div>
                </div>
              </div>
            )}
          </div>
        )}

        {keywordCount > 0 && (
          <div className="space-y-3">
            <Label htmlFor="keywords" className="text-slate-700">Список ключевых слов</Label>
            <textarea
              id="keywords"
              value={manualKeywords}
              onChange={(e) => {
                onManualKeywordsEdit?.();
                setManualKeywords(e.target.value);
              }}
              className="h-48 w-full resize-none rounded-lg border border-slate-200 p-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-500">
              {keywordCount} ключевых слов
            </p>
          </div>
        )}

        <input
          type="hidden"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
        />
        <input
          type="hidden"
          value={objectAddress}
          onChange={(e) => setObjectAddress(e.target.value)}
        />

        <Button 
          onClick={handleNext}
          disabled={keywordCount === 0 || isLoading || isCollecting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {isLoading ? (
            <>
              <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
              Генерация названий сегментов...
            </>
          ) : (
            <>
              Далее
              <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
