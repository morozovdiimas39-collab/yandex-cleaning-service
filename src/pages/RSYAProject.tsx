// RSYA Project Page - Tasks Management Interface
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';
import { BACKEND_URLS } from '@/config/backend-urls';

interface Task {
  id: number;
  description: string;
  is_enabled: boolean;
  created_at: string;
  combine_operator?: 'AND' | 'OR';
  task_group_id?: number;
	config?: {
		keywords?: string[];
		exceptions?: string[];
		goal_id?: string;
		goal_ids?: string[];
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

interface Goal {
  id: string;
  name: string;
  counter_id?: string;
  counter_name?: string;
}

interface Counter {
  id: string;
  name: string;
  site?: string;
}

interface GoalCounterGroup {
  id: string;
  name: string;
  goals: Goal[];
}

interface Project {
  id: number;
  name: string;
  yandex_token?: string;
  campaign_ids?: string[];
  counter_ids?: string[];
  goals?: Goal[];
}

const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'] || '';
const RSYA_PREVIEW_URL = BACKEND_URLS['rsya-preview'] || '';
const AUTOMATION_URL = BACKEND_URLS['rsya-automation'] || '';
const YANDEX_DIRECT_URL = BACKEND_URLS['yandex-direct'] || '';

interface PreviewPlatform {
  campaign_id: string;
  domain: string;
  important?: boolean;
  already_blocked?: boolean;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  cpa: number;
  ctr: number;
}

interface TaskPreview {
  checked: number;
  matched: number;
  sampled: boolean;
  campaigns_checked: string[];
  campaigns_total: number;
  will_block_examples: PreviewPlatform[];
  already_blocked_examples: PreviewPlatform[];
  kept_examples: PreviewPlatform[];
  important_will_block_examples: PreviewPlatform[];
  warnings: string[];
  reports_pending: { campaign_id: string; report_name?: string }[];
  errors: { campaign_id: string; status?: number; error?: string }[];
}

export default function RSYAProject() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string>('');
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isNameStepDone, setIsNameStepDone] = useState(false);
  const [createMode, setCreateMode] = useState<'smart' | 'expert' | null>(null);
  const [createWizardStep, setCreateWizardStep] = useState<3 | 4>(3);
  const [activeModules, setActiveModules] = useState<Set<string>>(new Set());
  const [availableCounters, setAvailableCounters] = useState<Counter[]>([]);
  const [taskGoals, setTaskGoals] = useState<Goal[]>([]);
  const [selectedCounterIds, setSelectedCounterIds] = useState<Set<string>>(new Set());
  const [counterSearch, setCounterSearch] = useState('');
  const [goalSearch, setGoalSearch] = useState('');
  const [loadingCounters, setLoadingCounters] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [conversionLoadError, setConversionLoadError] = useState('');
  const [preview, setPreview] = useState<TaskPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  
	const [formData, setFormData] = useState({
		description: '',
		keywords: '',
		exceptions: '',
		goal_id: 'all',
		goal_ids: [] as string[],
		combine_operator: 'OR' as 'AND' | 'OR',
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

  const goalCounterGroups = useMemo<GoalCounterGroup[]>(() => {
    const groups = new Map<string, GoalCounterGroup>();

    if (availableCounters.length > 0) {
      availableCounters.forEach((counter) => {
        groups.set(String(counter.id), {
          id: String(counter.id),
          name: counter.name || counter.site || `Счётчик ${counter.id}`,
          goals: taskGoals.filter((goal) => String(goal.counter_id || '') === String(counter.id))
        });
      });

      return Array.from(groups.values());
    }

    (taskGoals.length > 0 ? taskGoals : project?.goals || []).forEach((goal) => {
      const counterId = String(goal.counter_id || 'unknown').trim();
      const groupId = counterId || 'unknown';
      const group = groups.get(groupId) || {
        id: groupId,
        name: goal.counter_name || (groupId === 'unknown' ? 'Счётчик без ID' : `Счётчик ${groupId}`),
        goals: []
      };
      group.goals.push(goal);
      groups.set(groupId, group);
    });

    return Array.from(groups.values());
  }, [availableCounters, taskGoals, project?.goals]);

  const selectedCounterGoals = useMemo(() => {
    if (selectedCounterIds.size === 0) return [];
    return goalCounterGroups
      .filter((group) => selectedCounterIds.has(group.id))
      .flatMap((group) => group.goals);
  }, [goalCounterGroups, selectedCounterIds]);

  const filteredCounterGroups = useMemo(() => {
    const query = counterSearch.trim().toLowerCase();
    const counters = query
      ? goalCounterGroups.filter((counter) =>
          `${counter.name} ${counter.id}`.toLowerCase().includes(query)
        )
      : goalCounterGroups;

    return [...counters].sort((a, b) => {
      const aSelected = selectedCounterIds.has(a.id) ? 1 : 0;
      const bSelected = selectedCounterIds.has(b.id) ? 1 : 0;
      if (aSelected !== bSelected) return bSelected - aSelected;
      return a.name.localeCompare(b.name, 'ru');
    });
  }, [goalCounterGroups, counterSearch, selectedCounterIds]);

  const filteredSelectedCounterGoals = useMemo(() => {
    const query = goalSearch.trim().toLowerCase();
    const goals = query
      ? selectedCounterGoals.filter((goal) =>
          `${goal.name} ${goal.id} ${goal.counter_name || ''}`.toLowerCase().includes(query)
        )
      : selectedCounterGoals;

    return [...goals].sort((a, b) => {
      const aSelected = formData.goal_ids.includes(a.id) ? 1 : 0;
      const bSelected = formData.goal_ids.includes(b.id) ? 1 : 0;
      if (aSelected !== bSelected) return bSelected - aSelected;
      return a.name.localeCompare(b.name, 'ru');
    });
  }, [selectedCounterGoals, goalSearch, formData.goal_ids]);

  useEffect(() => {
    if (isCreateDialogOpen && project?.yandex_token) {
      loadTaskCounters();
    }
  }, [isCreateDialogOpen, project?.yandex_token]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const uid = userStr ? JSON.parse(userStr).id.toString() : '1';
    setUserId(uid);
    
    if (projectId) {
      loadProject(uid);
    }
  }, [projectId]);

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
      console.log('📋 Project data:', data.project);
      setProject(data.project);
      
      // Задачи приходят в project.tasks
      if (data.project.tasks) {
        console.log('📋 Tasks loaded:', data.project.tasks);
        setTasks(data.project.tasks);
      }
      
      if (!data.project.yandex_token) {
        navigate(`/rsya/${projectId}/auth`);
        return;
      }
      
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: number, currentEnabled: boolean) => {
    try {
      const response = await fetch(RSYA_PROJECTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          action: 'toggle_task',
          project_id: parseInt(projectId || '0'),
          task_id: taskId,
          enabled: !currentEnabled
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tasks) {
          setTasks(data.tasks);
        }
        toast({ title: currentEnabled ? 'Задача остановлена' : 'Задача запущена' });
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось изменить статус задачи', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Удалить задачу?')) return;

