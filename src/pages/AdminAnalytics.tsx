import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from '@/config/backend-urls';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface Analytics {
  overview: {
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    activeTasks: number;
    totalUsers: number;
    totalWordstatTasks: number;
    totalBlockQueue: number;
  };
  rsya: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalBlocked: number;
    avgBlockedPerExecution: number;
  };
  wordstat: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    totalKeywords: number;
  };
}

interface Project {
  id: number;
  name: string;
  user_id: string;
  client_login: string;
  is_configured: boolean;
  tasks_count: number;
  active_tasks_count: number;
  total_executions: number;
  total_blocked: number;
  last_execution_at: string;
}

interface DashboardStats {
  kpi: any;
  activity_chart: any[];
  recent_activity: any[];
  problematic_projects: any[];
  stale_tasks: any[];
}

interface WorkersHealth {
  queue_status: any[];
  problematic_queue: any[];
  old_pending: any[];
  execution_types_24h: any[];
  hourly_activity: any[];
  recent_errors: any[];
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [workersHealth, setWorkersHealth] = useState<WorkersHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [projectTasks, setProjectTasks] = useState<{[key: number]: any[]}>({});

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (selectedTab === 'projects') {
      loadProjects();
    } else if (selectedTab === 'dashboard') {
      loadDashboardStats();
    } else if (selectedTab === 'workers') {
      loadWorkersHealth();
    }
  }, [selectedTab]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URLS.admin}?action=analytics`, {
        headers: { 'X-Admin-Key': 'directkit_admin_2024' }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch(`${BACKEND_URLS.admin}?action=rsya_projects`, {
        headers: { 'X-Admin-Key': 'directkit_admin_2024' }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URLS.admin}?action=rsya_dashboard_stats`, {
        headers: { 'X-Admin-Key': 'directkit_admin_2024' }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const loadWorkersHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URLS.admin}?action=rsya_workers_health`, {
        headers: { 'X-Admin-Key': 'directkit_admin_2024' }
      });
      if (response.ok) {
        const data = await response.json();
        setWorkersHealth(data);
      }
    } catch (error) {
      console.error('Failed to load workers health:', error);
    }
  };

  const loadProjectTasks = async (projectId: number) => {
    if (projectTasks[projectId]) return;
    
    try {
      const response = await fetch(`${BACKEND_URLS.admin}?action=rsya_project_detail&project_id=${projectId}`, {
        headers: { 'X-Admin-Key': 'directkit_admin_2024' }
      });
      if (response.ok) {
        const data = await response.json();
        setProjectTasks(prev => ({ ...prev, [projectId]: data.tasks_stats || [] }));
      }
    } catch (error) {
      console.error('Failed to load project tasks:', error);
    }
  };

  const toggleProject = (projectId: number) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
      loadProjectTasks(projectId);
    }
  };

  const deleteProject = async (projectId: number, projectName: string) => {
    if (!confirm(`Вы уверены что хотите удалить проект "${projectName}" (ID: ${projectId})?\n\nЭто удалит:\n- Проект\n- Все задачи проекта\n- Все логи выполнений\n- Все записи в очереди блокировок\n- Все логи блокировок\n\nДействие необратимо!`)) return;
    
    try {
      const response = await fetch(`${BACKEND_URLS.admin}?action=delete_project&project_id=${projectId}`, {
        method: 'POST',
        headers: {
          'X-Admin-Key': 'directkit_admin_2024',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Проект удален!\n${data.message}`);
        loadProjects();
        loadAnalytics();
      } else {
        alert('Ошибка при удалении проекта');
      }
    } catch (error) {
      alert(`Ошибка: ${error}`);
    }
  };

  const deleteTask = async (taskId: number, taskDescription: string, projectId: number) => {
    if (!confirm(`Вы уверены что хотите удалить задачу "${taskDescription}" (ID: ${taskId})?\n\nЭто удалит:\n- Задачу\n- Все логи выполнений задачи\n- Все записи в очереди блокировок\n- Все логи блокировок\n\nДействие необратимо!`)) return;
    
    try {
      const response = await fetch(`${BACKEND_URLS.admin}?action=delete_task&task_id=${taskId}`, {
        method: 'POST',
        headers: {
          'X-Admin-Key': 'directkit_admin_2024',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Задача удалена!\n${data.message}`);
        setProjectTasks(prev => ({ ...prev, [projectId]: [] }));
        loadProjectTasks(projectId);
        loadProjects();
        loadAnalytics();
      } else {
        alert('Ошибка при удалении задачи');
      }
    } catch (error) {
      alert(`Ошибка: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 overflow-auto ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка аналитики...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto ml-64">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Аналитика системы</h1>
            <p className="text-muted-foreground">Полная информация по проектам, задачам и воркерам</p>
          </div>

          {analytics && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Icon name="Folder" size={16} className="text-blue-500" />
                    Проекты
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.overview.totalProjects}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analytics.overview.activeProjects} активных
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Icon name="CheckSquare" size={16} className="text-green-500" />
                    Задачи РССЯ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.overview.totalTasks}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analytics.overview.activeTasks} активных
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Icon name="Play" size={16} className="text-purple-500" />
                    Выполнений
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.rsya.totalExecutions}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analytics.rsya.successfulExecutions} успешных
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Icon name="Ban" size={16} className="text-red-500" />
                    Заблокировано
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.rsya.totalBlocked}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    площадок всего
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="projects">Проекты</TabsTrigger>
              <TabsTrigger value="dashboard">Дашборд</TabsTrigger>
              <TabsTrigger value="workers">Воркеры</TabsTrigger>
              <TabsTrigger value="cleanup">Очистка</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {analytics && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Статистика РССЯ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Всего выполнений:</span>
                        <span className="font-semibold">{analytics.rsya.totalExecutions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Успешных:</span>
                        <span className="font-semibold text-green-600">{analytics.rsya.successfulExecutions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">С ошибками:</span>
                        <span className="font-semibold text-red-600">{analytics.rsya.failedExecutions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Заблокировано площадок:</span>
                        <span className="font-semibold">{analytics.rsya.totalBlocked}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Среднее за запуск:</span>
                        <span className="font-semibold">{analytics.rsya.avgBlockedPerExecution.toFixed(1)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Статистика Wordstat</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">В ожидании:</span>
                        <span className="font-semibold">{analytics.wordstat.pending}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">В работе:</span>
                        <span className="font-semibold text-blue-600">{analytics.wordstat.processing}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Выполнено:</span>
                        <span className="font-semibold text-green-600">{analytics.wordstat.completed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">С ошибками:</span>
                        <span className="font-semibold text-red-600">{analytics.wordstat.failed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Всего ключей:</span>
                        <span className="font-semibold">{analytics.wordstat.totalKeywords}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Folder" size={20} className="text-blue-500" />
                    Все проекты ({projects.length})
                  </CardTitle>
                  <CardDescription>
                    Полный список проектов с ID, задачами и статистикой
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <p className="text-muted-foreground">Загрузка проектов...</p>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div key={project.id} className="border rounded-lg overflow-hidden">
                          <div className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleProject(project.id)}
                                    className="hover:bg-gray-200 p-1 rounded transition-colors"
                                  >
                                    <Icon 
                                      name={expandedProject === project.id ? "ChevronDown" : "ChevronRight"} 
                                      size={20} 
                                      className="text-gray-500"
                                    />
                                  </button>
                                  <h3 className="font-semibold text-lg">{project.name}</h3>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    ID: {project.id}
                                  </span>
                                  {project.is_configured && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                      Настроен
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 ml-9">
                                  User ID: {project.user_id} • Login: {project.client_login || 'Не указан'}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteProject(project.id, project.name)}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center gap-1"
                              >
                                <Icon name="Trash2" size={14} />
                                Удалить
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4 text-sm ml-9">
                              <div>
                                <span className="text-muted-foreground">Задач:</span>
                                <span className="ml-2 font-semibold">{project.tasks_count}</span>
                                <span className="text-green-600 ml-1">({project.active_tasks_count} активных)</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Выполнений:</span>
                                <span className="ml-2 font-semibold">{project.total_executions}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Заблокировано:</span>
                                <span className="ml-2 font-semibold">{project.total_blocked}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Последний запуск:</span>
                                <span className="ml-2 font-semibold">
                                  {project.last_execution_at 
                                    ? new Date(project.last_execution_at).toLocaleString('ru-RU')
                                    : 'Никогда'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {expandedProject === project.id && (
                            <div className="bg-gray-50 p-4 border-t">
                              <h4 className="font-semibold mb-3 ml-9">Задачи проекта:</h4>
                              {!projectTasks[project.id] ? (
                                <p className="text-muted-foreground ml-9">Загрузка задач...</p>
                              ) : projectTasks[project.id].length === 0 ? (
                                <p className="text-muted-foreground ml-9">Нет задач</p>
                              ) : (
                                <div className="space-y-2 ml-9">
                                  {projectTasks[project.id].map((task: any) => (
                                    <div key={task.id} className="flex items-center justify-between p-3 bg-white border rounded">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{task.description}</span>
                                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                            ID: {task.id}
                                          </span>
                                          {task.enabled ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                              Активна
                                            </span>
                                          ) : (
                                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                              Отключена
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                          Выполнений: {task.total_executions} • 
                                          Заблокировано: {task.total_blocked} • 
                                          Ошибок: {task.errors}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => deleteTask(task.id, task.description, project.id)}
                                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 flex items-center gap-1"
                                      >
                                        <Icon name="Trash2" size={12} />
                                        Удалить
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-6">
              {dashboardStats ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="Activity" size={20} className="text-purple-500" />
                        Последняя активность
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardStats.recent_activity && dashboardStats.recent_activity.map((activity: any) => (
                          <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Execution #{activity.id}</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  Project #{activity.project_id}
                                </span>
                                {activity.task_id && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    Task #{activity.task_id}
                                  </span>
                                )}
                                <span className={`text-xs px-2 py-1 rounded ${
                                  activity.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {activity.status}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.project_name} • {activity.task_description || 'Без описания'}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-semibold">{activity.placements_blocked || 0} заблокировано</div>
                              <div className="text-muted-foreground">
                                {new Date(activity.started_at).toLocaleString('ru-RU')}
                              </div>
                              {activity.duration_seconds && (
                                <div className="text-xs text-muted-foreground">
                                  {activity.duration_seconds.toFixed(1)}s
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {dashboardStats.problematic_projects && dashboardStats.problematic_projects.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="AlertTriangle" size={20} className="text-red-500" />
                          Проблемные проекты
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {dashboardStats.problematic_projects && dashboardStats.problematic_projects.map((proj: any) => (
                            <div key={proj.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                              <div>
                                <div className="font-semibold">{proj.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Project ID: {proj.id} • User ID: {proj.user_id}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-red-600">{proj.errors} ошибок</div>
                                <div className="text-sm text-muted-foreground">
                                  из {proj.total_executions} выполнений
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {dashboardStats.stale_tasks && dashboardStats.stale_tasks.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="Clock" size={20} className="text-orange-500" />
                          Задачи без выполнений
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {dashboardStats.stale_tasks && dashboardStats.stale_tasks.map((task: any) => (
                            <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{task.description}</span>
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    Task ID: {task.id}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Проект: {task.project_name} (ID: {task.project_id})
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <div className="text-orange-600 font-semibold">
                                  {Math.floor(task.hours_since_execution)} часов назад
                                </div>
                                <div className="text-muted-foreground">
                                  {new Date(task.last_executed_at).toLocaleString('ru-RU')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Загрузка статистики...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="workers" className="space-y-6">
              {workersHealth ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="ListTree" size={20} className="text-blue-500" />
                        Статус очереди
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        {workersHealth.queue_status && workersHealth.queue_status.map((status: any) => (
                          <div key={status.status} className="p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{status.count}</div>
                            <div className="text-sm text-muted-foreground capitalize">{status.status}</div>
                            {status.total_cost > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                ₽{status.total_cost.toFixed(2)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {workersHealth.recent_errors && workersHealth.recent_errors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="XCircle" size={20} className="text-red-500" />
                          Последние ошибки (24ч)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {workersHealth.recent_errors && workersHealth.recent_errors.map((error: any) => (
                            <div key={error.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">Execution #{error.id}</span>
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {error.execution_type}
                                  </span>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    Project #{error.project_id}
                                  </span>
                                  {error.task_id && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                      Task #{error.task_id}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(error.started_at).toLocaleString('ru-RU')}
                                </div>
                              </div>
                              <div className="text-sm">
                                <div className="text-muted-foreground mb-1">
                                  {error.project_name} • {error.task_description || 'Без описания'}
                                </div>
                                <div className="font-mono text-xs bg-white p-2 rounded border">
                                  {error.error_message}
                                </div>
                                {error.request_id && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Request ID: {error.request_id}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {workersHealth.problematic_queue && workersHealth.problematic_queue.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="AlertCircle" size={20} className="text-orange-500" />
                          Проблемные записи в очереди (3+ попыток)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {workersHealth.problematic_queue && workersHealth.problematic_queue.map((item: any) => (
                            <div key={item.id} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold">{item.domain}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Project: {item.project_name} (ID: {item.project_id})
                                    {item.task_description && ` • Task: ${item.task_description}`}
                                  </div>
                                  <div className="text-xs font-mono mt-1 text-red-600">
                                    {item.error_message}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-orange-600">
                                    {item.attempts} попыток
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {item.status}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ₽{item.cost} • {item.clicks} кликов
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {workersHealth.execution_types_24h && workersHealth.execution_types_24h.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="BarChart" size={20} className="text-green-500" />
                          Типы выполнений (24ч)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {workersHealth.execution_types_24h && workersHealth.execution_types_24h.map((type: any) => (
                            <div key={type.execution_type} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-semibold">{type.execution_type}</div>
                                <div className="text-sm text-muted-foreground">
                                  {type.count} выполнений • {type.total_blocked} заблокировано
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <div className="text-green-600">{type.completed} успешных</div>
                                <div className="text-red-600">{type.errors} ошибок</div>
                                <div className="text-muted-foreground">
                                  ~{Number(type.avg_duration_seconds || 0).toFixed(1)}s
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Загрузка данных о воркерах...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cleanup" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Trash2" size={20} className="text-red-500" />
                    Очистка данных
                  </CardTitle>
                  <CardDescription>
                    Удаление старых и неактуальных записей из базы данных
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CleanupSection title="Удалить старые pending батчи (>24ч)" action="delete_old_batches" />
                  <CleanupSection title="Удалить все pending батчи" action="delete_all_pending_batches" />
                  <CleanupSection title="Очистить campaign locks" action="clean_campaign_locks" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function CleanupSection({ title, action }: { title: string; action: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; deleted?: number } | null>(null);

  const handleCleanup = async () => {
    if (!confirm(`Вы уверены что хотите выполнить: ${title}?`)) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const url = `${BACKEND_URLS.admin}?action=${action}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Admin-Key': 'directkit_admin_2024',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        setResult({ success: false, message: 'Ошибка при выполнении операции' });
      }
    } catch (error) {
      setResult({ success: false, message: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        {result && (
          <p className={`text-sm mt-1 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
            {result.message} {result.deleted !== undefined && `(${result.deleted} записей)`}
          </p>
        )}
      </div>
      <button
        onClick={handleCleanup}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Удаление...
          </>
        ) : (
          <>
            <Icon name="Trash2" size={16} />
            Удалить
          </>
        )}
      </button>
    </div>
  );
}