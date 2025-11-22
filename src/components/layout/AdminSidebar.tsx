import { Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export default function AdminSidebar() {
  const location = useLocation();

  const menuItems = [
    {
      title: 'Главная',
      path: '/admin/analytics',
      icon: 'LayoutDashboard'
    },
    {
      title: 'Проекты',
      path: '/admin/projects',
      icon: 'Folder'
    },
    {
      title: 'Чистка РССЯ',
      path: '/admin/rsya-cleaning',
      icon: 'Ban'
    },
    {
      title: 'Сбор ключей',
      path: '/admin/wordstat',
      icon: 'Key'
    },
    {
      title: 'Пользователи',
      path: '/admin/users',
      icon: 'Users'
    },
    {
      title: 'Подписки',
      path: '/admin',
      icon: 'CreditCard'
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-sm z-50">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Icon name="ShieldCheck" size={24} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Админка</h2>
            <p className="text-xs text-muted-foreground">DirectKit</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon name={item.icon as any} size={20} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <Link
          to="/clustering"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Icon name="ArrowLeft" size={20} />
          <span>Выйти из админки</span>
        </Link>
      </div>
    </div>
  );
}
