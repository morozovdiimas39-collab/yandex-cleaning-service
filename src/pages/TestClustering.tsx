import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { City } from '@/data/russian-cities';
import SourceStep from '@/components/clustering/SourceStep';
import CitiesStep from '@/components/clustering/CitiesStep';
import GoalStep from '@/components/clustering/GoalStep';
import MinusFiltersStep from '@/components/clustering/MinusFiltersStep';
import ProcessingStep from '@/components/clustering/ProcessingStep';
import ResultsStep from '@/components/clustering/ResultsStep';
import StepIndicator from '@/components/clustering/StepIndicator';
import WordstatDialog from '@/components/clustering/WordstatDialog';

import { useAuth } from '@/contexts/AuthContext';
import { getMinusWordsFromFilters } from '@/utils/minusFilters';


const API_URL = 'https://functions.poehali.dev/06df3397-13af-46f0-946a-f5d38aa6f60f';
const WORDSTAT_API_URL = 'https://functions.poehali.dev/b7ad3b4d-d79c-422c-824b-b5b1f139a8bb';
const WORDSTAT_STATUS_URL = 'https://functions.poehali.dev/09b493ba-d477-479a-9dd0-66152410b98b';
const SUBSCRIPTION_URL = 'https://functions.poehali.dev/72f69b8a-01bc-488f-a554-2105dafc6f9c';

// Версия для отладки кэширования
const APP_VERSION = '2025-01-03-v2';
console.log(`🚀 TestClustering loaded, version: ${APP_VERSION}`);

type Step = 'source' | 'wordstat-dialog' | 'cities' | 'goal' | 'minus-filters' | 'processing' | 'results';
type Source = 'manual' | 'website';
type Goal = 'context' | 'seo';

interface Phrase {
  phrase: string;
  count: number;
}

interface Cluster {
  name: string;
  intent: string;
  color: string;
  icon: string;
  phrases: Phrase[];
}

