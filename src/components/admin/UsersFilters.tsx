import { Label } from '@/components/ui/label';

interface UsersFiltersProps {
  filterStatus: string;
  filterPlan: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onFilterChange: (filters: { status?: string; plan?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void;
}

export default function UsersFilters({
  filterStatus,
  filterPlan,
  sortBy,
  sortOrder,
  onFilterChange
}: UsersFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
      <div className="space-y-2">
        <Label>Статус</Label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          value={filterStatus}
          onChange={(e) => onFilterChange({ status: e.target.value })}
        >
          <option value="all">Все</option>
          <option value="active">Активные</option>
          <option value="expired">Истекшие</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Тариф</Label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          value={filterPlan}
          onChange={(e) => onFilterChange({ plan: e.target.value })}
        >
          <option value="all">Все</option>
          <option value="trial">Trial</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Сортировка</Label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          value={sortBy}
          onChange={(e) => onFilterChange({ sortBy: e.target.value })}
        >
          <option value="createdAt">По дате создания</option>
          <option value="expiresAt">По дате истечения</option>
          <option value="planType">По тарифу</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Порядок</Label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          value={sortOrder}
          onChange={(e) => onFilterChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
        >
          <option value="desc">По убыванию</option>
          <option value="asc">По возрастанию</option>
        </select>
      </div>
    </div>
  );
}
