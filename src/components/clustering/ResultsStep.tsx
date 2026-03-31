import { useState, useEffect, useRef, useMemo, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";

interface Phrase {
  phrase: string;
  count: number;
  sourceCluster?: string;
  sourceColor?: string;
  isTemporary?: boolean;
  removedPhrases?: Phrase[];
  isMinusWord?: boolean;
  minusTerm?: string;
}

interface Cluster {
  name: string;
  intent: string;
  color: string;
  icon: string;
  phrases: Phrase[];
  subClusters?: Cluster[];
}

type ClusterWithUI = Cluster & {
  bgColor: string;
  searchText: string;
};

interface ResultsStepProps {
  clusters: Cluster[];
  minusWords: Phrase[];
  onExport: () => void;
  onNewProject: () => void;
  projectId?: number;
  onSaveChanges?: (clusters: Cluster[], minusWords: Phrase[]) => void;
  regions?: string[];
  onWordstatClick?: () => void;
  specificAddress?: string;
  /** Название проекта для заголовка «Проект: …» */
  projectName?: string;
  /** Увеличивается родителем после внешнего обновления кластеров (например слияние Wordstat) */
  clustersMergeEpoch?: number;
}

/** Фиксированная ширина колонки сегмента (горизонтальный скролл рабочей области) */
const SEGMENT_COLUMN_WIDTH_PX = 320;

const CLUSTER_BG_COLORS = [
  "#E8F4F8",
  "#F5E8F8",
  "#E8F8E8",
  "#FFF8E0",
  "#FCE8F0",
  "#E0F8F5",
  "#F9FBE7",
  "#E1F5FE",
];

/** Словоформы в поиске/минусах всегда учитываются; частотность всегда в выгрузке */
const USE_WORD_FORMS = true;

/** Не мутирует исходный массив (раньше sort на месте вызывал лишние перерисовки и гонки). */
function sortPhrasesCopy(phrases: Phrase[]): Phrase[] {
  return [...phrases].sort((a, b) => {
    const aIsMinusConfirmed = a.isMinusWord && a.minusTerm === undefined;
    const bIsMinusConfirmed = b.isMinusWord && b.minusTerm === undefined;

    if (aIsMinusConfirmed && !bIsMinusConfirmed) return 1;
    if (!aIsMinusConfirmed && bIsMinusConfirmed) return -1;

    return b.count - a.count;
  });
}

const VirtualClusterPhrases = memo(function VirtualClusterPhrases({
  clusterIdx,
  cluster,
  onDragStart,
  onPhraseDropOnCluster,
  onRemovePhrase,
  addQuickMinusWord,
}: {
  clusterIdx: number;
  cluster: ClusterWithUI;
  onDragStart: (clusterIdx: number, phraseIdx: number) => void;
  onPhraseDropOnCluster: (targetClusterIdx: number) => void;
  onRemovePhrase: (clusterIdx: number, phraseIdx: number) => void;
  addQuickMinusWord: (word: string) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const sortedPhrases = useMemo(
    () => sortPhrasesCopy(cluster.phrases),
    [cluster.phrases],
  );

  const virtualizer = useVirtualizer({
    count: sortedPhrases.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 12,
  });

  return (
    <div
      ref={parentRef}
      className="flex-1 min-h-0 overflow-y-auto"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.stopPropagation();
        onPhraseDropOnCluster(clusterIdx);
      }}
    >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const phrase = sortedPhrases[virtualRow.index];
                const actualPhraseIdx = cluster.phrases.findIndex(
                  (p) => p.phrase === phrase.phrase,
                );
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className="absolute left-0 top-0 w-full box-border px-3 py-2 border-b border-gray-200 hover:bg-white/40 group/phrase"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
              draggable={!phrase.isTemporary && !phrase.isMinusWord}
              onDragStart={() => onDragStart(clusterIdx, actualPhraseIdx)}
            >
              <div
                className={`${phrase.isMinusWord ? "bg-red-50 border-l-4 border-l-red-500 -mx-3 px-3 py-2" : ""} ${phrase.isTemporary ? "opacity-60 border-2 border-dashed border-emerald-400 rounded" : ""} ${!phrase.isTemporary && !phrase.isMinusWord ? "cursor-move" : ""}`}
                style={
                  !phrase.isMinusWord && phrase.sourceColor
                    ? {
                        backgroundColor: phrase.sourceColor,
                        borderLeft: phrase.isTemporary
                          ? `3px dashed ${phrase.sourceColor}`
                          : `3px solid ${phrase.sourceColor}`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-2">
                  {!phrase.isTemporary && !phrase.isMinusWord && (
                    <Icon
                      name="GripVertical"
                      size={12}
                      className="text-gray-400 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm leading-snug mb-1 ${phrase.isMinusWord ? "text-red-700 line-through" : "text-gray-800"}`}
                    >
                      {!phrase.isMinusWord
                        ? phrase.phrase.split(" ").map((word, wIdx) => (
                            <span
                              key={wIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                addQuickMinusWord(word);
                              }}
                              className="hover:bg-red-100 hover:text-red-700 rounded px-0.5 cursor-pointer transition-colors"
                            >
                              {word}
                              {wIdx < phrase.phrase.split(" ").length - 1
                                ? " "
                                : ""}
                            </span>
                          ))
                        : phrase.phrase}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-xs font-mono ${phrase.isMinusWord ? "text-red-600" : "text-gray-500"}`}
                      >
                        {(
                          phrase.frequency ||
                          phrase.count ||
                          0
                        ).toLocaleString()}
                      </div>
                      {phrase.sourceCluster && !phrase.isMinusWord && (
                        <div className="text-xs text-gray-600 italic">
                          из "{phrase.sourceCluster}"
                        </div>
                      )}
                      {phrase.isMinusWord && (
                        <div className="text-xs text-red-600 italic">
                          минус-слово
                        </div>
                      )}
                    </div>
                  </div>
                  {!phrase.isTemporary && (
                    <button
                      type="button"
                      onClick={() =>
                        onRemovePhrase(clusterIdx, actualPhraseIdx)
                      }
                      className="opacity-0 group-hover/phrase:opacity-100 text-gray-700 hover:text-gray-900 flex-shrink-0"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const VirtualMinusWordsList = memo(function VirtualMinusWordsList({
  minusWords,
  editingMinusIndex,
  editingMinusText,
  setEditingMinusText,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onRemove,
}: {
  minusWords: Phrase[];
  editingMinusIndex: number | null;
  editingMinusText: string;
  setEditingMinusText: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: (idx: number) => void;
  onRemove: (idx: number) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: minusWords.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 8,
  });

  return (
    <div ref={parentRef} className="flex-1 min-h-0 overflow-y-auto">
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const pIdx = virtualRow.index;
          const phrase = minusWords[pIdx];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full box-border px-3 py-2 border-b border-gray-200 hover:bg-white/40 group/minus"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {editingMinusIndex === pIdx ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingMinusText}
                    onChange={(e) => setEditingMinusText(e.target.value)}
                    className="flex-1 h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSaveEdit();
                      if (e.key === "Escape") onCancelEdit();
                    }}
                  />
                  <button
                    type="button"
                    onClick={onSaveEdit}
                    className="text-green-700 hover:text-green-900"
                  >
                    <Icon name="Check" size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Icon name="X" size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm text-gray-800 leading-snug mb-1">
                      {phrase.phrase}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {(phrase.frequency || phrase.count || 0) > 0
                        ? (phrase.frequency || phrase.count || 0).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover/minus:opacity-100">
                    <button
                      type="button"
                      onClick={() => onStartEdit(pIdx)}
                      className="text-blue-700 hover:text-blue-900 flex-shrink-0"
                    >
                      <Icon name="Pencil" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(pIdx)}
                      className="text-red-700 hover:text-red-900 flex-shrink-0"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default function ResultsStep({
  clusters: propsClusters,
  minusWords: propsMinusWords,
  onExport,
  onNewProject,
  projectId,
  onSaveChanges,
  regions = [],
  onWordstatClick,
  specificAddress = '',
  projectName = '',
  clustersMergeEpoch = 0,
}: ResultsStepProps) {
  const initialClusters = propsClusters.map((c, idx) => ({
    ...c,
    bgColor: CLUSTER_BG_COLORS[idx % CLUSTER_BG_COLORS.length],
    searchText: "",
  }));

  const [clusters, setClusters] = useState(initialClusters);
  const [minusWords, setMinusWords] = useState<Phrase[]>(
    propsMinusWords.filter((p) => p.phrase && p.phrase.trim() !== ""),
  );
  const [minusSearchText, setMinusSearchText] = useState("");
  const [editingMinusIndex, setEditingMinusIndex] = useState<number | null>(
    null,
  );
  const [editingMinusText, setEditingMinusText] = useState("");
  const [draggedCluster, setDraggedCluster] = useState<number | null>(null);
  const [draggedPhrase, setDraggedPhrase] = useState<{
    clusterIdx: number;
    phraseIdx: number;
  } | null>(null);

  const { toast } = useToast();
  const renameDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [selectedClusterIndex, setSelectedClusterIndex] = useState<number | null>(null);
  const [originalClusters, setOriginalClusters] = useState<Cluster[]>([]);
  const [clusterSubClusters, setClusterSubClusters] = useState<Map<number, number>>(new Map());

  // ВАЖНО: обновляем состояние ТОЛЬКО если данные из БД значительно изменились
  // Используем ref чтобы отслеживать был ли уже первый рендер с данными
  const [isInitialized, setIsInitialized] = useState(false);
  
  const saveToAPI = async (newClusters: Cluster[], newMinusWords: Phrase[]) => {
    if (!onSaveChanges) return;
    
    let dataToSave = newClusters;
    
    if (selectedClusterIndex !== null && originalClusters.length > 0) {
      console.log('💾 Drill-down mode detected, merging cluster back to full dataset', {
        selectedClusterIndex,
        modifiedClusterName: newClusters[0]?.name,
        originalClustersCount: originalClusters.length
      });
      
      dataToSave = originalClusters.map((c, idx) => {
        if (idx === selectedClusterIndex) {
          const subClusters = newClusters.slice(1);
          return {
            ...newClusters[0],
            subClusters: subClusters.length > 0 ? subClusters.map(sc => ({
              name: sc.name,
              intent: sc.intent,
              color: sc.color,
              icon: sc.icon,
              phrases: sc.phrases,
              subClusters: sc.subClusters
            })) : undefined
          };
        }
        return c;
      });
      
      console.log('✅ Merged data ready to save', {
        totalClusters: dataToSave.length,
        modifiedClusterIndex: selectedClusterIndex,
        modifiedClusterData: {
          name: dataToSave[selectedClusterIndex].name,
          phrasesCount: dataToSave[selectedClusterIndex].phrases.length,
          subClustersCount: dataToSave[selectedClusterIndex].subClusters?.length || 0,
          subClusters: dataToSave[selectedClusterIndex].subClusters?.map(sc => ({
            name: sc.name,
            phrasesCount: sc.phrases.length
          }))
        }
      });
    }
    
    await onSaveChanges(
      dataToSave.map((c) => ({
        name: c.name,
        intent: c.intent,
        color: c.color,
        icon: c.icon,
        phrases: c.phrases,
        subClusters: c.subClusters,
      })),
      newMinusWords,
    );
  };

  useEffect(() => {
    // Если уже инициализировались и локальное состояние не пустое - игнорируем props
    if (isInitialized && clusters.length > 0) {
      return;
    }
    
    // Если пришли данные из БД (props не пустые) - обновляем локальное состояние
    if (propsClusters.length > 0) {
      console.log('🔄 ResultsStep: Initializing from props (DB data)', {
        propsClusterCount: propsClusters.length,
        propsPhrasesCount: propsClusters.reduce((sum, c) => sum + c.phrases.length, 0)
      });
      
      const mappedClusters = propsClusters.map((c, idx) => ({
        ...c,
        bgColor: CLUSTER_BG_COLORS[idx % CLUSTER_BG_COLORS.length],
        searchText: "",
      }));
      
      // Вычисляем количество подкластеров для каждого кластера
      const subClustersMap = new Map<number, number>();
      propsClusters.forEach((cluster, idx) => {
        const subClustersCount = cluster.subClusters?.length || 0;
        if (subClustersCount > 0) {
          subClustersMap.set(idx, subClustersCount);
          console.log(`📁 Cluster ${idx} "${cluster.name}" has ${subClustersCount} subclusters`);
        }
      });
      setClusterSubClusters(subClustersMap);
      
      const filteredMinus = propsMinusWords.filter((p) => p.phrase && p.phrase.trim() !== "");

      const savedIndex = localStorage.getItem('cluster_view_index');

      setMinusWords(filteredMinus);

      if (savedIndex !== null) {
        try {
          const clusterIdx = parseInt(savedIndex);
          
          console.log('🔄 Restoring cluster view from localStorage:', { clusterIdx });
          
          setOriginalClusters(mappedClusters);
          setSelectedClusterIndex(clusterIdx);
          
          const targetCluster = mappedClusters[clusterIdx];
          if (targetCluster) {
            setClusters([{
              ...targetCluster,
              bgColor: CLUSTER_BG_COLORS[0],
              searchText: "",
            }]);
            console.log('✅ Restored cluster view with fresh DB data:', {
              clusterName: targetCluster.name,
              phrasesCount: targetCluster.phrases.length
            });
          } else {
            console.warn('⚠️ Cluster index not found, showing all clusters');
            setClusters(mappedClusters);
            localStorage.removeItem('cluster_view_index');
          }
        } catch (e) {
          console.error('Failed to restore cluster view:', e);
          setClusters(mappedClusters);
          localStorage.removeItem('cluster_view_index');
        }
      } else {
        setClusters(mappedClusters);
      }

      setIsInitialized(true);
    }
  }, [propsClusters.length, propsMinusWords.length, isInitialized, clusters.length, projectId]);

  const matchesSearch = (phrase: string, searchTerm: string, useWordFormsParam = USE_WORD_FORMS): boolean => {
    if (!searchTerm.trim()) return false;
    return matchWithYandexOperators(phrase, searchTerm, useWordFormsParam);
  };

  const matchWithYandexOperators = (phrase: string, query: string, useWordFormsParam = USE_WORD_FORMS): boolean => {
    const phraseLower = phrase.toLowerCase();
    const queryLower = query.toLowerCase().trim();

    // ШАГ 1: Извлекаем минус-слова (слова с оператором -)
    const minusWords: { word: string; exactForm: boolean }[] = [];
    const queryParts = queryLower.split(/\s+/).filter((w) => w.length > 0);
    const positiveWords: string[] = [];
    
    queryParts.forEach(word => {
      if (word.startsWith('-')) {
        const minusWord = word.substring(1); // убираем -
        if (minusWord.startsWith('!')) {
          // -!слово - исключаем точную словоформу
          minusWords.push({ word: minusWord.substring(1), exactForm: true });
        } else {
          // -слово - исключаем с учетом словоформ
          minusWords.push({ word: minusWord, exactForm: false });
        }
      } else {
        positiveWords.push(word);
      }
    });
    
    // ШАГ 2: Проверяем минус-слова - если хоть одно найдено, фраза НЕ подходит
    if (minusWords.length > 0) {
      const phraseWords = phraseLower.split(/\s+/).filter((w) => w.length > 0);
      
      for (const minusWordObj of minusWords) {
        const { word: minusWord, exactForm } = minusWordObj;
        let found = false;
        
        if (exactForm) {
          // -!слово - проверяем ТОЧНОЕ совпадение словоформы (игнорируем галочку)
          found = phraseWords.includes(minusWord);
          console.log(`🔍 Checking exact minus word -!${minusWord}:`, found ? '❌ EXCLUDED' : '✅ OK');
        } else {
          // -слово - проверяем с учетом словоформ (если галочка включена)
          if (useWordFormsParam) {
            if (minusWord.length <= 3) {
              found = phraseWords.includes(minusWord);
            } else {
              found = matchesWordForm(phraseLower, minusWord);
            }
          } else {
            found = phraseWords.includes(minusWord);
          }
          console.log(`🔍 Checking minus word -${minusWord} (with forms: ${useWordFormsParam}):`, found ? '❌ EXCLUDED' : '✅ OK');
        }
        
        if (found) {
          return false; // Фраза содержит минус-слово - исключаем
        }
      }
    }
    
    // ШАГ 3: Если остались только минус-слова (нет позитивных) - это ошибка запроса
    if (positiveWords.length === 0) {
      return false;
    }
    
    // ШАГ 4: Продолжаем проверку позитивных слов с операторами
    const cleanQuery = positiveWords.join(' ');

    // Оператор "кавычки" - фиксирует количество и набор слов (но НЕ порядок)
    if (cleanQuery.startsWith('"') && cleanQuery.endsWith('"')) {
      const quotedText = cleanQuery.slice(1, -1).trim();
      const queryWords = quotedText.split(/\s+/).filter((w) => w.length > 0);
      const phraseWords = phraseLower.split(/\s+/).filter((w) => w.length > 0);

      // Проверяем что ВСЕ слова из запроса есть в фразе (в любом порядке)
      const allWordsPresent = queryWords.every((qw) =>
        phraseWords.includes(qw),
      );
      // Проверяем что в фразе ТОЛЬКО эти слова (без лишних)
      const noExtraWords = phraseWords.every((pw) => queryWords.includes(pw));

      return allWordsPresent && noExtraWords;
    }

    // Оператор [квадратные скобки] - фиксирует СТРОГИЙ порядок слов
    if (cleanQuery.startsWith("[") && cleanQuery.endsWith("]")) {
      const bracketText = cleanQuery.slice(1, -1).trim();
      const queryWords = bracketText.split(/\s+/).filter((w) => w.length > 0);
      const phraseWords = phraseLower.split(/\s+/).filter((w) => w.length > 0);

      // Ищем последовательность слов в строгом порядке
      for (let i = 0; i <= phraseWords.length - queryWords.length; i++) {
        let match = true;
        for (let j = 0; j < queryWords.length; j++) {
          if (phraseWords[i + j] !== queryWords[j]) {
            match = false;
            break;
          }
        }
        if (match) return true;
      }
      return false;
    }

    // Оператор ! - фиксирует ТОЧНУЮ словоформу (игнорирует useWordForms)
    const hasExactOperator = cleanQuery.includes('!');
    
    if (hasExactOperator) {
      const phraseWords = phraseLower.split(/\s+/).filter((w) => w.length > 0);
      const cleanQueryParts = cleanQuery.split(/\s+/).filter((w) => w.length > 0);
      
      console.log('🎯 Exact form operator detected', {
        query: cleanQuery,
        phrase: phraseLower,
        phraseWords,
        queryParts: cleanQueryParts
      });
      
      // Проверяем каждое слово из запроса
      for (const queryWord of cleanQueryParts) {
        if (queryWord.startsWith('!')) {
          // Слово с ! - требуем ТОЧНОЕ совпадение словоформы
          const exactWord = queryWord.substring(1); // убираем !
          const found = phraseWords.includes(exactWord);
          console.log(`  !${exactWord} → ${found ? '✅' : '❌'}`);
          if (!found) {
            return false;
          }
        } else {
          // Слово без ! - используем текущую настройку useWordForms
          let found = false;
          if (useWordFormsParam) {
            if (queryWord.length <= 3) {
              found = phraseWords.includes(queryWord);
            } else {
              found = matchesWordForm(phraseLower, queryWord);
            }
          } else {
            found = phraseWords.includes(queryWord);
          }
          console.log(`  ${queryWord} (with forms: ${useWordFormsParam}) → ${found ? '✅' : '❌'}`);
          if (!found) {
            return false;
          }
        }
      }
      
      console.log('  ✅ All checks passed!');
      return true;
    }

    // Оператор + - фиксирует предлоги/служебные слова
    const stopWordMatches = cleanQuery.matchAll(/\+([а-яёa-z]+)/gi);
    const stopWords = Array.from(stopWordMatches, (m) => m[1].toLowerCase());

    if (stopWords.length > 0) {
      const phraseWords = phraseLower.split(/\s+/).filter((w) => w.length > 0);

      // Все слова с + должны присутствовать
      for (const stopWord of stopWords) {
        if (!phraseWords.includes(stopWord)) {
          return false;
        }
      }

      // Проверяем остальные слова
      const queryWithoutStop = cleanQuery.replace(/\+([а-яёa-z]+)/gi, "$1");
      const remainingWords = queryWithoutStop
        .split(/\s+/)
        .filter((w) => w.length > 0 && !w.startsWith("+"));

      return remainingWords.every((word) => phraseLower.includes(word));
    }

    // Обычный поиск - все слова должны присутствовать
    const words = cleanQuery.split(/\s+/).filter((w) => w.length > 0);
    
    if (useWordFormsParam) {
      // С учётом словоформ (как для минус-слов)
      return words.every((word) => {
        if (word.length <= 3) {
          // Для коротких слов только точное совпадение
          const phraseWords = phraseLower.split(/\s+/);
          return phraseWords.includes(word);
        }
        return matchesWordForm(phraseLower, word);
      });
    } else {
      // Точное совпадение целых слов
      return words.every((word) => {
        const phraseWords = phraseLower.split(/\s+/);
        return phraseWords.includes(word);
      });
    }
  };

  const handleSearchChange = (clusterIndex: number, value: string) => {
    const newClusters = [...clusters];
    const oldSearchText = newClusters[clusterIndex].searchText;
    newClusters[clusterIndex].searchText = value;
    
    const targetCluster = newClusters[clusterIndex];
    
    // ШАГ 1: Всегда сначала возвращаем ВСЕ временные фразы из ЭТОГО кластера
    const tempPhrasesInTarget = targetCluster.phrases.filter(p => p.isTemporary);
    if (tempPhrasesInTarget.length > 0) {
      console.log('🔙 Restoring temporary phrases from target cluster');
      
      tempPhrasesInTarget.forEach(tempPhrase => {
        // Находим исходный кластер
        const sourceCluster = newClusters.find(c => c.name === tempPhrase.sourceCluster);
        if (sourceCluster) {
          // Убираем временные флаги
          const restoredPhrase = { ...tempPhrase };
          delete restoredPhrase.isTemporary;
          delete restoredPhrase.sourceCluster;
          delete restoredPhrase.sourceColor;
          sourceCluster.phrases.push(restoredPhrase);
          sourceCluster.phrases = sortPhrasesCopy(sourceCluster.phrases);
        }
      });
      
      // Удаляем все временные фразы из целевого кластера
      targetCluster.phrases = targetCluster.phrases.filter(p => !p.isTemporary);
    }
    
    // ШАГ 2: Если ввели текст - делаем новый временный перенос
    if (value.trim()) {
      console.log('🔄 Doing new temporary move for:', value);
      
      const searchTerm = value.toLowerCase().trim();
      
      // Ищем совпадения в других кластерах
      newClusters.forEach((sourceCluster, sourceIdx) => {
        if (sourceIdx === clusterIndex) return;
        
        const matchingPhrases: Phrase[] = [];
        const remainingPhrases: Phrase[] = [];
        
        sourceCluster.phrases.forEach(phrase => {
          if (matchWithYandexOperators(phrase.phrase, searchTerm, USE_WORD_FORMS)) {
            // Проверяем что фразы нет в целевом кластере
            const alreadyInTarget = targetCluster.phrases.some(p => p.phrase === phrase.phrase);
            if (!alreadyInTarget) {
              matchingPhrases.push({
                ...phrase,
                sourceCluster: sourceCluster.name,
                sourceColor: sourceCluster.bgColor,
                isTemporary: true
              });
            } else {
              remainingPhrases.push(phrase);
            }
          } else {
            remainingPhrases.push(phrase);
          }
        });
        
        // Удаляем найденные фразы из исходного кластера
        sourceCluster.phrases = remainingPhrases;
        
        // Добавляем во временные в целевом кластере
        targetCluster.phrases.push(...matchingPhrases);
      });
      
      targetCluster.phrases = sortPhrasesCopy(targetCluster.phrases);
    }
    
    setClusters(newClusters);
  };

  const getFilteredPhrases = (clusterIndex: number, _searchText: string) => {
    const cluster = clusters[clusterIndex];
    return sortPhrasesCopy(cluster.phrases);
  };

  const handleConfirmSearch = async (targetIndex: number) => {
    const newClusters = [...clusters];
    const targetCluster = newClusters[targetIndex];
    const searchTerm = targetCluster.searchText.toLowerCase();

    if (!searchTerm) return;

    console.log('✅ Confirming temporary moves');
    
    // Убираем флаг isTemporary у всех временных фраз в целевом кластере
    targetCluster.phrases = targetCluster.phrases.map(p => {
      if (p.isTemporary) {
        const confirmed = { ...p };
        delete confirmed.isTemporary;
        return confirmed;
      }
      return p;
    });
    
    const movedCount = targetCluster.phrases.filter(p => p.sourceCluster).length;
    
    // Очищаем поле поиска
    targetCluster.searchText = "";

    setClusters(newClusters);

    if (onSaveChanges) {
      await onSaveChanges(
        newClusters.map((c) => ({
          name: c.name,
          intent: c.intent,
          color: c.color,
          icon: c.icon,
          phrases: c.phrases,
          subClusters: c.subClusters,
        })),
        minusWords,
      );
    }

    toast({
      title: "✅ Перенос зафиксирован",
      description: `${movedCount} фраз`,
    });
  };

  const handleMinusSearchChange = (value: string) => {
    setMinusSearchText(value);

    const searchTerm = value.toLowerCase().trim();
    if (!searchTerm) {
      // При очистке поиска снимаем только временную подсветку (minusTerm !== undefined)
      // НЕ трогаем подтверждённые минус-слова (minusTerm === undefined && isMinusWord === true)
      const newClusters = clusters.map((cluster) => ({
        ...cluster,
        phrases: sortPhrasesCopy(
          cluster.phrases.map((p) => {
            // Если это временная подсветка (есть minusTerm) — снимаем
            if (p.minusTerm !== undefined) {
              // Проверяем, не подходит ли фраза под какое-то подтверждённое минус-слово
              const matchesConfirmedMinus = minusWords.some((mw) =>
                matchesMinusPhrase(p.phrase, mw.phrase.toLowerCase())
              );
              
              return {
                ...p,
                isMinusWord: matchesConfirmedMinus,
                minusTerm: undefined,
              };
            }
            // Подтверждённые минус-слова оставляем как есть
            return p;
          }),
        ),
      }));
      setClusters(newClusters);
      return;
    }

    // При вводе — добавляем временную подсветку, НЕ трогая подтверждённые минус-слова
    const newClusters = clusters.map((cluster) => {
      const updatedPhrases = cluster.phrases.map((p) => {
        // Если это уже подтверждённое минус-слово — не трогаем
        if (p.isMinusWord && p.minusTerm === undefined) {
          return p;
        }

        const matches = matchesWordForm(p.phrase, searchTerm);

        return {
          ...p,
          isMinusWord: matches,
          minusTerm: matches ? searchTerm : undefined,
        };
      });

      return {
        ...cluster,
        phrases: updatedPhrases,
      };
    });

    setClusters(newClusters);
  };

  const handleConfirmMinusSearch = async () => {
    const searchTerm = minusSearchText.toLowerCase().trim();
    if (!searchTerm) return;

    // Проверка дубля
    const isDuplicate = minusWords.some(
      (m) => m.phrase.toLowerCase() === searchTerm,
    );
    if (isDuplicate) {
      toast({
        title: "⚠️ Дубль минус-слова",
        description: `"${searchTerm}" уже есть в списке`,
        variant: "destructive",
      });
      setMinusSearchText("");
      return;
    }

    const affectedPhrases: Phrase[] = [];
    const newClusters = clusters.map((cluster) => {
      const updatedPhrases = cluster.phrases.map((p) => {
        if (matchesWordForm(p.phrase, searchTerm)) {
          affectedPhrases.push({
            ...p,
            sourceCluster: cluster.name,
            sourceColor: cluster.bgColor,
          });

          // Закрепляем фразу как минус-слово (НЕ удаляем!)
          return {
            ...p,
            isMinusWord: true,
            minusTerm: undefined, // undefined = подтверждённое минус-слово
          };
        }
        return p;
      });

      return {
        ...cluster,
        phrases: updatedPhrases,
      };
    });

    if (affectedPhrases.length > 0) {
      const totalCount = affectedPhrases.reduce(
        (sum, p) => sum + (p.count || 0),
        0,
      );

      const newMinusWord: Phrase = {
        phrase: searchTerm,
        count: totalCount,
        removedPhrases: affectedPhrases.map((p) => ({
          ...p,
          isMinusWord: false,
          minusTerm: undefined,
        })),
      };

      const newMinusWords = [...minusWords, newMinusWord].sort(
        (a, b) => b.count - a.count,
      );
      setMinusWords(newMinusWords);
      setClusters(newClusters);
      setMinusSearchText("");

      await saveToAPI(newClusters, newMinusWords);

      toast({
        title: "🚫 Добавлено в минус-слова",
        description: `${affectedPhrases.length} фраз помечено`,
      });
    }
  };

  const getWordRoot = (word: string): string => {
    const w = word.toLowerCase();
    if (w.length <= 3) return w;

    const commonEndings = [
      // Причастия
      "ующий",
      "ающий",
      "ющий",
      "ящий",
      "вший",
      "ший",
      "ующая",
      "ающая",
      "ющая",
      "ящая",
      "вшая",
      "шая",
      "ующую",
      "ающую",
      "ющую",
      "ящую",
      "ающие",
      "ующие",
      "ющие",
      "ящие",
      "вшие",
      "шие",
      // Существительные
      "ость",
      "ение",
      "ание",
      "ость",
      "ство",
      "тель",
      // Глаголы (инфинитив)
      "ать",
      "ять",
      "еть",
      "ить",
      "оть",
      "уть",
      "ти",
      // Глаголы (личные формы)
      "ишь",
      "ешь",
      "ёшь",
      "ишь",
      "ит",
      "ет",
      "ёт",
      "им",
      "ем",
      "ём",
      "ите",
      "ете",
      "ёте",
      "ят",
      "ат",
      "ут",
      "ют",
      "ил",
      "ел",
      "ёл",
      "ал",
      "ял",
      "ила",
      "ела",
      "ёла",
      "ала",
      "яла",
      "или",
      "ели",
      "ёли",
      "али",
      "яли",
      "ило",
      "ело",
      "ёло",
      "ало",
      "яло",
      "ишь",
      "ешь",
      // Прилагательные
      "ный",
      "ная",
      "ное",
      "ные",
      "ной",
      "ную",
      "ого",
      "его",
      "ому",
      "ему",
      "ую",
      "ая",
      "яя",
      "ое",
      "ее",
      "ый",
      "ий",
      "ой",
      "ые",
      "ие",
      "ом",
      "ем",
      "им",
      // Множественное число существительных
      "ами",
      "ями",
      "ах",
      "ях",
      "ов",
      "ев",
      "ей",
      "ам",
      "ям",
      // Возвратные формы
      "ся",
      "сь",
      // Короткие окончания (в конце, чтобы не перебивали длинные)
      "у",
      "ю",
      "а",
      "я",
      "ы",
      "и",
      "е",
      "о",
    ];

    for (const ending of commonEndings) {
      if (w.endsWith(ending) && w.length - ending.length >= 3) {
        return w.slice(0, -ending.length);
      }
    }

    return w;
  };

  const matchesWordForm = (phrase: string, targetWord: string): boolean => {
    const targetLower = targetWord.toLowerCase();
    const phraseWords = phrase.toLowerCase().split(/\s+/);

    // Для коротких слов (меньше 5 символов) только точное совпадение
    if (targetLower.length < 5) {
      return phraseWords.some((word) => word === targetLower);
    }

    return phraseWords.some((word) => {
      // 1. Точное совпадение слова
      if (word === targetLower) return true;

      // Для коротких слов во фразе (меньше 4 символов) не ищем словоформы
      if (word.length < 4) {
        return false;
      }

      // 2. Совпадение корней (для словоформ: купить → куплю, купил)
      // НО: длины слов должны быть примерно одинаковые (защита от мусора)
      const wordRoot = getWordRoot(word);
      const targetRoot = getWordRoot(targetLower);

      // Не ищем словоформы если корень короче 4 символов (защита от "как" → "каком")
      if (
        wordRoot === targetRoot &&
        wordRoot.length >= 4 &&
        Math.abs(word.length - targetLower.length) <= 3
      ) {
        return true;
      }

      // 3. Учёт чередований согласных в корне (куп/купл, лов/ловл, и т.д.)
      if (wordRoot.length >= 3 && targetRoot.length >= 3) {
        const normalizeRoot = (root: string): string => {
          // Убираем чередующиеся согласные в конце корня
          return root
            .replace(/пл$/, 'п')
            .replace(/бл$/, 'б')
            .replace(/вл$/, 'в')
            .replace(/мл$/, 'м')
            .replace(/фл$/, 'ф');
        };

        const normalizedWordRoot = normalizeRoot(wordRoot);
        const normalizedTargetRoot = normalizeRoot(targetRoot);

        // Защита: нормализованный корень должен быть >= 3 символов
        // И исходное слово >= 5 символов (чтобы "как" не нашло "каком")
        if (
          normalizedWordRoot === normalizedTargetRoot &&
          normalizedWordRoot.length >= 3 &&
          targetLower.length >= 5 &&
          word.length >= 5 &&
          Math.abs(word.length - targetLower.length) <= 3
        ) {
          return true;
        }
      }

      return false;
    });
  };

  const matchesMinusPhrase = (phrase: string, minusPhrase: string): boolean => {
    const phraseLower = phrase.toLowerCase();
    const phraseWords = phraseLower.split(/\s+/);
    const minusPhraseWords = minusPhrase
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    // С учётом словоформ; для очень коротких слов (<= 3 символа) — точное совпадение
    return minusPhraseWords.every((minusWord) => {
      if (minusWord.length <= 3) {
        return phraseWords.includes(minusWord);
      }
      return matchesWordForm(phraseLower, minusWord);
    });
  };

  const addQuickMinusWord = async (word: string) => {
    const searchTerm = word.toLowerCase().trim();
    if (!searchTerm) return;

    // Проверка дубля
    const isDuplicate = minusWords.some(
      (m) => m.phrase.toLowerCase() === searchTerm,
    );
    if (isDuplicate) {
      toast({
        title: "⚠️ Дубль минус-слова",
        description: `"${searchTerm}" уже есть в списке`,
        variant: "destructive",
      });
      return;
    }

    const affectedPhrases: Phrase[] = [];

    // Сохраняем ВСЕ существующие минус-метки
    const updatedClusters = clusters.map((cluster) => {
      const updatedPhrases = cluster.phrases.map((p) => {
        // Если фраза УЖЕ помечена как минус — оставляем как есть
        if (p.isMinusWord) {
          return p;
        }

        // Если фраза совпадает с новым минус-словом — помечаем
        if (matchesMinusPhrase(p.phrase, searchTerm)) {
          affectedPhrases.push(p);
          return { ...p, isMinusWord: true, minusTerm: searchTerm };
        }

        // Иначе оставляем без изменений
        return p;
      });

      return {
        ...cluster,
        phrases: updatedPhrases,
      };
    });

    if (affectedPhrases.length > 0) {
      const totalCount = affectedPhrases.reduce(
        (sum, p) => sum + (p.count || 0),
        0,
      );

      const newMinusWord: Phrase = {
        phrase: searchTerm,
        count: totalCount,
        removedPhrases: affectedPhrases.map((p) => ({
          ...p,
          isMinusWord: false,
          minusTerm: undefined,
        })),
      };

      const newMinusWords = [...minusWords, newMinusWord].sort(
        (a, b) => b.count - a.count,
      );

      setClusters(updatedClusters);
      setMinusWords(newMinusWords);

      await saveToAPI(updatedClusters, newMinusWords);

      toast({
        title: "🚫 Добавлено в минус-слова",
        description: `${affectedPhrases.length} фраз помечено`,
      });
    }
  };

  const renameCluster = (clusterIndex: number, newName: string) => {
    const newClusters = [...clusters];
    newClusters[clusterIndex].name = newName;
    setClusters(newClusters);

    if (renameDebounceTimer.current) {
      clearTimeout(renameDebounceTimer.current);
    }

    renameDebounceTimer.current = setTimeout(async () => {
      await saveToAPI(newClusters, minusWords);
    }, 800);
  };

  const deleteCluster = async (clusterIndex: number) => {
    const cluster = clusters[clusterIndex];

    if (cluster.name === "Минус-фразы" || cluster.intent === "minus") {
      toast({
        title: "⚠️ Нельзя удалить",
        description: "Сегмент минус-фраз всегда должен существовать",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Удалить сегмент "${cluster.name}"?`)) return;

    const newClusters = clusters.filter((_, idx) => idx !== clusterIndex);
    setClusters(newClusters);

    await saveToAPI(newClusters, minusWords);

    toast({
      title: "🗑️ Сегмент удалён",
    });
  };

  const removePhrase = async (clusterIndex: number, phraseIndex: number) => {
    const cluster = clusters[clusterIndex];
    if (
      !cluster ||
      phraseIndex < 0 ||
      phraseIndex >= cluster.phrases.length
    ) {
      return;
    }

    const phrase = clusters[clusterIndex].phrases[phraseIndex];
    const newClusters = [...clusters];
    
    // Помечаем фразу как минус-слово вместо удаления
    newClusters[clusterIndex].phrases[phraseIndex] = {
      ...phrase,
      isMinusWord: true,
      minusTerm: undefined // undefined = подтверждённое минус-слово
    };
    
    setClusters(newClusters);

    await saveToAPI(newClusters, minusWords);

    toast({
      title: "🚫 Фраза помечена",
      description: "Фраза отмечена как минус-слово",
    });
  };

  const addNewCluster = async (afterIndex: number) => {
    console.log('➕ addNewCluster called:', {
      currentClustersCount: clusters.length,
      afterIndex,
      willHaveCount: clusters.length + 1
    });
    
    const newCluster = {
      name: `Новый сегмент ${clusters.length + 1}`,
      intent: "informational",
      color: "gray",
      icon: "Folder",
      phrases: [],
      bgColor: CLUSTER_BG_COLORS[clusters.length % CLUSTER_BG_COLORS.length],
      searchText: "",
    };
    
    const newClusters = [
      ...clusters.slice(0, afterIndex + 1),
      newCluster,
      ...clusters.slice(afterIndex + 1),
    ];
    
    console.log('➕ Setting new clusters:', {
      newClustersCount: newClusters.length
    });
    
    setClusters(newClusters);

    await saveToAPI(newClusters, minusWords);

    toast({
      title: "✨ Сегмент создан",
    });
  };

  const copyClusterPhrases = (phrases: Phrase[]) => {
    const text = phrases
      .map((p) => `${p.phrase}\t${p.count}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Скопировано",
      description: `${phrases.length} фраз с частотностью`,
    });
  };

  const removeMinusWord = async (minusIndex: number) => {
    const minusWord = minusWords[minusIndex];
    const newMinusWords = minusWords.filter((_, idx) => idx !== minusIndex);

    const phrasesToUnmark = minusWord.removedPhrases || [];
    const phraseTexts = new Set(
      phrasesToUnmark.map((p) => p.phrase.toLowerCase()),
    );
    const minusPhraseLower = minusWord.phrase.toLowerCase();

    const newClusters = clusters.map((cluster) => {
      const updatedPhrases = cluster.phrases.map((p) => {
        // Снимаем зачёркивание с фраз которые:
        // 1. Были в removedPhrases этого минус-слова ИЛИ
        // 2. Совпадают с этим минус-словом (проверка через matchesMinusPhrase)
        const isInRemovedList = phraseTexts.has(p.phrase.toLowerCase());
        const matchesThisMinusWord =
          p.isMinusWord && matchesMinusPhrase(p.phrase, minusPhraseLower);

        if (isInRemovedList || matchesThisMinusWord) {
          // Проверяем, совпадает ли эта фраза с каким-либо из оставшихся минус-слов
          const stillMatchesAnotherMinus = newMinusWords.some((mw) =>
            matchesMinusPhrase(p.phrase, mw.phrase.toLowerCase())
          );
          
          if (stillMatchesAnotherMinus) {
            // Фраза всё ещё подходит под другие минус-слова - оставляем как минус
            return p;
          }
          
          // Фраза больше не подходит ни под одно минус-слово - восстанавливаем
          return {
            ...p,
            isMinusWord: false,
            minusTerm: undefined,
          };
        }
        return p;
      });

      return {
        ...cluster,
        phrases: sortPhrasesCopy(updatedPhrases),
      };
    });

    setClusters(newClusters);
    setMinusWords(newMinusWords);

    await saveToAPI(newClusters, newMinusWords);

    toast({
      title: "↩️ Фразы восстановлены",
      description: `Восстановлено ${phrasesToUnmark.length} фраз`,
    });
  };

  const startEditingMinusWord = (index: number) => {
    setEditingMinusIndex(index);
    setEditingMinusText(minusWords[index].phrase);
  };

  const saveEditingMinusWord = async () => {
    if (editingMinusIndex === null) return;

    const newPhrase = editingMinusText.trim();
    if (!newPhrase) {
      toast({
        title: "⚠️ Ошибка",
        description: "Минус-фраза не может быть пустой",
        variant: "destructive",
      });
      return;
    }

    const newMinusWords = [...minusWords];
    newMinusWords[editingMinusIndex] = {
      ...newMinusWords[editingMinusIndex],
      phrase: newPhrase,
    };

    setMinusWords(newMinusWords);
    setEditingMinusIndex(null);
    setEditingMinusText("");

    await saveToAPI(clusters, newMinusWords);

    toast({
      title: "✅ Сохранено",
      description: "Минус-фраза обновлена",
    });
  };

  const cancelEditingMinusWord = () => {
    setEditingMinusIndex(null);
    setEditingMinusText("");
  };

  const removeDuplicates = async () => {
    const normalizePhrase = (phrase: string) => {
      return phrase.toLowerCase().split(/\s+/).sort().join(" ");
    };

    // Собираем все фразы из всех кластеров (кроме первого "Запросы пользователя")
    const globalSeen = new Set<string>();
    
    let removedCount = 0;
    const newClusters = clusters.map((cluster, clusterIndex) => {
      // Пропускаем первый кластер "Запросы пользователей" (индекс 0)
      if (clusterIndex === 0) {
        // Но добавляем его фразы в globalSeen, чтобы удалить их из других кластеров
        cluster.phrases.forEach((p) => {
          globalSeen.add(normalizePhrase(p.phrase));
        });
        return cluster;
      }

      const uniquePhrases: Phrase[] = [];

      cluster.phrases.forEach((p) => {
        const normalized = normalizePhrase(p.phrase);
        if (!globalSeen.has(normalized)) {
          globalSeen.add(normalized);
          uniquePhrases.push(p);
        } else {
          removedCount++;
        }
      });

      return {
        ...cluster,
        phrases: uniquePhrases,
      };
    });

    setClusters(newClusters);

    await saveToAPI(newClusters, minusWords);

    toast({
      title: "🧹 Дубли удалены",
      description: `Удалено дублей: ${removedCount}`,
    });
  };

  const applyGeoFilter = async () => {
    const selectedRegionsLower = regions.map(r => r.toLowerCase());
    
    // РСЯ мусорные паттерны (вопросы, сравнения, инфо-запросы)
    const rsyaPatterns = [
      /\b(как|какой|какая|какое|какие|зачем|почему|что такое|что значит|где|куда|откуда|когда)\b/gi,
      /\b(или|либо|versus|vs|против)\b/gi,
      /\b(отличие|отличается|разница|сравнение|лучше|хуже)\b/gi,
      /\b(можно ли|нужно ли|стоит ли|надо ли)\b/gi,
      /\b(сделать|изготовить|построить|создать)\s+(самостоятельно|своими руками|сам|самому)\b/gi,
      /\b(отзывы|обзор|мнение|опыт|рейтинг|топ)\b/gi,
      /\b(бесплатно|даром|безвозмездно|без оплаты)\b/gi,
      /\b(скачать|загрузить|download)\b/gi,
      /\b(смотреть онлайн|читать онлайн|слушать онлайн)\b/gi,
      /\b(видео|фото|картинки|изображения)\b/gi,
      /\b(форум|обсуждение|чат)\b/gi,
      /\b(wikipedia|википедия|wiki)\b/gi,
      /\?$/gi // Запросы заканчивающиеся на "?"
    ];
    
    // Паттерны площадок для очистки
    const platformPatterns = [
      /\b(авито|avito)\b/gi,
      /\b(юла|youla)\b/gi,
      /\b(озон|ozon)\b/gi,
      /\b(wildberries|вайлдберриз|wb)\b/gi,
      /\b(яндекс маркет|yandex market)\b/gi,
      /\b(aliexpress|алиэкспресс)\b/gi,
      /\b(lamoda|ламода)\b/gi,
      /\b(mvideo|мвидео)\b/gi,
      /\b(эльдорадо|eldorado)\b/gi,
      /\b(леруа|leroy merlin)\b/gi,
      /\b(DNS|днс)\b/gi,
      /\b(ситилинк|citilink)\b/gi
    ];
    
    let removedRsyaCount = 0;
    let removedPlatformsCount = 0;
    let removedCitiesCount = 0;

    const newClusters = clusters.map((cluster) => {
      const filteredPhrases = cluster.phrases.filter(phrase => {
        const phraseLower = phrase.phrase.toLowerCase();
        
        // 1. Проверка на РСЯ мусор
        const isRsya = rsyaPatterns.some(pattern => pattern.test(phraseLower));
        if (isRsya) {
          removedRsyaCount++;
          return false; // Удаляем фразу
        }
        
        // 2. Проверка на площадки
        const hasPlatform = platformPatterns.some(pattern => pattern.test(phraseLower));
        if (hasPlatform) {
          removedPlatformsCount++;
          return false; // Удаляем фразу
        }
        
        // 3. Проверка на чужие города (если выбраны регионы)
        if (selectedRegionsLower.length > 0) {
          const hasOtherCity = phraseLower.match(/\b(москва|химки|мытищи|балашиха|петербург|спб|екатеринбург|казань|новосибирск|нижний новгород|челябинск|самара|уфа|ростов|краснодар|воронеж|пермь|волгоград|саратов|тюмень|тольятти|ижевск|барнаул|ульяновск|иркутск|хабаровск|ярославль|владивосток|махачкала|томск|оренбург|кемерово|новокузнецк|рязань|набережные челны|астрахань|пенза|липецк|киров|чебоксары|калининград|тула|курск|сочи|ставрополь|улан-удэ|тверь|магнитогорск|иваново|брянск|белгород|сургут|владимир|архангельск|чита|калуга|смоленск|волжский|курган|череповец|орел|владикавказ|мурманск|саранск|вологда|тамбов|стерлитамак|грозный|якутск|кострома|комсомольск-на-амуре|петрозаводск|нижний тагил|таганрог|йошкар-ола|братск|новороссийск|дзержинск|нальчик|шахты|орск|нижневартовск|ангарск|старый оскол|великий новгород|благовещенск|энгельс|подольск|псков|бийск|прокопьевск|рыбинск|балаково|армавир|северодвинск|королев|сызрань|норильск|петропавловск-камчатский|златоуст|мичуринск|каменск-уральский|южно-сахалинск|керчь|майкоп|абакан|уссурийск|элиста|новочеркасск|каменногорск|березники|салават|нефтекамск|волгодонск|батайск|новочебоксарск|находка)\b/gi);
          
          if (hasOtherCity && !selectedRegionsLower.some(r => phraseLower.includes(r))) {
            removedCitiesCount++;
            return false; // Удаляем фразу
          }
        }
        
        return true; // Оставляем фразу
      });

      return {
        ...cluster,
        phrases: filteredPhrases
      };
    });

    const totalRemoved = removedRsyaCount + removedPlatformsCount + removedCitiesCount;
    
    if (totalRemoved === 0) {
      toast({
        title: "✅ Мусора не найдено",
        description: "РСЯ, площадки и чужие города не обнаружены",
      });
      return;
    }

    setClusters(newClusters);

    await saveToAPI(newClusters, minusWords);

    const parts = [];
    if (removedRsyaCount > 0) parts.push(`РСЯ: ${removedRsyaCount}`);
    if (removedPlatformsCount > 0) parts.push(`площадок: ${removedPlatformsCount}`);
    if (removedCitiesCount > 0) parts.push(`городов: ${removedCitiesCount}`);
    
    toast({
      title: "🗑️ Мусор удалён",
      description: parts.join(', '),
    });
  };

  const copyMinusPhrases = () => {
    const text = minusWords.map((p) => p.phrase).join("\n");
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Скопировано",
      description: `${minusWords.length} минус-фраз`,
    });
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      let totalExported = 0;
      
      // Функция для создания листа из кластеров
      const createSheetFromClusters = (clustersData: any[], includeMinusColumn: boolean = true) => {
        // Добавляем минус-фразы как отдельный сегмент
        const clustersWithMinus = includeMinusColumn && minusWords.length > 0
          ? [...clustersData, {
              name: 'Минус-фразы',
              phrases: minusWords.map(mw => ({
                phrase: mw.phrase,
                count: mw.count || 0,
                isMinusWord: false
              }))
            }]
          : clustersData;
        
        const clusterData = clustersWithMinus.map((cluster) => ({
          name: cluster.name,
          phrases: cluster.phrases,
        }));

        const maxRows = Math.max(...clusterData.map((c) => c.phrases.length));
        const data: any[][] = [];
        
        // Заголовки
        const headers: string[] = [];
        clusterData.forEach((c) => {
          headers.push(c.name, 'Частотность');
        });
        data.push(headers);
        
        // Данные
        for (let row = 0; row < maxRows; row++) {
          const rowData: any[] = [];
          
          clusterData.forEach((cluster) => {
            const phrase = cluster.phrases[row];
            if (!phrase) {
              rowData.push('', '');
            } else {
              totalExported++;
              
              const phraseText = phrase.isMinusWord 
                ? phrase.phrase.split('').join('\u0336') + '\u0336'
                : phrase.phrase;
              
              rowData.push(phraseText, phrase.count || 0);
            }
          });
          
          data.push(rowData);
        }
        
        return XLSX.utils.aoa_to_sheet(data);
      };
      
      // Основной лист со всеми кластерами + минус-фразы
      const mainSheet = createSheetFromClusters(clusters, true);
      XLSX.utils.book_append_sheet(wb, mainSheet, 'Все сегменты');
      
      // Проверяем есть ли кластеры с subClusters
      clusters.forEach((cluster, idx) => {
        if (cluster.subClusters && cluster.subClusters.length > 0) {
          // Создаем отдельный лист для вложенного сегмента + минус-фразы
          const subClustersWithParent = [cluster, ...cluster.subClusters];
          const subSheet = createSheetFromClusters(subClustersWithParent, true);
          
          // Имя листа (максимум 31 символ для Excel)
          const sheetName = cluster.name.substring(0, 28) + '...';
          XLSX.utils.book_append_sheet(wb, subSheet, sheetName);
        }
      });
      
      // Скачивание файла
      XLSX.writeFile(wb, `кластеры_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "📊 Экспорт завершен",
        description: `Выгружено ${totalExported} фраз из ${clusters.length} кластеров${minusWords.length > 0 ? ` + ${minusWords.length} минус-фраз` : ''}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "❌ Ошибка экспорта",
        description: "Не удалось создать Excel файл",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!clustersMergeEpoch || propsClusters.length === 0 || !isInitialized) return;
    if (selectedClusterIndex !== null) return;

    const filteredMinus = propsMinusWords.filter((p) => p.phrase && p.phrase.trim() !== "");
    const mappedClusters = propsClusters.map((c, idx) => ({
      ...c,
      bgColor: CLUSTER_BG_COLORS[idx % CLUSTER_BG_COLORS.length],
      searchText: "",
    }));

    const subClustersMap = new Map<number, number>();
    propsClusters.forEach((cluster, idx) => {
      const n = cluster.subClusters?.length || 0;
      if (n > 0) subClustersMap.set(idx, n);
    });
    setClusterSubClusters(subClustersMap);

    setMinusWords(filteredMinus);
    setClusters(mappedClusters);
  }, [clustersMergeEpoch]);

  const removeStrikethroughPhrases = async () => {
    const strikethroughCount = clusters.reduce(
      (sum, c) => sum + c.phrases.filter(p => p.isMinusWord).length,
      0
    );
    
    if (strikethroughCount === 0) {
      toast({
        title: "ℹ️ Нет зачёркнутых фраз",
        description: "Нет фраз для удаления",
      });
      return;
    }
    
    if (!confirm(`Удалить ${strikethroughCount} зачёркнутых фраз?`)) return;

    const newClusters = clusters.map(cluster => ({
      ...cluster,
      phrases: cluster.phrases.filter(p => !p.isMinusWord)
    }));
    
    setClusters(newClusters);

    await saveToAPI(newClusters, minusWords);

    toast({
      title: "🗑️ Удалено",
      description: `${strikethroughCount} зачёркнутых фраз удалено`,
    });
  };

  const totalPhrases =
    clusters.reduce((sum, c) => sum + c.phrases.length, 0) + minusWords.length;
  
  const strikethroughPhrases =
    clusters.reduce((sum, c) => sum + c.phrases.filter(p => p.isMinusWord).length, 0);

  const handleClusterDragStart = (clusterIdx: number) => {
    setDraggedCluster(clusterIdx);
  };

  const handleClusterDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedCluster === null || draggedCluster === targetIdx) return;
  };

  const handleClusterDrop = async (targetIdx: number) => {
    if (draggedCluster === null || draggedCluster === targetIdx) {
      setDraggedCluster(null);
      return;
    }

    const newClusters = [...clusters];
    const [movedCluster] = newClusters.splice(draggedCluster, 1);
    newClusters.splice(targetIdx, 0, movedCluster);

    setClusters(newClusters);
    setDraggedCluster(null);

    console.log("🔄 Cluster moved, saving...");

    await saveToAPI(newClusters, minusWords);
    console.log("✅ Cluster move saved to API");

    toast({
      title: "✅ Кластер перемещён",
      description: "Позиция сохранена",
    });
  };

  const openCluster = (clusterIdx: number) => {
    const cluster = clusters[clusterIdx];
    if (!cluster) return;
    
    console.log('📂 Opening cluster:', { 
      clusterIdx, 
      name: cluster.name, 
      selectedClusterIndex,
      hasSubClusters: !!cluster.subClusters,
      subClustersCount: cluster.subClusters?.length || 0
    });
    
    // Сохраняем ТОЛЬКО индекс кластера (данные всегда берём из БД при восстановлении)
    localStorage.setItem('cluster_view_index', clusterIdx.toString());
    
    // Сохраняем оригинальные кластеры в памяти
    setOriginalClusters(clusters);
    setSelectedClusterIndex(clusterIdx);
    
    // Формируем список кластеров для отображения: родительский + подкластеры
    const clustersToShow = [
      {
        ...cluster,
        bgColor: CLUSTER_BG_COLORS[0],
        searchText: "",
      },
      ...(cluster.subClusters || []).map((subCluster, idx) => ({
        ...subCluster,
        bgColor: CLUSTER_BG_COLORS[(idx + 1) % CLUSTER_BG_COLORS.length],
        searchText: "",
      }))
    ];
    
    setClusters(clustersToShow);
    
    console.log('📂 Cluster opened with sub-clusters:', {
      clusterIdx,
      totalClustersShown: clustersToShow.length
    });
    
    toast({
      title: "📂 Открыт сегмент",
      description: `"${cluster.name}" — ${cluster.phrases.length} фраз${cluster.subClusters?.length ? ` + ${cluster.subClusters.length} подсегментов` : ''}`,
    });
  };

  const closeCluster = async () => {
    console.log('↩️ Closing cluster:', { selectedClusterIndex, originalClustersLength: originalClusters.length });
    
    // Очищаем localStorage
    localStorage.removeItem('cluster_view_index');
    
    if (selectedClusterIndex === null) {
      console.warn('⚠️ closeCluster called but selectedClusterIndex is null');
      return;
    }
    
    // ВАЖНО: Сохраняем данные внутреннего сегмента обратно в родительский
    const updatedOriginalClusters = [...originalClusters];
    const subClustersArray = clusters.slice(1); // Все кроме первого (родительского)
    
    updatedOriginalClusters[selectedClusterIndex] = {
      ...clusters[0], // Берём обновлённые данные из внутреннего view
      bgColor: originalClusters[selectedClusterIndex].bgColor, // Сохраняем оригинальный цвет
      subClusters: subClustersArray.length > 0 ? subClustersArray.map(c => ({
        name: c.name,
        intent: c.intent,
        color: c.color,
        icon: c.icon,
        phrases: c.phrases,
        subClusters: c.subClusters
      })) : undefined
    };
    
    console.log('💾 Saving inner cluster data back to parent:', {
      parentClusterName: originalClusters[selectedClusterIndex].name,
      phrasesCount: clusters[0].phrases.length,
      subClustersCount: subClustersArray.length
    });
    
    // Обновляем счётчик подкластеров для родительского кластера
    const subClusterCount = clusters.length - 1; // Вычитаем сам родительский кластер
    const newMap = new Map(clusterSubClusters);
    if (subClusterCount > 0) {
      newMap.set(selectedClusterIndex, subClusterCount);
    } else {
      newMap.delete(selectedClusterIndex); // Удаляем метку если подкластеров нет
    }
    setClusterSubClusters(newMap);
    console.log('📊 Updated sub-cluster count:', { clusterIdx: selectedClusterIndex, count: subClusterCount });
    
    // ВАЖНО: Сначала выходим из drill-down режима
    setSelectedClusterIndex(null);
    setOriginalClusters([]);
    
    // Потом восстанавливаем оригинальные кластеры с обновлёнными данными
    setClusters(updatedOriginalClusters);
    
    // И только после этого сохраняем в БД (используем прямой вызов, т.к. merge уже сделан)
    if (onSaveChanges) {
      await onSaveChanges(
        updatedOriginalClusters.map((c) => ({
          name: c.name,
          intent: c.intent,
          color: c.color,
          icon: c.icon,
          phrases: c.phrases,
          subClusters: c.subClusters,
        })),
        minusWords,
      );
    }
    
    console.log('✅ Cluster closed, restored to main view with saved data');
    
    toast({
      title: "↩️ Возврат",
      description: "Изменения сохранены",
    });
  };

  const handlePhraseDragStart = (clusterIdx: number, phraseIdx: number) => {
    setDraggedPhrase({ clusterIdx, phraseIdx });
  };

  const handlePhraseDrop = async (targetClusterIdx: number) => {
    if (!draggedPhrase) return;

    const { clusterIdx: sourceClusterIdx, phraseIdx } = draggedPhrase;

    if (sourceClusterIdx === targetClusterIdx) {
      setDraggedPhrase(null);
      return;
    }
    
    console.log('🔄 handlePhraseDrop called:', {
      sourceClusterIdx,
      targetClusterIdx,
      phraseIdx,
      currentClustersCount: clusters.length
    });

    const newClusters = [...clusters];
    const sourceCluster = newClusters[sourceClusterIdx];
    const targetCluster = newClusters[targetClusterIdx];

    const [movedPhrase] = sourceCluster.phrases.splice(phraseIdx, 1);

    // Обновляем источник на ТЕКУЩИЙ кластер (откуда перемещаем)
    movedPhrase.sourceCluster = sourceCluster.name;
    movedPhrase.sourceColor = sourceCluster.bgColor;

    targetCluster.phrases.push(movedPhrase);
    targetCluster.phrases = sortPhrasesCopy(targetCluster.phrases);

    setClusters(newClusters);
    setDraggedPhrase(null);

    await saveToAPI(newClusters, minusWords);

    toast({
      title: "✅ Фраза перемещена",
      description: `→ "${targetCluster.name}"`,
    });
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden bg-gray-50">
      <div className="flex-shrink-0 border-b border-slate-200/80 bg-white shadow-sm">
        <div className="w-full max-w-none px-4 py-2 sm:px-6 sm:py-3">
          <div className="mb-2">
            <h2 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              {selectedClusterIndex !== null
                ? `Сегмент: ${clusters[0]?.name || ''}`
                : `Проект: ${projectName.trim() || 'Без названия'}`}
            </h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <Button
                onClick={onWordstatClick}
                size="sm"
                variant="outline"
                className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Icon name="Plus" size={16} />
                Добавить фразы
              </Button>
              {specificAddress && (
                <Button
                  onClick={applyGeoFilter}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Icon name="MapPin" size={16} />
                  Убрать чужие города
                </Button>
              )}
              <Button
                onClick={exportToExcel}
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Icon name="FileSpreadsheet" size={16} />
                Выгрузить .xlsx
              </Button>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-2">
            {selectedClusterIndex !== null && (
              <Button
                onClick={() => addNewCluster(0)}
                size="sm"
                variant="outline"
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Icon name="Plus" size={16} />
                Новый сегмент
              </Button>
            )}
            <Button
              onClick={removeDuplicates}
              size="sm"
              variant="outline"
              className="gap-2 border-amber-200 text-amber-800 hover:bg-amber-50"
            >
              <Icon name="Trash2" size={16} />
              Удалить дубли
            </Button>
            <Button
              onClick={removeStrikethroughPhrases}
              size="sm"
              variant="outline"
              className="gap-2 border-amber-200 text-amber-800 hover:bg-amber-50"
            >
              <Icon name="Trash2" size={16} />
              Удалить зачёркнутые
            </Button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 mb-2">
            <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon name="Key" size={14} className="text-blue-600 shrink-0" />
                <span className="text-[11px] font-medium text-blue-600 leading-tight">
                  Всего ключей
                </span>
              </div>
              <div className="text-xl font-bold tabular-nums text-blue-900 leading-none">
                {totalPhrases.toLocaleString()}
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg px-3 py-2 border border-purple-200">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon name="Folder" size={14} className="text-purple-600 shrink-0" />
                <span className="text-[11px] font-medium text-purple-600 leading-tight">
                  Сегментов
                </span>
              </div>
              <div className="text-xl font-bold tabular-nums text-purple-900 leading-none">
                {clusters.length}
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg px-3 py-2 border border-orange-200">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon name="Slash" size={14} className="text-orange-600 shrink-0" />
                <span className="text-[11px] font-medium text-orange-600 leading-tight">
                  Зачёркнутых фраз
                </span>
              </div>
              <div className="text-xl font-bold tabular-nums text-orange-900 leading-none">
                {strikethroughPhrases.toLocaleString()}
              </div>
            </div>

            <div className="bg-red-50 rounded-lg px-3 py-2 border border-red-200">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon name="Ban" size={14} className="text-red-600 shrink-0" />
                <span className="text-[11px] font-medium text-red-600 leading-tight">
                  Минус-слов
                </span>
              </div>
              <div className="text-xl font-bold tabular-nums text-red-900 leading-none">
                {minusWords.length}
              </div>
            </div>
          </div>

          {regions.length > 0 && (
            <div className="mt-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-md px-3 py-1.5 border border-emerald-200">
              <div className="flex items-center gap-2">
                <Icon name="MapPin" size={16} className="text-emerald-600" />
                <span className="font-semibold text-emerald-800">Регионы:</span>
                <span className="text-emerald-700 font-medium">
                  {regions.join(", ")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-h-0 w-max min-w-full px-4 py-1 sm:px-6 sm:py-2">
          {clusters.map((cluster, idx) => (
            <div
              key={idx}
              className="relative h-full min-h-0 shrink-0"
              style={{
                width: SEGMENT_COLUMN_WIDTH_PX,
                minWidth: SEGMENT_COLUMN_WIDTH_PX,
              }}
            >
              <div
                onDragOver={(e) => handleClusterDragOver(e, idx)}
                onDrop={() => handleClusterDrop(idx)}
                className={`flex h-full min-h-0 w-full shrink-0 flex-col border-r border-gray-300 group relative ${draggedCluster === idx ? "opacity-50" : ""}`}
                style={{
                  backgroundColor: cluster.bgColor,
                  zIndex: 1,
                }}
              >


              <div
                className="p-3 border-b border-gray-200 relative z-10"
                style={{ 
                  backgroundColor: cluster.bgColor
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleClusterDragStart(idx);
                    }}
                    className="cursor-move"
                  >
                    <Icon
                      name="GripVertical"
                      size={14}
                      className="text-gray-400 flex-shrink-0"
                    />
                  </div>
                  <Input
                    value={cluster.name}
                    onChange={(e) => renameCluster(idx, e.target.value)}
                    className="font-semibold text-sm h-7 border-transparent hover:border-gray-300 focus:border-gray-400 bg-transparent flex-1"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    {selectedClusterIndex === null ? (
                      <>
                        <button
                          onClick={() => {
                            console.log('🔵 FolderOpen clicked for cluster:', idx);
                            openCluster(idx);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Открыть сегмент"
                        >
                          <Icon 
                            name={clusterSubClusters.get(idx) && clusterSubClusters.get(idx)! > 0 ? "FolderClosed" : "FolderInput"} 
                            size={16} 
                          />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          console.log('🔴 Back button clicked from card');
                          closeCluster();
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 text-orange-600 transition-colors"
                        title="Вернуться назад"
                      >
                        <Icon name="ArrowLeft" size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-1.5 mb-2">
                  <div className="flex-1 relative group">
                    <Input
                      placeholder="Поиск"
                      value={cluster.searchText}
                      onChange={(e) => handleSearchChange(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && cluster.searchText) {
                          e.preventDefault();
                          handleConfirmSearch(idx);
                        }
                      }}
                      className="h-8 text-sm bg-white border-gray-300 w-full"
                      title='Операторы Яндекс.Директ:
"купить квартиру" - порядок слов
[купить квартиру] - строго подряд
!купить - точная форма
+в - обязательный предлог
Enter или кнопка ✓ - зафиксировать перенос'
                    />
                  </div>
                  {cluster.searchText && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirmSearch(idx)}
                      className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
                    >
                      <Icon name="Check" size={14} />
                    </Button>
                  )}
                </div>

                <div className="text-xs text-gray-500 mb-2">
                  {getFilteredPhrases(idx, cluster.searchText).length} фраз
                </div>

                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyClusterPhrases(cluster.phrases)}
                    className="flex-1 text-xs h-7 hover:bg-white/80"
                  >
                    <Icon name="Copy" size={12} className="mr-1.5" />
                    Копировать
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCluster(idx)}
                    className="text-xs h-7 px-2 hover:bg-red-50 hover:text-red-700"
                  >
                    <Icon name="Trash2" size={12} />
                  </Button>
                </div>
              </div>

              <VirtualClusterPhrases
                clusterIdx={idx}
                cluster={cluster as ClusterWithUI}
                onDragStart={handlePhraseDragStart}
                onPhraseDropOnCluster={handlePhraseDrop}
                onRemovePhrase={removePhrase}
                addQuickMinusWord={addQuickMinusWord}
              />
            </div>
          </div>
          ))}

          <div
            className="flex h-full min-h-0 shrink-0 flex-col border-r border-gray-300"
            style={{
              width: SEGMENT_COLUMN_WIDTH_PX,
              minWidth: SEGMENT_COLUMN_WIDTH_PX,
              backgroundColor: "#F5F5F5",
            }}
          >
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <button
                onClick={() => addNewCluster(clusters.length - 1)}
                className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-4 hover:bg-gray-400 transition-colors cursor-pointer"
              >
                <Icon name="Plus" size={32} className="text-gray-600" />
              </button>
              <div className="text-gray-600 font-medium text-sm mb-1">
                Создать сегмент
              </div>
              <div className="text-gray-400 text-xs">
                Нажмите на кнопку
              </div>
            </div>
          </div>

          <div
            className="mr-6 flex h-full min-h-0 shrink-0 flex-col border-r border-gray-300"
            style={{
              width: SEGMENT_COLUMN_WIDTH_PX,
              minWidth: SEGMENT_COLUMN_WIDTH_PX,
              backgroundColor: "#FFE8E8",
            }}
          >
            <div className="p-3 border-b border-gray-200 bg-white/60">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Ban" size={18} className="text-red-700" />
                <span className="font-semibold text-sm text-red-700 flex-1">
                  Минус-слова
                </span>
                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                  {minusWords.length}
                </span>
              </div>

              <div className="flex gap-1.5 mb-2">
                <Input
                  placeholder="Поиск..."
                  value={minusSearchText}
                  onChange={(e) => handleMinusSearchChange(e.target.value)}
                  className="h-8 text-sm bg-white border-red-300 flex-1"
                />
                {minusSearchText && (
                  <Button
                    size="sm"
                    onClick={handleConfirmMinusSearch}
                    className="h-8 px-3 bg-red-600 hover:bg-red-700 flex-shrink-0"
                  >
                    <Icon name="Check" size={14} />
                  </Button>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-2">
                {minusWords.length} фраз
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={copyMinusPhrases}
                className="w-full text-xs h-7 hover:bg-white/80 mb-2"
              >
                <Icon name="Copy" size={12} className="mr-1.5" />
                Копировать
              </Button>
            </div>

            <VirtualMinusWordsList
              minusWords={minusWords}
              editingMinusIndex={editingMinusIndex}
              editingMinusText={editingMinusText}
              setEditingMinusText={setEditingMinusText}
              onSaveEdit={saveEditingMinusWord}
              onCancelEdit={cancelEditingMinusWord}
              onStartEdit={startEditingMinusWord}
              onRemove={removeMinusWord}
            />
          </div>
        </div>
      </div>
    </div>
  );
}