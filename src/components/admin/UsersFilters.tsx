interface Props { filterStatus: string; filterPlan: string; sortBy: string; sortOrder: 'asc' | 'desc'; onFilterChange: (filters: { status?: string; plan?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void; }
const selectClass = 'h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
export default function UsersFilters({ filterStatus, filterPlan, sortBy, sortOrder, onFilterChange }: Props) {
  return <div className="grid grid-cols-2 gap-2 sm:flex">
    <select aria-label="Статус" className={selectClass} value={filterStatus} onChange={(e) => onFilterChange({ status: e.target.value })}><option value="all">Все статусы</option><option value="active">Активные</option><option value="expired">Истекшие</option></select>
    <select aria-label="Тариф" className={selectClass} value={filterPlan} onChange={(e) => onFilterChange({ plan: e.target.value })}><option value="all">Все тарифы</option><option value="trial">Trial</option><option value="monthly">Monthly</option><option value="free">Без тарифа</option></select>
    <select aria-label="Сортировка" className={selectClass} value={sortBy} onChange={(e) => onFilterChange({ sortBy: e.target.value })}><option value="createdAt">По регистрации</option><option value="expiresAt">По истечению</option><option value="planType">По тарифу</option></select>
    <select aria-label="Порядок" className={selectClass} value={sortOrder} onChange={(e) => onFilterChange({ sortOrder: e.target.value as 'asc' | 'desc' })}><option value="desc">Сначала новые</option><option value="asc">Сначала старые</option></select>
  </div>;
}
