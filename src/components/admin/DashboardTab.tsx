import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface Stats { total: number; activeTrial: number; activeMonthly: number; newToday: number; expiringWeek: number; }
interface AdminOverview {
  overview: { totalProjects: number; activeProjects: number; totalTasks: number; activeTasks: number; totalUsers: number; totalClusteringProjects: number; totalWordstatTasks: number; totalBlockQueue: number; };
  rsya: { totalExecutions: number; successfulExecutions: number; failedExecutions: number; totalBlocked: number; avgBlockedPerExecution: number; };
  wordstat: { pending: number; processing: number; completed: number; failed: number; totalKeywords: number; };
}

export default function DashboardTab({ stats, adminOverview }: { stats: Stats | null; adminOverview: AdminOverview | null }) {
  const successRate = adminOverview?.rsya.totalExecutions
    ? Math.round((adminOverview.rsya.successfulExecutions / adminOverview.rsya.totalExecutions) * 100)
    : 0;
  const metrics = [
    { label: 'Проекты', value: adminOverview?.overview.totalProjects || 0, detail: `${adminOverview?.overview.activeProjects || 0} настроено`, icon: 'FolderKanban', tone: 'emerald' },
    { label: 'Активные задачи', value: adminOverview?.overview.activeTasks || 0, detail: `из ${adminOverview?.overview.totalTasks || 0} задач`, icon: 'ListChecks', tone: 'blue' },
    { label: 'Пользователи', value: stats?.total || adminOverview?.overview.totalUsers || 0, detail: `${stats?.newToday || 0} новых сегодня`, icon: 'Users', tone: 'slate' },
    { label: 'Заблокировано', value: adminOverview?.rsya.totalBlocked || 0, detail: 'площадок за всё время', icon: 'Ban', tone: 'red' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-emerald-700">Состояние DirectKit</p>
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">Обзор сервиса</h1>
          <p className="mt-2 text-sm text-slate-500">Проекты, задачи, пользователи и последние результаты в одном месте.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" />Система работает</div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div><h2 className="font-semibold text-slate-950">Чистка РСЯ</h2><p className="mt-1 text-sm text-slate-500">Основные показатели выполнения</p></div>
            <Link to="/admin/rsya-cleaning" className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Все проекты <Icon name="ArrowRight" size={16} /></Link>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
            <DataPoint label="Запусков" value={adminOverview?.rsya.totalExecutions || 0} />
            <DataPoint label="Успешность" value={`${successRate}%`} />
            <DataPoint label="Ошибок" value={adminOverview?.rsya.failedExecutions || 0} danger />
            <DataPoint label="В очереди" value={adminOverview?.overview.totalBlockQueue || 0} />
          </div>
          <div className="border-t border-slate-200 px-5 py-4">
            <div className="mb-2 flex justify-between text-xs text-slate-500"><span>Успешные выполнения</span><span>{successRate}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(successRate, 100)}%` }} /></div>
          </div>
        </div>

        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold">Требует внимания</h2><p className="mt-1 text-sm text-slate-500">Сводка текущих рисков</p></div>
          <div className="divide-y divide-slate-100">
            <Attention icon="CircleAlert" label="Ошибки запусков" value={adminOverview?.rsya.failedExecutions || 0} danger={(adminOverview?.rsya.failedExecutions || 0) > 0} />
            <Attention icon="Clock3" label="Истекают на неделе" value={stats?.expiringWeek || 0} danger={(stats?.expiringWeek || 0) > 0} />
            <Attention icon="ListTodo" label="Задачи выключены" value={Math.max(0, (adminOverview?.overview.totalTasks || 0) - (adminOverview?.overview.activeTasks || 0))} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <QuickLink to="/admin/rsya-cleaning" icon="FolderSearch" title="Проекты и задачи" text="Названия, расписания, запуски и примеры площадок" />
        <QuickLink to="/admin/users" icon="UserRoundCog" title="Пользователи" text="Доступы, тарифы и сроки подписок" />
        <QuickLink to="/admin/rsya-workers" icon="ServerCog" title="Состояние системы" text="Очереди, воркеры и технические ошибки" />
      </section>
    </div>
  );
}

function Metric({ label, value, detail, icon, tone }: any) {
  const tones: Record<string, string> = { emerald: 'bg-emerald-50 text-emerald-700', blue: 'bg-sky-50 text-sky-700', slate: 'bg-slate-100 text-slate-700', red: 'bg-rose-50 text-rose-700' };
  return <div className="border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tabular-nums text-slate-950">{Number(value).toLocaleString('ru-RU')}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-md ${tones[tone]}`}><Icon name={icon} size={20} /></span></div></div>;
}
function DataPoint({ label, value, danger = false }: any) { return <div className="px-5 py-5"><p className="text-xs text-slate-500">{label}</p><p className={`mt-2 text-2xl font-semibold tabular-nums ${danger ? 'text-rose-600' : 'text-slate-950'}`}>{typeof value === 'number' ? value.toLocaleString('ru-RU') : value}</p></div>; }
function Attention({ icon, label, value, danger = false }: any) { return <div className="flex items-center gap-3 px-5 py-4"><span className={`flex h-9 w-9 items-center justify-center rounded-md ${danger ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}><Icon name={icon} size={18} /></span><span className="flex-1 text-sm text-slate-600">{label}</span><strong className={danger ? 'text-rose-600' : 'text-slate-950'}>{value}</strong></div>; }
function QuickLink({ to, icon, title, text }: any) { return <Link to={to} className="group flex items-start gap-4 border border-slate-200 bg-white p-5 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700"><Icon name={icon} size={20} /></span><span className="min-w-0 flex-1"><span className="font-semibold text-slate-950">{title}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{text}</span></span><Icon name="ArrowUpRight" size={18} className="text-slate-400 group-hover:text-emerald-700" /></Link>; }
