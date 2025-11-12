import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Cluster } from './ClusteringMockData';

interface ClusteringResultsProps {
  clusters: Cluster[];
  minusWords: string[];
  expandedClusters: Set<string>;
  toggleCluster: (name: string) => void;
  exportMinusWords: () => void;
  exportCluster: (cluster: Cluster) => void;
  onBack: () => void;
}

const CLUSTER_COLORS = [
  { bg: 'bg-slate-100', light: 'bg-white', icon: 'text-emerald-600', border: 'border-slate-200' },
  { bg: 'bg-slate-100', light: 'bg-white', icon: 'text-emerald-600', border: 'border-slate-200' },
  { bg: 'bg-slate-100', light: 'bg-white', icon: 'text-emerald-600', border: 'border-slate-200' },
  { bg: 'bg-slate-100', light: 'bg-white', icon: 'text-emerald-600', border: 'border-slate-200' },
  { bg: 'bg-slate-100', light: 'bg-white', icon: 'text-emerald-600', border: 'border-slate-200' },
  { bg: 'bg-slate-100', light: 'bg-white', icon: 'text-emerald-600', border: 'border-slate-200' },
];

export default function ClusteringResults({
  clusters,
  minusWords,
  expandedClusters,
  toggleCluster,
  exportMinusWords,
  exportCluster,
  onBack
}: ClusteringResultsProps) {
  const totalPhrases = clusters.reduce((sum, c) => sum + c.phrases.length, 0);
  const totalVolume = clusters.reduce((sum, c) => 
    sum + c.phrases.reduce((s, p) => s + p.count, 0), 0
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Результаты кластеризации</h1>
          <p className="text-lg text-slate-600">
            Проанализировано и сгруппировано {totalPhrases.toLocaleString()} ключевых фраз
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onBack} variant="outline" size="lg">
            <Icon name="ArrowLeft" className="mr-2 h-5 w-5" />
            Назад
          </Button>
          <Button 
            onClick={() => {
              clusters.forEach(c => exportCluster(c));
              exportMinusWords();
            }}
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Icon name="Download" className="mr-2 h-5 w-5" />
            Экспортировать всё
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden shadow-lg">
          <div className="relative p-6 bg-white">
            <Icon name="Layers" className="h-8 w-8 text-emerald-600 mb-3" />
            <div className="text-4xl font-bold text-slate-900 mb-2">{clusters.length}</div>
            <div className="text-sm text-slate-600 font-medium">Кластеров</div>
          </div>
        </Card>

        <Card className="relative overflow-hidden shadow-lg">
          <div className="relative p-6 bg-white">
            <Icon name="Hash" className="h-8 w-8 text-emerald-600 mb-3" />
            <div className="text-4xl font-bold text-slate-900 mb-2">{totalPhrases.toLocaleString()}</div>
            <div className="text-sm text-slate-600 font-medium">Ключевых фраз</div>
          </div>
        </Card>

        <Card className="relative overflow-hidden shadow-lg">
          <div className="relative p-6 bg-white">
            <Icon name="TrendingUp" className="h-8 w-8 text-emerald-600 mb-3" />
            <div className="text-4xl font-bold text-slate-900 mb-2">{totalVolume.toLocaleString()}</div>
            <div className="text-sm text-slate-600 font-medium">Общий объём</div>
          </div>
        </Card>

        <Card className="relative overflow-hidden shadow-lg">
          <div className="relative p-6 bg-white">
            <Icon name="Ban" className="h-8 w-8 text-slate-500 mb-3" />
            <div className="text-4xl font-bold text-slate-900 mb-2">{minusWords.length}</div>
            <div className="text-sm text-slate-600 font-medium">Минус-слов</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {clusters.map((cluster, idx) => {
          const isExpanded = expandedClusters.has(cluster.name);
          const colorScheme = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
          const clusterVolume = cluster.phrases.reduce((sum, p) => sum + p.count, 0);
          
          return (
            <Card key={idx} className={`overflow-hidden border ${colorScheme.border} hover:shadow-xl transition-all duration-300`}>
              <div className={`p-5 ${colorScheme.light} border-b ${colorScheme.border}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-white/50">
                      <Icon name={cluster.icon as any} className={`h-6 w-6 ${colorScheme.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xl text-slate-900 mb-2">{cluster.name}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="font-semibold">
                          {cluster.phrases.length} фраз
                        </Badge>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {clusterVolume.toLocaleString()} показов
                        </Badge>
                        <Badge 
                          variant={cluster.intent === 'commercial' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {cluster.intent === 'commercial' ? '💰 Коммерческий' : '📖 Информационный'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportCluster(cluster);
                      }}
                      size="sm"
                      variant="outline"
                      className="hover:bg-white"
                    >
                      <Icon name="Download" className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => toggleCluster(cluster.name)}
                      size="sm"
                      variant="ghost"
                      className="hover:bg-white"
                    >
                      <Icon 
                        name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                        className="h-5 w-5" 
                      />
                    </Button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 bg-white max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {cluster.phrases.map((phrase, pidx) => (
                      <div
                        key={pidx}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 hover:shadow-md transition-all group border border-transparent hover:border-slate-200"
                      >
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                          {phrase.phrase}
                        </span>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="font-mono font-semibold px-3 py-1">
                            {phrase.count.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden border-2 border-rose-200 shadow-xl">
        <div className="p-6 bg-gradient-to-br from-rose-500 to-pink-600 border-b border-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Icon name="Ban" className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Минус-слова</h2>
              <p className="text-sm text-white/90">Исключить {minusWords.length} нерелевантных запросов</p>
            </div>
          </div>
          <Button
            onClick={exportMinusWords}
            size="lg"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Icon name="Download" className="mr-2 h-5 w-5" />
            Экспортировать
          </Button>
        </div>
        
        <div className="p-6 bg-white">
          <div className="flex flex-wrap gap-3">
            {minusWords.map((word, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="px-4 py-2 text-sm font-medium border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors cursor-default"
              >
                −{word}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}