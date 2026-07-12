import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from '@/config/backend-urls';
import AdminShell from '@/components/layout/AdminShell';
import { adminFetch } from '@/lib/admin-auth';
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
  task_names?: string[];
  tasks_count: number;
  active_tasks_count: number;
  total_executions: number;
  total_blocked: number;
  last_execution_at: string | null;
  next_run_at?: string | null;
  last_run_at?: string | null;
  interval_hours?: number;
  schedule_active?: boolean;
  last_batch_status?: string | null;
  last_batch_completed_at?: string | null;
  last_batch_processing_time_sec?: number | null;
}

const IMPORTANT_PLATFORMS = [
  'yandex.ru', 'ya.ru', 'dzen.ru', 'kinopoisk.ru', 'mail.ru', 'vk.com', 'ok.ru',
  'youtube.com', 'rutube.ru', 'google.com', 'avito.ru', 'wildberries.ru',
  'ozon.ru', 'market.yandex.ru', 'drive2.ru', '2gis.ru', 'rbc.ru', 'ria.ru',
  'lenta.ru', 'tass.ru', 'kommersant.ru', 'rzd.ru', 'tutu.ru', 'aviasales.ru',
  'hh.ru', 'habr.com', 'vc.ru', 'pikabu.ru', 'sportmaster.ru', 'dns-shop.ru',
];

const isImportantPlatform = (domain: string) => {
  const normalized = (domain || '').toLowerCase().trim();
  return IMPORTANT_PLATFORMS.some((important) => normalized === important || normalized.endsWith(`.${important}`));
};

const formatDateTime = (value?: string | null) => (
  value ? new Date(value).toLocaleString('ru-RU') : <span className="text-muted-foreground">-</span>
);

const formatNumber = (value: number | string | null | undefined) => Number(value || 0).toLocaleString('ru-RU');

const getBatchBadgeClass = (status?: string | null) => {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100';
  if (status === 'failed' || status === 'error') return 'bg-red-100 text-red-800 hover:bg-red-100';
  if (status === 'processing') return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
  if (status === 'pending') return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
  return 'bg-slate-100 text-slate-700 hover:bg-slate-100';
};

const getStatusBadge = (status?: string | null) => {
  if (status === 'completed' || status === 'success') {
    return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Успешно</Badge>;
  }
  if (status === 'error' || status === 'failed') {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ошибка</Badge>;
  }
  if (status === 'processing') {
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">В работе</Badge>;
  }
  if (status === 'pending') {
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Ожидает</Badge>;
  }
  return <Badge variant="secondary">{status || '-'}</Badge>;
};

