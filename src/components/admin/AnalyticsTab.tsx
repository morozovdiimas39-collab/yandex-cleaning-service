import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface User {
  userId: string;
  phone?: string;
  planType: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  hasAccess?: boolean;
}

interface AnalyticsTabProps {
  users: User[];
}

export default function AnalyticsTab({ users }: AnalyticsTabProps) {
  const expiringUsers = users.filter(u => {
    const daysUntilExpire = Math.floor((new Date(u.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpire >= 0 && daysUntilExpire <= 7 && u.status === 'active';
  });

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilExpire = (expiresAt: string) => {
    return Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="AlertTriangle" className="w-5 h-5 text-orange-600" />
            Скоро истекают ({expiringUsers.length})
          </CardTitle>
          <CardDescription>Подписки, которые истекают в течение 7 дней</CardDescription>
        </CardHeader>
        <CardContent>
          {expiringUsers.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Нет подписок, истекающих в ближайшую неделю</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">User ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Тариф</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Истекает</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Осталось дней</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {expiringUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono">{user.userId}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.planType === 'monthly'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.planType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(user.expiresAt)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {getDaysUntilExpire(user.expiresAt)} дней
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="TrendingUp" className="w-5 h-5 text-purple-600" />
            Последние регистрации
          </CardTitle>
          <CardDescription>10 последних зарегистрированных пользователей</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">User ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Телефон</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Тариф</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Статус</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Дата регистрации</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono">{user.userId}</td>
                    <td className="px-4 py-3 text-sm">{user.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.planType === 'monthly'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.planType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
