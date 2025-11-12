import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface UsersTableProps {
  users: User[];
  onUpdateUser: (userId: string, planType: string, days: number) => void;
  onDeleteUser: (userId: string) => void;
}

export default function UsersTable({ users, onUpdateUser, onDeleteUser }: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState({ planType: 'trial', days: 1 });

  const handleStartEdit = (user: User) => {
    setEditingUser(user.userId);
    setEditData({ planType: user.planType, days: 1 });
  };

  const handleSaveEdit = (userId: string) => {
    onUpdateUser(userId, editData.planType, editData.days);
    setEditingUser(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-y border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">User ID</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Телефон</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Тариф</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Статус</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Истекает</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Создан</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {users.map((user) => (
            <tr key={user.userId} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-mono">{user.userId}</td>
              <td className="px-4 py-3 text-sm">{user.phone || '-'}</td>
              <td className="px-4 py-3">
                {editingUser === user.userId ? (
                  <select
                    className="px-2 py-1 text-sm border rounded"
                    value={editData.planType}
                    onChange={(e) => setEditData({ ...editData, planType: e.target.value })}
                  >
                    <option value="trial">Trial</option>
                    <option value="monthly">Monthly</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.planType === 'monthly'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.planType}
                  </span>
                )}
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
              <td className="px-4 py-3 text-sm">{formatDate(user.expiresAt)}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                {editingUser === user.userId ? (
                  <div className="flex items-center justify-end gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={editData.days}
                      onChange={(e) => setEditData({ ...editData, days: parseInt(e.target.value) || 1 })}
                      className="w-20 h-8 text-sm"
                      placeholder="Дней"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(user.userId)}
                    >
                      <Icon name="Check" className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingUser(null)}
                    >
                      <Icon name="X" className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartEdit(user)}
                    >
                      <Icon name="Edit" className="w-3 h-3 mr-1" />
                      Изменить
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteUser(user.userId)}
                    >
                      <Icon name="Trash2" className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
