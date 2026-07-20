import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { icon: 'ShieldCheck', label: 'Чистка площадок', path: '/rsya' },
  { icon: 'CreditCard', label: 'Оплата', path: '/billing' },
  { icon: 'LifeBuoy', label: 'Получить помощь', href: 'https://t.me/mooz26' },
  { icon: 'UserRound', label: 'Профиль', path: '/profile' },
];

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdminImpersonation, stopAdminImpersonation } = useAuth();

  const handleItemClick = (item: (typeof menuItems)[number]) => {
    if (item.href) {
      window.open(item.href, item.href.startsWith('mailto:') ? '_self' : '_blank', 'noopener,noreferrer');
      return;
    }
    if (item.path) navigate(item.path);
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/rsya') return location.pathname === '/rsya' || location.pathname.startsWith('/rsya/');
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div
      role="navigation"
      aria-label="Основное меню"
      className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-slate-200 bg-white"
    >
      <div className="border-b border-slate-200 p-4">
        <button
          type="button"
          onClick={() => navigate('/rsya')}
          className="flex w-full items-center gap-3 rounded-lg text-left transition-opacity hover:opacity-80"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Icon name="ShieldCheck" size={22} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-slate-950">DirectKit</div>
            <div className="truncate text-xs text-slate-500">Чистка площадок РСЯ</div>
          </div>
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {menuItems.map((item) => (
          <Button
            key={item.path || item.href}
            variant="ghost"
            onClick={() => handleItemClick(item)}
            className={cn(
              'h-11 w-full justify-start gap-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              item.path && isActive(item.path) && 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800',
            )}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="space-y-3 border-t border-slate-200 p-4">
        {isAdminImpersonation && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
            <div className="flex items-start gap-2">
              <Icon name="BadgeCheck" size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-amber-900">Режим администратора</div>
                <div className="mt-1 truncate text-xs text-amber-800">
                  {user?.email || user?.phone || user?.userId || 'Пользователь'}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={stopAdminImpersonation}
              className="mt-3 h-9 w-full border-amber-200 bg-white text-xs text-amber-900 hover:bg-amber-100"
            >
              Вернуться в админку
            </Button>
          </div>
        )}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-500">Аккаунт</div>
          <div className="mt-1 truncate text-sm font-medium text-slate-800">
            {user?.email || user?.phone || user?.userId || 'Пользователь'}
          </div>
        </div>
        <Button onClick={handleLogout} variant="outline" className="h-11 w-full justify-start gap-3">
          <Icon name="LogOut" size={18} />
          Выйти
        </Button>
      </div>
    </div>
  );
}
