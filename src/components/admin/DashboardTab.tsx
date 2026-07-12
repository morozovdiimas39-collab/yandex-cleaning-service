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
    { label: 'Всего пользователей', value: stats?.total || adminOverview?.overview.totalUsers || 0, detail: 'В системе', icon: 'Users', tone: 'emerald' },
    { label: 'Проекты РСЯ', value: adminOverview?.overview.totalProjects || 0, detail: `${adminOverview?.overview.activeProjects || 0} настроено`, icon: 'FolderKanban', tone: 'blue' },
    { label: 'Активные задачи', value: adminOverview?.overview.activeTasks || 0, detail: `Из ${adminOverview?.overview.totalTasks || 0} задач`, icon: 'ListChecks', tone: 'emerald' },
    { label: 'Новых сегодня', value: stats?.newToday || 0, detail: 'Новые регистрации', icon: 'TrendingUp', tone: 'violet' },
    { label: 'Истекают на неделе', value: stats?.expiringWeek || 0, detail: 'Требуют внимания', icon: 'TriangleAlert', tone: 'orange' },
  ];

  return (
    <div className="space-y-5">
      <div className="lg:hidden">
        <h1 className="text-2xl font-semibold">Дашборд</h1>
        <p className="mt-1 text-sm text-slate-500">Ключевые метрики и инструменты управления</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name="ShieldCheck" size={20} /></span><div><h2 className="font-semibold text-slate-950">Чистка РСЯ</h2><p className="mt-0.5 text-xs text-slate-500">Проекты, задачи и результаты блокировок</p></div></div>
            <Link to="/admin/rsya-cleaning" className="flex min-h-10 items-center gap-2 rounded-md bg-emerald-50 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100">Перейти <Icon name="ChevronRight" size={16} /></Link>
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

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Icon name="TriangleAlert" size={20} /></span><div><h2 className="font-semibold">Требует внимания</h2><p className="mt-0.5 text-xs text-slate-500">Сводка текущих рисков</p></div></div>
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
  const tones: Record<string, string> = { emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', violet: 'bg-violet-50 text-violet-600', orange: 'bg-orange-50 text-orange-600' };
  return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}><Icon name={icon} size={21} /></span><div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-3xl font-semibold tabular-nums text-slate-950">{Number(value).toLocaleString('ru-RU')}</p></div></div><p className="mt-5 text-xs text-slate-400">{detail}</p></div>;
}
function DataPoint({ label, value, danger = false }: any) { return <div className="px-5 py-5"><p className="text-xs text-slate-500">{label}</p><p className={`mt-2 text-2xl font-semibold tabular-nums ${danger ? 'text-rose-600' : 'text-slate-950'}`}>{typeof value === 'number' ? value.toLocaleString('ru-RU') : value}</p></div>; }
function Attention({ icon, label, value, danger = false }: any) { return <div className="flex items-center gap-3 px-5 py-4"><span className={`flex h-9 w-9 items-center justify-center rounded-md ${danger ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}><Icon name={icon} size={18} /></span><span className="flex-1 text-sm text-slate-600">{label}</span><strong className={danger ? 'text-rose-600' : 'text-slate-950'}>{value}</strong></div>; }
function QuickLink({ to, icon, title, text }: any) { return <Link to={to} className="group flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Icon name={icon} size={20} /></span><span className="min-w-0 flex-1"><span className="font-semibold text-slate-950">{title}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{text}</span></span><Icon name="ChevronRight" size={18} className="text-slate-400 group-hover:text-emerald-700" /></Link>; }
