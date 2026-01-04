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

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    console.log('🔄 Loading admin analytics...');
    setLoading(true);
    try {
      const url = `${BACKEND_URLS.admin}?action=analytics`;
      console.log('📡 Fetching from:', url);
      
      const response = await fetch(url, {
        headers: {
          'X-Admin-Key': 'directkit_admin_2024'
        }
      });

      console.log('📊 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Analytics data loaded:', data);
        setAnalytics(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Failed to load analytics:', error);
    } finally {
      setLoading(false);
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
            <p className="text-muted-foreground">Полная статистика по всем процессам</p>
          </div>

          {analytics && (
            <>
              {/* Общие метрики */}
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
                      <Icon name="Users" size={16} className="text-purple-500" />
                      Пользователи
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analytics.overview.totalUsers}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Всего зарегистрировано
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Icon name="ListTree" size={16} className="text-orange-500" />
                      Очередь блокировок
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analytics.overview.totalBlockQueue}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Площадок в очереди
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="rsya" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="rsya">Чистка РССЯ</TabsTrigger>
                  <TabsTrigger value="wordstat">Сбор ключей</TabsTrigger>
                  <TabsTrigger value="cleanup">Очистка данных</TabsTrigger>
                </TabsList>

                <TabsContent value="rsya" className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="Play" size={20} className="text-blue-500" />
                          Выполнено запусков
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{analytics.rsya.totalExecutions}</div>
                        <div className="flex gap-4 mt-4 text-sm">
                          <div>
                            <span className="text-green-600 font-semibold">{analytics.rsya.successfulExecutions}</span>
                            <span className="text-muted-foreground ml-1">успешных</span>
                          </div>
                          <div>
                            <span className="text-red-600 font-semibold">{analytics.rsya.failedExecutions}</span>
                            <span className="text-muted-foreground ml-1">с ошибками</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="Ban" size={20} className="text-red-500" />
                          Заблокировано площадок
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-red-600">{analytics.rsya.totalBlocked}</div>
                        <p className="text-sm text-muted-foreground mt-4">
                          Всего площадок заблокировано
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="TrendingUp" size={20} className="text-orange-500" />
                          Среднее за запуск
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-orange-600">
                          {analytics.rsya.avgBlockedPerExecution.toFixed(1)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                          Площадок блокируется в среднем
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="wordstat" className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="ListChecks" size={20} className="text-blue-500" />
                          Всего задач
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{analytics.overview.totalWordstatTasks}</div>
                        <div className="space-y-2 mt-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">В ожидании:</span>
                            <span className="font-semibold">{analytics.wordstat.pending}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">В работе:</span>
                            <span className="font-semibold text-blue-600">{analytics.wordstat.processing}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="CheckCircle2" size={20} className="text-green-500" />
                          Выполнено
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-green-600">{analytics.wordstat.completed}</div>
                        <p className="text-sm text-muted-foreground mt-4">
                          Успешно завершённых задач
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="XCircle" size={20} className="text-red-500" />
                          С ошибками
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-red-600">{analytics.wordstat.failed}</div>
                        <p className="text-sm text-muted-foreground mt-4">
                          Задач завершилось с ошибкой
                        </p>
                      </CardContent>
                    </Card>
                  </div>
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
                      <CleanupSection title="Удалить старые pending батчи" action="delete_old_batches" />
                      <CleanupSection title="Удалить все pending батчи" action="delete_all_pending_batches" />
                      <CleanupSection title="Очистить campaign locks" action="clean_campaign_locks" />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
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