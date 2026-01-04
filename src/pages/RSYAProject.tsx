// RSYA Project Page - Tasks Management Interface
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

interface Project {
  id: number;
  name: string;
  yandex_token?: string;
  campaign_ids?: string[];
  counter_ids?: string[];
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
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
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
            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
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
      </div>
    </div>
  );
}