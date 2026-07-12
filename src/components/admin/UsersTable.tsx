import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface User { userId: string; phone?: string; planType: string; status: string; expiresAt?: string | null; createdAt?: string | null; hasAccess?: boolean; }
interface Props { users: User[]; onUpdateUser: (userId: string, planType: string, days: number) => void; onDeleteUser: (userId: string) => void; }

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function UsersTable({ users, onUpdateUser, onDeleteUser }: Props) {
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState({ planType: 'trial', days: 30 });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse">
        <thead><tr className="border-b border-slate-200 bg-slate-50/80">
          {['Пользователь', 'Тариф', 'Доступ', 'Истекает', 'Регистрация', ''].map((label) => <th key={label} className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 last:text-right">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => {
            const isEditing = editingUser === user.userId;
            const active = user.status === 'active' || user.hasAccess;
            return <tr key={user.userId} className="transition-colors hover:bg-slate-50/70">
              <td className="px-5 py-4"><div className="font-medium text-slate-950">{user.phone || 'Телефон не указан'}</div><div className="mt-1 max-w-[250px] truncate font-mono text-xs text-slate-400" title={user.userId}>{user.userId}</div></td>
              <td className="px-5 py-4">{isEditing ? <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={editData.planType} onChange={(e) => setEditData({ ...editData, planType: e.target.value })}><option value="trial">Trial</option><option value="monthly">Monthly</option></select> : <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{user.planType === 'monthly' ? 'Monthly' : user.planType === 'trial' ? 'Trial' : 'Без тарифа'}</span>}</td>
              <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 text-sm font-medium ${active ? 'text-emerald-700' : 'text-slate-500'}`}><span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}`} />{active ? 'Активен' : 'Нет доступа'}</span></td>
              <td className="px-5 py-4 text-sm tabular-nums text-slate-600">{formatDate(user.expiresAt)}</td>
              <td className="px-5 py-4 text-sm tabular-nums text-slate-500">{formatDate(user.createdAt)}</td>
              <td className="px-5 py-4 text-right">{isEditing ? <div className="flex items-center justify-end gap-2"><Input type="number" min="1" aria-label="Количество дней" value={editData.days} onChange={(e) => setEditData({ ...editData, days: Number(e.target.value) || 1 })} className="h-9 w-20" /><Button size="sm" onClick={() => { onUpdateUser(user.userId, editData.planType, editData.days); setEditingUser(null); }}><Icon name="Check" size={16} className="mr-1" />Сохранить</Button><Button size="icon" variant="outline" aria-label="Отменить" onClick={() => setEditingUser(null)}><Icon name="X" size={16} /></Button></div> : <div className="flex items-center justify-end gap-2"><Button size="sm" variant="outline" onClick={() => { setEditingUser(user.userId); setEditData({ planType: user.planType === 'monthly' ? 'monthly' : 'trial', days: 30 }); }}><Icon name="Pencil" size={15} className="mr-1.5" />Изменить</Button><Button size="icon" variant="ghost" className="text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Удалить пользователя" onClick={() => onDeleteUser(user.userId)}><Icon name="Trash2" size={16} /></Button></div>}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}