    try {
      const response = await fetch(RSYA_PROJECTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          action: 'delete_task',
          project_id: parseInt(projectId || '0'),
          task_id: taskId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tasks) {
          setTasks(data.tasks);
        }
        toast({ title: 'Задача удалена' });
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось удалить задачу', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

	const toggleGoal = (goalId: string) => {
		const current = formData.goal_ids;
		const next = current.includes(goalId)
			? current.filter((id) => id !== goalId)
			: [...current, goalId].slice(0, 10);

		setFormData({
			...formData,
			goal_ids: next,
			goal_id: next.length === 1 ? next[0] : next.length > 1 ? 'selected' : 'all'
		});
	};

	const clearGoals = () => {
		setFormData({ ...formData, goal_ids: [], goal_id: 'all' });
	};

  const loadTaskCounters = async () => {
    if (!project?.yandex_token || !YANDEX_DIRECT_URL) return;

    try {
      setLoadingCounters(true);
      setConversionLoadError('');
      const response = await fetch(`${YANDEX_DIRECT_URL}?action=counters`, {
        headers: { 'X-Auth-Token': project.yandex_token }
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Не удалось загрузить счётчики');
      }

      setAvailableCounters(data?.counters || []);
    } catch (error: any) {
      setAvailableCounters([]);
      setConversionLoadError(error.message || 'Не удалось загрузить счётчики');
    } finally {
      setLoadingCounters(false);
    }
  };

  const loadTaskGoals = async (counterIds: string[]) => {
    if (!project?.yandex_token || !YANDEX_DIRECT_URL || counterIds.length === 0) {
      setTaskGoals([]);
      return;
    }

    try {
      setLoadingGoals(true);
      setConversionLoadError('');
      const response = await fetch(`${YANDEX_DIRECT_URL}?action=goals&counter_ids=${counterIds.join(',')}`, {
        headers: { 'X-Auth-Token': project.yandex_token }
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Не удалось загрузить конверсии');
      }

      setTaskGoals(data?.goals || []);
    } catch (error: any) {
      setTaskGoals([]);
      setConversionLoadError(error.message || 'Не удалось загрузить конверсии');
    } finally {
      setLoadingGoals(false);
    }
  };

  const toggleCounter = (counterId: string) => {
    const nextCounters = new Set(selectedCounterIds);
    if (nextCounters.has(counterId)) {
      nextCounters.delete(counterId);
    } else {
      nextCounters.add(counterId);
    }

    const allowedGoalIds = new Set(
      goalCounterGroups
        .filter((group) => nextCounters.has(group.id))
        .flatMap((group) => group.goals.map((goal) => goal.id))
    );
    const nextGoalIds = formData.goal_ids.filter((goalId) => allowedGoalIds.has(goalId));

    const nextCounterIds = Array.from(nextCounters);

    setSelectedCounterIds(nextCounters);
    setFormData({
      ...formData,
      goal_ids: nextGoalIds,
      goal_id: nextGoalIds.length === 1 ? nextGoalIds[0] : nextGoalIds.length > 1 ? 'selected' : 'all'
    });
    void loadTaskGoals(nextCounterIds);
  };

	const getGoalName = (goalId: string) => {
		return taskGoals.find((goal) => goal.id === goalId)?.name || project?.goals?.find((goal) => goal.id === goalId)?.name || `Цель ${goalId}`;
	};

	const getTaskGoalsLabel = (task: Task) => {
		const goalIds = task.config?.goal_ids?.length
			? task.config.goal_ids
			: task.config?.goal_id && task.config.goal_id !== 'all' && task.config.goal_id !== 'selected'
				? [task.config.goal_id]
				: [];

		if (!goalIds.length) return 'Все конверсии';
		if (goalIds.length === 1) return getGoalName(goalIds[0]);
		return `${goalIds.length} цели: ${goalIds.slice(0, 2).map(getGoalName).join(', ')}${goalIds.length > 2 ? '...' : ''}`;
	};

	const buildTaskConfig = () => {
		const selectedGoalIds = formData.goal_ids.slice(0, 10);
		const config: any = {
			goal_id: selectedGoalIds.length === 1 ? selectedGoalIds[0] : selectedGoalIds.length > 1 ? 'selected' : 'all',
			goal_ids: selectedGoalIds,
      protect_conversions: selectedGoalIds.length > 0
		};

    if (createMode === 'smart') {
      config.protect_conversions = true;
      config.min_clicks = 20;
      config.max_cpa = 500;
    }

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

    return config;
  };

  const resetCreateForm = () => {
    setPreview(null);
    setPreviewConfirmed(false);
    setIsNameStepDone(false);
    setCreateMode(null);
    setCreateWizardStep(3);
    setSelectedCounterIds(new Set());
    setActiveModules(new Set());
    setTaskGoals([]);
    setCounterSearch('');
    setGoalSearch('');
    setConversionLoadError('');
    setFormData({
      description: '',
      keywords: '',
      exceptions: '',
      goal_id: 'all',
      goal_ids: [],
      combine_operator: 'OR' as 'AND' | 'OR',
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
  };

  const loadPreview = async () => {
    if (!createMode) {
      toast({ title: 'Выберите режим чистки', variant: 'destructive' });
      return;
    }
    if (!formData.description.trim()) {
      toast({ title: 'Ошибка', description: 'Введите название задачи', variant: 'destructive' });
      return;
    }
    if (!RSYA_PREVIEW_URL) {
      toast({ title: 'Предпросмотр недоступен', description: 'URL функции rsya-preview не настроен', variant: 'destructive' });
      return;
    }

    try {
      setPreviewLoading(true);
      setPreview(null);
      setPreviewConfirmed(false);
      const response = await fetch(RSYA_PREVIEW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          project_id: parseInt(projectId || '0'),
          description: formData.description,
          combine_operator: formData.combine_operator,
          config: buildTaskConfig()
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const reasons = data?.reasons?.length ? data.reasons.join(' ') : data?.error || 'Не удалось построить предпросмотр';
        toast({ title: data?.message || 'Предпросмотр не готов', description: reasons, variant: 'destructive' });
        return;
      }

      setPreview(data);
      toast({ title: 'Предпросмотр готов', description: `Проверено площадок: ${data.checked || 0}` });
    } catch (error: any) {
      toast({ title: 'Ошибка предпросмотра', description: error.message, variant: 'destructive' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const createTask = async () => {
    if (!createMode) {
      toast({ title: 'Выберите режим чистки', variant: 'destructive' });
      return;
    }
    if (!formData.description.trim()) {
      toast({ title: 'Ошибка', description: 'Введите название задачи', variant: 'destructive' });
      return;
    }

    const config = buildTaskConfig();

    try {
      const response = await fetch(RSYA_PROJECTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          action: 'add_task',
          project_id: parseInt(projectId || '0'),
          description: formData.description,
          combine_operator: formData.combine_operator,
          config
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tasks) {
          setTasks(data.tasks);
        }
        toast({ title: '✅ Задача создана' });
        setIsCreateDialogOpen(false);
        resetCreateForm();
	      } else {
	        const errorData = await response.json().catch(() => null);
	        const reasons = errorData?.reasons?.length ? errorData.reasons.join(' ') : 'Не удалось создать задачу';
	        toast({ title: errorData?.message || 'Ошибка', description: reasons, variant: 'destructive' });
	      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const PreviewList = ({ title, items, emptyText }: { title: string; items: PreviewPlatform[]; emptyText: string }) => (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-3 py-2 text-sm font-semibold text-gray-900">{title}</div>
      <div className="max-h-44 overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-500">{emptyText}</div>
        ) : items.slice(0, 10).map((item) => (
          <div key={`${title}-${item.campaign_id}-${item.domain}`} className={`border-b px-3 py-2 last:border-b-0 ${item.important ? 'bg-amber-50' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-gray-900">{item.domain}</span>
              {item.important && <Badge className="border-0 bg-amber-100 text-amber-800">важная</Badge>}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Кампания {item.campaign_id} · {item.clicks} кликов · {item.cost}₽ · CPA {item.cpa}₽ · конв. {item.conversions}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const filteredTasks = tasks.filter(task => 
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const getTaskStatusLabel = (task: Task) => {
    if (task.is_enabled) {
      return { text: 'АКТИВНА', color: 'bg-green-100 text-green-700' };
    }
    return { text: 'НА ПАУЗЕ', color: 'bg-gray-100 text-gray-600' };
  };

  const getTaskIcon = (task: Task) => {
    if (task.is_enabled) return 'GitBranch';
    return 'Play';
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Icon name="Loader2" className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      
      <div className="flex-1 overflow-auto ml-64">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Задачи</h1>
              <p className="text-gray-500">Автоматическое управление трафиком и ставками</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/rsya/${projectId}/settings`)}
              className="gap-2"
            >
              <Icon name="Settings" className="h-4 w-4" />
              Настройки
            </Button>
          </div>

          {/* Search and Create */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Поиск задач..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Icon name="Plus" className="h-4 w-4" />
              Создать
            </Button>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const status = getTaskStatusLabel(task);
              const icon = getTaskIcon(task);

              return (
                <Card key={task.id} className="border-2 hover:border-gray-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${task.is_enabled ? 'bg-green-600' : 'bg-gray-300'}`}>
                        <Icon name={icon} className="h-6 w-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        {/* Title and Status */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {task.description}
                            </h3>
                            <div className="flex items-center gap-3">
                              <Badge className={`${status.color} border-0`}>
                                {status.text}
                              </Badge>
                              {task.combine_operator && (
                                <Badge className={`border-0 ${
                                  task.combine_operator === 'AND' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                  {task.combine_operator === 'AND' ? 'И (AND)' : 'ИЛИ (OR)'}
                                </Badge>
                              )}
                              <span className="text-sm text-gray-500">
                                ID: t{task.id}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleTask(task.id, task.is_enabled)}
                            >
                              <Icon name={task.is_enabled ? 'Pause' : 'Play'} className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Icon name="Trash2" className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Task Details Grid */}
                        <div className="grid grid-cols-3 gap-6">
                          {/* Блокировка */}
                          {task.config?.keywords && task.config.keywords.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Icon name="ShieldOff" className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-medium text-gray-700">БЛОКИРОВКА</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {task.config.keywords.slice(0, 3).map((keyword, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    {keyword}
                                  </Badge>
                                ))}
                                {task.config.keywords.length > 3 && (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    +{task.config.keywords.length - 3}
                                  </Badge>
                                )}
                              </div>
                              {task.config?.min_cpa && (
                                <p className="text-sm text-gray-600 mt-2">
                                  CPA &gt; {task.config.min_cpa}₽
                                </p>
                              )}
                            </div>
                          )}

                          {/* Исключения */}
                          {task.config?.exceptions && task.config.exceptions.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Icon name="ShieldCheck" className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium text-gray-700">ИСКЛЮЧЕНИЯ</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {task.config.exceptions.slice(0, 2).map((exception, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {exception}
                                  </Badge>
                                ))}
                                {task.config.exceptions.length > 2 && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    +{task.config.exceptions.length - 2}
                                  </Badge>
                                )}
                              </div>
                              {!task.config.exceptions.length && (
                                <p className="text-sm text-gray-400 italic">Нет исключений</p>
                              )}
                            </div>
                          )}

                          {/* Цель */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon name="Target" className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium text-gray-700">ЦЕЛЬ</span>
                            </div>
                            <p className="text-sm text-gray-900 font-medium">
	                              {getTaskGoalsLabel(task)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Создано: {formatDate(task.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredTasks.length === 0 && (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <Icon name="Inbox" className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchQuery ? 'Ничего не найдено' : 'Создайте первую задачу'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Create Task Dialog */}
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              resetCreateForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-0 pb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Icon name="Plus" className="h-7 w-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold">Создать задачу</DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">Настройте автоматическую чистку площадок</p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {!isNameStepDone && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">1</span>
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="description" className="text-lg font-bold text-slate-950">Название задачи</Label>
                      <p className="mt-1 text-sm text-slate-500">Назовите задачу так, чтобы потом было понятно, какую чистку она выполняет.</p>
                    </div>
                  </div>
                  <Input
                    id="description"
                    placeholder="Например: Блокировка дорогих площадок"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-12 text-base"
                  />
                  <Button
                    type="button"
                    disabled={!formData.description.trim()}
                    onClick={() => setIsNameStepDone(true)}
                    className="h-14 w-full rounded-xl bg-green-600 text-base font-semibold hover:bg-green-700"
                  >
                    Продолжить
                  </Button>
                </div>
              )}

              {isNameStepDone && !createMode && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">2</span>
                  <Label className="text-lg font-bold text-slate-950">Выберите режим чистки</Label>
                </div>
                <Tabs
                  value={createMode || ''}
                  onValueChange={(v) => {
                    setCreateMode(v as 'smart' | 'expert');
                    setCreateWizardStep(3);
                  }}
                >
                <TabsList className="grid h-auto w-full grid-cols-2 gap-3 bg-transparent p-0">
                  <TabsTrigger
                    value="smart"
                    className="group h-36 flex-col items-start justify-between rounded-2xl border-2 border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 data-[state=active]:border-emerald-500 data-[state=active]:bg-emerald-50 data-[state=active]:shadow-md"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 group-data-[state=active]:bg-emerald-600 group-data-[state=active]:text-white">
                      <Icon name="Sparkles" className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-base font-bold text-slate-950">Умная очистка</span>
                      <span className="mt-1 block whitespace-normal text-xs font-normal leading-relaxed text-slate-600">
                        Готовые правила, ничего не нужно задавать вручную
                      </span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="expert"
                    className="group h-36 flex-col items-start justify-between rounded-2xl border-2 border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 data-[state=active]:border-slate-900 data-[state=active]:bg-slate-950 data-[state=active]:shadow-md"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-data-[state=active]:bg-white group-data-[state=active]:text-slate-950">
                      <Icon name="Settings" className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-base font-bold text-slate-950 group-data-[state=active]:text-white">Режим эксперта</span>
                      <span className="mt-1 block whitespace-normal text-xs font-normal leading-relaxed text-slate-600 group-data-[state=active]:text-slate-300">
                        Гибкая настройка правил, порогов и исключений
                      </span>
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="smart" className="mt-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
                    <div className="mb-1 flex items-center gap-2 font-semibold">
                      <Icon name="Sparkles" className="h-4 w-4" />
                      Ничего не нужно настраивать вручную
                    </div>
                    Мы заранее подготовили правила чистки: сервис сам будет искать слабые площадки и защищать выбранные конверсии от случайной блокировки.
                  </div>
                </TabsContent>

                <TabsContent value="expert" className="space-y-6 mt-6">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                    <div className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
                      <Icon name="Settings" className="h-4 w-4" />
                      Гибкая настройка под свои правила
                    </div>
                    Можно самостоятельно выбрать условия, исключения, метрики, пороги CPA и логику срабатывания задачи.
                  </div>

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
                            <Icon name="BarChart3" className={`h-5 w-5 ${
                              activeModules.has('metrics') ? 'text-white' : 'text-gray-500'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Метрики</div>
                            <div className="text-xs text-gray-500">CTR, CPC, показы, клики</div>
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
                            <div className="text-xs text-gray-500">CPA и цели</div>
                          </div>
                          <Icon name={activeModules.has('conversions') ? 'Check' : 'Plus'} className={`h-5 w-5 ${
                            activeModules.has('conversions') ? 'text-purple-500' : 'text-gray-400'
                          }`} />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {activeModules.has('keywords') && (
                      <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                            <Icon name="ShieldOff" className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-red-900">Блокировка по вхождениям</h4>
                            <p className="text-sm text-red-700">Площадки с этими словами будут заблокированы</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newModules = new Set(activeModules);
                              newModules.delete('keywords');
                              setActiveModules(newModules);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Icon name="X" className="h-5 w-5" />
                          </button>
                        </div>
                        <Textarea
                          placeholder="Через запятую: dsp, bot, click, vpn, ads"
                          value={formData.keywords}
                          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                          rows={3}
                          className="bg-white border-red-200 focus:border-red-400"
                        />
                      </div>
                    )}

                    {activeModules.has('exceptions') && (
                      <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                            <Icon name="ShieldCheck" className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-green-900">Исключения</h4>
                            <p className="text-sm text-green-700">Эти площадки никогда не будут заблокированы</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newModules = new Set(activeModules);
                              newModules.delete('exceptions');
                              setActiveModules(newModules);
                            }}
                            className="text-green-500 hover:text-green-700"
                          >
                            <Icon name="X" className="h-5 w-5" />
                          </button>
                        </div>
                        <Textarea
                          placeholder="Через запятую: ozon, yandex, mail, avito"
                          value={formData.exceptions}
                          onChange={(e) => setFormData({ ...formData, exceptions: e.target.value })}
                          rows={3}
                          className="bg-white border-green-200 focus:border-green-400"
                        />
                      </div>
                    )}

                    {activeModules.has('metrics') && (
                      <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/50">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                            <Icon name="BarChart3" className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-900">Метрики эффективности</h4>
                            <p className="text-sm text-blue-700">Блокировать при отклонении от пороговых значений</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newModules = new Set(activeModules);
                              newModules.delete('metrics');
                              setActiveModules(newModules);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Icon name="X" className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm text-blue-900">Мин. показов</Label>
                            <Input
                              type="number"
                              placeholder="1000"
                              value={formData.min_impressions}
                              onChange={(e) => setFormData({ ...formData, min_impressions: e.target.value })}
                              className="mt-1 bg-white border-blue-200"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-blue-900">Макс. показов</Label>
                            <Input
                              type="number"
                              placeholder="50000"
                              value={formData.max_impressions}
                              onChange={(e) => setFormData({ ...formData, max_impressions: e.target.value })}
                              className="mt-1 bg-white border-blue-200"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-blue-900">Мин. кликов</Label>
                            <Input
                              type="number"
                              placeholder="10"
                              value={formData.min_clicks}
                              onChange={(e) => setFormData({ ...formData, min_clicks: e.target.value })}
                              className="mt-1 bg-white border-blue-200"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-blue-900">Макс. кликов</Label>
                            <Input
                              type="number"
                              placeholder="1000"
                              value={formData.max_clicks}
                              onChange={(e) => setFormData({ ...formData, max_clicks: e.target.value })}
                              className="mt-1 bg-white border-blue-200"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-blue-900">Мин. CTR (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.5"
                              value={formData.min_ctr}
                              onChange={(e) => setFormData({ ...formData, min_ctr: e.target.value })}
                              className="mt-1 bg-white border-blue-200"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-blue-900">Мин. CPC (₽)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="10"
                              value={formData.min_cpc}
                              onChange={(e) => setFormData({ ...formData, min_cpc: e.target.value })}
                              className="mt-1 bg-white border-blue-200"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-blue-900">Макс. CPC (₽)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="50"
                              value={formData.max_cpc}
                              onChange={(e) => setFormData({ ...formData, max_cpc: e.target.value })}
                              className="mt-1 bg-white border-blue-200"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeModules.has('conversions') && (
                      <div className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50/50">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                            <Icon name="Target" className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-purple-900">Конверсии и CPA</h4>
                            <p className="text-sm text-purple-700">Блокировать неэффективные площадки по целям</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newModules = new Set(activeModules);
                              newModules.delete('conversions');
                              setActiveModules(newModules);
                            }}
                            className="text-purple-500 hover:text-purple-700"
                          >
                            <Icon name="X" className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm text-purple-900">Макс. CPA (₽)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="500"
                                value={formData.max_cpa}
                                onChange={(e) => setFormData({ ...formData, max_cpa: e.target.value })}
                                className="mt-1 bg-white border-purple-200"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-purple-900">Мин. конверсий</Label>
                              <Input
                                type="number"
                                placeholder="1"
                                value={formData.min_conversions || ''}
                                onChange={(e) => setFormData({ ...formData, min_conversions: e.target.value })}
                                className="mt-1 bg-white border-purple-200"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeModules.size === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Icon name="Blocks" className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Выберите модули условий выше</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              </div>
              )}

              {isNameStepDone && createMode && (
              <>
              {createWizardStep === 3 && (
              <div className="space-y-3 rounded-xl border border-purple-100 bg-white p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">3</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon name="Target" className="h-5 w-5 text-purple-500" />
                      <Label className="text-base font-semibold">Конверсии для защиты</Label>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Выберите конверсии из своих счётчиков, которые нельзя терять при чистке площадок. Площадки с выбранными конверсиями будут защищены. Этот этап можно пропустить.
                    </p>
                  </div>
                </div>

                {loadingCounters ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                    Загружаю счётчики
                  </div>
                ) : conversionLoadError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {conversionLoadError}
                  </div>
                ) : goalCounterGroups.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Счётчики пока не найдены. Можно продолжить без выбора — защита по конверсиям просто не будет применяться.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-white via-purple-50/45 to-white p-3 shadow-sm">
                    <div className="mb-3 grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-white bg-white/85 px-3 py-2 shadow-sm">
                        <div className="text-lg font-bold leading-none text-slate-950">{goalCounterGroups.length}</div>
                        <div className="mt-1 text-[11px] font-medium text-slate-500">счётчиков</div>
                      </div>
                      <div className="rounded-xl border border-white bg-white/85 px-3 py-2 shadow-sm">
                        <div className="text-lg font-bold leading-none text-slate-950">{selectedCounterIds.size}</div>
                        <div className="mt-1 text-[11px] font-medium text-slate-500">выбрано</div>
                      </div>
                      <div className="rounded-xl border border-white bg-white/85 px-3 py-2 shadow-sm">
                        <div className="text-lg font-bold leading-none text-slate-950">{formData.goal_ids.length}</div>
                        <div className="mt-1 text-[11px] font-medium text-slate-500">конверсий</div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                      <div className="min-h-0 rounded-xl border border-purple-100 bg-white p-3 shadow-sm">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Счётчики</div>
                            <div className="text-xs text-slate-500">Выбранные закрепляются сверху</div>
                          </div>
                          {selectedCounterIds.size > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCounterIds(new Set());
                                clearGoals();
                                setGoalSearch('');
                              }}
                              className="text-xs font-medium text-purple-700 hover:text-purple-900"
                            >
                              Сбросить
                            </button>
                          )}
                        </div>
                        <div className="relative mb-2">
                          <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={counterSearch}
                            onChange={(e) => setCounterSearch(e.target.value)}
                            placeholder="Поиск счётчика"
                            className="h-9 pl-9 text-sm"
                          />
                        </div>
                        <div className="max-h-[280px] space-y-1 overflow-y-auto pr-1">
                          {filteredCounterGroups.map((counter) => (
                            <button
                              key={counter.id}
                              type="button"
                              onClick={() => toggleCounter(counter.id)}
                              className={`w-full rounded-xl border px-3 py-2 text-left transition-all ${
                                selectedCounterIds.has(counter.id)
                                  ? 'border-purple-300 bg-purple-50 shadow-sm'
                                  : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox checked={selectedCounterIds.has(counter.id)} className="pointer-events-none" />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-slate-950">{counter.name}</span>
                                  <span className="block truncate text-xs text-slate-500">
                                    ID: {counter.id}
                                  </span>
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  counter.goals.length > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {counter.goals.length}
                                </span>
                              </div>
                            </button>
                          ))}
                          {filteredCounterGroups.length === 0 && (
                            <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                              Ничего не найдено
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-h-0 rounded-xl border border-purple-100 bg-white p-3 shadow-sm">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Конверсии</div>
                            <div className="text-xs text-slate-500">Отмеченные защищают площадку от блокировки</div>
                          </div>
                          {formData.goal_ids.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                clearGoals();
                                setGoalSearch('');
                              }}
                              className="text-xs font-medium text-purple-700 hover:text-purple-900"
                            >
                              Очистить
                            </button>
                          )}
                        </div>
                        {selectedCounterGoals.length > 0 && (
                          <div className="relative mb-2">
                            <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                              value={goalSearch}
                              onChange={(e) => setGoalSearch(e.target.value)}
                              placeholder="Поиск конверсии"
                              className="h-9 pl-9 text-sm"
                            />
                          </div>
                        )}

                      {selectedCounterIds.size === 0 ? (
                        <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-purple-200 bg-purple-50/35 px-4 py-5 text-center text-sm text-slate-500">
                          <div>
                            <Icon name="MousePointerClick" className="mx-auto mb-2 h-5 w-5 text-purple-400" />
                            Выберите счётчик слева, и здесь появятся его конверсии.
                          </div>
                        </div>
                      ) : loadingGoals ? (
                        <div className="flex min-h-[180px] items-center justify-center gap-2 rounded-lg border border-purple-100 bg-white px-4 py-5 text-sm text-slate-500">
                          <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                          Загружаю конверсии
                        </div>
                      ) : selectedCounterGoals.length === 0 ? (
                        <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-500">
                          В выбранных счётчиках конверсии не найдены.
                        </div>
                      ) : (
                        <div className="max-h-[280px] space-y-1 overflow-y-auto pr-1">
                          {filteredSelectedCounterGoals.map((goal) => (
                            <label
                              key={goal.id}
                              className={`flex items-start gap-3 rounded-xl border px-3 py-2 transition-all ${
                                formData.goal_ids.includes(goal.id)
                                  ? 'border-purple-300 bg-purple-50 shadow-sm'
                                  : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <Checkbox
                                checked={formData.goal_ids.includes(goal.id)}
                                onCheckedChange={() => toggleGoal(goal.id)}
                              />
                              <span className="min-w-0 text-sm">
                                <span className="block truncate font-semibold text-gray-900">{goal.name}</span>
                                <span className="block truncate text-xs text-gray-500">
                                  {goal.counter_name ? `${goal.counter_name} · ` : ''}ID: {goal.id}
                                </span>
                              </span>
                            </label>
                          ))}
                          {filteredSelectedCounterGoals.length === 0 && (
                            <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                              Конверсии не найдены
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-purple-700">Можно выбрать до 10 конверсий. Выбранные конверсии защищают площадки от ошибочной блокировки.</p>
                  </div>
                )}
              </div>
              )}

              {createWizardStep === 3 && (
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => setCreateWizardStep(4)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Продолжить к логике условий
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Отмена
                  </Button>
                </div>
              )}

              {createWizardStep === 4 && (
              <>
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div>
                  <div className="mb-3 flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">4</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Icon name="GitBranch" className="h-5 w-5 text-indigo-500" />
	                      <Label className="text-base font-semibold">Логика условий задачи</Label>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        Выберите, как система должна объединять активные правила перед блокировкой площадки.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, combine_operator: 'OR' })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.combine_operator === 'OR'
                          ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          formData.combine_operator === 'OR' ? 'bg-indigo-500' : 'bg-gray-100'
                        }`}>
                          <Icon name="List" className={`h-5 w-5 ${
                            formData.combine_operator === 'OR' ? 'text-white' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
	                          <div className="font-semibold text-gray-900 mb-1">Любое условие</div>
	                          <div className="text-xs text-gray-600 leading-relaxed">
	                            Площадка блокируется, если подходит хотя бы под одно активное правило.
	                          </div>
                            <div className="mt-2 rounded-md bg-white/80 px-2 py-1 text-xs text-indigo-700">
                              Быстрее чистит мусор, но требует аккуратных правил.
                            </div>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, combine_operator: 'AND' })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.combine_operator === 'AND'
                          ? 'border-purple-400 bg-purple-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          formData.combine_operator === 'AND' ? 'bg-purple-500' : 'bg-gray-100'
                        }`}>
                          <Icon name="Layers" className={`h-5 w-5 ${
                            formData.combine_operator === 'AND' ? 'text-white' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
	                          <div className="font-semibold text-gray-900 mb-1">Все условия</div>
	                          <div className="text-xs text-gray-600 leading-relaxed">
	                            Площадка блокируется только если подходит под все активные правила сразу.
	                          </div>
                            <div className="mt-2 rounded-md bg-white/80 px-2 py-1 text-xs text-purple-700">
                              Безопаснее: площадка должна провалиться по всем выбранным критериям.
                            </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {preview && (
                <div className="space-y-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-emerald-950">Предпросмотр чистки</h3>
                      <p className="text-sm text-emerald-800">
                        Проверено {preview.checked} площадок, совпало {preview.matched}. Кампаний: {preview.campaigns_checked.length} из {preview.campaigns_total}.
                      </p>
                    </div>
                    {preview.sampled && <Badge className="border-0 bg-blue-100 text-blue-700">выборка</Badge>}
                  </div>

                  {preview.warnings.length > 0 && (
                    <div className="space-y-2">
                      {preview.warnings.map((warning, index) => (
                        <div key={index} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-3">
                    <PreviewList
                      title="Заблокируется"
                      items={preview.will_block_examples}
                      emptyText="Новых блокировок в выборке нет"
                    />
                    <PreviewList
                      title="Уже заблокировано"
                      items={preview.already_blocked_examples}
                      emptyText="Совпадений среди уже заблокированных нет"
                    />
                    <PreviewList
                      title="Останется"
                      items={preview.kept_examples}
                      emptyText="Нет примеров оставшихся площадок"
                    />
                  </div>

                  {preview.errors.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                      Ошибки по кампаниям: {preview.errors.slice(0, 3).map((error) => `${error.campaign_id}: ${error.status || ''}`).join(', ')}
                    </div>
                  )}

                  <label className="flex items-start gap-3 rounded-lg bg-white p-3 text-sm text-gray-700">
                    <Checkbox
                      checked={previewConfirmed}
                      onCheckedChange={(checked) => setPreviewConfirmed(Boolean(checked))}
                    />
                    <span>
                      Я проверил примеры площадок и понимаю, какие домены попадут под блокировку.
                    </span>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={previewConfirmed ? createTask : loadPreview}
                  disabled={previewLoading || (Boolean(preview) && !previewConfirmed)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
                >
                  {previewLoading ? (
                    <>
                      <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                      Проверяю площадки
                    </>
                  ) : previewConfirmed ? 'Создать задачу' : preview ? 'Подтвердите предпросмотр' : 'Проверить перед созданием'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Отмена
                </Button>
              </div>
              </>
              )}
              </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
