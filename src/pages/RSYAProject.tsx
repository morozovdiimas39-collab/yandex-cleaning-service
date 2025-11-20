// RSYA Project Page - Fixed protectConversions issue
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';
import BlockedCampaignGroup from '@/components/rsya/BlockedCampaignGroup';
import ActiveCampaignGroup from '@/components/rsya/ActiveCampaignGroup';
import { Textarea } from '@/components/ui/textarea';
import { BACKEND_URLS } from '@/config/backend-urls';

interface Task {
  id: number;
  description: string;
  is_enabled: boolean;
  created_at: string;
  config?: {
    keywords?: string[];
    exceptions?: string[];
    goal_id?: string;
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
    schedule_interval?: number;
  };
}

interface Placement {
  id: string;
  domain: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  status: 'active' | 'blocked';
  campaign_id: string;
  campaign_name?: string;
}

interface Goal {
  id: string;
  name: string;
  counter_id: string;
}

interface Project {
  id: number;
  name: string;
  yandex_token?: string;
  campaign_ids?: string[];
  counter_ids?: string[];
  cached_platforms?: any[];
  goals?: Goal[];
}

const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'] || '';
const AUTOMATION_URL = BACKEND_URLS['rsya-automation'] || '';

// Version: 2.0.1 - Removed protectConversions completely
export default function RSYAProject() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string>('');
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [taskTab, setTaskTab] = useState<'create' | 'list'>('create');
  
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [taskKeywords, setTaskKeywords] = useState('');
  const [taskExceptions, setTaskExceptions] = useState('');
  const [taskGoalId, setTaskGoalId] = useState('all');
  const [taskMinImpressions, setTaskMinImpressions] = useState('');
  const [taskMaxImpressions, setTaskMaxImpressions] = useState('');
  const [taskMinClicks, setTaskMinClicks] = useState('');
  const [taskMaxClicks, setTaskMaxClicks] = useState('');
  const [taskMinCpc, setTaskMinCpc] = useState('');
  const [taskMaxCpc, setTaskMaxCpc] = useState('');
  const [taskMinCtr, setTaskMinCtr] = useState('');
  const [taskMaxCtr, setTaskMaxCtr] = useState('');
  const [taskMinConversions, setTaskMinConversions] = useState('');
  const [taskMinCpa, setTaskMinCpa] = useState('');
  const [taskMaxCpa, setTaskMaxCpa] = useState('');
  const [taskScheduleInterval, setTaskScheduleInterval] = useState('2');
  const [showKeywordsInput, setShowKeywordsInput] = useState(false);
  const [showExceptionsInput, setShowExceptionsInput] = useState(false);
  const [showMetricsFilters, setShowMetricsFilters] = useState(false);
  const [selectedKeywordPresets, setSelectedKeywordPresets] = useState<Set<string>>(new Set());
  const [selectedExceptionPresets, setSelectedExceptionPresets] = useState<Set<string>>(new Set());
  const [protectConversions, setProtectConversions] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlacements, setSelectedPlacements] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'active' | 'blocked'>('active');
  const [taskTimers, setTaskTimers] = useState<Map<number, NodeJS.Timeout>>(new Map());
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('all');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  
  const [minCpc, setMinCpc] = useState('');
  const [maxCpc, setMaxCpc] = useState('');
  const [minCtr, setMinCtr] = useState('');
  const [maxCtr, setMaxCtr] = useState('');
  const [minCpa, setMinCpa] = useState('');
  const [maxCpa, setMaxCpa] = useState('');
  const [minImpressions, setMinImpressions] = useState('');
  const [maxImpressions, setMaxImpressions] = useState('');
  const [minClicks, setMinClicks] = useState('');
  const [maxClicks, setMaxClicks] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [runningTasks, setRunningTasks] = useState<Set<number>>(new Set());

  const KEYWORD_PRESETS = [
    { value: 'com.', label: 'com.' },
    { value: 'dsp.', label: 'dsp.' },
    { value: 'vpn', label: 'vpn' },
    { value: 'free', label: 'free' },
    { value: 'proxy', label: 'proxy' },
    { value: 'download', label: 'download' }
  ];

  const EXCEPTION_PRESETS = [
    { value: 'com.avito.android', label: 'Авито' },
    { value: 'com.vkontakte.android', label: 'ВКонтакте' },
    { value: 'com.opera.browser', label: 'Opera' },
    { value: 'ru.yandex.zen', label: 'Дзен' },
    { value: 'free.vpn.proxy.secure', label: 'VPN Secure' }
  ];

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const uid = userStr ? JSON.parse(userStr).id.toString() : '1';
    setUserId(uid);
    
    if (projectId) {
      loadProject(uid);
    }
  }, [projectId]);

  useEffect(() => {
    if (project?.campaign_ids && project?.yandex_token && dateFrom && dateTo) {
      syncData(false);
    }
  }, [selectedGoalId]);

  const toggleKeywordPreset = (preset: string) => {
    const newPresets = new Set(selectedKeywordPresets);
    if (newPresets.has(preset)) {
      newPresets.delete(preset);
      const currentKeywords = taskKeywords.split('\n').filter(k => k.trim() && k.trim() !== preset);
      setTaskKeywords(currentKeywords.join('\n'));
    } else {
      newPresets.add(preset);
      const currentKeywords = taskKeywords.split('\n').filter(k => k.trim());
      const presetKeywords = Array.from(newPresets);
      const combined = [...new Set([...currentKeywords, ...presetKeywords])];
      setTaskKeywords(combined.join('\n'));
    }
    setSelectedKeywordPresets(newPresets);
  };

  const toggleExceptionPreset = (preset: string) => {
    const newPresets = new Set(selectedExceptionPresets);
    if (newPresets.has(preset)) {
      newPresets.delete(preset);
      const currentExceptions = taskExceptions.split('\n').filter(e => e.trim() && e.trim() !== preset);
      setTaskExceptions(currentExceptions.join('\n'));
    } else {
      newPresets.add(preset);
      const currentExceptions = taskExceptions.split('\n').filter(e => e.trim());
      const presetExceptions = Array.from(newPresets);
      const combined = [...new Set([...currentExceptions, ...presetExceptions])];
      setTaskExceptions(combined.join('\n'));
    }
    setSelectedExceptionPresets(newPresets);
  };

  const loadProject = async (uid: string) => {
    try {
      setLoading(true);
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
      
      if (!data.project.yandex_token) {
        navigate(`/rsya/${projectId}/auth`);
        return;
      }
      
      setTasks(data.project.tasks || []);
      
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const fromDate = monthAgo.toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];
      setDateFrom(fromDate);
      setDateTo(toDate);
      
      if (data.project.counter_ids && data.project.counter_ids.length > 0 && data.project.yandex_token) {
        loadGoals(uid, data.project.counter_ids, data.project.yandex_token);
      }
      
      // Загружаем площадки
      if (data.project.campaign_ids && data.project.campaign_ids.length > 0) {
        syncData(false);
      }
    } catch (error) {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  


  const loadGoals = async (uid: string, counterIds: string[], yandexToken: string) => {
    try {
      setLoadingGoals(true);
      console.log('🎯 Загрузка целей:', { counterIds, hasToken: !!yandexToken });
      
      const GOALS_URL = func2url['yandex-metrika-goals'] || '';
      
      const response = await fetch(GOALS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': uid,
          'X-Auth-Token': yandexToken
        },
        body: JSON.stringify({
          counter_ids: counterIds
        })
      });
      
      console.log('📊 Ответ API целей:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Цели загружены:', data.goals?.length || 0);
        setGoals(data.goals || []);
      } else {
        console.error('❌ Ошибка загрузки целей:', response.status);
      }
    } catch (error) {
      console.error('💥 Ошибка запроса целей:', error);
    } finally {
      setLoadingGoals(false);
    }
  };

  const syncData = async (forceRefresh = false) => {
    if (!project?.yandex_token || !project?.campaign_ids || project.campaign_ids.length === 0) {
      return;
    }

    try {
      setSyncing(true);
      
      const STATS_URL = func2url['yandex-platform-stats'] || '';
      const BLOCKED_URL = func2url['yandex-blocked-platforms'] || '';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 420000);
      
      const [statsResponse, blockedResponse] = await Promise.all([
        fetch(STATS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
            'X-Auth-Token': project.yandex_token
          },
          body: JSON.stringify({
            project_id: projectId,
            campaign_ids: project.campaign_ids,
            date_from: dateFrom,
            date_to: dateTo,
            goal_id: selectedGoalId === 'all' ? '' : selectedGoalId,
            force_refresh: forceRefresh
          }),
          signal: controller.signal
        }),
        fetch(BLOCKED_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': project.yandex_token
          },
          body: JSON.stringify({ campaign_ids: project.campaign_ids }),
          signal: controller.signal
        })
      ]);
      
      clearTimeout(timeoutId);
      
      if (!statsResponse.ok) throw new Error('Ошибка загрузки статистики');
      
      const statsData = await statsResponse.json();
      let platforms = statsData.platforms || [];
      
      if ((statsData.success && !platforms.length) || (statsData.from_cache && statsData.platforms_count > 0)) {
        const dbResponse = await fetch(`${RSYA_PROJECTS_URL}?action=load_platforms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId
          },
          body: JSON.stringify({
            project_id: projectId,
            campaign_ids: project.campaign_ids,
            date_from: dateFrom,
            date_to: dateTo,
            goal_id: selectedGoalId === 'all' ? '' : selectedGoalId
          })
        });
        
        if (dbResponse.ok) {
          const dbData = await dbResponse.json();
          platforms = dbData.platforms || [];
        }
      }
      
      const blockedDomains = new Set<string>();
      let blockedPlacements: Placement[] = [];
      
      if (blockedResponse.ok) {
        const blockedData = await blockedResponse.json();
        const platformsByCampaign = blockedData.platforms_by_campaign || [];
        
        blockedPlacements = platformsByCampaign.flatMap((item: any) => 
          item.platforms.map((domain: string) => {
            blockedDomains.add(domain);
            return {
              id: `${item.campaign_id}_${domain}`,
              domain,
              impressions: 0,
              clicks: 0,
              cost: 0,
              conversions: 0,
              ctr: 0,
              cpc: 0,
              cpa: 0,
              status: 'blocked' as const,
              campaign_id: item.campaign_id,
              campaign_name: item.campaign_name
            };
          })
        );
      }
      
      const activePlacements: Placement[] = platforms
        .filter((p: any) => !blockedDomains.has(p.url || p.domain))
        .map((p: any) => ({
          id: `${p.campaign_id}_${p.url || p.domain}`,
          domain: p.url || p.domain,
          impressions: p.impressions || 0,
          clicks: p.clicks || 0,
          cost: p.cost || 0,
          conversions: p.conversions || 0,
          ctr: p.ctr || 0,
          cpc: p.cpc || 0,
          cpa: p.cpa || 0,
          status: 'active' as const,
          campaign_id: p.campaign_id,
          campaign_name: p.campaign_name
        }));
      
      setPlacements([...activePlacements, ...blockedPlacements]);
      
      toast({ 
        title: 'Обновлено', 
        description: `${activePlacements.length} активных, ${blockedPlacements.length} запрещенных`,
        duration: 5000
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({ 
          title: 'Превышено время ожидания', 
          description: 'Запрос занял слишком много времени',
          variant: 'destructive'
        });
      } else {
        toast({ 
          title: 'Ошибка синхронизации', 
          description: error.message,
          variant: 'destructive' 
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  const addTask = async () => {
    if (!newTaskDescription.trim() || !taskKeywords.trim()) {
      toast({ 
        title: 'Ошибка', 
        description: 'Заполните описание и ключевые слова',
        variant: 'destructive' 
      });
      return;
    }
    
    try {
      const keywords = taskKeywords
        .split(/[\n,]+/)
        .map(k => k.trim())
        .filter(k => k);
      
      const exceptions = taskExceptions
        .split(/[\n,]+/)
        .map(k => k.trim())
        .filter(k => k);
      
      console.log('📝 Создание задачи:', {
        description: newTaskDescription,
        keywords,
        exceptions,
        placementsAvailable: placements.length
      });
      
      const config: any = { 
        keywords, 
        exceptions,
        goal_id: taskGoalId !== 'all' ? taskGoalId : undefined,
        min_impressions: taskMinImpressions ? parseInt(taskMinImpressions) : undefined,
        max_impressions: taskMaxImpressions ? parseInt(taskMaxImpressions) : undefined,
        min_clicks: taskMinClicks ? parseInt(taskMinClicks) : undefined,
        max_clicks: taskMaxClicks ? parseInt(taskMaxClicks) : undefined,
        min_cpc: taskMinCpc ? parseFloat(taskMinCpc) : undefined,
        max_cpc: taskMaxCpc ? parseFloat(taskMaxCpc) : undefined,
        min_ctr: taskMinCtr ? parseFloat(taskMinCtr) : undefined,
        max_ctr: taskMaxCtr ? parseFloat(taskMaxCtr) : undefined,
        min_conversions: taskMinConversions ? parseInt(taskMinConversions) : undefined,
        min_cpa: taskMinCpa ? parseFloat(taskMinCpa) : undefined,
        max_cpa: taskMaxCpa ? parseFloat(taskMaxCpa) : undefined,
        schedule_interval: taskScheduleInterval ? parseInt(taskScheduleInterval) : undefined,
        protect_conversions: protectConversions
      };

      const response = await fetch(RSYA_PROJECTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          action: 'add_task',
          project_id: projectId,
          description: newTaskDescription,
          config: JSON.stringify(config)
        })
      });
      
      if (!response.ok) throw new Error('Ошибка создания');
      
      const data = await response.json();
      if (data.tasks && data.tasks.length > 0) {
        setTasks(data.tasks);
        
        const newTask = data.tasks[data.tasks.length - 1];
        
        setTimeout(() => {
          executeTask(newTask);
          scheduleTask(newTask);
        }, 500);
        
        setTaskTab('list');
      }
      
      setNewTaskDescription('');
      setTaskKeywords('');
      setTaskExceptions('');
      setTaskGoalId('all');
      setSelectedKeywordPresets(new Set());
      setSelectedExceptionPresets(new Set());
      setProtectConversions(false);
      setShowKeywordsInput(false);
      setShowExceptionsInput(false);
      setShowMetricsFilters(false);
      setTaskMinImpressions('');
      setTaskMaxImpressions('');
      setTaskMinClicks('');
      setTaskMaxClicks('');
      setTaskMinCpc('');
      setTaskMaxCpc('');
      setTaskMinCtr('');
      setTaskMaxCtr('');
      setTaskMinConversions('');
      setTaskMinCpa('');
      setTaskMaxCpa('');
      setTaskScheduleInterval('2');
      
      toast({ title: 'Задача создана и запущена' });
    } catch (error) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      const response = await fetch(RSYA_PROJECTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          action: 'delete_task',
          project_id: projectId,
          task_id: taskId
        })
      });
      
      if (!response.ok) throw new Error('Ошибка удаления');
      
      const data = await response.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
      
      const timer = taskTimers.get(taskId);
      if (timer) {
        clearInterval(timer);
        setTaskTimers(prev => {
          const newMap = new Map(prev);
          newMap.delete(taskId);
          return newMap;
        });
      }
      
      if (selectedTask?.id === taskId) setSelectedTask(null);
      toast({ title: 'Задача удалена' });
    } catch (error) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const toggleTask = async (taskId: number, enabled: boolean) => {
    try {
      await fetch(RSYA_PROJECTS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          action: 'toggle_task',
          task_id: taskId,
          is_enabled: enabled
        })
      });
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_enabled: enabled } : t));
    } catch (error) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const blockSelected = async () => {
    const ids = Array.from(selectedPlacements);
    if (ids.length === 0) return;
    
    const placementsToBlock = placements.filter(p => ids.includes(p.id));
    
    if (placementsToBlock.length === 0) {
      toast({ 
        title: 'Нет площадок для блокировки', 
        description: 'Не выбраны площадки'
      });
      return;
    }
    
    await blockPlacementsInYandex(placementsToBlock);
    setSelectedPlacements(new Set());
  };

  const unblockSelected = async () => {
    const ids = Array.from(selectedPlacements);
    if (ids.length === 0) return;
    
    setPlacements(prev => prev.filter(p => !ids.includes(p.id)));
    setSelectedPlacements(new Set());
    toast({ title: 'Удалено', description: `${ids.length} площадок из запрещенных` });
  };

  const unblockSingle = async (placementId: string) => {
    setPlacements(prev => prev.filter(p => p.id !== placementId));
    toast({ title: 'Удалено', description: '1 площадка из запрещенных' });
  };

  const YANDEX_PROTECTED_DOMAINS = [
    'yandex.ru', 'ya.ru', 'yandex.kz', 'yandex.ua', 'yandex.by', 'yandex.com',
    'mail.ru', 'rambler.ru', 'lenta.ru', 'gazeta.ru', 'rbc.ru',
    'turbo.site', 'turbopages.org', 'yandex.net'
  ];

  const canBlockDomain = (domain: string): boolean => {
    const lowerDomain = domain.toLowerCase();
    return !YANDEX_PROTECTED_DOMAINS.some(protectedDomain => lowerDomain.includes(protectedDomain));
  };

  const executeTask = (task: Task) => {
    if (!task.config) {
      console.log('❌ executeTask: нет конфигурации задачи');
      return;
    }

    console.log('🚀 executeTask запущена:', {
      task: task.description,
      totalPlacements: placements.length,
      activePlacements: placements.filter(p => p.status === 'active').length,
      blockedPlacements: placements.filter(p => p.status === 'blocked').length
    });

    const activePlacements = placements.filter(p => p.status === 'active');
    if (activePlacements.length === 0) {
      console.log('⚠️ executeTask: нет активных площадок для проверки');
      toast({ 
        title: `Задача: ${task.description}`, 
        description: 'Нет активных площадок для проверки',
        variant: 'destructive'
      });
      return;
    }

    const blockedDomains = new Set(placements.filter(p => p.status === 'blocked').map(p => p.domain));
    
    const matchedPlacements: Placement[] = [];

    activePlacements.forEach(placement => {
      if (blockedDomains.has(placement.domain)) return;
      if (!canBlockDomain(placement.domain)) return;

      let matches = true;

      if (task.config?.keywords && task.config.keywords.length > 0) {
        const hasKeyword = task.config.keywords.some(kw => 
          placement.domain.toLowerCase().includes(kw.toLowerCase())
        );
        if (!hasKeyword) matches = false;
      }

      if (matches && task.config?.exceptions && task.config.exceptions.length > 0) {
        const hasException = task.config.exceptions.some(exc => 
          placement.domain.toLowerCase().includes(exc.toLowerCase())
        );
        if (hasException) matches = false;
      }

      if (matches && task.config?.min_impressions && placement.impressions < task.config.min_impressions) matches = false;
      if (matches && task.config?.max_impressions && placement.impressions > task.config.max_impressions) matches = false;
      if (matches && task.config?.min_clicks && placement.clicks < task.config.min_clicks) matches = false;
      if (matches && task.config?.max_clicks && placement.clicks > task.config.max_clicks) matches = false;
      if (matches && task.config?.min_cpc && placement.cpc < task.config.min_cpc) matches = false;
      if (matches && task.config?.max_cpc && placement.cpc > task.config.max_cpc) matches = false;
      if (matches && task.config?.min_ctr && placement.ctr < task.config.min_ctr) matches = false;
      if (matches && task.config?.max_ctr && placement.ctr > task.config.max_ctr) matches = false;
      if (matches && task.config?.min_conversions && placement.conversions < task.config.min_conversions) matches = false;
      if (matches && task.config?.min_cpa && placement.cpa < task.config.min_cpa) matches = false;
      if (matches && task.config?.max_cpa && placement.cpa > task.config.max_cpa) matches = false;
      
      if (matches && task.config?.protect_conversions && placement.conversions > 0) matches = false;

      if (matches) {
        matchedPlacements.push(placement);
      }
    });

    console.log('🎯 executeTask результаты:', {
      matched: matchedPlacements.length,
      domains: matchedPlacements.slice(0, 5).map(p => p.domain)
    });

    if (matchedPlacements.length > 0) {
      blockPlacementsInYandex(matchedPlacements, task.description);
    } else {
      console.log('ℹ️ executeTask: ни одна площадка не подошла под фильтры');
      toast({ 
        title: `Задача: ${task.description}`, 
        description: 'Ни одна площадка не подошла под фильтры'
      });
    }
  };

  const blockPlacementsInYandex = async (placementsToBlock: Placement[], taskDescription?: string) => {
    if (!project?.yandex_token) {
      toast({ 
        title: 'Ошибка', 
        description: 'Нет токена Яндекс Директа',
        variant: 'destructive'
      });
      return;
    }

    const campaignIds = project.campaign_ids || [];
    if (campaignIds.length === 0) {
      toast({ 
        title: 'Ошибка', 
        description: 'Не выбраны кампании',
        variant: 'destructive'
      });
      return;
    }

    const domains = [...new Set(placementsToBlock.map(p => p.domain))];
    
    console.log('📤 Блокировка площадок в Яндекс:', {
      campaigns: campaignIds.length,
      domains: domains.length
    });

    const BLOCK_URL = func2url['yandex-block-platforms'] || '';
    
    try {
      const response = await fetch(BLOCK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': project.yandex_token
        },
        body: JSON.stringify({
          campaign_ids: campaignIds,
          domains: domains
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Ошибка блокировки:', errorData);
        toast({ 
          title: 'Ошибка блокировки', 
          description: errorData.error || 'Не удалось заблокировать площадки',
          variant: 'destructive'
        });
        return;
      }

      const data = await response.json();
      console.log('✅ Результат блокировки:', data);

      const idsToBlock = placementsToBlock.map(p => p.id);
      setPlacements(prev => prev.map(p => 
        idsToBlock.includes(p.id) ? { ...p, status: 'blocked' } : p
      ));

      const title = taskDescription ? `Задача: ${taskDescription}` : 'Блокировка площадок';
      toast({ 
        title, 
        description: `Заблокировано ${domains.length} площадок в ${data.success} кампаниях` 
      });

      if (data.failed > 0) {
        console.warn('⚠️ Ошибки блокировки:', data.errors);
      }
    } catch (error) {
      console.error('❌ Ошибка запроса:', error);
      toast({ 
        title: 'Ошибка', 
        description: 'Не удалось отправить запрос на блокировку',
        variant: 'destructive'
      });
    }
  };



  const runTaskNow = async (taskId: number) => {
    if (!AUTOMATION_URL) {
      toast({ title: 'Ошибка', description: 'URL автоматизации не настроен', variant: 'destructive' });
      return;
    }

    setRunningTasks(prev => new Set(prev).add(taskId));
    
    try {
      const response = await fetch(AUTOMATION_URL, {
        method: 'GET'
      });
      
      if (!response.ok) throw new Error('Ошибка запуска');
      
      const data = await response.json();
      const taskResult = data.results?.find((r: any) => r.task_id === taskId);
      
      if (taskResult) {
        if (taskResult.status === 'success') {
          toast({ 
            title: 'Задача выполнена', 
            description: `Проверено ${taskResult.total_placements}, заблокировано ${taskResult.blocked}`
          });
        } else {
          toast({ 
            title: 'Задача завершена', 
            description: taskResult.message || 'Нет результатов'
          });
        }
      }

    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось запустить задачу', variant: 'destructive' });
    } finally {
      setRunningTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const checkKeywordMatch = (domain: string, keywords: string[], exceptions?: string[]): boolean => {
    const lowerDomain = domain.toLowerCase();
    
    // Проверяем исключения (самое сильное правило)
    if (exceptions && exceptions.length > 0) {
      const hasException = exceptions.some(exc => lowerDomain.includes(exc.toLowerCase()));
      if (hasException) return false; // Если в исключениях - не блокируем
    }
    
    return keywords.some(keyword => lowerDomain.includes(keyword.toLowerCase()));
  };

  const getFilteredPlacements = () => {
    let filtered = placements.filter(p => 
      p.status === viewMode && 
      p.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered = filtered.filter(p => {
      if (minCpc && p.cpc < parseFloat(minCpc)) return false;
      if (maxCpc && p.cpc > parseFloat(maxCpc)) return false;
      if (minCtr && p.ctr < parseFloat(minCtr)) return false;
      if (maxCtr && p.ctr > parseFloat(maxCtr)) return false;
      if (minCpa && p.cpa < parseFloat(minCpa)) return false;
      if (maxCpa && p.cpa > parseFloat(maxCpa)) return false;
      if (minImpressions && p.impressions < parseInt(minImpressions)) return false;
      if (maxImpressions && p.impressions > parseInt(maxImpressions)) return false;
      if (minClicks && p.clicks < parseInt(minClicks)) return false;
      if (maxClicks && p.clicks > parseInt(maxClicks)) return false;
      return true;
    });

    return filtered.sort((a, b) => b.clicks - a.clicks);
  };

  const checkPlacementMatchesFilters = (p: Placement): boolean => {
    if (taskMinImpressions && p.impressions < parseInt(taskMinImpressions)) return false;
    if (taskMaxImpressions && p.impressions > parseInt(taskMaxImpressions)) return false;
    if (taskMinClicks && p.clicks < parseInt(taskMinClicks)) return false;
    if (taskMaxClicks && p.clicks > parseInt(taskMaxClicks)) return false;
    if (taskMinCpc && p.cpc < parseFloat(taskMinCpc)) return false;
    if (taskMaxCpc && p.cpc > parseFloat(taskMaxCpc)) return false;
    if (taskMinCtr && p.ctr < parseFloat(taskMinCtr)) return false;
    if (taskMaxCtr && p.ctr > parseFloat(taskMaxCtr)) return false;
    if (taskMinConversions && p.conversions < parseInt(taskMinConversions)) return false;
    if (taskMinCpa && p.cpa < parseFloat(taskMinCpa)) return false;
    if (taskMaxCpa && p.cpa > parseFloat(taskMaxCpa)) return false;
    return true;
  };

  const getPlacementsMarkedForBlock = (): Set<string> => {
    const marked = new Set<string>();
    
    // Добавляем площадки из активных задач
    tasks.filter(t => t.is_enabled && t.config?.keywords).forEach(task => {
      placements.forEach(p => {
        if (p.status === 'active' && checkKeywordMatch(p.domain, task.config!.keywords!, task.config?.exceptions)) {
          marked.add(p.id);
        }
      });
    });
    
    // Добавляем площадки из поля ввода новой задачи (живая подсветка)
    const hasFilters = taskMinImpressions || taskMaxImpressions || taskMinClicks || taskMaxClicks || 
                       taskMinCpc || taskMaxCpc || taskMinCtr || taskMaxCtr || 
                       taskMinConversions || taskMinCpa || taskMaxCpa;
    
    const inputKeywords = taskKeywords
      .split(/[\n,]+/)
      .map(k => k.trim())
      .filter(k => k);
    
    const inputExceptions = taskExceptions
      .split(/[\n,]+/)
      .map(k => k.trim())
      .filter(k => k);
    
    if (inputKeywords.length > 0 || hasFilters) {
      placements.forEach(p => {
        if (p.status !== 'active') return;
        
        let shouldMark = true;
        
        // Проверяем ключевые слова если они есть
        if (inputKeywords.length > 0) {
          shouldMark = checkKeywordMatch(p.domain, inputKeywords, inputExceptions.length > 0 ? inputExceptions : undefined);
        }
        
        // Проверяем фильтры если площадка прошла проверку ключевых слов (или их нет)
        if (shouldMark && hasFilters) {
          shouldMark = checkPlacementMatchesFilters(p);
        }
        
        if (shouldMark) {
          marked.add(p.id);
        }
      });
    }
    
    return marked;
  };

  const filteredPlacements = getFilteredPlacements();
  const activePlacements = placements.filter(p => p.status === 'active');
  const blockedPlacements = placements.filter(p => p.status === 'blocked');

  const groupedBlockedPlacements = useMemo(() => {
    if (viewMode !== 'blocked') return [];
    
    const grouped = filteredPlacements.reduce((acc, placement) => {
      const key = placement.campaign_id;
      if (!acc[key]) {
        acc[key] = {
          campaignId: placement.campaign_id,
          campaignName: placement.campaign_name || `Кампания ${placement.campaign_id}`,
          placements: []
        };
      }
      acc[key].placements.push(placement);
      return acc;
    }, {} as Record<string, { campaignId: string; campaignName: string; placements: Placement[] }>);
    
    return Object.values(grouped).slice(0, 50);
  }, [viewMode, filteredPlacements]);

  const groupedActivePlacements = useMemo(() => {
    if (viewMode !== 'active') return [];
    
    const grouped = filteredPlacements.reduce((acc, placement) => {
      const key = placement.campaign_id;
      if (!acc[key]) {
        acc[key] = {
          campaignId: placement.campaign_id,
          campaignName: placement.campaign_name || `Кампания ${placement.campaign_id}`,
          placements: []
        };
      }
      acc[key].placements.push(placement);
      return acc;
    }, {} as Record<string, { campaignId: string; campaignName: string; placements: Placement[] }>);
    
    return Object.values(grouped).map(group => ({
      ...group,
      placements: group.placements.sort((a, b) => b.clicks - a.clicks)
    }));
  }, [viewMode, filteredPlacements]);

  if (loading) {
    return (
      <div className="flex h-screen">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center ml-64">
          <Icon name="Loader2" className="animate-spin" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <div className="border-b p-6 flex items-center justify-between bg-gradient-to-r from-background to-muted/20">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/rsya')} className="rounded-full">
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project?.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="secondary" className="gap-1">
                  <Icon name="CheckCircle2" size={12} />
                  {activePlacements.length} активных
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate(`/rsya/${projectId}/settings`)}
            >
              <Icon name="Settings" size={18} />
              Настройки
            </Button>

            {syncing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="Loader2" className="animate-spin" size={18} />
                <span>Загрузка данных...</span>
              </div>
            )}
          </div>
        </div>



        <div className="flex-1 flex overflow-hidden">
          {/* Левая колонка: Задачи */}
          <div className="w-96 border-r flex flex-col overflow-hidden">
            {/* Вкладки */}
            <div className="border-b bg-muted/30 p-2">
              <div className="flex gap-1">
                <Button
                  variant={taskTab === 'create' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTaskTab('create')}
                  className="flex-1"
                >
                  <Icon name="Plus" size={16} />
                  Создать задачу
                </Button>
                <Button
                  variant={taskTab === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTaskTab('list')}
                  className="flex-1"
                >
                  <Icon name="ListChecks" size={16} />
                  Запущенные ({tasks.length})
                </Button>

              </div>
            </div>
            
            {/* Контент вкладки: Создать задачу */}
            {taskTab === 'create' && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <Input
                  placeholder="Название задачи"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Вхождения для блокировки</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {KEYWORD_PRESETS.map(preset => (
                      <Button
                        key={preset.value}
                        variant={selectedKeywordPresets.has(preset.value) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleKeywordPreset(preset.value)}
                        className="h-7 text-xs"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKeywordsInput(!showKeywordsInput)}
                    className="w-full justify-between h-8"
                  >
                    <span className="text-xs text-muted-foreground">
                      {showKeywordsInput ? 'Скрыть' : 'Добавить свои вхождения'}
                    </span>
                    <Icon name={showKeywordsInput ? 'ChevronUp' : 'ChevronDown'} size={14} />
                  </Button>
                  {showKeywordsInput && (
                    <Textarea
                      placeholder="Свои вхождения (каждое с новой строки)"
                      value={taskKeywords}
                      onChange={(e) => setTaskKeywords(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Исключения (не блокировать)</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {EXCEPTION_PRESETS.map(preset => (
                      <Button
                        key={preset.value}
                        variant={selectedExceptionPresets.has(preset.value) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleExceptionPreset(preset.value)}
                        className="h-7 text-xs"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExceptionsInput(!showExceptionsInput)}
                    className="w-full justify-between h-8"
                  >
                    <span className="text-xs text-muted-foreground">
                      {showExceptionsInput ? 'Скрыть' : 'Добавить свои исключения'}
                    </span>
                    <Icon name={showExceptionsInput ? 'ChevronUp' : 'ChevronDown'} size={14} />
                  </Button>
                  {showExceptionsInput && (
                    <Textarea
                      placeholder="Свои исключения (каждое с новой строки)"
                      value={taskExceptions}
                      onChange={(e) => setTaskExceptions(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Цель</label>
                  <Select value={taskGoalId} onValueChange={setTaskGoalId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выбрать цель" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все конверсии</SelectItem>
                      {goals.map(goal => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="protect-conversions"
                      checked={protectConversions}
                      onCheckedChange={(checked) => setProtectConversions(checked as boolean)}
                    />
                    <label htmlFor="protect-conversions" className="text-sm text-muted-foreground cursor-pointer">
                      Не блокировать площадки с конверсиями
                    </label>
                  </div>
                </div>
                
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMetricsFilters(!showMetricsFilters)}
                    className="w-full justify-between h-8"
                  >
                    <span className="text-xs text-muted-foreground">
                      {showMetricsFilters ? 'Скрыть фильтры по метрикам' : 'Показать фильтры по метрикам'}
                    </span>
                    <Icon name={showMetricsFilters ? 'ChevronUp' : 'ChevronDown'} size={14} />
                  </Button>
                  
                  {showMetricsFilters && (
                    <div className="space-y-3 mt-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Показы</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="От"
                            value={taskMinImpressions}
                            onChange={(e) => setTaskMinImpressions(e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Input
                            type="number"
                            placeholder="До"
                            value={taskMaxImpressions}
                            onChange={(e) => setTaskMaxImpressions(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Клики</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="От"
                            value={taskMinClicks}
                            onChange={(e) => setTaskMinClicks(e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Input
                            type="number"
                            placeholder="До"
                            value={taskMaxClicks}
                            onChange={(e) => setTaskMaxClicks(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">CTR (%)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="От"
                            value={taskMinCtr}
                            onChange={(e) => setTaskMinCtr(e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="До"
                            value={taskMaxCtr}
                            onChange={(e) => setTaskMaxCtr(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">CPA (₽)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="От"
                            value={taskMinCpa}
                            onChange={(e) => setTaskMinCpa(e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="До"
                            value={taskMaxCpa}
                            onChange={(e) => setTaskMaxCpa(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button onClick={addTask} className="w-full" size="sm">
                  <Icon name="Plus" size={16} />
                  Добавить задачу
                </Button>
              </div>
            </div>
            )}
            
            {/* Контент вкладки: Запущенные задачи */}
            {taskTab === 'list' && (
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-2">
                {tasks.map(task => (
                  <Card 
                    key={task.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedTask?.id === task.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedTask(task.id === selectedTask?.id ? null : task)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-1 truncate">{task.description}</p>
                          {task.config?.keywords && task.config.keywords.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {task.config.keywords.map((keyword, idx) => (
                                  <Badge key={idx} variant="destructive" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                              {task.config.exceptions && task.config.exceptions.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {task.config.exceptions.map((exc, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      <Icon name="Shield" size={10} className="mr-1" />
                                      {exc}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {task.config && (
                                <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
                                  {(task.config.min_impressions || task.config.max_impressions) && (
                                    <div>Показы: {task.config.min_impressions || '−'} — {task.config.max_impressions || '∞'}</div>
                                  )}
                                  {(task.config.min_clicks || task.config.max_clicks) && (
                                    <div>Клики: {task.config.min_clicks || '−'} — {task.config.max_clicks || '∞'}</div>
                                  )}
                                  {(task.config.min_ctr || task.config.max_ctr) && (
                                    <div>CTR: {task.config.min_ctr || '−'}% — {task.config.max_ctr || '∞'}%</div>
                                  )}
                                  {(task.config.min_cpc || task.config.max_cpc) && (
                                    <div>CPC: {task.config.min_cpc || '−'}₽ — {task.config.max_cpc || '∞'}₽</div>
                                  )}
                                  {task.config.min_conversions && (
                                    <div>Конверсий: ≥{task.config.min_conversions}</div>
                                  )}
                                  {(task.config.min_cpa || task.config.max_cpa) && (
                                    <div>CPA: {task.config.min_cpa || '−'}₽ — {task.config.max_cpa || '∞'}₽</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            )}


          </div>

          {/* Правая колонка: Фильтры и площадки */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Фильтры */}
            <div className="border-b bg-background/50 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по доменам..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={selectedGoalId} onValueChange={(v) => setSelectedGoalId(v)} disabled={loadingGoals || goals.length === 0}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Выбрать цель" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все конверсии</SelectItem>
                    {goals.map(goal => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.counter_site} → {goal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                />
                
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  placeholder="CPC от"
                  type="number"
                  value={minCpc}
                  onChange={(e) => setMinCpc(e.target.value)}
                  className="w-28"
                />
                <Input
                  placeholder="до"
                  type="number"
                  value={maxCpc}
                  onChange={(e) => setMaxCpc(e.target.value)}
                  className="w-28"
                />
                
                <Input
                  placeholder="CTR% от"
                  type="number"
                  value={minCtr}
                  onChange={(e) => setMinCtr(e.target.value)}
                  className="w-28"
                />
                <Input
                  placeholder="до"
                  type="number"
                  value={maxCtr}
                  onChange={(e) => setMaxCtr(e.target.value)}
                  className="w-28"
                />
                
                <Input
                  placeholder="CPA от"
                  type="number"
                  value={minCpa}
                  onChange={(e) => setMinCpa(e.target.value)}
                  className="w-28"
                />
                <Input
                  placeholder="до"
                  type="number"
                  value={maxCpa}
                  onChange={(e) => setMaxCpa(e.target.value)}
                  className="w-28"
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="ml-2"
                >
                  <Icon name={showAdvancedFilters ? "ChevronUp" : "ChevronDown"} size={16} />
                </Button>
              </div>
              
              {showAdvancedFilters && (
                <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg">
                  <Input
                    placeholder="Показы от"
                    type="number"
                    value={minImpressions}
                    onChange={(e) => setMinImpressions(e.target.value)}
                    className="w-32"
                  />
                  <Input
                    placeholder="до"
                    type="number"
                    value={maxImpressions}
                    onChange={(e) => setMaxImpressions(e.target.value)}
                    className="w-32"
                  />
                  
                  <Input
                    placeholder="Клики от"
                    type="number"
                    value={minClicks}
                    onChange={(e) => setMinClicks(e.target.value)}
                    className="w-32"
                  />
                  <Input
                    placeholder="до"
                    type="number"
                    value={maxClicks}
                    onChange={(e) => setMaxClicks(e.target.value)}
                    className="w-32"
                  />
                </div>
              )}
              

              
              <div className="flex items-center justify-between">
                <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
                  <Button
                    variant={viewMode === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('active')}
                  >
                    <Icon name="CircleCheck" size={16} />
                    Активные ({activePlacements.length})
                  </Button>
                  <Button
                    variant={viewMode === 'blocked' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('blocked')}
                  >
                    <Icon name="Ban" size={16} />
                    Запрещенные ({blockedPlacements.length})
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => syncData(true)}
                    disabled={syncing}
                  >
                    <Icon name={syncing ? "Loader2" : "RefreshCw"} size={16} className={syncing ? "animate-spin" : ""} />
                    {syncing ? 'Обновление...' : 'Обновить данные'}
                  </Button>
                  
                  {selectedPlacements.size > 0 && (
                    <>
                      {viewMode === 'active' && (
                        <Button size="sm" variant="destructive" onClick={blockSelected}>
                          <Icon name="Ban" size={16} />
                          Заблокировать ({selectedPlacements.size})
                        </Button>
                      )}
                      {viewMode === 'blocked' && (
                        <Button size="sm" variant="default" onClick={unblockSelected}>
                          <Icon name="CircleCheck" size={16} />
                          Разблокировать ({selectedPlacements.size})
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {selectedTask && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="Filter" size={16} />
                    <span className="text-sm font-medium">Фильтр: {selectedTask.description}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                    <Icon name="X" size={16} />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Таблица площадок */}
          <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPlacements.size === filteredPlacements.length && filteredPlacements.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPlacements(new Set(filteredPlacements.map(p => p.id)));
                          } else {
                            setSelectedPlacements(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Площадка</TableHead>
                    {viewMode === 'active' ? (
                      <>
                        <TableHead className="text-right">Показы</TableHead>
                        <TableHead className="text-right">Клики</TableHead>
                        <TableHead className="text-right">Конверсии</TableHead>
                        <TableHead className="text-right">Расход</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">CPC</TableHead>
                        <TableHead className="text-right">CPA</TableHead>
                      </>
                    ) : (
                      <TableHead className="text-right w-24">Действия</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlacements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={viewMode === 'active' ? 9 : 3} className="text-center py-8 text-muted-foreground">
                        {viewMode === 'blocked' ? 'Нет запрещенных площадок' : 'Нет площадок'}
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {viewMode === 'blocked' && blockedPlacements.length > 0 && groupedBlockedPlacements.length < Object.keys(filteredPlacements.reduce((acc, p) => ({ ...acc, [p.campaign_id]: true }), {})).length && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 bg-yellow-50 border-b-2">
                        <div className="flex items-center justify-center gap-2 text-yellow-800">
                          <Icon name="AlertTriangle" size={16} />
                          <span className="text-sm font-medium">
                            Показано первых 50 кампаний. Используйте поиск для фильтрации.
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {viewMode === 'blocked' ? (
                    groupedBlockedPlacements.map(group => (
                      <BlockedCampaignGroup
                        key={group.campaignId}
                        campaignId={group.campaignId}
                        campaignName={group.campaignName}
                        placements={group.placements}
                        selectedPlacements={selectedPlacements}
                        onToggleSelection={(id, checked) => {
                          const newSet = new Set(selectedPlacements);
                          if (checked) {
                            newSet.add(id);
                          } else {
                            newSet.delete(id);
                          }
                          setSelectedPlacements(newSet);
                        }}
                        onUnblock={unblockSingle}
                      />
                    ))
                  ) : (
                    groupedActivePlacements.map(group => (
                      <ActiveCampaignGroup
                        key={group.campaignId}
                        campaignId={group.campaignId}
                        campaignName={group.campaignName}
                        placements={group.placements}
                        selectedPlacements={selectedPlacements}
                        markedForBlock={getPlacementsMarkedForBlock()}
                        canBlockDomain={canBlockDomain}
                        onToggleSelection={(id, checked) => {
                          const newSet = new Set(selectedPlacements);
                          if (checked) {
                            newSet.add(id);
                          } else {
                            newSet.delete(id);
                          }
                          setSelectedPlacements(newSet);
                        }}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}