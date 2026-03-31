import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const COLLAPSED_STORAGE_KEY = 'clustering_sidebar_collapsed';

type SidebarProps = {
  /** Узкая полоса с иконками + кнопка разворота (для экрана кластеризации) */
  collapsible?: boolean;
};

export default function Sidebar({ collapsible = false }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    if (!collapsible) return false;
    try {
      const v = localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (v === null) return true;
      return v === '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!collapsible) return;
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsible, collapsed]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const menuItems = [
    {
      icon: 'Search',
      label: 'Сбор фраз Wordstat',
      path: '/clustering',
    },
    {
      icon: 'Shield',
      label: 'Чистка РСЯ',
      path: '/rsya',
    },
    {
      icon: 'MessageSquare',
      label: 'TelegaCRM',
      path: '/telega-crm',
    },
    {
      icon: 'HelpCircle',
      label: 'Как пользоваться',
      path: '/how-to-use',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/clustering') {
      return location.pathname === '/clustering' || location.pathname.startsWith('/clustering/');
    }
    if (path === '/rsya') {
      return location.pathname === '/rsya' || location.pathname.startsWith('/rsya/');
    }
    return location.pathname === path;
  };

  const narrow = collapsible && collapsed;

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ease-out',
        narrow ? 'w-[4.5rem]' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex border-b border-slate-200',
          narrow ? 'flex-col items-center gap-1.5 px-1 py-3' : 'items-center gap-2 px-4 py-4',
        )}
      >
        <div
          onClick={() => navigate('/clustering')}
          className={cn(
            'flex min-w-0 cursor-pointer items-center gap-2 rounded-lg transition-opacity hover:opacity-80',
            narrow ? 'flex-col justify-center' : 'flex-1',
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
            <Icon name="Sparkles" className="h-5 w-5 text-white" />
          </div>
          {!narrow && (
            <span className="truncate text-xl font-semibold text-slate-800">Сбор ключей</span>
          )}
        </div>
        {collapsible && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-slate-500 hover:text-slate-800"
            title={narrow ? 'Развернуть меню' : 'Свернуть меню'}
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((v) => !v);
            }}
          >
            <Icon name={narrow ? 'ChevronRight' : 'ChevronLeft'} className="h-4 w-4" />
          </Button>
        )}
      </div>

      {user && (
        <>
          <nav className={cn('flex-1 space-y-1 py-4', narrow ? 'px-1.5' : 'px-3')}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                title={narrow ? item.label : undefined}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full text-slate-600 hover:bg-slate-100 hover:text-slate-800',
                  narrow ? 'justify-center px-0' : 'justify-start',
                  isActive(item.path) &&
                    'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800',
                )}
              >
                <Icon
                  name={item.icon as never}
                  className={cn('h-4 w-4 shrink-0', !narrow && 'mr-3')}
                />
                {!narrow && item.label}
              </Button>
            ))}
          </nav>

          <div
            className={cn(
              'space-y-2 border-t border-slate-200 py-4',
              narrow ? 'px-1.5' : 'px-3',
            )}
          >
            <a
              href="https://t.me/mooz26"
              target="_blank"
              rel="noopener noreferrer"
              title="Telegram @mooz26"
              className={cn(
                'flex items-center rounded-lg border border-slate-200 bg-slate-100 transition-colors hover:bg-slate-200',
                narrow ? 'justify-center p-2' : 'gap-2 px-3 py-2',
              )}
            >
              <Icon name="MessageCircle" size={16} className="shrink-0 text-slate-500" />
              {!narrow && <span className="text-sm text-slate-700">@mooz26</span>}
            </a>

            <div
              title={narrow ? user.userId : undefined}
              className={cn(
                'flex items-center rounded-lg border border-slate-200 bg-slate-100',
                narrow ? 'justify-center p-2' : 'gap-2 px-3 py-2',
              )}
            >
              <Icon name="User" size={16} className="shrink-0 text-slate-500" />
              {!narrow && (
                <span className="truncate text-sm font-mono text-slate-700">{user.userId}</span>
              )}
            </div>

            <Button
              variant="ghost"
              title={narrow ? 'Выйти' : undefined}
              onClick={handleLogout}
              className={cn(
                'w-full text-slate-600 hover:bg-slate-100 hover:text-slate-800',
                narrow ? 'justify-center px-0' : 'justify-start',
              )}
            >
              <Icon name="LogOut" className={cn('h-4 w-4 shrink-0', !narrow && 'mr-3')} />
              {!narrow && 'Выйти'}
            </Button>
          </div>
        </>
      )}
    </aside>
  );
}
