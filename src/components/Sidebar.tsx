import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

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
      icon: 'CreditCard',
      label: 'Подписка',
      path: '/subscription',
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

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div
        onClick={() => navigate('/clustering')}
        className="flex items-center gap-2 px-6 py-4 cursor-pointer hover:opacity-80 transition-opacity border-b border-slate-200"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Icon name="Sparkles" className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-semibold text-slate-800">Сбор ключей</span>
      </div>

      {user && (
        <>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full justify-start text-slate-600 hover:text-slate-800 hover:bg-slate-100',
                  isActive(item.path) && 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
                )}
              >
                <Icon name={item.icon as any} className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-slate-200 space-y-2">
            <a
              href="https://t.me/mooz26"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors"
            >
              <Icon name="MessageCircle" size={16} className="text-slate-500" />
              <span className="text-sm text-slate-700">@mooz26</span>
            </a>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200">
              <Icon name="User" size={16} className="text-slate-500" />
              <span className="text-sm font-mono text-slate-700">{user.userId}</span>
            </div>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            >
              <Icon name="LogOut" className="h-4 w-4 mr-3" />
              Выйти
            </Button>
          </div>
        </>
      )}
    </aside>
  );
}
