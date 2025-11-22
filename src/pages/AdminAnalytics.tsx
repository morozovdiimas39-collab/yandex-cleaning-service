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
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URLS.admin}?action=analytics`, {
        headers: {
          'X-Admin-Key': 'directkit_admin_2024'
        }
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
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
