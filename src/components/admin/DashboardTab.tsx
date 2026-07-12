import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BACKEND_URLS } from '@/config/backend-urls';
import { adminFetch } from '@/lib/admin-auth';

interface Stats { total: number; activeTrial: number; activeMonthly: number; newToday: number; expiringWeek: number; }
interface AdminOverview {
  overview: { totalProjects: number; activeProjects: number; totalTasks: number; activeTasks: number; totalUsers: number; totalClusteringProjects: number; totalWordstatTasks: number; totalBlockQueue: number; };
  rsya: { totalExecutions: number; successfulExecutions: number; failedExecutions: number; totalBlocked: number; avgBlockedPerExecution: number; };
  wordstat: { pending: number; processing: number; completed: number; failed: number; totalKeywords: number; };
}
interface Activity { id: number; project_name?: string; task_description?: string; status?: string; started_at?: string; placements_blocked?: number; execution_type?: string; }

export default function DashboardTab({ stats, adminOverview, onUpdateSubscription }: { stats: Stats | null; adminOverview: AdminOverview | null; onUpdateSubscription: (userId: string, planType: string, days: number) => Promise<void> }) {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [userId, setUserId] = useState('');
  const [planType, setPlanType] = useState('trial');
  const [days, setDays] = useState(30);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    adminFetch(`${BACKEND_URLS.admin}?action=rsya_dashboard_stats`).then(async (response) => {
      if (response.ok) setActivity((await response.json()).recent_activity?.slice(0, 4) || []);
    }).catch(() => undefined);
  }, []);

  const successRate = adminOverview?.rsya.totalExecutions ? Math.round((adminOverview.rsya.successfulExecutions / adminOverview.rsya.totalExecutions) * 100) : 0;
  const cards = [
    { label: 'Всего пользователей', value: stats?.total || adminOverview?.overview.totalUsers || 0, note: 'Всего в системе', icon: 'Users', tone: 'green' },
    { label: 'Активных Trial', value: stats?.activeTrial || 0, note: 'Пробных подписок', icon: 'Clock3', tone: 'blue' },
    { label: 'Активных Monthly', value: stats?.activeMonthly || 0, note: 'Платных подписок', icon: 'WalletCards', tone: 'green' },
    { label: 'Новых сегодня', value: stats?.newToday || 0, note: 'Новые регистрации', icon: 'TrendingUp', tone: 'violet' },
    { label: 'Истекают на неделе', value: stats?.expiringWeek || 0, note: 'Требуют внимания', icon: 'TriangleAlert', tone: 'orange' },
  ];

  const submit = async () => {
    if (!userId.trim()) return;
    setUpdating(true);
    try { await onUpdateSubscription(userId.trim(), planType, days); setUserId(''); } finally { setUpdating(false); }
  };

  return <div className="space-y-5">
    <div className="lg:hidden"><h1 className="text-2xl font-semibold">Дашборд</h1><p className="mt-1 text-sm text-slate-500">Ключевые метрики и инструменты управления</p></div>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => <KpiCard key={card.label} {...card} />)}
    </section>

    <section className="grid gap-5 xl:grid-cols-3">
      <ServiceCard title="Чистка РСЯ" subtitle="Проекты, задачи и очередь блокировок" icon="ShieldCheck" tone="green" to="/admin/rsya-cleaning" action="Перейти к проектам">
        <MetricGrid items={[["Проекты", adminOverview?.overview.totalProjects || 0, "Folder"], ["Настроены", adminOverview?.overview.activeProjects || 0, "Settings2"], ["Задачи", adminOverview?.overview.totalTasks || 0, "ListChecks"], ["В очереди", adminOverview?.overview.totalBlockQueue || 0, "Clock3"]]} />
      </ServiceCard>
      <ServiceCard title="Пользователи" subtitle="Доступы, тарифы и сроки подписок" icon="Users" tone="blue" to="/admin/users" action="Открыть пользователей">
        <MetricGrid items={[["Всего", stats?.total || 0, "Users"], ["Trial", stats?.activeTrial || 0, "Clock"], ["Monthly", stats?.activeMonthly || 0, "CreditCard"], ["Истекают", stats?.expiringWeek || 0, "CalendarClock"]]} />
      </ServiceCard>
      <ServiceCard title="Ошибки запусков" subtitle="Сводка по выполнению чистки" icon="TriangleAlert" tone="red" to="/admin/errors" action="Перейти к ошибкам">
        <MetricGrid items={[["Запусков", adminOverview?.rsya.totalExecutions || 0, "Play"], ["Успешно", adminOverview?.rsya.successfulExecutions || 0, "CircleCheck"], ["Ошибок", adminOverview?.rsya.failedExecutions || 0, "CircleX"], ["Блокировок", adminOverview?.rsya.totalBlocked || 0, "Ban"]]} dangerIndex={2} />
      </ServiceCard>
    </section>

    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4"><h2 className="text-base font-semibold">Быстрое обновление подписки</h2><p className="mt-1 text-xs text-slate-500">Обновить или создать подписку для пользователя</p></div>
      <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr_0.55fr_auto] lg:items-end">
        <Field label="User ID"><div className="relative"><Icon name="UserRound" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="ID пользователя" className="h-11 pl-9" /></div></Field>
        <Field label="Тип подписки"><select value={planType} onChange={(event) => setPlanType(event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="trial">Trial</option><option value="monthly">Monthly</option></select></Field>
        <Field label="Дней"><Input type="number" min="1" value={days} onChange={(event) => setDays(Number(event.target.value) || 1)} className="h-11" /></Field>
        <Button onClick={submit} disabled={updating || !userId.trim()} className="h-11 min-w-56 bg-emerald-600 hover:bg-emerald-700">{updating ? <Icon name="Loader2" size={17} className="mr-2 animate-spin" /> : <Icon name="RefreshCw" size={17} className="mr-2" />}Обновить подписку</Button>
      </div>
    </section>

    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2"><Icon name="Activity" size={18} className="text-emerald-600" /><h2 className="font-semibold">Последняя активность</h2></div><Link to="/admin/rsya-cleaning" className="text-xs font-medium text-slate-500 hover:text-emerald-700">Смотреть всё</Link></div>
      {activity.length ? <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">{activity.map((item) => <div key={item.id} className="flex min-w-0 gap-3 px-5 py-4"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.status === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}><Icon name={item.status === 'error' ? 'TriangleAlert' : 'Play' } size={16} /></span><div className="min-w-0"><p className="truncate text-sm font-medium">{item.project_name || `Проект #${item.project_id}`}</p><p className="mt-1 truncate text-xs text-slate-500">{item.task_description || item.execution_type || 'Запуск чистки'} · {item.placements_blocked || 0} блокировок</p><p className="mt-1 text-[11px] text-slate-400">{item.started_at ? new Date(item.started_at).toLocaleString('ru-RU') : '—'}</p></div></div>)}</div> : <div className="px-5 py-8 text-center text-sm text-slate-400">Запусков пока нет</div>}
    </section>
  </div>;
}

function KpiCard({ label, value, note, icon, tone }: any) { const colors: Record<string, string> = { green: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', violet: 'bg-violet-50 text-violet-600', orange: 'bg-orange-50 text-orange-600' }; return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex gap-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${colors[tone]}`}><Icon name={icon} size={21} /></span><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{Number(value).toLocaleString('ru-RU')}</p></div></div><p className="mt-5 text-xs text-slate-400">{note}</p></div>; }
function ServiceCard({ title, subtitle, icon, tone, to, action, children }: any) { const colors: Record<string, string> = { green: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', red: 'bg-rose-50 text-rose-600' }; const bars: Record<string, string> = { green: 'bg-emerald-50 text-emerald-700', blue: 'bg-blue-50 text-blue-700', red: 'bg-rose-50 text-rose-700' }; return <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 px-5 py-4"><span className={`flex h-10 w-10 items-center justify-center rounded-full ${colors[tone]}`}><Icon name={icon} size={20} /></span><div><h2 className="font-semibold">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div></div><div className="px-4 pb-4">{children}<Link to={to} className={`mt-4 flex h-10 items-center justify-center gap-2 rounded-md text-xs font-medium ${bars[tone]}`}>{action}<Icon name="ChevronRight" size={15} /></Link></div></div>; }
function MetricGrid({ items, dangerIndex = -1 }: { items: any[]; dangerIndex?: number }) { return <div className="grid grid-cols-2 gap-3">{items.map(([label, value, icon], index) => <div key={label} className="flex items-center justify-between rounded-lg border border-slate-200 p-3"><div><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-xl font-semibold tabular-nums ${index === dangerIndex ? 'text-rose-600' : ''}`}>{Number(value).toLocaleString('ru-RU')}</p></div><span className={`flex h-9 w-9 items-center justify-center rounded-full ${index === dangerIndex ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}><Icon name={icon} size={17} /></span></div>)}</div>; }
function Field({ label, children }: any) { return <label className="block"><span className="mb-2 block text-xs font-medium text-slate-600">{label}</span>{children}</label>; }
