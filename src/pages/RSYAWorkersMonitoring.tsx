import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

const RSYAWorkersMonitoring = () => {
  const [workersData, setWorkersData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const loadWorkersHealth = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${BACKEND_URLS.admin}?action=rsya_workers_health`, {
        headers: { 'X-Admin-Key': 'directkit_admin_2024' }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setWorkersData(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных воркеров');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkersHealth();
    
    const interval = setInterval(() => {
      loadWorkersHealth();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !workersData) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 overflow-auto ml-64 flex items-center justify-center">
          <div className="text-center">
            <Icon name="Loader2" className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Загрузка данных воркеров...</p>
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
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Мониторинг воркеров РСЯ</h1>
            <p className="text-muted-foreground">Статус воркеров, scheduler'ов и очереди блокировок</p>
            <p className="text-xs text-muted-foreground mt-1">Обновляется каждые 15 секунд</p>
          </div>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {workersData && (
            <>
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                {workersData.queue_status.map((status: any) => (
                  <Card key={status.status}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Очередь: {status.status}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${
                        status.status === 'pending' ? 'text-yellow-600' :
                        status.status === 'processing' ? 'text-blue-600' :
                        status.status === 'blocked' ? 'text-green-600' :
                        'text-red-600'
                      }`}>
                        {status.count}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Попыток: {parseFloat(status.avg_attempts).toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Расход: {parseFloat(status.total_cost).toFixed(2)} ₽
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Статистика выполнений по типам (24ч)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {workersData.execution_types_24h.length > 0 ? (
                      <div className="space-y-3">
                        {workersData.execution_types_24h.map((type: any) => (
                          <div key={type.execution_type} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{type.execution_type}</Badge>
                              <span className="text-lg font-bold">{type.count}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <div className="text-green-600 font-semibold">{type.completed}</div>
                                <div className="text-xs text-muted-foreground">Успешно</div>
                              </div>
                              <div>
                                <div className="text-red-600 font-semibold">{type.errors}</div>
                                <div className="text-xs text-muted-foreground">Ошибок</div>
                              </div>
                              <div>
                                <div className="font-semibold">{parseFloat(type.avg_duration_seconds).toFixed(1)}с</div>
                                <div className="text-xs text-muted-foreground">Ср. время</div>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t">
                              <span className="text-red-600 font-bold">{type.total_blocked}</span>
                              <span className="text-xs text-muted-foreground ml-1">площадок заблокировано</span>
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
                    <CardTitle>Активность по часам (24ч)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {workersData.hourly_activity.length > 0 ? (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {workersData.hourly_activity.slice().reverse().map((hour: any) => (
                          <div key={hour.hour} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <div className="text-xs text-muted-foreground w-32">
                              {new Date(hour.hour).toLocaleString('ru-RU', { 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                              <div>
                                <div className="font-semibold">{hour.executions}</div>
                                <div className="text-xs text-muted-foreground">Запусков</div>
                              </div>
                              <div>
                                <div className="text-green-600 font-semibold">{hour.completed}</div>
                                <div className="text-xs text-muted-foreground">OK</div>
                              </div>
                              <div>
                                <div className="text-red-600 font-semibold">{hour.errors}</div>
                                <div className="text-xs text-muted-foreground">Ошибок</div>
                              </div>
                              <div>
                                <div className="text-red-600 font-bold">{hour.blocked}</div>
                                <div className="text-xs text-muted-foreground">Заблок.</div>
                              </div>
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

              {workersData.problematic_queue.length > 0 && (
                <Card className="mb-6 border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="AlertCircle" className="text-red-600" size={20} />
                      Проблемные записи в очереди (≥3 попыток)
                    </CardTitle>
                    <CardDescription>Площадки с неудачными попытками блокировки</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Домен</TableHead>
                          <TableHead>Проект</TableHead>
                          <TableHead>Задача</TableHead>
                          <TableHead className="text-right">Попыток</TableHead>
                          <TableHead className="text-right">Расход</TableHead>
                          <TableHead>Создано</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Ошибка</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workersData.problematic_queue.slice(0, 20).map((record: any) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-mono text-sm">{record.domain}</TableCell>
                            <TableCell className="text-sm">{record.project_name || `#${record.project_id}`}</TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">{record.task_description || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={record.attempts >= 5 ? "destructive" : "outline"}>
                                {record.attempts}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{parseFloat(record.cost).toFixed(2)} ₽</TableCell>
                            <TableCell className="text-sm">{new Date(record.created_at).toLocaleString('ru-RU')}</TableCell>
                            <TableCell>
                              <Badge variant={record.status === 'failed' ? 'destructive' : 'outline'}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-red-600 max-w-[300px] truncate">
                              {record.error_message || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {workersData.old_pending.length > 0 && (
                <Card className="mb-6 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Clock" className="text-yellow-600" size={20} />
                      Долгие pending записи (>1 часа)
                    </CardTitle>
                    <CardDescription>Площадки, которые долго ждут в очереди</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Домен</TableHead>
                          <TableHead>Проект</TableHead>
                          <TableHead>Задача</TableHead>
                          <TableHead className="text-right">Попыток</TableHead>
                          <TableHead className="text-right">Расход</TableHead>
                          <TableHead>Создано</TableHead>
                          <TableHead className="text-right">Часов ожидания</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workersData.old_pending.slice(0, 20).map((record: any) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-mono text-sm">{record.domain}</TableCell>
                            <TableCell className="text-sm">{record.project_name || `#${record.project_id}`}</TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">{record.task_description || '-'}</TableCell>
                            <TableCell className="text-right">{record.attempts}</TableCell>
                            <TableCell className="text-right">{parseFloat(record.cost).toFixed(2)} ₽</TableCell>
                            <TableCell className="text-sm">{new Date(record.created_at).toLocaleString('ru-RU')}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="text-yellow-600">
                                {parseFloat(record.hours_waiting).toFixed(1)}ч
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {workersData.recent_errors.length > 0 && (
                <Card className="mb-6 border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="XCircle" className="text-red-600" size={20} />
                      Последние ошибки воркеров (24ч)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Тип</TableHead>
                          <TableHead>Проект</TableHead>
                          <TableHead>Задача</TableHead>
                          <TableHead>Дата</TableHead>
                          <TableHead>Ошибка</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workersData.recent_errors.map((err: any) => (
                          <TableRow key={err.id}>
                            <TableCell><Badge variant="outline">{err.execution_type}</Badge></TableCell>
                            <TableCell className="text-sm">{err.project_name || `#${err.project_id}`}</TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">{err.task_description || '-'}</TableCell>
                            <TableCell className="text-sm">{new Date(err.started_at).toLocaleString('ru-RU')}</TableCell>
                            <TableCell className="text-sm text-red-600 max-w-[400px]">
                              <pre className="whitespace-pre-wrap text-xs">{err.error_message}</pre>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RSYAWorkersMonitoring;
