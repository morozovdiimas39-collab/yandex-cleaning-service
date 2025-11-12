import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface TaskStats {
  id: number;
  description: string;
  enabled: boolean;
  project_name: string;
  total_placements: number;
  blocked_placements: number;
  pending_placements: number;
  total_cost: string;
}

const RSYACleaningDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskStats[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const statsApiUrl = 'https://functions.poehali.dev/d3cebabe-3f18-4fe6-bd7c-30e46d781398';
  const ITEMS_PER_PAGE = 10;

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsResponse, tasksResponse] = await Promise.all([
        fetch(`${statsApiUrl}?stats=overview`, {
          headers: { 'X-User-Id': '1' }
        }),
        fetch(`${statsApiUrl}?stats=tasks`, {
          headers: { 'X-User-Id': '1' }
        })
      ]);
      
      if (!statsResponse.ok) {
        const text = await statsResponse.text();
        throw new Error(`HTTP ${statsResponse.status}: ${text}`);
      }
      
      if (!tasksResponse.ok) {
        const text = await tasksResponse.text();
        throw new Error(`HTTP ${tasksResponse.status}: ${text}`);
      }
      
      const statsResult = await statsResponse.json();
      const tasksResult = await tasksResponse.json();
      
      console.log('✅ Data loaded:', statsResult, tasksResult);
      setData(statsResult);
      setTasks(tasksResult.tasks || []);
      setTotalPages(Math.ceil((tasksResult.tasks || []).length / ITEMS_PER_PAGE));
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Icon name="Loader2" className="animate-spin h-12 w-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadData}>Повторить</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Дашборд чистки РСЯ</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Статистика выполнений</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.execution_stats && data.execution_stats.length > 0 ? (
              <div className="space-y-2">
                {data.execution_stats.map((stat: any) => (
                  <div key={stat.execution_type} className="border-b pb-2">
                    <div className="font-medium">{stat.execution_type}</div>
                    <div className="text-sm text-muted-foreground">
                      Выполнений: {stat.executions} | Найдено: {stat.total_found} | 
                      Заблокировано: {stat.total_blocked}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Нет данных</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Очередь блокировок</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.queue_stats && data.queue_stats.length > 0 ? (
              <div className="space-y-2">
                {data.queue_stats.map((stat: any) => (
                  <div key={stat.status} className="flex justify-between">
                    <span className="font-medium">{stat.status}</span>
                    <span>{stat.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Нет данных</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Все задачи по проектам</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Проект</TableHead>
                    <TableHead>Задача</TableHead>
                    <TableHead className="text-right">Всего площадок</TableHead>
                    <TableHead className="text-right">Заблокировано</TableHead>
                    <TableHead className="text-right">В очереди</TableHead>
                    <TableHead className="text-right">Расходы, ₽</TableHead>
                    <TableHead className="text-center">Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.id}</TableCell>
                        <TableCell>{task.project_name}</TableCell>
                        <TableCell>{task.description}</TableCell>
                        <TableCell className="text-right">{task.total_placements}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-600 font-medium">{task.blocked_placements}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-yellow-600 font-medium">{task.pending_placements}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {task.total_cost ? parseFloat(task.total_cost).toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell className="text-center">
                          {task.enabled ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              Активна
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              Выключена
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Нет задач</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Последние выполнения</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recent_executions && data.recent_executions.length > 0 ? (
            <div className="space-y-2">
              {data.recent_executions.map((exec: any) => (
                <div key={exec.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{exec.execution_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {exec.project_name} - {exec.task_description}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(exec.started_at).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  <div className="text-sm mt-1">
                    Найдено: {exec.placements_found} | Совпало: {exec.placements_matched} | 
                    В очередь: {exec.placements_sent_to_queue} | Заблокировано: {exec.placements_blocked}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Нет выполнений</p>
              <Button 
                onClick={() => window.open('https://functions.poehali.dev/d26aaae5-ffb1-46ce-bc94-e692335fdfda', '_blank')}
              >
                Запустить функцию чистки
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4">
        <Button onClick={loadData}>
          <Icon name="RefreshCw" className="mr-2 h-4 w-4" />
          Обновить
        </Button>
      </div>
    </div>
  );
};

export default RSYACleaningDashboard;