import { useState } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

interface PhraseItem {
  phrase: string;
  reason?: string;
}

interface SemanticCluster {
  id: string;
  name: string;
  description: string;
  phrases: string[];
  isGarbage: boolean;
}

interface CleaningResult {
  step1_stopwords: {
    removed: PhraseItem[];
    remaining: string[];
  };
  step2_clusters: SemanticCluster[];
  stats: {
    total: number;
    removed_stopwords: number;
    remaining_after_stopwords: number;
    clusters_count: number;
  };
}

const DEFAULT_PHRASES = `купить квартиру ставрополь
новостройки ставрополь промышленный
ипотека на квартиру ставрополь
бесплатные объявления ставрополь
фото квартир ставрополь
снять квартиру посуточно
видео обзор квартир
купить квартиру вторичка ставрополь
скачать планировки квартир
работа риэлтор ставрополь
продать квартиру быстро
цены на квартиры ставрополь
новостройки москва
смотреть квартиры онлайн`;

const DEFAULT_TARGET = 'купить квартиру в новостройке ставрополь';

export default function MinusPhraseCleaner() {
  const [targetPhrase, setTargetPhrase] = useState(DEFAULT_TARGET);
  const [phrases, setPhrases] = useState(DEFAULT_PHRASES);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CleaningResult | null>(null);
  const [selectedClusters, setSelectedClusters] = useState<Set<string>>(new Set());

  const handleClean = async () => {
    setIsLoading(true);
    setResult(null);
    setSelectedClusters(new Set());

    try {
      const phrasesArray = phrases.split('\n').filter(p => p.trim());

      const response = await fetch('https://functions.poehali.dev/c56fa750-bb00-4b11-ae10-3a17c5071417', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: targetPhrase,
          phrases: phrasesArray
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка API');
      }

      const data = await response.json();
      setResult(data);
      
      const garbageClusters = new Set(
        data.step2_clusters
          .filter((c: SemanticCluster) => c.isGarbage)
          .map((c: SemanticCluster) => c.id)
      );
      setSelectedClusters(garbageClusters);
      
      toast.success('Анализ завершён!');
    } catch (error) {
      console.error('Cleaning error:', error);
      toast.error('Ошибка при анализе фраз');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCluster = (clusterId: string) => {
    setSelectedClusters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clusterId)) {
        newSet.delete(clusterId);
      } else {
        newSet.add(clusterId);
      }
      return newSet;
    });
  };

  const exportMinusPhrases = () => {
    if (!result) return;

    const minusPhrases: string[] = [
      ...result.step1_stopwords.removed.map(p => p.phrase)
    ];

    result.step2_clusters.forEach(cluster => {
      if (selectedClusters.has(cluster.id)) {
        minusPhrases.push(...cluster.phrases);
      }
    });

    const text = minusPhrases.join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`Скопировано ${minusPhrases.length} минус-фраз`);
  };

  const exportCleanPhrases = () => {
    if (!result) return;

    const cleanPhrases: string[] = [];

    result.step2_clusters.forEach(cluster => {
      if (!selectedClusters.has(cluster.id)) {
        cleanPhrases.push(...cluster.phrases);
      }
    });

    const text = cleanPhrases.join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`Скопировано ${cleanPhrases.length} чистых фраз`);
  };

  const phrasesCount = phrases.split('\n').filter(p => p.trim()).length;
  const totalMinusPhrases = result 
    ? result.step1_stopwords.removed.length + 
      result.step2_clusters
        .filter(c => selectedClusters.has(c.id))
        .reduce((sum, c) => sum + c.phrases.length, 0)
    : 0;

  const totalCleanPhrases = result
    ? result.step2_clusters
        .filter(c => !selectedClusters.has(c.id))
        .reduce((sum, c) => sum + c.phrases.length, 0)
    : 0;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <div className="flex-1">
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🧹 Очистка минус-фраз (Гибридный метод)</h1>
          <p className="text-slate-600">
            Стоп-слова + AI сегментация = быстрая очистка тысяч фраз
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Исходные данные</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Целевая фраза (что продаём)
                  </label>
                  <Input
                    value={targetPhrase}
                    onChange={(e) => setTargetPhrase(e.target.value)}
                    placeholder="купить квартиру москва"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Алгоритм будет искать похожие фразы и отсеивать мусор
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Спарсенные фразы (по одной на строку)
                  </label>
                  <Textarea
                    value={phrases}
                    onChange={(e) => setPhrases(e.target.value)}
                    rows={16}
                    placeholder="купить квартиру москва&#10;бесплатные объявления&#10;фото квартир"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Загружено: {phrasesCount} фраз
                  </p>
                </div>

                <Button 
                  onClick={handleClean}
                  disabled={isLoading || !targetPhrase.trim() || phrasesCount === 0}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                      Анализирую фразы...
                    </>
                  ) : (
                    <>
                      <Icon name="Sparkles" className="mr-2 h-4 w-4" />
                      Запустить очистку
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {result && (
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Icon name="BarChart3" className="h-4 w-4" />
                  Статистика обработки
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Всего фраз:</span>
                    <Badge variant="secondary">{result.stats.total}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Стоп-слова удалили:</span>
                    <Badge variant="destructive">{result.stats.removed_stopwords}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Сегментов создано:</span>
                    <Badge variant="secondary">{result.stats.clusters_count}</Badge>
                  </div>
                  <div className="h-px bg-slate-200 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-red-600">Минус-фразы:</span>
                    <Badge className="bg-red-600">{totalMinusPhrases}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-600">Чистые фразы:</span>
                    <Badge className="bg-green-600">{totalCleanPhrases}</Badge>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200 flex gap-2">
                  <Button
                    onClick={exportMinusPhrases}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Icon name="Copy" className="mr-2 h-3 w-3" />
                    Копировать минус
                  </Button>
                  <Button
                    onClick={exportCleanPhrases}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Icon name="CheckCircle" className="mr-2 h-3 w-3" />
                    Копировать чистые
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {!result && (
              <Card className="p-12 text-center border-dashed">
                <Icon name="Filter" className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">
                  Загрузи фразы и запусти очистку
                </p>
              </Card>
            )}

            {result && (
              <>
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Icon name="Trash2" className="h-5 w-5 text-red-600" />
                    Шаг 1: Стоп-слова
                  </h2>
                  {result.step1_stopwords.removed.length > 0 ? (
                    <Card className="p-4 bg-red-50 border-red-200">
                      <p className="text-sm text-red-700 mb-2 font-medium">
                        Автоматически удалено: {result.step1_stopwords.removed.length} фраз
                      </p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {result.step1_stopwords.removed.slice(0, 10).map((item, idx) => (
                          <div key={idx} className="text-xs bg-white/50 rounded px-2 py-1 flex justify-between">
                            <span className="text-slate-700">{item.phrase}</span>
                            {item.reason && (
                              <span className="text-red-600 font-mono ml-2">"{item.reason}"</span>
                            )}
                          </div>
                        ))}
                        {result.step1_stopwords.removed.length > 10 && (
                          <p className="text-xs text-slate-500 text-center pt-2">
                            ...и ещё {result.step1_stopwords.removed.length - 10} фраз
                          </p>
                        )}
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-4 border-dashed">
                      <p className="text-sm text-slate-500">Стоп-слова не найдены</p>
                    </Card>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Icon name="Layers" className="h-5 w-5 text-purple-600" />
                    Шаг 2: Семантические кластеры
                  </h2>
                  <p className="text-sm text-slate-600 mb-4">
                    Кликни на кластер чтобы добавить/убрать из минус-фраз
                  </p>

                  <div className="space-y-3">
                    {result.step2_clusters.map((cluster) => {
                      const isSelected = selectedClusters.has(cluster.id);
                      
                      return (
                        <Card
                          key={cluster.id}
                          className={`p-4 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-red-50 border-red-300 border-2' 
                              : 'bg-white hover:border-slate-300 border-2'
                          }`}
                          onClick={() => toggleCluster(cluster.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded flex items-center justify-center ${
                                isSelected ? 'bg-red-600' : 'bg-slate-200'
                              }`}>
                                {isSelected ? (
                                  <Icon name="X" className="h-4 w-4 text-white" />
                                ) : (
                                  <Icon name="Check" className="h-4 w-4 text-slate-600" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm">{cluster.name}</h3>
                                <p className="text-xs text-slate-500">{cluster.description}</p>
                              </div>
                            </div>
                            <Badge variant={isSelected ? 'destructive' : 'secondary'}>
                              {cluster.phrases.length}
                            </Badge>
                          </div>

                          <div className="space-y-1 mt-3 max-h-32 overflow-y-auto">
                            {cluster.phrases.slice(0, 5).map((phrase, idx) => (
                              <div 
                                key={idx}
                                className={`text-xs rounded px-2 py-1 ${
                                  isSelected 
                                    ? 'bg-white/50 text-red-700' 
                                    : 'bg-slate-50 text-slate-700'
                                }`}
                              >
                                {phrase}
                              </div>
                            ))}
                            {cluster.phrases.length > 5 && (
                              <p className="text-xs text-slate-400 text-center pt-1">
                                +{cluster.phrases.length - 5} фраз
                              </p>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}