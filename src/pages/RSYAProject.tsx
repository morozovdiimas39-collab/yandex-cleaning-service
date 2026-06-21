// RSYA Project Page - Tasks Management Interface
import { useState, useEffect } from 'react';
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

interface Project {
  id: number;
  name: string;
  yandex_token?: string;
  campaign_ids?: string[];
  counter_ids?: string[];
  goals?: Goal[];
}

const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'] || '';
const AUTOMATION_URL = BACKEND_URLS['rsya-automation'] || '';

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
  const [createMode, setCreateMode] = useState<'smart' | 'expert'>('smart');
  const [activeModules, setActiveModules] = useState<Set<string>>(new Set());
  
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

	const getGoalName = (goalId: string) => {
		return project?.goals?.find((goal) => goal.id === goalId)?.name || `Цель ${goalId}`;
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

	const createTask = async () => {
    if (!formData.description.trim()) {
      toast({ title: 'Ошибка', description: 'Введите название задачи', variant: 'destructive' });
      return;
    }

		const selectedGoalIds = formData.goal_ids.slice(0, 10);
		const config: any = {
			goal_id: selectedGoalIds.length === 1 ? selectedGoalIds[0] : selectedGoalIds.length > 1 ? 'selected' : 'all',
			goal_ids: selectedGoalIds
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
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось создать задачу', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">Название задачи</Label>
                <Input
                  id="description"
                  placeholder="Например: Блокировка дорогих площадок"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-11"
                />
              </div>

              <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as 'smart' | 'expert')}>
                <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100">
                  <TabsTrigger value="smart" className="flex items-center gap-2 data-[state=active]:bg-white">
                    <Icon name="Sparkles" className="h-4 w-4" />
                    <span>Умная очистка</span>
                  </TabsTrigger>
                  <TabsTrigger value="expert" className="flex items-center gap-2 data-[state=active]:bg-white">
                    <Icon name="Settings" className="h-4 w-4" />
                    <span>Режим эксперта</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="smart" className="space-y-4 mt-6">
	                  <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
	                    <div className="flex items-start gap-4">
	                      <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
	                        <Icon name="Sparkles" className="h-6 w-6 text-white" />
	                      </div>
	                      <div>
	                        <h4 className="font-bold text-blue-900 text-lg mb-2">Защитный пресет</h4>
	                        <p className="text-sm text-blue-700 leading-relaxed">
	                          Блокирует площадки без конверсий при заметном объеме кликов и дорогом CPA. Площадки с выбранными конверсиями не блокируются.
	                        </p>
	                      </div>
	                    </div>
	                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon name="Target" className="h-5 w-5 text-purple-500" />
	                      <Label className="text-base font-semibold">Конверсии для защиты</Label>
	                    </div>
                    {(!project?.goals || project.goals.length === 0) ? (
                      <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Сначала настройте счетчики Метрики в настройках проекта для загрузки целей
                        </p>
                      </div>
                    ) : (
	                      <div className="space-y-2 rounded-lg border-2 border-gray-200 bg-white p-3">
	                        <button
	                          type="button"
	                          onClick={clearGoals}
	                          className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
	                            formData.goal_ids.length === 0 ? 'bg-green-50 text-green-800' : 'text-gray-700 hover:bg-gray-50'
	                          }`}
	                        >
	                          Все конверсии
	                        </button>
	                        <div className="max-h-44 space-y-2 overflow-y-auto">
	                          {project.goals.map((goal) => (
	                            <label key={goal.id} className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-gray-50">
	                              <Checkbox
	                                checked={formData.goal_ids.includes(goal.id)}
	                                onCheckedChange={() => toggleGoal(goal.id)}
	                              />
	                              <span className="text-sm">
	                                <span className="font-medium text-gray-900">{goal.name}</span>
	                                <span className="block text-xs text-gray-500">ID: {goal.id}</span>
	                              </span>
	                            </label>
	                          ))}
	                        </div>
	                        <p className="text-xs text-gray-500">Можно выбрать до 10 целей. Это лимит Direct Reports.</p>
	                      </div>
	                    )}
	                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon name="GitBranch" className="h-5 w-5 text-indigo-500" />
	                      <Label className="text-base font-semibold">Логика условий</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, combine_operator: 'OR' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.combine_operator === 'OR'
                            ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="text-left">
	                          <div className="font-semibold text-gray-900 mb-1">Любое условие</div>
	                          <div className="text-xs text-gray-600">
	                            Заблокировать, если совпало хотя бы одно правило
	                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, combine_operator: 'AND' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.combine_operator === 'AND'
                            ? 'border-purple-400 bg-purple-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="text-left">
	                          <div className="font-semibold text-gray-900 mb-1">Все условия</div>
	                          <div className="text-xs text-gray-600">
	                            Заблокировать только при совпадении всех правил
	                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="expert" className="space-y-6 mt-6">
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
                          <div>
	                            <Label className="text-sm text-purple-900">Конверсии для расчета CPA</Label>
                            {(!project?.goals || project.goals.length === 0) ? (
                              <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                  ⚠️ Настройте счетчики Метрики в настройках
                                </p>
                              </div>
                            ) : (
	                              <div className="mt-1 space-y-2 rounded-lg border-2 border-purple-200 bg-white p-3">
	                                <button
	                                  type="button"
	                                  onClick={clearGoals}
	                                  className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
	                                    formData.goal_ids.length === 0 ? 'bg-purple-50 text-purple-800' : 'text-gray-700 hover:bg-gray-50'
	                                  }`}
	                                >
	                                  Все конверсии
	                                </button>
	                                <div className="max-h-44 space-y-2 overflow-y-auto">
	                                  {project.goals.map((goal) => (
	                                    <label key={goal.id} className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-gray-50">
	                                      <Checkbox
	                                        checked={formData.goal_ids.includes(goal.id)}
	                                        onCheckedChange={() => toggleGoal(goal.id)}
	                                      />
	                                      <span className="text-sm">
	                                        <span className="font-medium text-gray-900">{goal.name}</span>
	                                        <span className="block text-xs text-gray-500">
	                                          {goal.counter_name ? `${goal.counter_name} · ` : ''}ID: {goal.id}
	                                        </span>
	                                      </span>
	                                    </label>
	                                  ))}
	                                </div>
	                                <p className="text-xs text-purple-700">Если ничего не выбрано, используются все конверсии из отчета Direct.</p>
	                              </div>
	                            )}
	                          </div>
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

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="GitBranch" className="h-5 w-5 text-indigo-500" />
	                    <Label className="text-base font-semibold">Логика условий задачи</Label>
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
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={createTask}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Создать задачу
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
