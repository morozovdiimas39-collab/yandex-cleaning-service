import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import UsersTable from './UsersTable';
import UsersFilters from './UsersFilters';

interface User { userId: string; email?: string; phone?: string; planType: string; status: string; expiresAt?: string | null; createdAt?: string | null; hasAccess?: boolean; }
interface Props {
  users: User[]; total: number; loading: boolean; loadingMore: boolean; hasMore: boolean;
  filterStatus: string; filterPlan: string; sortBy: string; sortOrder: 'asc' | 'desc';
  searchQuery: string; onSearchChange: (value: string) => void;
  onFilterChange: (filters: { status?: string; plan?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void;
  onLoadMore: () => void; onUpdateUser: (userId: string, planType: string, days: number) => void; onDeleteUser: (userId: string) => void;
}

export default function UsersTab(props: Props) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-sm font-medium text-emerald-700">Клиенты и доступы</p><h1 className="text-2xl font-semibold sm:text-3xl">Пользователи</h1><p className="mt-2 text-sm text-slate-500">Управление тарифами, сроками и доступом к сервису.</p></div>
        <div className="text-sm text-slate-500"><strong className="text-slate-950">{props.total.toLocaleString('ru-RU')}</strong> зарегистрировано</div>
      </div>

      <div className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={props.searchQuery} onChange={(e) => props.onSearchChange(e.target.value)} placeholder="Найти по email, телефону или ID" className="h-11 pl-10" />
          </div>
          <UsersFilters filterStatus={props.filterStatus} filterPlan={props.filterPlan} sortBy={props.sortBy} sortOrder={props.sortOrder} onFilterChange={props.onFilterChange} />
        </div>

        {props.loading ? (
          <div className="flex min-h-72 items-center justify-center"><Icon name="Loader2" className="h-7 w-7 animate-spin text-emerald-600" /></div>
        ) : props.users.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><Icon name="UsersRound" size={34} className="mb-3 text-slate-300" /><h2 className="font-medium">Пользователи не найдены</h2><p className="mt-1 text-sm text-slate-500">Измените поиск или фильтры.</p></div>
        ) : <UsersTable users={props.users} onUpdateUser={props.onUpdateUser} onDeleteUser={props.onDeleteUser} />}

        {props.hasMore && !props.loading && (
          <div className="flex justify-center border-t border-slate-200 p-4"><Button variant="outline" onClick={props.onLoadMore} disabled={props.loadingMore}>{props.loadingMore ? <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" /> : <Icon name="ChevronsDown" className="mr-2 h-4 w-4" />}Загрузить ещё</Button></div>
        )}
      </div>
    </div>
  );
}
