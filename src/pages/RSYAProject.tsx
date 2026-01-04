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
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';
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
  
  const [formData, setFormData] = useState({
    description: '',
    keywords: '',
    exceptions: '',
    goal_id: 'all',
    min_impressions: '',
    max_impressions: '',
    min_clicks: '',
    max_clicks: '',
    min_cpc: '',
    max_cpc: '',
    min_ctr: '',
    max_ctr: '',
    min_cpa: '',
    max_cpa: ''
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

  const createTask = async () => {
    if (!formData.description.trim()) {
      toast({ title: 'Ошибка', description: 'Введите название задачи', variant: 'destructive' });
      return;
    }

    const config: any = {
      goal_id: formData.goal_id
    };

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
          min_impressions: '',
          max_impressions: '',
          min_clicks: '',
          max_clicks: '',
          min_cpc: '',
          max_cpc: '',
          min_ctr: '',
          max_ctr: '',
          min_cpa: '',
          max_cpa: ''
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Задачи</h1>
            <p className="text-gray-500">Автоматическое управление трафиком и ставками</p>
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
                              {task.config?.goal_id === 'all' ? 'Все конверсии' : `Цель ${task.config?.goal_id}`}
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
            <DialogHeader>
              <DialogTitle>Создать задачу</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description">Название задачи</Label>
                <Input
                  id="description"
                  placeholder="Например: Блокировка дорогих площадок"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as 'smart' | 'expert')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="smart">Умная очистка</TabsTrigger>
                  <TabsTrigger value="expert">Режим эксперта</TabsTrigger>
                </TabsList>

                <TabsContent value="smart" className="space-y-4 mt-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Icon name="Sparkles" className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Автоматическая оптимизация</h4>
                        <p className="text-sm text-blue-700">
                          Система автоматически заблокирует площадки с низкой эффективностью на основе машинного обучения
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal_id_smart">Цель оптимизации</Label>
                    <select
                      id="goal_id_smart"
                      value={formData.goal_id}
                      onChange={(e) => setFormData({ ...formData, goal_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">Все конверсии</option>
                      {project?.goals?.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.name} (ID: {goal.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </TabsContent>

                <TabsContent value="expert" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon name="ShieldOff" className="h-4 w-4 text-red-500" />
                        <Label htmlFor="keywords">Вхождения для блокировки</Label>
                      </div>
                      <Textarea
                        id="keywords"
                        placeholder="Через запятую: com, dsp, vpn"
                        value={formData.keywords}
                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon name="ShieldCheck" className="h-4 w-4 text-green-500" />
                        <Label htmlFor="exceptions">Исключения (не блокировать)</Label>
                      </div>
                      <Textarea
                        id="exceptions"
                        placeholder="Через запятую: ozon, yandex"
                        value={formData.exceptions}
                        onChange={(e) => setFormData({ ...formData, exceptions: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="Eye" className="h-4 w-4 text-blue-500" />
                        <Label className="text-base font-semibold">Показы и клики</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min_impressions" className="text-sm">Мин. показов</Label>
                          <Input
                            id="min_impressions"
                            type="number"
                            value={formData.min_impressions}
                            onChange={(e) => setFormData({ ...formData, min_impressions: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max_impressions" className="text-sm">Макс. показов</Label>
                          <Input
                            id="max_impressions"
                            type="number"
                            value={formData.max_impressions}
                            onChange={(e) => setFormData({ ...formData, max_impressions: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="min_clicks" className="text-sm">Мин. кликов</Label>
                          <Input
                            id="min_clicks"
                            type="number"
                            value={formData.min_clicks}
                            onChange={(e) => setFormData({ ...formData, min_clicks: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max_clicks" className="text-sm">Макс. кликов</Label>
                          <Input
                            id="max_clicks"
                            type="number"
                            value={formData.max_clicks}
                            onChange={(e) => setFormData({ ...formData, max_clicks: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="DollarSign" className="h-4 w-4 text-green-500" />
                        <Label className="text-base font-semibold">Цена и эффективность</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min_cpc" className="text-sm">Мин. цена клика (₽)</Label>
                          <Input
                            id="min_cpc"
                            type="number"
                            step="0.01"
                            value={formData.min_cpc}
                            onChange={(e) => setFormData({ ...formData, min_cpc: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max_cpc" className="text-sm">Макс. цена клика (₽)</Label>
                          <Input
                            id="max_cpc"
                            type="number"
                            step="0.01"
                            value={formData.max_cpc}
                            onChange={(e) => setFormData({ ...formData, max_cpc: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="min_ctr" className="text-sm">Мин. CTR (%)</Label>
                          <Input
                            id="min_ctr"
                            type="number"
                            step="0.01"
                            value={formData.min_ctr}
                            onChange={(e) => setFormData({ ...formData, min_ctr: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max_ctr" className="text-sm">Макс. CTR (%)</Label>
                          <Input
                            id="max_ctr"
                            type="number"
                            step="0.01"
                            value={formData.max_ctr}
                            onChange={(e) => setFormData({ ...formData, max_ctr: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="min_cpa" className="text-sm">Мин. CPA (₽)</Label>
                          <Input
                            id="min_cpa"
                            type="number"
                            step="0.01"
                            value={formData.min_cpa}
                            onChange={(e) => setFormData({ ...formData, min_cpa: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max_cpa" className="text-sm">Макс. CPA (₽)</Label>
                          <Input
                            id="max_cpa"
                            type="number"
                            step="0.01"
                            value={formData.max_cpa}
                            onChange={(e) => setFormData({ ...formData, max_cpa: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon name="Target" className="h-4 w-4 text-purple-500" />
                        <Label htmlFor="goal_id_expert">Цель конверсии</Label>
                      </div>
                      <select
                        id="goal_id_expert"
                        value={formData.goal_id}
                        onChange={(e) => setFormData({ ...formData, goal_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">Все конверсии</option>
                        {project?.goals?.map((goal) => (
                          <option key={goal.id} value={goal.id}>
                            {goal.name} (ID: {goal.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

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