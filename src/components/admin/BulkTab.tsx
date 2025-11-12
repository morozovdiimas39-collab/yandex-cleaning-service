import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface BulkTabProps {
  bulkUserIds: string;
  bulkPlan: { planType: string; days: number };
  loading: boolean;
  onBulkUserIdsChange: (value: string) => void;
  onBulkPlanChange: (plan: { planType: string; days: number }) => void;
  onBulkUpdate: () => void;
}

export default function BulkTab({
  bulkUserIds,
  bulkPlan,
  loading,
  onBulkUserIdsChange,
  onBulkPlanChange,
  onBulkUpdate
}: BulkTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Массовое обновление подписок</CardTitle>
          <CardDescription>Обновить подписки для нескольких пользователей одновременно</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>User ID (каждый с новой строки)</Label>
            <textarea
              className="w-full min-h-[200px] px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
              placeholder="user123&#10;user456&#10;user789"
              value={bulkUserIds}
              onChange={(e) => onBulkUserIdsChange(e.target.value)}
            />
            <p className="text-sm text-slate-500">
              Количество пользователей: {bulkUserIds.split('\n').filter(id => id.trim()).length}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Тип подписки</Label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                value={bulkPlan.planType}
                onChange={(e) => onBulkPlanChange({ ...bulkPlan, planType: e.target.value })}
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
                value={bulkPlan.days}
                onChange={(e) => onBulkPlanChange({ ...bulkPlan, days: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <Button
            onClick={onBulkUpdate}
            disabled={loading || !bulkUserIds.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Icon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <Icon name="FileStack" className="w-4 h-4 mr-2" />
                Применить ко всем
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Icon name="AlertTriangle" className="w-5 h-5" />
            Внимание
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900">
          <ul className="list-disc list-inside space-y-1">
            <li>Массовое обновление может занять несколько минут</li>
            <li>Операция необратима - убедитесь в корректности данных</li>
            <li>Обновление происходит последовательно для каждого пользователя</li>
            <li>В случае ошибки для одного пользователя, обработка продолжится для остальных</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
