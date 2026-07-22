import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_URLS } from '@/config/backend-urls';
import { adminFetch } from '@/lib/admin-auth';
import { useAuth } from '@/contexts/AuthContext';
import AdminShell from '@/components/layout/AdminShell';
import DashboardTab from '@/components/admin/DashboardTab';
import UsersTab from '@/components/admin/UsersTab';

interface User { userId: string; email?: string; phone?: string; planType: string; status: string; expiresAt?: string | null; createdAt?: string | null; hasAccess?: boolean; paidProjectSlots?: number; manualProjectSlots?: number; projectLimit?: number; }
interface Stats { total: number; activeTrial: number; activeMonthly: number; newToday: number; expiringWeek: number; }
interface AdminOverview {
  overview: { totalProjects: number; activeProjects: number; totalTasks: number; activeTasks: number; totalUsers: number; totalClusteringProjects: number; totalWordstatTasks: number; totalBlockQueue: number; };
  rsya: { totalExecutions: number; successfulExecutions: number; failedExecutions: number; totalBlocked: number; avgBlockedPerExecution: number; };
  wordstat: { pending: number; processing: number; completed: number; failed: number; totalKeywords: number; };
}

export default function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { impersonateUser } = useAuth();
  const isUsersPage = location.pathname.startsWith('/admin/users');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const LIMIT = 50;

  useEffect(() => {
    Promise.all([loadUsers(0, true), loadStats(), loadAdminOverview()]).finally(() => setLoading(false));
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminFetch(`${BACKEND_URLS.subscription}?action=admin_stats`);
      if (response.ok) setStats(await response.json());
    } catch (error) { console.error('Ошибка загрузки статистики:', error); }
  };

  const loadUsers = async (offsetValue = 0, reset = false) => {
    if (!reset) setLoadingMore(true);
    try {
      const response = await adminFetch(`${BACKEND_URLS.subscription}?action=admin_all&limit=${LIMIT}&offset=${offsetValue}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setUsers((previous) => reset ? (data.users || []) : [...previous, ...(data.users || [])]);
      setTotal(data.total || 0);
      setHasMore(Boolean(data.hasMore));
      setOffset(offsetValue + LIMIT);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      toast({ title: 'Не удалось загрузить пользователей', description: 'Обновите страницу или проверьте состояние системы.', variant: 'destructive' });
    } finally { setLoadingMore(false); }
  };

  const loadAdminOverview = async () => {
    try {
      const response = await adminFetch(`${BACKEND_URLS.admin}?action=analytics`);
      if (response.ok) setAdminOverview(await response.json());
    } catch (error) { console.error('Ошибка загрузки обзора:', error); }
  };

  const updateSubscription = async (userId: string, planType: string, days: number, manualProjectSlots?: number) => {
    try {
      const response = await adminFetch(`${BACKEND_URLS.subscription}?action=admin_update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, planType, days, manualProjectSlots })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      toast({ title: 'Подписка обновлена', description: `${planType}, ${days} дн.` });
      await Promise.all([loadUsers(0, true), loadStats()]);
    } catch (error) {
      toast({ title: 'Не удалось обновить подписку', description: 'Повторите попытку.', variant: 'destructive' });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm(`Удалить пользователя ${userId}?`)) return;
    try {
      const response = await adminFetch(`${BACKEND_URLS.subscription}?action=admin_delete&userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      toast({ title: 'Пользователь удалён' });
      await Promise.all([loadUsers(0, true), loadStats()]);
    } catch (error) {
      toast({ title: 'Не удалось удалить пользователя', variant: 'destructive' });
    }
  };

  const openUserCabinet = (targetUser: User) => {
    const numericId = Number(targetUser.userId);
    if (!Number.isFinite(numericId)) {
      toast({ title: 'Не удалось открыть кабинет', description: 'У пользователя некорректный ID.', variant: 'destructive' });
      return;
    }

    impersonateUser({
      id: numericId,
      userId: targetUser.userId,
      email: targetUser.email,
      phone: targetUser.phone,
      createdAt: targetUser.createdAt || new Date().toISOString(),
      sessionToken: `admin-impersonation-${targetUser.userId}`,
      hasAccess: true,
      adminImpersonated: true,
    });
    toast({ title: 'Открыт кабинет пользователя', description: targetUser.email || targetUser.phone || `ID ${targetUser.userId}` });
    navigate('/rsya');
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return [...users]
      .filter((user) => filterStatus === 'all' || user.status === filterStatus)
      .filter((user) => filterPlan === 'all' || user.planType === filterPlan)
      .filter((user) => !query || user.userId.toLowerCase().includes(query) || (user.email || '').toLowerCase().includes(query) || (user.phone || '').toLowerCase().includes(query))
      .sort((a, b) => {
        const left = String(a[sortBy as keyof User] || '');
        const right = String(b[sortBy as keyof User] || '');
        return sortOrder === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
      });
  }, [users, filterStatus, filterPlan, sortBy, sortOrder, searchQuery]);

  return (
    <AdminShell>
      {isUsersPage ? (
        <UsersTab
          users={filteredUsers} total={total} loading={loading} loadingMore={loadingMore} hasMore={hasMore}
          filterStatus={filterStatus} filterPlan={filterPlan} sortBy={sortBy} sortOrder={sortOrder}
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
          onFilterChange={(filters) => {
            if (filters.status !== undefined) setFilterStatus(filters.status);
            if (filters.plan !== undefined) setFilterPlan(filters.plan);
            if (filters.sortBy !== undefined) setSortBy(filters.sortBy);
            if (filters.sortOrder !== undefined) setSortOrder(filters.sortOrder);
          }}
          onLoadMore={() => !loadingMore && hasMore && loadUsers(offset)} onUpdateUser={updateSubscription} onDeleteUser={deleteUser} onImpersonateUser={openUserCabinet}
        />
      ) : <DashboardTab stats={stats} adminOverview={adminOverview} onUpdateSubscription={updateSubscription} />}
    </AdminShell>
  );
}
