import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Icon from '@/components/ui/icon';

export default function AdminShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const page = location.pathname.startsWith('/admin/rsya-cleaning')
    ? ['Проекты и задачи', 'Контроль проектов, расписаний и результатов чистки']
    : location.pathname.startsWith('/admin/users')
      ? ['Пользователи', 'Подписки, доступы и клиентская база']
      : location.pathname.startsWith('/admin/rsya-workers')
        ? ['Состояние системы', 'Очереди, воркеры и технические ошибки']
        : ['Дашборд', 'Ключевые метрики и инструменты управления'];

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <AdminSidebar />
      <main className="min-h-screen lg:pl-64">
        <header className="hidden h-20 items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">{page[0]}</h1>
            <p className="mt-1 text-xs text-slate-500">{page[1]}</p>
          </div>
          <div className="flex items-center gap-5">
            <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Уведомления"><Icon name="Bell" size={19} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-emerald-500" /></button>
            <div className="h-7 w-px bg-slate-200" />
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-medium text-blue-700">A</span><div><p className="text-sm font-medium">Администратор</p><p className="text-xs text-slate-400">DirectKit</p></div></div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </main>
    </div>
  );
}
