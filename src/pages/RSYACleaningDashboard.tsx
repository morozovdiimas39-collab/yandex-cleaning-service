import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from '@/config/backend-urls';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ViewMode = 'projects' | 'project-detail' | 'task-detail' | 'execution-detail';

interface Project {
  id: number;
  user_id: string;
  name: string;
  client_login: string | null;
  is_configured: boolean;
  tasks_count: number;
  active_tasks_count: number;
  total_executions: number;
  total_blocked: number;
  last_execution_at: string | null;
}

const RSYACleaningDashboard = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<number | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [executionDetail, setExecutionDetail] = useState<any>(null);
  const [executionPlatforms, setExecutionPlatforms] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const ITEMS_PER_PAGE = 20;

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${BACKEND_URLS.admin}?action=rsya_projects`, {
        headers: { 'X-Admin-Key': 'directkit_admin_2024' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetail = async (projectId: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BACKEND_URLS.admin}?action=rsya_project_detail&project_id=${projectId}`, {
        headers: { 'X-Admin-Key': 'directkit_admin_2024' }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setProjectDetail(data);
      setViewMode('project-detail');
      setSelectedProjectId(projectId);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки деталей проекта');
    } finally {
      setLoading(false);
    }
  };

  const loadTaskDetail = async (taskId: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BACKEND_URLS.admin}?action=rsya_task_detail&task_id=${taskId}`, {
        headers: { 'X-Admin-Key': 'directkit_admin_2024' }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setTaskDetail(data);
      setViewMode('task-detail');
      setSelectedTaskId(taskId);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки деталей задачи');
    } finally {
      setLoading(false);
    }
  };

  const loadExecutionDetail = async (executionId: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BACKEND_URLS.admin}?action=rsya_execution_detail&execution_id=${executionId}`, {
        headers: { 'X-Admin-Key': 'directkit_admin_2024' }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setExecutionDetail(data.execution);
      setExecutionPlatforms(data.platforms || []);
      setViewMode('execution-detail');
      setSelectedExecutionId(executionId);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки деталей выполнения');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleBackClick = () => {
    if (viewMode === 'execution-detail') {
      setViewMode('task-detail');
    } else if (viewMode === 'task-detail') {
      setViewMode('project-detail');
    } else if (viewMode === 'project-detail') {
      setViewMode('projects');
    }
    setCurrentPage(1);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.client_login && p.client_login.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && p.is_configured) ||
                          (statusFilter === 'inactive' && !p.is_configured);
    return matchesSearch && matchesStatus;
  });

  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  if (loading && viewMode === 'projects') {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 overflow-auto ml-64 flex items-center justify-center">
          <div className="text-center">
            <Icon name="Loader2" className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Загрузка проектов...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto ml-64">
        <div className="max-w-[1600px] mx-auto p-6">
          {viewMode !== 'projects' && (
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="mb-4"
            >
              <Icon name="ArrowLeft" size={20} className="mr-2" />
              Назад
            </Button>
          )}

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {viewMode === 'projects' && (
            <div>
              <div className="mb-6">
                <h1 className="text-4xl font-bold mb-2">Чистка РССЯ</h1>
                <p className="text-muted-foreground">Все проекты и задачи по автоматической блокировке площадок</p>
              </div>

              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Поиск по названию проекта или логину..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="max-w-md"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все проекты</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="inactive">Неактивные</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Проекты ({filteredProjects.length})</CardTitle>
                  <CardDescription>Клик по строке откроет детали проекта</CardDescription>
                </CardHeader>
                <CardContent>
                  {paginatedProjects.length > 0 ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Название</TableHead>
                            <TableHead>Логин</TableHead>
                            <TableHead className="text-center">Задачи</TableHead>
                            <TableHead className="text-right">Запусков</TableHead>
                            <TableHead className="text-right">Заблокировано</TableHead>
                            <TableHead>Последний запуск</TableHead>
                            <TableHead className="text-center">Статус</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedProjects.map((project) => (
                            <TableRow 
                              key={project.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => loadProjectDetail(project.id)}
                            >
                              <TableCell className="font-medium">{project.id}</TableCell>
                              <TableCell className="font-medium">{project.name}</TableCell>
                              <TableCell className="text-muted-foreground">{project.client_login || '-'}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">
                                  {project.active_tasks_count}/{project.tasks_count}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{project.total_executions}</TableCell>
                              <TableCell className="text-right">
                                <span className="text-red-600 font-semibold">{project.total_blocked}</span>
                              </TableCell>
                              <TableCell>
                                {project.last_execution_at 
                                  ? new Date(project.last_execution_at).toLocaleString('ru-RU')
                                  : <span className="text-muted-foreground">Нет запусков</span>
                                }
                              </TableCell>
                              <TableCell className="text-center">
                                {project.is_configured ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Активен</Badge>
                                ) : (
                                  <Badge variant="secondary">Неактивен</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-sm text-muted-foreground">
                            Страница {currentPage} из {totalPages}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                            >
                              <Icon name="ChevronLeft" size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                            >
                              <Icon name="ChevronRight" size={16} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Icon name="FolderOpen" size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-muted-foreground">Проекты не найдены</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {viewMode === 'project-detail' && projectDetail && (
            <div>
              <h1 className="text-3xl font-bold mb-6">{projectDetail.project_info.name}</h1>
              <p className="text-muted-foreground mb-6">
                ID: {projectDetail.project_info.id} | Логин: {projectDetail.project_info.client_login || '-'}
              </p>
              
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{projectDetail.project_info.tasks_count}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {projectDetail.project_info.active_tasks_count} активных
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Запусков</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{projectDetail.project_info.total_executions}</div>
                    <p className="text-sm text-muted-foreground mt-1">Всего выполнений</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Заблокировано</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{projectDetail.project_info.total_blocked}</div>
                    <p className="text-sm text-muted-foreground mt-1">Площадок заблокировано</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Ошибок</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{projectDetail.project_info.errors}</div>
                    <p className="text-sm text-muted-foreground mt-1">Выполнений с ошибкой</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Задачи проекта</CardTitle>
                  <CardDescription>Клик по задаче откроет детальную статистику</CardDescription>
                </CardHeader>
                <CardContent>
                  {projectDetail.tasks_stats && projectDetail.tasks_stats.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Описание</TableHead>
                          <TableHead>Настройки</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead className="text-right">Запусков</TableHead>
                          <TableHead className="text-right">Заблокировано</TableHead>
                          <TableHead className="text-right">Ошибок</TableHead>
                          <TableHead>Последний запуск</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectDetail.tasks_stats.map((task: any) => {
                          const config = task.config || {};
                          const configParts = [];
                          if (config.min_clicks) configParts.push(`Клики ≥ ${config.min_clicks}`);
                          if (config.min_cost) configParts.push(`Расход ≥ ${config.min_cost}₽`);
                          if (config.max_ctr) configParts.push(`CTR ≤ ${config.max_ctr}%`);
                          if (config.min_conversions !== undefined) configParts.push(`Конверсии ≥ ${config.min_conversions}`);
                          if (config.max_cpc) configParts.push(`CPC ≤ ${config.max_cpc}₽`);
                          
                          return (
                            <TableRow 
                              key={task.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => loadTaskDetail(task.id)}
                            >
                              <TableCell className="font-medium">{task.id}</TableCell>
                              <TableCell>{task.description}</TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[300px]">
                                {configParts.length > 0 ? configParts.join(', ') : '-'}
                              </TableCell>
                              <TableCell>
                                {task.enabled ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Активна</Badge>
                                ) : (
                                  <Badge variant="secondary">Выключена</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{task.total_executions}</TableCell>
                              <TableCell className="text-right">
                                <span className="text-red-600 font-semibold">{task.total_blocked}</span>
                              </TableCell>
                              <TableCell className="text-right">{task.errors}</TableCell>
                              <TableCell>
                                {task.last_executed_at 
                                  ? new Date(task.last_executed_at).toLocaleString('ru-RU')
                                  : <span className="text-muted-foreground">Нет запусков</span>
                                }
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Задачи не найдены</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Последние 20 выполнений</CardTitle>
                </CardHeader>
                <CardContent>
                  {projectDetail.daily_stats && projectDetail.daily_stats.length > 0 && (
                    <div className="mb-4 grid grid-cols-5 gap-4">
                      {projectDetail.daily_stats.slice(0, 7).map((day: any) => (
                        <div key={day.date} className="text-center">
                          <div className="text-xs text-muted-foreground">{new Date(day.date).toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit'})}</div>
                          <div className="text-lg font-bold">{day.total_blocked}</div>
                          <div className="text-xs text-muted-foreground">{day.executions} запусков</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {viewMode === 'task-detail' && taskDetail && (
            <div>
              <h1 className="text-3xl font-bold mb-2">{taskDetail.task_info.description}</h1>
              <p className="text-muted-foreground mb-6">
                ID задачи: {taskDetail.task_info.id} | Проект: {taskDetail.project_name}
              </p>

              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Запусков</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{taskDetail.task_info.total_executions}</div>
                    <div className="text-sm text-green-600 mt-1">✓ {taskDetail.task_info.successful_executions}</div>
                    <div className="text-sm text-red-600">✗ {taskDetail.task_info.failed_executions}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Заблокировано</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{taskDetail.task_info.total_blocked}</div>
                    <p className="text-sm text-muted-foreground mt-1">Всего площадок</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">В очереди</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">{taskDetail.task_info.pending_in_queue}</div>
                    <p className="text-sm text-muted-foreground mt-1">Ожидают блокировки</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Статус</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {taskDetail.task_info.enabled ? (
                      <Badge className="bg-green-100 text-green-800 text-lg py-2 px-4">Активна</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-lg py-2 px-4">Выключена</Badge>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>История выполнений (последние 50)</CardTitle>
                  <CardDescription>Клик по строке откроет список заблокированных площадок</CardDescription>
                </CardHeader>
                <CardContent>
                  {taskDetail.execution_logs && taskDetail.execution_logs.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Тип</TableHead>
                          <TableHead>Дата</TableHead>
                          <TableHead className="text-right">Найдено</TableHead>
                          <TableHead className="text-right">Заблокировано</TableHead>
                          <TableHead className="text-right">Время</TableHead>
                          <TableHead>Статус</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taskDetail.execution_logs.map((log: any) => (
                          <TableRow 
                            key={log.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => loadExecutionDetail(log.id)}
                          >
                            <TableCell className="font-medium">{log.id}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.execution_type}</Badge>
                            </TableCell>
                            <TableCell>{new Date(log.started_at).toLocaleString('ru-RU')}</TableCell>
                            <TableCell className="text-right">{log.placements_found}</TableCell>
                            <TableCell className="text-right">
                              <span className="text-red-600 font-semibold">{log.placements_blocked}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              {log.duration_seconds ? `${log.duration_seconds}с` : '-'}
                            </TableCell>
                            <TableCell>
                              {log.status === 'completed' ? (
                                <Badge className="bg-green-100 text-green-800">Успешно</Badge>
                              ) : log.status === 'error' ? (
                                <Badge className="bg-red-100 text-red-800">Ошибка</Badge>
                              ) : (
                                <Badge variant="secondary">{log.status}</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Выполнений не найдено</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {viewMode === 'execution-detail' && executionDetail && (
            <div>
              <h1 className="text-3xl font-bold mb-2">Детали выполнения #{executionDetail.id}</h1>
              <p className="text-muted-foreground mb-6">
                {executionDetail.project_name} / {executionDetail.task_description}
              </p>

              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Найдено</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{executionDetail.placements_found}</div>
                    <p className="text-sm text-muted-foreground mt-1">Площадок в отчете</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Совпало</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">{executionDetail.placements_matched}</div>
                    <p className="text-sm text-muted-foreground mt-1">По критериям задачи</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Заблокировано</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{executionDetail.placements_blocked}</div>
                    <p className="text-sm text-muted-foreground mt-1">Площадок заблокировано</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Время выполнения</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {executionDetail.duration_seconds ? `${executionDetail.duration_seconds}с` : '-'}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {executionDetail.status === 'completed' ? 'Завершено успешно' : 'Ошибка'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {executionDetail.error_message && (
                <Card className="mb-6 border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800">Ошибка выполнения</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-red-700 whitespace-pre-wrap">{executionDetail.error_message}</pre>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Список заблокированных площадок ({executionPlatforms.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {executionPlatforms.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Домен</TableHead>
                          <TableHead className="text-right">Расход</TableHead>
                          <TableHead className="text-right">Клики</TableHead>
                          <TableHead className="text-right">Конверсии</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Дата блокировки</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {executionPlatforms.map((platform, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{platform.domain}</TableCell>
                            <TableCell className="text-right">{platform.cost?.toFixed(2)} ₽</TableCell>
                            <TableCell className="text-right">{platform.clicks}</TableCell>
                            <TableCell className="text-right">{platform.conversions || 0}</TableCell>
                            <TableCell>
                              {platform.status === 'blocked' ? (
                                <Badge className="bg-green-100 text-green-800">Заблокирован</Badge>
                              ) : platform.status === 'pending' ? (
                                <Badge className="bg-yellow-100 text-yellow-800">В очереди</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">Ошибка</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {platform.blocked_at 
                                ? new Date(platform.blocked_at).toLocaleString('ru-RU')
                                : <span className="text-muted-foreground">-</span>
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Площадок не найдено</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RSYACleaningDashboard;