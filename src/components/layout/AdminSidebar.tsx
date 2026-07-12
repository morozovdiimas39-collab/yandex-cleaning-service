import { Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { logoutAdmin } from '@/lib/admin-auth';

const menuItems = [
  { title: 'Обзор', path: '/admin', icon: 'LayoutDashboard' },
  { title: 'Проекты и задачи', path: '/admin/rsya-cleaning', icon: 'FolderKanban' },
  { title: 'Пользователи', path: '/admin/users', icon: 'Users' },
  { title: 'Состояние системы', path: '/admin/rsya-workers', icon: 'Activity' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const isActive = (path: string) => path === '/admin'
    ? location.pathname === '/admin'
    : location.pathname.startsWith(path);

  const logout = async () => {
    await logoutAdmin();
    window.location.assign('/admin');
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-[#fbfcfb] lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-slate-200 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600 text-white">
            <Icon name="ShieldCheck" size={21} />
          </div>
          <div className="ml-3 min-w-0">
            <div className="text-base font-semibold text-slate-950">DirectKit</div>
            <div className="text-xs text-slate-500">Управление сервисом</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Админ-навигация">
          <p className="px-3 pb-2 text-xs font-medium uppercase text-slate-400">Рабочая область</p>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                isActive(item.path)
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              )}
            >
              <Icon name={item.icon as any} size={19} />
              <span>{item.title}</span>
              {isActive(item.path) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600" />}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950">
            <Icon name="LogOut" size={19} />
            Выйти
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link to="/admin" className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-white"><Icon name="ShieldCheck" size={19} /></span>
            DirectKit
          </Link>
          <button type="button" onClick={logout} className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-slate-600" aria-label="Выйти">
            <Icon name="LogOut" size={19} />
          </button>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Мобильная админ-навигация">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} className={cn('flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium', isActive(item.path) ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
              <Icon name={item.icon as any} size={17} />{item.title}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