export default function TestClustering() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('source');
  const [source, setSource] = useState<Source>('manual');
  const [manualKeywords, setManualKeywords] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [objectAddress, setObjectAddress] = useState('');
  const [specificAddress, setSpecificAddress] = useState('');
  const [useGeoKeys, setUseGeoKeys] = useState(false);
  const [wordstatQuery, setWordstatQuery] = useState('');
  const [isWordstatLoading, setIsWordstatLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [goal, setGoal] = useState<Goal>('context');
  const [selectedMinusFilters, setSelectedMinusFilters] = useState<string[]>([]);

  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [minusWords, setMinusWords] = useState<Phrase[]>([]);
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const { user, sessionToken } = useAuth();

  // Защита от закрытия страницы во время обработки
  useEffect(() => {
    if (step === 'processing' || isWordstatLoading) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [step, isWordstatLoading]);

  // Сохранение состояния в localStorage
  useEffect(() => {
    if (!projectId) return;
    const stateKey = `clustering_state_${projectId}`;
    const stepToSave = step === 'processing' ? 'intents' : step;
    
    // ВАЖНО: если перешли в results, удаляем сохранённое состояние
    // т.к. данные теперь в БД (clusters, minusWords)
    if (step === 'results') {
      console.log('🗑️ Clearing localStorage state - using DB data');
      localStorage.removeItem(stateKey);
      return;
    }
    
    localStorage.setItem(stateKey, JSON.stringify({
      step: stepToSave,
      source,
      manualKeywords,
      websiteUrl,
      objectAddress,
      specificAddress,
      useGeoKeys,
      wordstatQuery,
      selectedCities,
      goal,
      selectedMinusFilters
    }));
  }, [projectId, step, source, manualKeywords, websiteUrl, objectAddress, specificAddress, useGeoKeys, wordstatQuery, selectedCities, goal, selectedMinusFilters]);

  // Восстановление состояния из localStorage (вызывается ПОСЛЕ загрузки проекта)
  const restoreStateFromStorage = useCallback(() => {
    if (!projectId) return;
    const stateKey = `clustering_state_${projectId}`;
    const savedState = localStorage.getItem(stateKey);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Восстанавливаем состояние (processing автоматически заменяется на intents при сохранении)
        if (parsed.step) {
          setStep(parsed.step);
          setSource(parsed.source || 'manual');
          setManualKeywords(parsed.manualKeywords || '');
          setWebsiteUrl(parsed.websiteUrl || '');
          setObjectAddress(parsed.objectAddress || '');
          setSpecificAddress(parsed.specificAddress || '');
          setUseGeoKeys(parsed.useGeoKeys || false);
          setWordstatQuery(parsed.wordstatQuery || '');
          setSelectedCities(parsed.selectedCities || []);
          setGoal(parsed.goal || 'context');
          setSelectedMinusFilters(parsed.selectedMinusFilters || []);
        }
      } catch (e) {
        console.error('Failed to restore state:', e);
      }
    }
  }, [projectId]);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      if (!sessionToken) {
        toast.error('Ошибка: пользователь не авторизован');
        navigate('/auth');
        return;
      }

      // Проверяем подписку
      if (user?.id) {
        try {
          const subResponse = await fetch(SUBSCRIPTION_URL, {
            headers: {
              'X-User-Id': user.id.toString()
            }
          });

          if (subResponse.ok) {
            const subData = await subResponse.json();
            setHasAccess(subData.hasAccess || false);
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }

      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}?endpoint=projects&id=${projectId}`, {
          headers: {
            'X-Session-Token': sessionToken
          }
        });

        if (response.status === 403) {
          toast.error('Доступ запрещён: это не ваш проект');
          navigate('/clustering');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }

        const project = await response.json();
        console.log('📦 Loaded project:', project);
        console.log('📦 Project results:', project.results);
        console.log('📦 Has clusters?', project.results?.clusters?.length);
        
        if (project) {
          setProjectName(project.name || '');
          
          // Если есть готовые результаты, показываем их (приоритет выше сохраненного состояния)
          if (project.results && project.results.clusters && project.results.clusters.length > 0) {
            console.log('✅ SHOWING RESULTS PAGE! Clusters:', project.results.clusters.length);
            console.log('🔍 First cluster from DB:', project.results.clusters[0]);
            console.log('🔍 First phrase from DB:', project.results.clusters[0]?.phrases?.[0]);
            
            // Конвертируем frequency → count для компонента ResultsStep
            const convertedClusters = project.results.clusters.map((cluster: any) => ({
              ...cluster,
              phrases: cluster.phrases.map((phrase: any) => ({
                phrase: phrase.phrase,
                count: phrase.frequency || phrase.count || 0
              }))
            }));
            
            setClusters(convertedClusters);
            setMinusWords(project.results.minusWords || []);
            
            if (project.results.regions && Array.isArray(project.results.regions)) {
              const loadedCities = project.results.regions.map((region: any) => ({
                id: typeof region === 'object' ? region.id : 1000,
                name: typeof region === 'object' ? region.name : region,
                region: '',
                population: 0
              }));
              setSelectedCities(loadedCities);
              console.log('📍 Loaded regions from DB:', project.results.regions);
            }
            
            setStep('results');
          } else {
            console.log('❌ No results - restoring saved state if any');
            restoreStateFromStorage();
          }
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Не удалось загрузить проект');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, navigate, restoreStateFromStorage]);

  const saveResultsToAPI = useCallback(async (clustersData: Cluster[], minusWordsData: Phrase[]) => {
    console.log('🔥 saveResultsToAPI CALLED', {
      projectId,
      clustersCount: clustersData.length,
      minusWordsCount: minusWordsData.length
    });
    
    if (!projectId) {
      console.error('❌ No projectId provided');
      return;
    }

    if (!sessionToken) {
      console.error('❌ No session token found');
      toast.error('Ошибка: пользователь не авторизован');
      return;
    }

    try {
      console.log('💾 Sending results to API...');
      
      const totalKeywords = clustersData.reduce((sum, cluster) => sum + cluster.phrases.length, 0);
      const totalClusters = clustersData.length;
      const totalMinusWords = minusWordsData.length;
      
      const response = await fetch(`${API_URL}?endpoint=projects`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          id: parseInt(projectId),
          keywordsCount: totalKeywords,
          clustersCount: totalClusters,
          minusWordsCount: totalMinusWords,
          results: {
            clusters: clustersData,
            minusWords: minusWordsData,
            regions: selectedCities.map(c => ({ id: c.id, name: c.name }))
          }
        })
      });

      if (response.status === 403) {
        toast.error('Доступ запрещён: это не ваш проект');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save results');
      }

      const result = await response.json();
      console.log('✅ Results saved successfully:', result);
      
      // ВАЖНО: синхронизируем состояние родителя с данными из ResultsStep
      setClusters(clustersData);
      setMinusWords(minusWordsData);
      console.log('🔄 Parent state synchronized with ResultsStep');
      
      toast.success('Результаты сохранены');
    } catch (error) {
      console.error('❌ Error saving results:', error);
      toast.error('Не удалось сохранить результаты');
    }
  }, [projectId, sessionToken, selectedCities]);

  const createGeoClusters = async (clusters: Cluster[], address: string, cities: City[]): Promise<Cluster[]> => {
    try {
      const allPhrases = clusters.flatMap(c => c.phrases.map(p => p.phrase));
      
      if (allPhrases.length === 0) {
        return [];
      }

      const response = await fetch('https://functions.poehali.dev/816f5c03-c259-4d9d-9a4b-44d96af0e858', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          geo_mode: true,
          phrases: allPhrases.slice(0, 200),
          address: address,
          regions: cities.map(c => c.name)
        })
      });

      if (!response.ok) {
        console.error('Geo-clustering API error:', await response.text());
        return [];
      }

      const data = await response.json();
      return data.geoClusters || [];
      
    } catch (error) {
      console.error('Error creating geo-clusters:', error);
      return [];
    }
  };

  const handleWordstatSubmit = async (query: string, cities: City[], mode: string, calledFromResults = false, autoMinusWords: string[] = []) => {
    console.log('🎬 handleWordstatSubmit STARTED', { calledFromResults, autoMinusWords: autoMinusWords.length });
    
    if (!hasAccess) {
      toast.error('Подписка закончилась', {
        description: 'Продлите подписку чтобы собирать ключи',
        action: {
          label: 'Подписка',
          onClick: () => navigate('/subscription')
        }
      });
      setIsWordstatLoading(false);
      return;
    }
    
    if (!sessionToken) {
      toast.error('Ошибка: пользователь не авторизован');
      setIsWordstatLoading(false);
      return;
    }
    
    if (!query || !query.trim()) {
      toast.error('Введите фразы для сбора');
      setIsWordstatLoading(false);
      return;
    }
    
    if (cities.length === 0) {
      toast.error('Выберите хотя бы один регион');
      setIsWordstatLoading(false);
      return;
    }
    
    setIsWordstatLoading(true);
    
    try {
      // ВСЕГДА передаём ID городов (реальные коды регионов Яндекс.Директа)
      const regionIds = cities.map(c => c.id);
      
      // Парсим введенные фразы (каждая с новой строки)
      const inputPhrases = query
        .split('\n')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      const requestBody = {
        keywords: inputPhrases,
        regions: regionIds,
        mode: 'context', // Всегда используем режим "все фразы"
        selected_intents: ['commercial', 'informational', 'navigational', 'transactional'] // Все интенты
      };
      
      console.log('🚀 Creating Wordstat task...', {
        keywordsCount: inputPhrases.length,
        keywords: inputPhrases,
        calledFromResults,
        cities: cities.map(c => ({ id: c.id, name: c.name })),
        requestBody
      });
      
      const response = await fetch(WORDSTAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id || ''
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to create Wordstat task');
      }

      const data = await response.json();
      console.log('✅ Wordstat response:', data);
      
      if (!data.success || !data.results || data.results.length === 0) {
        throw new Error('Нет результатов от Wordstat');
      }
      
      setLoadingProgress(100);
      
      // Собираем все фразы из всех результатов
      const allPhrases: Array<{phrase: string, count: number}> = [];
      
      data.results.forEach((result: any) => {
        if (result.data && result.data.topRequests) {
          result.data.topRequests.forEach((req: any) => {
            allPhrases.push({
              phrase: req.phrase,
              count: req.count
            });
          });
        }
      });
      
      console.log(`📊 Extracted ${allPhrases.length} phrases from Wordstat`);
      
      // Создаем кластеры
      const newClusters = [
        {
          name: 'Все ключи',
          phrases: inputPhrases.map(phrase => {
            const found = allPhrases.find(p => p.phrase === phrase);
            return {
              phrase,
              frequency: found?.count || 0,
              isMinusWord: false
            };
          }),
          totalCount: 0
        },
        {
          name: 'Сегмент',
          phrases: allPhrases.map(p => ({
            phrase: p.phrase,
            frequency: p.count,
            isMinusWord: false
          })),
          totalCount: allPhrases.reduce((sum, p) => sum + p.count, 0)
        }
      ];
          const newAllKeysCluster = newClusters.find(c => c.name === 'Все ключи');
          
          if (calledFromResults) {
            // Вызвано из результатов - добавляем новые фразы к существующим
            console.log('📦 Merging new phrases with existing clusters', {
              existingClustersCount: clusters.length,
              existingMinusWordsCount: minusWords.length,
              newClustersCount: newClusters.length
            });
            
            const updatedClusters = [...clusters];
            const existingSegmentCluster = updatedClusters.find(c => c.name === 'Сегмент');
            const existingAllKeysCluster = updatedClusters.find(c => c.name === 'Все ключи');
            
            const newSegmentCluster = newClusters.find(c => c.name === 'Сегмент');
            
            console.log('🔍 Found existing "Сегмент":', !!existingSegmentCluster, 
                       'with phrases:', existingSegmentCluster?.phrases.length);
            console.log('🔍 Found existing "Все ключи":', !!existingAllKeysCluster, 
                       'with phrases:', existingAllKeysCluster?.phrases.length);
            console.log('🔍 Found new "Сегмент":', !!newSegmentCluster,
                       'with phrases:', newSegmentCluster?.phrases.length);
            console.log('🔍 Found new "Все ключи":', !!newAllKeysCluster,
                       'with phrases:', newAllKeysCluster?.phrases.length);
            
            let addedToSegment = 0;
            let addedToAllKeys = 0;
            
            // 1. Добавляем новые ПОЛЬЗОВАТЕЛЬСКИЕ ключи в "Сегмент"
            if (existingSegmentCluster && newSegmentCluster) {
              const existingSegmentPhrases = new Set(existingSegmentCluster.phrases.map(p => p.phrase));
              const newSegmentPhrases = newSegmentCluster.phrases
                .filter(p => !existingSegmentPhrases.has(p.phrase))
                .map(p => ({
                  ...p,
                  isMinusWord: false,
                  minusTerm: undefined,
                  removedPhrases: undefined
                }));
              
              existingSegmentCluster.phrases.push(...newSegmentPhrases);
              addedToSegment = newSegmentPhrases.length;
              console.log(`✅ Added ${newSegmentPhrases.length} new phrases to "Сегмент"`, 
                         `Total now: ${existingSegmentCluster.phrases.length}`);
            }
            
            // 2. Добавляем новые фразы к существующему кластеру "Все ключи"
            if (existingAllKeysCluster && newAllKeysCluster) {
              const existingPhrases = new Set(existingAllKeysCluster.phrases.map(p => p.phrase));
              const newPhrases = newAllKeysCluster.phrases
                .filter(p => !existingPhrases.has(p.phrase))
                .map(p => ({
                  ...p,
                  // ВАЖНО: очищаем флаги минус-слов от сервера
                  isMinusWord: false,
                  minusTerm: undefined,
                  removedPhrases: undefined
                }));
              
              existingAllKeysCluster.phrases.push(...newPhrases);
              addedToAllKeys = newPhrases.length;
              console.log(`✅ Added ${newPhrases.length} new phrases to "Все ключи"`, 
                         `Total now: ${existingAllKeysCluster.phrases.length}`);
            } else if (!existingAllKeysCluster && newAllKeysCluster) {
              // Если кластера "Все ключи" не было, добавляем его
              // Очищаем флаги минус-слов у всех фраз
              const cleanedCluster = {
                ...newAllKeysCluster,
                phrases: newAllKeysCluster.phrases.map(p => ({
                  ...p,
                  isMinusWord: false,
                  minusTerm: undefined,
                  removedPhrases: undefined
                }))
              };
              updatedClusters.push(cleanedCluster);
              addedToAllKeys = newAllKeysCluster.phrases.length;
              console.log(`✅ Created new "Все ключи" cluster with ${addedToAllKeys} phrases`);
            }
            
            const totalAdded = addedToSegment + addedToAllKeys;
            
            // ВАЖНО: сохраняем старые минус-слова, не заменяем на новые!
            const existingMinusWords = minusWords;
            
            console.log('💾 Saving merged data:', {
              clustersCount: updatedClusters.length,
              minusWordsCount: existingMinusWords.length,
              addedToSegment,
              addedToAllKeys,
              totalAdded
            });
            
            setClusters(updatedClusters);
            // Минус-слова НЕ меняем
            
            await saveResultsToAPI(updatedClusters, existingMinusWords);
            
            if (addedToSegment > 0 && addedToAllKeys > 0) {
              toast.success(`Добавлено ${addedToSegment} фраз в "Сегмент" и ${addedToAllKeys} фраз в "Все ключи"!`);
            } else if (addedToSegment > 0) {
              toast.success(`Добавлено ${addedToSegment} новых фраз в "Сегмент"!`);
            } else if (addedToAllKeys > 0) {
              toast.success(`Добавлено ${addedToAllKeys} новых фраз в "Все ключи"!`);
            } else {
              toast.info('Все фразы уже есть в кластерах');
            }
            
            setStep('results'); // Возвращаемся к результатам
          } else {
            // Вызвано из начального шага - полная замена
            console.log('📦 Full replacement of clusters');
            
            let finalClusters = newClusters;
            
            // Если указан конкретный адрес - создаём геокластеры
            if (specificAddress && specificAddress.trim() !== '') {
              console.log('🗺️ Creating geo-clusters for address:', specificAddress);
              try {
                const geoClusters = await createGeoClusters(newClusters, specificAddress, selectedCities);
                if (geoClusters.length > 0) {
                  finalClusters = [...newClusters, ...geoClusters];
                  console.log('✅ Added geo-clusters:', geoClusters.length);
                }
              } catch (error) {
                console.error('❌ Failed to create geo-clusters:', error);
              }
            }
            
            // Добавляем автоматические минус-слова к результатам
            const autoMinusPhrases = autoMinusWords.map(word => ({ phrase: word, count: 0 }));
            const combinedMinusWords = [...autoMinusPhrases];
            
            console.log('🚫 Combined minus-words:', {
              autoAdded: autoMinusPhrases.length,
              total: combinedMinusWords.length
            });
            
            // Применяем минус-слова к фразам в кластерах
            const minusWordsSet = new Set(autoMinusWords.map(w => w.toLowerCase()));
            const clustersWithMinusMarks = finalClusters.map(cluster => ({
              ...cluster,
              phrases: cluster.phrases.map(phrase => {
                const phraseLower = phrase.phrase.toLowerCase();
                const matchedMinusWord = Array.from(minusWordsSet).find(minusWord => 
                  phraseLower.includes(minusWord)
                );
                
                if (matchedMinusWord) {
                  return {
                    ...phrase,
                    isMinusWord: true,
                    minusTerm: matchedMinusWord
                  };
                }
                return phrase;
              })
            }));
            
            console.log('✅ Applied minus-words to phrases in clusters');
            
            setClusters(clustersWithMinusMarks);
            setMinusWords(combinedMinusWords);
            
            await saveResultsToAPI(clustersWithMinusMarks, combinedMinusWords);
            
            toast.success('Кластеризация завершена!');
            setStep('results');
          }
      
    } catch (error: any) {
      console.error('❌ Error in handleWordstatSubmit:', error);
      toast.error(`Ошибка: ${error?.message || 'неизвестная ошибка'}`);
      // Не меняем step при ошибке, остаёмся там где были
    } finally {
      setIsWordstatLoading(false);
    }
  };

  const handleNextFromSource = async () => {
    if (!hasAccess) {
      toast.error('Подписка закончилась', {
        description: 'Продлите подписку чтобы добавлять ключи',
        action: {
          label: 'Подписка',
          onClick: () => navigate('/subscription')
        }
      });
      return;
    }

    if (!manualKeywords.trim()) {
      toast.error('Введите ключевые слова или соберите из Wordstat');
      return;
    }

    const keywords = manualKeywords
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywords.length === 0) {
      toast.error('Введите хотя бы одно ключевое слово');
      return;
    }

    setStep('cities');
  };

  const handleBack = () => {
    if (step === 'cities') setStep('source');
    else if (step === 'goal') setStep('cities');
    else if (step === 'minus-filters') setStep('goal');
    else if (step === 'cluster-names') setStep('processing');
    else if (step === 'results') setStep('cluster-names');
  };

  const exportClusters = () => {
    const text = clusters.map(c =>
      `${c.name}\n${c.phrases.map(p => `${p.phrase} - ${p.count}`).join('\n')}`
    ).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `кластеры_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const exportMinusWords = () => {
    const text = minusWords.map(p => `${p.phrase} - ${p.count}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `минус-слова_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Загрузка проекта...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      {step === 'results' ? (
        <div className="relative">
          <ResultsStep
            clusters={clusters}
            minusWords={minusWords}
            onExport={exportClusters}
            onNewProject={() => navigate('/')}
            projectId={projectId ? parseInt(projectId) : undefined}
            onSaveChanges={saveResultsToAPI}
            regions={selectedCities.map(c => c.name)}
            onWordstatClick={() => setStep('wordstat-dialog')}
            specificAddress={specificAddress}
          />
          {isWordstatLoading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Сбор фраз из Wordstat</h3>
                <p className="text-slate-600 mb-4">Это может занять несколько минут...</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-500 mt-2">{Math.round(loadingProgress)}%</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-semibold text-slate-800 mb-2 tracking-tight">
                Сбор ключей
              </h1>
              <p className="text-lg text-slate-500">
                {projectName || 'Быстрый сбор и кластеризация ключей'}
              </p>
            </div>

            <StepIndicator currentStep={step} />

          {step === 'source' && (
            <SourceStep
              source={source}
              setSource={setSource}
              manualKeywords={manualKeywords}
              setManualKeywords={setManualKeywords}
              websiteUrl={websiteUrl}
              setWebsiteUrl={setWebsiteUrl}
              objectAddress={objectAddress}
              setObjectAddress={setObjectAddress}
              onNext={handleNextFromSource}
              onWordstatClick={() => setStep('wordstat-dialog')}
              isLoading={false}
            />
          )}

          {step === 'cities' && (
            <CitiesStep
              selectedCities={selectedCities}
              citySearch={citySearch}
              setCitySearch={setCitySearch}
              addCity={(city) => {
                setSelectedCities([...selectedCities, city]);
                setCitySearch('');
              }}
              removeCity={(cityId) => {
                setSelectedCities(selectedCities.filter(c => c.id !== cityId));
              }}
              onNext={() => {
                console.log('🔵 Cities step: onNext clicked');
                setStep('goal');
                console.log('🔵 Cities step: setStep(goal) called');
              }}
              onBack={handleBack}
              hasManualKeywords={manualKeywords.trim().length > 0}
              manualKeyword={manualKeywords.split('\n')[0]?.trim() || ''}
              specificAddress={specificAddress}
              setSpecificAddress={setSpecificAddress}
            />
          )}

          {step === 'goal' && (
            <GoalStep
              goal={goal}
              setGoal={setGoal}
              onNext={() => setStep('minus-filters')}
              onBack={handleBack}
            />
          )}

          {step === 'minus-filters' && (
            <MinusFiltersStep
              selectedFilters={selectedMinusFilters}
              toggleFilter={(filterId: string) => {
                setSelectedMinusFilters(prev => 
                  prev.includes(filterId) 
                    ? prev.filter(id => id !== filterId)
                    : [...prev, filterId]
                );
              }}
              onNext={async () => {
                const allKeywords = manualKeywords.trim();
                if (allKeywords && selectedCities.length > 0) {
                  setLoadingProgress(0);
                  setIsWordstatLoading(true);
                  setStep('processing');
                  
                  // Реальный таймер: основной запрос (10 сек) + геоключи (15 запросов × 10 сек) = ~160 сек
                  const totalTime = 160000; // 160 секунд
                  const startTime = Date.now();
                  
                  const progressInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min((elapsed / totalTime) * 100, 95);
                    setLoadingProgress(progress);
                  }, 1000);
                  
                  try {
                    // Получаем минус-слова из выбранных фильтров
                    const autoMinusWords = getMinusWordsFromFilters(selectedMinusFilters, selectedCities);
                    console.log('🚫 Auto minus-words:', autoMinusWords);
                    
                    await handleWordstatSubmit(allKeywords, selectedCities, goal, false, autoMinusWords);
                  } finally {
                    clearInterval(progressInterval);
                  }
                }
              }}
              onBack={handleBack}
            />
          )}

          {(step === 'processing' || isWordstatLoading) && (
            <ProcessingStep
              progress={loadingProgress}
              currentStage={Math.floor(loadingProgress / 20)}
            />
          )}

          <WordstatDialog
            open={step === 'wordstat-dialog'}
            onOpenChange={(open) => setStep(open ? 'wordstat-dialog' : 'results')}
            onSubmit={(query, cities, mode) => {
              // ВАЖНО: определяем вызван ли из результатов по наличию данных в БД
              const calledFromResults = clusters.length > 0;
              console.log('🎯 WordstatDialog submit:', { clustersLength: clusters.length, calledFromResults });
              handleWordstatSubmit(query, cities, mode, calledFromResults);
            }}
            isLoading={isWordstatLoading}
            selectedCities={selectedCities}
            setSelectedCities={setSelectedCities}
          />
          </div>
        </div>
      )}
    </>
  );
}