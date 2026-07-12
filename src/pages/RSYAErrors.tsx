import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BACKEND_URLS } from '@/config/backend-urls';
import { adminFetch } from '@/lib/admin-auth';

interface ExecutionError {
  id: number; execution_type?: string; project_id?: number; project_name?: string; user_id?: string;
  client_login?: string; task_id?: number; task_description?: string; task_config?: unknown;
  started_at?: string; completed_at?: string; status?: string; request_id?: string;
  placements_found?: number; placements_matched?: number; placements_sent_to_queue?: number;
  placements_blocked?: number; error_message?: string; metadata?: unknown; duration_seconds?: number;
}

const formatDate = (value?: string) => value ? new Date(value).toLocaleString('ru-RU') : '—';
const jsonText = (value: unknown) => value ? JSON.stringify(value, null, 2) : 'Нет данных';

export default function RSYAErrors() {
  const [errors, setErrors] = useState<ExecutionError[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = async (offset = 0) => {
    offset ? setLoadingMore(true) : setLoading(true);
    try {
      const response = await adminFetch(`${BACKEND_URLS.admin}?action=rsya_errors&limit=50&offset=${offset}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setErrors((current) => offset ? [...current, ...(data.errors || [])] : (data.errors || []));
      setTotal(data.total || 0);
      setHasMore(Boolean(data.has_more));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return errors;
    return errors.filter((error) => [error.project_name, error.task_description, error.client_login, error.user_id, error.request_id, error.error_message, error.execution_type]
      .some((value) => String(value || '').toLowerCase().includes(normalized)));
  }, [errors, query]);

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="lg:hidden"><h1 className="text-2xl font-semibold">Ошибки запусков</h1><p className="mt-1 text-sm text-slate-500">Полная история с техническими подробностями.</p></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Summary label="Всего ошибок" value={total} icon="CircleAlert" tone="rose" />
          <Summary label="Загружено" value={errors.length} icon="ListChecks" tone="blue" />
          <Summary label="Проектов затронуто" value={new Set(errors.map((item) => item.project_id).filter(Boolean)).size} icon="FolderWarning" tone="orange" />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-semibold">Журнал ошибок</h2><p className="mt-1 text-xs text-slate-500">Откройте строку, чтобы увидеть все технические данные.</p></div>
            <div className="flex gap-2"><div className="relative min-w-[280px]"><Icon name="Search" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Проект, задача, request ID или текст" className="h-10 pl-9" /></div><Button variant="outline" size="icon" onClick={() => load()} aria-label="Обновить"><Icon name="RefreshCw" size={16} /></Button></div>
          </div>

          {loading ? <div className="flex min-h-72 items-center justify-center"><Icon name="Loader2" className="h-7 w-7 animate-spin text-emerald-600" /></div> : filtered.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center text-center"><Icon name="BadgeCheck" size={36} className="mb-3 text-emerald-500" /><h3 className="font-medium">Ошибок не найдено</h3></div> : <div className="divide-y divide-slate-100">{filtered.map((error) => {
            const isOpen = expanded === error.id;
            return <article key={error.id}>
              <button type="button" onClick={() => setExpanded(isOpen ? null : error.id)} className="grid w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 lg:grid-cols-[160px_1fr_1fr_150px_24px] lg:items-center">
                <div><span className="inline-flex items-center gap-2 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700"><Icon name="CircleAlert" size={14} />Ошибка #{error.id}</span><p className="mt-2 text-xs text-slate-400">{formatDate(error.started_at)}</p></div>
                <div><p className="font-medium text-slate-950">{error.project_name || `Проект #${error.project_id || '—'}`}</p><p className="mt-1 text-xs text-slate-500">Client-Login: {error.client_login || '—'} · User: {error.user_id || '—'}</p></div>
                <div><p className="text-sm text-slate-700">{error.task_description || `Задача #${error.task_id || '—'}`}</p><p className="mt-1 line-clamp-1 text-xs text-rose-600">{error.error_message || 'Текст ошибки отсутствует'}</p></div>
                <div><p className="text-xs uppercase text-slate-400">{error.execution_type || 'unknown'}</p><p className="mt-1 truncate font-mono text-xs text-slate-500">{error.request_id || 'нет request ID'}</p></div>
                <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-slate-400" />
              </button>
              {isOpen && <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5"><div className="grid gap-4 xl:grid-cols-2">
                <DetailBlock title="Полный текст ошибки" icon="Terminal" danger><pre>{error.error_message || 'Текст ошибки отсутствует'}</pre></DetailBlock>
                <DetailBlock title="Параметры выполнения" icon="Gauge"><dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm"><Info label="Начало" value={formatDate(error.started_at)} /><Info label="Завершение" value={formatDate(error.completed_at)} /><Info label="Длительность" value={error.duration_seconds != null ? `${Number(error.duration_seconds).toFixed(2)} сек.` : '—'} /><Info label="Request ID" value={error.request_id || '—'} /><Info label="Найдено" value={error.placements_found ?? 0} /><Info label="Совпало" value={error.placements_matched ?? 0} /><Info label="В очередь" value={error.placements_sent_to_queue ?? 0} /><Info label="Заблокировано" value={error.placements_blocked ?? 0} /></dl></DetailBlock>
                <DetailBlock title="Metadata" icon="Braces"><pre>{jsonText(error.metadata)}</pre></DetailBlock>
                <DetailBlock title="Конфигурация задачи" icon="SlidersHorizontal"><pre>{jsonText(error.task_config)}</pre></DetailBlock>
              </div></div>}
            </article>;
          })}</div>}
          {hasMore && !loading && <div className="flex justify-center border-t border-slate-200 p-4"><Button variant="outline" onClick={() => load(errors.length)} disabled={loadingMore}>{loadingMore && <Icon name="Loader2" size={16} className="mr-2 animate-spin" />}Загрузить ещё</Button></div>}
        </div>
      </div>
    </AdminShell>
  );
}

function Summary({ label, value, icon, tone }: any) { const colors: Record<string, string> = { rose: 'bg-rose-50 text-rose-600', blue: 'bg-blue-50 text-blue-600', orange: 'bg-orange-50 text-orange-600' }; return <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><span className={`flex h-11 w-11 items-center justify-center rounded-full ${colors[tone]}`}><Icon name={icon} size={21} /></span><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{Number(value).toLocaleString('ru-RU')}</p></div></div>; }
function DetailBlock({ title, icon, danger = false, children }: any) { return <section className={`min-w-0 rounded-lg border bg-white p-4 ${danger ? 'border-rose-200' : 'border-slate-200'}`}><h3 className={`mb-3 flex items-center gap-2 text-sm font-medium ${danger ? 'text-rose-700' : 'text-slate-800'}`}><Icon name={icon} size={16} />{title}</h3><div className="max-h-80 overflow-auto text-xs leading-5 text-slate-700 [&_pre]:whitespace-pre-wrap [&_pre]:break-words">{children}</div></section>; }
function Info({ label, value }: any) { return <div><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 break-all font-medium text-slate-700">{String(value)}</dd></div>; }
