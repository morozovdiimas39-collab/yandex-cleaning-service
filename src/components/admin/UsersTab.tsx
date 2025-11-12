import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import UsersTable from './UsersTable';
import UsersFilters from './UsersFilters';

interface User {
  userId: string;
  phone?: string;
  planType: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  hasAccess?: boolean;
}

interface UsersTabProps {
  users: User[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  filterStatus: string;
  filterPlan: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onFilterChange: (filters: { status?: string; plan?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void;
  onLoadMore: () => void;
  onUpdateUser: (userId: string, planType: string, days: number) => void;
  onDeleteUser: (userId: string) => void;
}

export default function UsersTab({
  users,
  total,
  loading,
  loadingMore,
  hasMore,
  filterStatus,
  filterPlan,
  sortBy,
  sortOrder,
  onFilterChange,
  onLoadMore,
  onUpdateUser,
  onDeleteUser
}: UsersTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Все пользователи ({total})</CardTitle>
          <CardDescription>Управление подписками пользователей</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsersFilters
            filterStatus={filterStatus}
            filterPlan={filterPlan}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onFilterChange={onFilterChange}
          />

          {loading ? (
            <div className="flex justify-center py-12">
              <Icon name="Loader2" className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <UsersTable
                users={users}
                onUpdateUser={onUpdateUser}
                onDeleteUser={onDeleteUser}
              />

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={onLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Icon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Icon name="ChevronsDown" className="w-4 h-4 mr-2" />
                        Загрузить ещё
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
