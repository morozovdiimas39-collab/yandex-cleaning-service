import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import ClusterColumn from './ClusterColumn';
import MinusWordsColumn from './MinusWordsColumn';

interface Phrase {
  phrase: string;
  count: number;
  id: string;
}

interface Cluster {
  id: string;
  cluster_name: string;
  phrases: Phrase[];
  color: string;
  searchText: string;
  highlightedPhrases?: Set<string>;
}

interface MinusWord {
  word: string;
  count: number;
}

interface ExcelClustersTableProps {
  initialClusters: any[];
  initialMinusPhrases: Phrase[];
}

const CLUSTER_COLORS = [
  '#E3F2FD',
  '#F3E5F5', 
  '#E8F5E9',
  '#FFF3E0',
  '#FCE4EC',
  '#E0F2F1',
  '#F9FBE7',
  '#E1F5FE',
];

export default function ExcelClustersTable({ 
  initialClusters, 
  initialMinusPhrases 
}: ExcelClustersTableProps) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [minusWords, setMinusWords] = useState<MinusWord[]>([]);
  const [minusSearchText, setMinusSearchText] = useState('');
  const [draggedPhrase, setDraggedPhrase] = useState<Phrase | null>(null);
  const [dragOverCluster, setDragOverCluster] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setClusters(initialClusters.map((c, idx) => ({
      id: `cluster-${idx}`,
      ...c,
      phrases: c.phrases.map((p: any, pIdx: number) => ({
        ...p,
        id: `phrase-${idx}-${pIdx}-${p.phrase}`,
      })),
      color: CLUSTER_COLORS[idx % CLUSTER_COLORS.length],
      searchText: ''
    })));
  }, [initialClusters]);

  const handleSearchChange = (clusterIndex: number, value: string) => {
    const newClusters = [...clusters];
    const targetCluster = newClusters[clusterIndex];
    targetCluster.searchText = value;

    if (!value.trim()) {
      for (const cluster of newClusters) {
        cluster.highlightedPhrases = undefined;
      }
      setClusters(newClusters);
      return;
    }

    const searchLower = value.toLowerCase();
    const highlightedSet = new Set<string>();

    for (let i = 0; i < newClusters.length; i++) {
      const cluster = newClusters[i];
      cluster.phrases.forEach(p => {
        if (p.phrase.toLowerCase().includes(searchLower)) {
          highlightedSet.add(p.phrase);
        }
      });
      cluster.highlightedPhrases = highlightedSet;
    }

    setClusters(newClusters);
  };

  const moveHighlightedPhrases = (targetClusterIndex: number) => {
    const newClusters = [...clusters];
    const targetCluster = newClusters[targetClusterIndex];
    const searchLower = targetCluster.searchText.toLowerCase();

    if (!searchLower) return;

    const movedPhrases: Phrase[] = [];

    for (let i = 0; i < newClusters.length; i++) {
      if (i === targetClusterIndex) continue;

      const cluster = newClusters[i];
      const matchingPhrases = cluster.phrases.filter(p => 
        p.phrase.toLowerCase().includes(searchLower)
      );

      if (matchingPhrases.length > 0) {
        cluster.phrases = cluster.phrases.filter(p => 
          !p.phrase.toLowerCase().includes(searchLower)
        );
        movedPhrases.push(...matchingPhrases);
      }
    }

    if (movedPhrases.length > 0) {
      targetCluster.phrases = [...targetCluster.phrases, ...movedPhrases]
        .sort((a, b) => b.count - a.count);
      targetCluster.searchText = '';
      targetCluster.highlightedPhrases = undefined;
      
      toast({
        title: '✅ Перенесено',
        description: `${movedPhrases.length} фраз → "${targetCluster.cluster_name}"`
      });
    }

    for (const cluster of newClusters) {
      cluster.highlightedPhrases = undefined;
    }

    setClusters(newClusters);
  };

  const handleMinusSearchChange = (value: string) => {
    setMinusSearchText(value);
  };

  const addMinusWord = () => {
    if (!minusSearchText.trim()) return;

    const minusWord = minusSearchText.trim().toLowerCase();
    let phrasesRemoved = 0;

    const newClusters = clusters.map(cluster => {
      const filteredPhrases = cluster.phrases.filter(p => {
        const hasMinusWord = p.phrase.toLowerCase().includes(minusWord);
        if (hasMinusWord) phrasesRemoved++;
        return !hasMinusWord;
      });

      return {
        ...cluster,
        phrases: filteredPhrases
      };
    });

    const existingMinusWord = minusWords.find(m => m.word === minusWord);
    if (existingMinusWord) {
      existingMinusWord.count += phrasesRemoved;
      setMinusWords([...minusWords]);
    } else {
      setMinusWords(prev => [...prev, { word: minusWord, count: phrasesRemoved }]);
    }

    setClusters(newClusters);
    setMinusSearchText('');
    
    toast({
      title: '🚫 Минус-слово добавлено',
      description: `"${minusWord}" — удалено ${phrasesRemoved} фраз`
    });
  };

  const handleDrop = (targetClusterId: string, phraseId: string) => {
    const newClusters = [...clusters];
    let movedPhrase: Phrase | undefined;

    for (let i = 0; i < newClusters.length; i++) {
      const idx = newClusters[i].phrases.findIndex(p => p.id === phraseId);
      if (idx !== -1) {
        movedPhrase = newClusters[i].phrases[idx];
        newClusters[i].phrases = newClusters[i].phrases.filter((_, j) => j !== idx);
        break;
      }
    }

    if (!movedPhrase) return;

    const targetIndex = newClusters.findIndex(c => c.id === targetClusterId);
    if (targetIndex !== -1) {
      newClusters[targetIndex].phrases.push(movedPhrase);
      newClusters[targetIndex].phrases.sort((a, b) => b.count - a.count);
      toast({
        title: '✅ Перенесено',
        description: `→ "${newClusters[targetIndex].cluster_name}"`
      });
    }

    setClusters(newClusters);
    setDragOverCluster(null);
  };

  const removePhrase = (clusterIndex: number, phraseId: string) => {
    const newClusters = [...clusters];
    newClusters[clusterIndex].phrases = newClusters[clusterIndex].phrases.filter(
      p => p.id !== phraseId
    );
    setClusters(newClusters);
  };

  const renameCluster = (clusterIndex: number, newName: string) => {
    const newClusters = [...clusters];
    newClusters[clusterIndex].cluster_name = newName;
    setClusters(newClusters);
  };

  const deleteCluster = (clusterIndex: number) => {
    if (!confirm(`Удалить сегмент "${clusters[clusterIndex].cluster_name}"?`)) return;
    
    setClusters(clusters.filter((_, i) => i !== clusterIndex));
    
    toast({
      title: '🗑️ Сегмент удалён',
      description: 'Фразы удалены из результатов'
    });
  };

  const exportToCSV = () => {
    let csv = 'Сегмент,Фраза,Частотность\n';
    
    clusters.forEach(cluster => {
      cluster.phrases.forEach(phrase => {
        csv += `"${cluster.cluster_name}","${phrase.phrase}",${phrase.count}\n`;
      });
    });

    csv += '\nМинус-слова (включения)\n';
    minusWords.forEach(minusWord => {
      csv += `"Минус-слово","${minusWord.word}",${minusWord.count}\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `сегменты_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({ title: '📊 Экспорт завершен', description: 'Excel файл загружен' });
  };

  const copyClusterPhrases = (clusterIndex: number) => {
    const cluster = clusters[clusterIndex];
    const text = cluster.phrases.map(p => p.phrase).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: '📋 Скопировано', description: `${cluster.phrases.length} фраз` });
  };

  const copyMinusWords = () => {
    const text = minusWords.map(m => m.word).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: '📋 Скопировано', description: `${minusWords.length} минус-слов` });
  };

  const removeMinusWord = (word: string) => {
    setMinusWords(prev => prev.filter(m => m.word !== word));
  };

  const addNewCluster = () => {
    const newCluster: Cluster = {
      id: `cluster-${clusters.length}`,
      cluster_name: `Новый сегмент ${clusters.length + 1}`,
      phrases: [],
      color: CLUSTER_COLORS[clusters.length % CLUSTER_COLORS.length],
      searchText: ''
    };
    
    setClusters([...clusters, newCluster]);
    
    toast({
      title: '➕ Сегмент создан',
      description: `"${newCluster.cluster_name}"`
    });
  };

  const openCluster = (clusterId: string) => {
    const cluster = clusters.find(c => c.id === clusterId);
    if (!cluster) return;
    
    const newCluster: Cluster = {
      id: `subcluster-0`,
      cluster_name: cluster.cluster_name,
      phrases: [...cluster.phrases],
      color: CLUSTER_COLORS[0],
      searchText: ''
    };
    
    setSelectedClusterId(clusterId);
    setClusters([newCluster]);
    
    toast({
      title: '📂 Открыт сегмент',
      description: `"${cluster.cluster_name}" — ${cluster.phrases.length} фраз`
    });
  };

  const closeCluster = () => {
    setSelectedClusterId(null);
    setClusters(initialClusters.map((c, idx) => ({
      id: `cluster-${idx}`,
      ...c,
      phrases: c.phrases.map((p: any, pIdx: number) => ({
        ...p,
        id: `phrase-${idx}-${pIdx}-${p.phrase}`,
      })),
      color: CLUSTER_COLORS[idx % CLUSTER_COLORS.length],
      searchText: ''
    })));
    
    toast({
      title: '↩️ Возврат',
      description: 'Вернулись к основным сегментам'
    });
  };

  const totalPhrases = clusters.reduce((sum, c) => sum + c.phrases.length, 0);
  const selectedCluster = selectedClusterId ? initialClusters.find((_, idx) => `cluster-${idx}` === selectedClusterId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {selectedCluster ? `Сегмент: ${selectedCluster.cluster_name}` : 'Сегменты — Excel режим'}
          </h2>
          <p className="text-xs text-muted-foreground">
            Всего {totalPhrases} фраз • {minusWords.length} минус-слов
          </p>
          <p className="text-xs text-blue-600 mt-1">
            💡 {selectedClusterId ? 'Работаем внутри сегмента • Стрелка назад в карточке' : 'Кликните на 📂 для открытия • Введите текст → Enter для переноса'}
          </p>
        </div>
        <Button onClick={exportToCSV} size="sm" className="gap-2">
          <Icon name="Download" size={16} />
          Скачать Excel
        </Button>
      </div>

      <div className="overflow-auto border rounded-lg shadow-lg" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-100 z-10">
            <tr className="border-b-2 border-slate-300">
              {clusters.map((cluster, idx) => (
                <ClusterColumn
                  key={cluster.id}
                  cluster={cluster}
                  clusterIndex={idx}
                  dragOverCluster={dragOverCluster}
                  onSearchChange={handleSearchChange}
                  onMoveHighlighted={moveHighlightedPhrases}
                  onRenameCluster={renameCluster}
                  onDeleteCluster={deleteCluster}
                  onCopyPhrases={copyClusterPhrases}
                  onRemovePhrase={removePhrase}
                  onDragStart={setDraggedPhrase}
                  onDragEnd={() => setDraggedPhrase(null)}
                  onDragOver={setDragOverCluster}
                  onDragLeave={() => setDragOverCluster(null)}
                  onDrop={handleDrop}
                  onClusterClick={(id) => id === 'back' ? closeCluster() : openCluster(id)}
                  isInSubClusterMode={!!selectedClusterId}
                />
              ))}
              <MinusWordsColumn
                minusWords={minusWords}
                minusSearchText={minusSearchText}
                onMinusSearchChange={(value) => {
                  setMinusSearchText(value);
                }}
                onCopyMinusWords={copyMinusWords}
                onRemoveMinusWord={removeMinusWord}
              />
            </tr>
          </thead>
          <tbody>
            <tr>
              {clusters.map((cluster) => (
                <td key={`body-${cluster.id}`} />
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={addMinusWord}
          disabled={!minusSearchText.trim()}
          size="sm"
          variant="destructive"
        >
          Добавить минус-слово
        </Button>
        
        {selectedClusterId && (
          <Button
            onClick={addNewCluster}
            size="sm"
            variant="outline"
            className="gap-1"
          >
            <Icon name="Plus" size={14} />
            Новый кластер
          </Button>
        )}
      </div>
    </div>
  );
}