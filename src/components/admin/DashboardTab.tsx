import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface Stats {
  total: number;
  activeTrial: number;
  activeMonthly: number;
  newToday: number;
  expiringWeek: number;
}

interface DashboardTabProps {
  stats: Stats | null;
  newPlan: { userId: string; planType: string; days: number };
  loading: boolean;
  onNewPlanChange: (plan: { userId: string; planType: string; days: number }) => void;
  onUpdateSubscription: () => void;
  onSearchUser: (userId: string) => void;
}

export default function DashboardTab({
  stats,
  newPlan,
  loading,
  onNewPlanChange,
  onUpdateSubscription,
  onSearchUser
}: DashboardTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Всего пользователей</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Icon name="Users" className="w-5 h-5 text-slate-400" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Активных Trial</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats?.activeTrial || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Icon name="Clock" className="w-5 h-5 text-blue-400" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Активных Monthly</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats?.activeMonthly || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Icon name="CreditCard" className="w-5 h-5 text-green-400" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Новых сегодня</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats?.newToday || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Icon name="TrendingUp" className="w-5 h-5 text-purple-400" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Истекают на неделе</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats?.expiringWeek || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Icon name="AlertTriangle" className="w-5 h-5 text-orange-400" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Быстрое обновление подписки</CardTitle>
          <CardDescription>Обновить или создать подписку для пользователя</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input
                placeholder="ID пользователя"
                value={newPlan.userId}
                onChange={(e) => onNewPlanChange({ ...newPlan, userId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Тип подписки</Label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                value={newPlan.planType}
                onChange={(e) => onNewPlanChange({ ...newPlan, planType: e.target.value })}
              >
                <option value="trial">Trial</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Дней</Label>
              <Input
                type="number"
                min="1"
                value={newPlan.days}
                onChange={(e) => onNewPlanChange({ ...newPlan, days: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <Button onClick={onUpdateSubscription} disabled={loading} className="w-full">
            <Icon name="CheckCircle" className="w-4 h-4 mr-2" />
            Обновить подписку
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Быстрый поиск</CardTitle>
          <CardDescription>Найти пользователя по ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Введите User ID"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearchUser((e.target as HTMLInputElement).value);
                }
              }}
            />
            <Button
              onClick={(e) => {
                const input = (e.currentTarget.previousSibling as HTMLInputElement);
                onSearchUser(input.value);
              }}
            >
              <Icon name="Search" className="w-4 h-4 mr-2" />
              Найти
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