const describeTaskConfig = (config: any) => {
  const parts: string[] = [];
  if (!config) return parts;
  if (config.keywords?.length) parts.push(`Домены: ${config.keywords.slice(0, 3).join(', ')}${config.keywords.length > 3 ? '...' : ''}`);
  if (config.exceptions?.length) parts.push(`Исключения: ${config.exceptions.slice(0, 2).join(', ')}${config.exceptions.length > 2 ? '...' : ''}`);
  if (config.goal_ids?.length) parts.push(`Целей: ${config.goal_ids.length}`);
  if (config.protect_conversions) parts.push('Защита конверсий');
  if (config.min_impressions) parts.push(`Показы >= ${config.min_impressions}`);
  if (config.min_clicks) parts.push(`Клики >= ${config.min_clicks}`);
  if (config.max_clicks) parts.push(`Клики <= ${config.max_clicks}`);
  if (config.min_ctr) parts.push(`CTR >= ${config.min_ctr}%`);
  if (config.max_ctr) parts.push(`CTR <= ${config.max_ctr}%`);
  if (config.min_cpc) parts.push(`CPC >= ${config.min_cpc}₽`);
  if (config.max_cpc) parts.push(`CPC <= ${config.max_cpc}₽`);
  if (config.min_cpa) parts.push(`CPA >= ${config.min_cpa}₽`);
  if (config.max_cpa) parts.push(`CPA >= ${config.max_cpa}₽`);
  if (config.min_conversions !== undefined) parts.push(`Конверсии >= ${config.min_conversions}`);
  return parts;
};

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
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const ITEMS_PER_PAGE = 20;

  const loadDashboardStats = async () => {
    try {
      const response = await adminFetch(`${BACKEND_URLS.admin}?action=rsya_dashboard_stats`);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setDashboardStats(data);
    } catch (err: any) {
      console.error('Ошибка загрузки статистики:', err);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await adminFetch(`${BACKEND_URLS.admin}?action=rsya_projects`);
      
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
      
      const response = await adminFetch(`${BACKEND_URLS.admin}?action=rsya_project_detail&project_id=${projectId}`);
      
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
      
      const response = await adminFetch(`${BACKEND_URLS.admin}?action=rsya_task_detail&task_id=${taskId}`);
      
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
      
      const response = await adminFetch(`${BACKEND_URLS.admin}?action=rsya_execution_detail&execution_id=${executionId}`);
      
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
    loadDashboardStats();
    
    const interval = setInterval(() => {
      if (viewMode === 'projects') {
        loadDashboardStats();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [viewMode]);

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
    const query = searchQuery.toLowerCase();
    const taskNames = (p.task_names || []).join(' ').toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(query) ||
                          (p.client_login && p.client_login.toLowerCase().includes(query)) ||
                          taskNames.includes(query) ||
                          String(p.id).includes(query) ||
                          String(p.user_id).includes(query);
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
      <AdminShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Icon name="Loader2" className="mx-auto mb-4 h-9 w-9 animate-spin text-emerald-600" />
            <p className="text-muted-foreground">Загрузка проектов...</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
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
              <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
                      <Icon name="ShieldCheck" size={22} />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-normal text-slate-950">Админка чистки РСЯ</h1>
                      <p className="text-sm text-slate-500">Проекты, задачи, расписания, батчи и последние примеры площадок</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Icon name="RefreshCw" size={16} />
                  Обновление статистики каждые 30 секунд
                </div>
              </div>

              {dashboardStats && (
                <>
                  <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                    {[
                      { label: 'Проекты', value: `${dashboardStats.kpi.active_projects}/${dashboardStats.kpi.total_projects}`, note: 'активных / всего', icon: 'FolderKanban', tone: 'slate' },
                      { label: 'Задачи', value: `${dashboardStats.kpi.active_tasks}/${dashboardStats.kpi.total_tasks}`, note: 'активных / всего', icon: 'ListChecks', tone: 'emerald' },
                      { label: 'Запусков 24ч', value: dashboardStats.kpi.executions_24h, note: `7д: ${dashboardStats.kpi.executions_7d}`, icon: 'PlayCircle', tone: 'blue' },
                      { label: 'Заблокировано', value: formatNumber(dashboardStats.kpi.total_blocked), note: 'всего площадок', icon: 'Ban', tone: 'red' },
                      { label: 'Ошибок 24ч', value: dashboardStats.kpi.errors_24h, note: 'выполнений с ошибкой', icon: 'TriangleAlert', tone: 'amber' },
                      { label: 'Очередь', value: dashboardStats.kpi.queue_pending + dashboardStats.kpi.queue_processing, note: `ошибок батчей: ${dashboardStats.kpi.queue_failed}`, icon: 'Activity', tone: 'violet' },
                    ].map((metric) => (
                      <Card key={metric.label} className="border-slate-200 shadow-sm">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</span>
                            <Icon name={metric.icon as any} size={18} className="text-slate-400" />
                          </div>
                          <div className="text-2xl font-bold text-slate-950">{metric.value}</div>
                          <p className="mt-1 text-xs text-slate-500">{metric.note}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Топ-5 проектов по выполнениям (30д)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {dashboardStats.top_projects_executions.length > 0 ? (
                          <div className="space-y-3">
                            {dashboardStats.top_projects_executions.map((proj: any) => (
                              <div key={proj.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => loadProjectDetail(proj.id)}>
                                <div>
                                  <div className="font-medium">{proj.name}</div>
                                  <div className="text-xs text-muted-foreground">User: {proj.user_id}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-600">{proj.executions}</div>
                                  <div className="text-xs text-muted-foreground">{proj.total_blocked} заблок.</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Нет данных</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Топ-5 проектов по блокировкам (30д)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {dashboardStats.top_projects_blocks.length > 0 ? (
                          <div className="space-y-3">
                            {dashboardStats.top_projects_blocks.map((proj: any) => (
                              <div key={proj.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => loadProjectDetail(proj.id)}>
                                <div>
                                  <div className="font-medium">{proj.name}</div>
                                  <div className="text-xs text-muted-foreground">User: {proj.user_id}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-red-600">{proj.total_blocked}</div>
                                  <div className="text-xs text-muted-foreground">{proj.executions} запусков</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Нет данных</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {dashboardStats.problematic_projects.length > 0 && (
                    <Card className="mb-6 border-orange-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="AlertTriangle" className="text-orange-600" size={20} />
                          Проблемные проекты (с ошибками за 7д)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {dashboardStats.problematic_projects.map((proj: any) => (
                            <div key={proj.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100" onClick={() => loadProjectDetail(proj.id)}>
                              <div>
                                <div className="font-medium">{proj.name}</div>
                                <div className="text-xs text-muted-foreground">User: {proj.user_id}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-orange-600">{proj.errors} ошибок</div>
                                <div className="text-xs text-muted-foreground">из {proj.total_executions} запусков</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Последняя активность</CardTitle>
                      <CardDescription>Обновляется каждые 30 секунд</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dashboardStats.recent_activity.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Проект</TableHead>
                              <TableHead>Задача</TableHead>
                              <TableHead>Дата</TableHead>
                              <TableHead className="text-right">Найдено</TableHead>
                              <TableHead className="text-right">Заблок.</TableHead>
                              <TableHead>Статус</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dashboardStats.recent_activity.map((act: any) => (
                              <TableRow key={act.id} className="cursor-pointer hover:bg-gray-50" onClick={() => loadExecutionDetail(act.id)}>
                                <TableCell>
                                  <div className="font-medium">{act.project_name || `#${act.project_id}`}</div>
                                  <div className="text-xs text-muted-foreground">User: {act.user_id}</div>
                                </TableCell>
                                <TableCell className="text-sm">{act.task_description || '-'}</TableCell>
                                <TableCell className="text-sm">{new Date(act.started_at).toLocaleString('ru-RU')}</TableCell>
                                <TableCell className="text-right">{act.placements_found || 0}</TableCell>
                                <TableCell className="text-right"><span className="text-red-600 font-semibold">{act.placements_blocked || 0}</span></TableCell>
                                <TableCell>
                                  {act.status === 'completed' ? (
                                    <Badge className="bg-green-100 text-green-800">Успешно</Badge>
                                  ) : act.status === 'error' ? (
                                    <Badge className="bg-red-100 text-red-800">Ошибка</Badge>
                                  ) : (
                                    <Badge variant="secondary">{act.status}</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">Нет активности</p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Поиск по проекту, задаче, логину, ID пользователя..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
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

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>Проекты и задачи ({filteredProjects.length})</CardTitle>
                      <CardDescription>Все названия проектов и первые задачи видны сразу. Клик по строке откроет детали.</CardDescription>
                    </div>
                    <Badge variant="outline" className="shrink-0">{projects.length} всего</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {paginatedProjects.length > 0 ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[90px]">ID</TableHead>
                            <TableHead>Проект и задачи</TableHead>
                            <TableHead>Аккаунт</TableHead>
                            <TableHead className="text-center">Активность</TableHead>
                            <TableHead className="text-right">Запусков</TableHead>
	                            <TableHead className="text-right">Заблокировано</TableHead>
	                            <TableHead>Последний запуск</TableHead>
	                            <TableHead>Следующий запуск</TableHead>
	                            <TableHead>Батч</TableHead>
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
                              <TableCell className="align-top">
                                <div className="font-semibold text-slate-900">#{project.id}</div>
                                <div className="font-mono text-xs text-slate-400">u{project.user_id}</div>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="font-semibold text-slate-950">{project.name}</div>
                                <div className="mt-2 flex max-w-[520px] flex-wrap gap-1.5">
                                  {(project.task_names || []).length > 0 ? (
                                    <>
                                      {(project.task_names || []).slice(0, 4).map((taskName) => (
                                        <Badge key={taskName} variant="outline" className="max-w-[240px] truncate bg-slate-50 text-slate-700">
                                          {taskName}
                                        </Badge>
                                      ))}
                                      {(project.task_names || []).length > 4 && (
                                        <Badge variant="secondary">+{(project.task_names || []).length - 4}</Badge>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-sm text-slate-400">Задач нет</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="text-sm text-slate-700">{project.client_login || 'Client-Login не указан'}</div>
                                <div className="mt-1 text-xs text-slate-400">User ID: {project.user_id}</div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={project.active_tasks_count > 0 ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-100'}>
                                  {project.active_tasks_count}/{project.tasks_count}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{project.total_executions}</TableCell>
                              <TableCell className="text-right">
                                <span className="text-red-600 font-semibold">{project.total_blocked}</span>
                              </TableCell>
                              <TableCell>
	                                {project.last_execution_at ? formatDateTime(project.last_execution_at) : <span className="text-muted-foreground">Нет запусков</span>}
	                              </TableCell>
	                              <TableCell>
	                                {project.schedule_active ? formatDateTime(project.next_run_at) : <Badge variant="secondary">Пауза</Badge>}
	                              </TableCell>
	                              <TableCell>
	                                {project.last_batch_status ? (
	                                  <div className="space-y-1">
	                                    <Badge className={getBatchBadgeClass(project.last_batch_status)}>{project.last_batch_status}</Badge>
	                                    {project.last_batch_processing_time_sec ? (
	                                      <div className="text-xs text-muted-foreground">{project.last_batch_processing_time_sec}с</div>
	                                    ) : null}
	                                  </div>
	                                ) : <span className="text-muted-foreground">-</span>}
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
              <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline">Проект #{projectDetail.project_info.id}</Badge>
                    {projectDetail.project_info.is_configured ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Настроен</Badge>
                    ) : (
                      <Badge variant="secondary">Не настроен</Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-slate-950">{projectDetail.project_info.name}</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    User ID: {projectDetail.project_info.user_id} · Client-Login: {projectDetail.project_info.client_login || 'не указан'}
                  </p>
                </div>
                <Button variant="outline" onClick={() => loadProjectDetail(projectDetail.project_info.id)}>
                  <Icon name="RefreshCw" size={16} className="mr-2" />
                  Обновить проект
                </Button>
              </div>
              
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
	                    <CardTitle className="text-sm font-medium">Следующий запуск</CardTitle>
	                  </CardHeader>
	                  <CardContent>
	                    <div className="text-lg font-bold">
	                      {projectDetail.project_info.schedule_active ? formatDateTime(projectDetail.project_info.next_run_at) : 'Пауза'}
	                    </div>
	                    <p className="text-sm text-muted-foreground mt-1">
	                      Интервал: {projectDetail.project_info.interval_hours || '-'}ч
	                    </p>
	                  </CardContent>
	                </Card>
              </div>

	              {projectDetail.project_info.last_batch_status && (
	                <Card className="mb-6">
	                  <CardHeader>
	                    <CardTitle>Последний батч</CardTitle>
	                    <CardDescription>Фактический статус последней обработки проекта</CardDescription>
	                  </CardHeader>
	                  <CardContent className="grid md:grid-cols-4 gap-4 text-sm">
	                    <div>
	                      <div className="text-muted-foreground">Статус</div>
	                      <Badge className={projectDetail.project_info.last_batch_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
	                        {projectDetail.project_info.last_batch_status}
	                      </Badge>
	                    </div>
	                    <div>
	                      <div className="text-muted-foreground">Старт</div>
	                      <div className="font-medium">{formatDateTime(projectDetail.project_info.last_batch_started_at)}</div>
	                    </div>
	                    <div>
	                      <div className="text-muted-foreground">Финиш</div>
	                      <div className="font-medium">{formatDateTime(projectDetail.project_info.last_batch_completed_at)}</div>
	                    </div>
	                    <div>
	                      <div className="text-muted-foreground">Время</div>
	                      <div className="font-medium">{projectDetail.project_info.last_batch_processing_time_sec || '-'}с</div>
	                    </div>
	                  </CardContent>
	                </Card>
	              )}

	              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Задачи проекта</CardTitle>
                  <CardDescription>Все названия задач, правила, запуски и ошибки по проекту</CardDescription>
                </CardHeader>
                <CardContent>
                  {projectDetail.tasks_stats && projectDetail.tasks_stats.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[90px]">ID</TableHead>
                          <TableHead>Задача</TableHead>
                          <TableHead>Правила</TableHead>
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
                          const configParts = describeTaskConfig(config);
                          
                          return (
                            <TableRow 
                              key={task.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => loadTaskDetail(task.id)}
                            >
                              <TableCell className="align-top font-medium">t{task.id}</TableCell>
                              <TableCell className="align-top">
                                <div className="font-semibold text-slate-950">{task.description}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  Последний батч: {task.last_batch_completed_at ? formatDateTime(task.last_batch_completed_at) : 'нет'}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[420px] align-top text-sm text-muted-foreground">
                                {configParts.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {configParts.slice(0, 6).map((part) => (
                                      <Badge key={part} variant="outline" className="bg-slate-50 text-slate-700">{part}</Badge>
                                    ))}
                                    {configParts.length > 6 && <Badge variant="secondary">+{configParts.length - 6}</Badge>}
                                  </div>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                {task.enabled ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Активна</Badge>
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
                                  ? formatDateTime(task.last_executed_at)
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
	                  <CardTitle>Примеры площадок ({executionPlatforms.length})</CardTitle>
	                  <CardDescription>Заблокированные, совпавшие и оставленные примеры по этому выполнению</CardDescription>
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
	                          <TableRow key={idx} className={isImportantPlatform(platform.domain) ? 'bg-amber-50' : ''}>
	                            <TableCell className="font-medium">
	                              <div className="flex items-center gap-2">
	                                <span>{platform.domain}</span>
	                                {isImportantPlatform(platform.domain) && (
	                                  <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">важная</Badge>
	                                )}
	                              </div>
	                            </TableCell>
                            <TableCell className="text-right">{platform.cost?.toFixed(2)} ₽</TableCell>
                            <TableCell className="text-right">{platform.clicks}</TableCell>
                            <TableCell className="text-right">{platform.conversions || 0}</TableCell>
                            <TableCell>
	                              {platform.status === 'blocked' ? (
	                                <Badge className="bg-red-100 text-red-800">Заблокируется</Badge>
	                              ) : platform.status === 'kept_example' ? (
	                                <Badge className="bg-green-100 text-green-800">Останется</Badge>
	                              ) : platform.status === 'matched_not_blocked' ? (
	                                <Badge className="bg-orange-100 text-orange-800">Совпала, не заблокирована</Badge>
	                              ) : (
	                                <Badge variant="secondary">{platform.status}</Badge>
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
    </AdminShell>
  );
};

export default RSYACleaningDashboard;
