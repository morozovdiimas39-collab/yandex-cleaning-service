import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_URLS } from '@/config/backend-urls';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminTabs, { TabType } from '@/components/admin/AdminTabs';
import DashboardTab from '@/components/admin/DashboardTab';
import UsersTab from '@/components/admin/UsersTab';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import BulkTab from '@/components/admin/BulkTab';
import AffiliatesTab from '@/components/admin/AffiliatesTab';
import ScheduleTab from '@/components/admin/ScheduleTab';

interface User {
  userId: string;
  phone?: string;
  planType: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  hasAccess?: boolean;
}

interface Stats {
  total: number;
  activeTrial: number;
  activeMonthly: number;
  newToday: number;
  expiringWeek: number;
}

const ADMIN_KEY = 'directkit_admin_2024';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [bulkUserIds, setBulkUserIds] = useState('');
  const [bulkPlan, setBulkPlan] = useState({ planType: 'trial', days: 1 });
  const [newPlan, setNewPlan] = useState<{ userId: string; planType: string; days: number }>({
    userId: '',
    planType: 'trial',
    days: 1
  });
  const { toast } = useToast();

  const LIMIT = 50;

  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadInitialData();
    }
  }, []);

  const handleLogin = (username: string, password: string) => {
    if (username === 'admin' && password === 'directkit2024') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      loadInitialData();
      toast({
        title: 'Вход выполнен',
        description: 'Добро пожаловать в админ-панель'
      });
    } else {
      toast({
        title: 'Ошибка входа',
        description: 'Неверный логин или пароль',
        variant: 'destructive'
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
  };

  const loadInitialData = async () => {
    await Promise.all([loadUsers(0, true), loadStats()]);
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URLS.subscription}?action=admin_stats`,
        {
          method: 'GET',
          headers: {
            'X-Admin-Key': ADMIN_KEY
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const loadUsers = async (offsetValue: number = 0, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await fetch(
        `${BACKEND_URLS.subscription}?action=admin_all&limit=${LIMIT}&offset=${offsetValue}`,
        {
          method: 'GET',
          headers: {
            'X-Admin-Key': ADMIN_KEY
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (reset) {
          setUsers(data.users || []);
        } else {
          setUsers(prev => [...prev, ...(data.users || [])]);
        }
        
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
        setOffset(offsetValue + LIMIT);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список пользователей',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreUsers = () => {
    if (!loadingMore && hasMore) {
      loadUsers(offset, false);
    }
  };

  const updateSubscription = async (targetUserId: string, planType: string, days: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URLS.subscription}?action=admin_update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': ADMIN_KEY
          },
          body: JSON.stringify({
            userId: targetUserId,
            planType,
            days
          })
        }
      );

      if (response.ok) {
        toast({
          title: 'Подписка обновлена',
          description: `Пользователю ${targetUserId} назначен тариф ${planType} на ${days} дней`
        });
        await loadInitialData();
        return true;
      } else {
        throw new Error('Ошибка обновления');
      }
    } catch (error) {
      console.error('Ошибка обновления подписки:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить подписку',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    if (!newPlan.userId) {
      toast({
        title: 'Ошибка',
        description: 'Введите ID пользователя',
        variant: 'destructive'
      });
      return;
    }

    const success = await updateSubscription(newPlan.userId, newPlan.planType, newPlan.days);
    if (success) {
      setNewPlan({ userId: '', planType: 'trial', days: 1 });
    }
  };

  const bulkUpdateSubscriptions = async () => {
    const userIdList = bulkUserIds.split('\n').map(id => id.trim()).filter(Boolean);
    
    if (userIdList.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите хотя бы один User ID',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of userIdList) {
      const success = await updateSubscription(userId, bulkPlan.planType, bulkPlan.days);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setLoading(false);
    toast({
      title: 'Массовое обновление завершено',
      description: `Успешно: ${successCount}, Ошибок: ${errorCount}`
    });
    setBulkUserIds('');
  };

  const deleteUser = async (userId: string) => {
    if (!confirm(`Удалить пользователя ${userId}?`)) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URLS.subscription}?action=admin_delete&userId=${userId}`,
        {
          method: 'DELETE',
          headers: {
            'X-Admin-Key': ADMIN_KEY
          }
        }
      );

      if (response.ok) {
        toast({
          title: 'Пользователь удален',
          description: `${userId} успешно удален`
        });
        await loadInitialData();
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить пользователя',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    let filtered = [...users];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }

    if (filterPlan !== 'all') {
      filtered = filtered.filter(u => u.planType === filterPlan);
    }

    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof User] || '';
      const bValue = b[sortBy as keyof User] || '';
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const handleFilterChange = (filters: { status?: string; plan?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
    if (filters.status !== undefined) setFilterStatus(filters.status);
    if (filters.plan !== undefined) setFilterPlan(filters.plan);
    if (filters.sortBy !== undefined) setSortBy(filters.sortBy);
    if (filters.sortOrder !== undefined) setSortOrder(filters.sortOrder);
  };

  const handleSearchUser = async (userId: string) => {
    if (!userId.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите User ID для поиска',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URLS.subscription}?action=admin_search&userId=${userId}`,
        {
          method: 'GET',
          headers: {
            'X-Admin-Key': ADMIN_KEY
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUsers([data.user]);
          setTotal(1);
          setActiveTab('users');
        } else {
          toast({
            title: 'Не найдено',
            description: 'Пользователь с таким ID не найден',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить поиск',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const filteredUsers = getFilteredUsers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminHeader onLogout={handleLogout} />
      <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={stats}
            newPlan={newPlan}
            loading={loading}
            onNewPlanChange={setNewPlan}
            onUpdateSubscription={handleUpdateSubscription}
            onSearchUser={handleSearchUser}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={filteredUsers}
            total={total}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            filterStatus={filterStatus}
            filterPlan={filterPlan}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onFilterChange={handleFilterChange}
            onLoadMore={loadMoreUsers}
            onUpdateUser={updateSubscription}
            onDeleteUser={deleteUser}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab users={users} />
        )}

        {activeTab === 'bulk' && (
          <BulkTab
            bulkUserIds={bulkUserIds}
            bulkPlan={bulkPlan}
            loading={loading}
            onBulkUserIdsChange={setBulkUserIds}
            onBulkPlanChange={setBulkPlan}
            onBulkUpdate={bulkUpdateSubscriptions}
          />
        )}

        {activeTab === 'affiliates' && (
          <AffiliatesTab />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTab />
        )}
      </div>
    </div>
  );
}