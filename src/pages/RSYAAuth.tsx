import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';
import { BACKEND_URLS } from '@/config/backend-urls';

const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'];
const YANDEX_DIRECT_URL = BACKEND_URLS['yandex-direct'];
const YANDEX_CLIENT_ID = 'fa264103fca547b7baa436de1a416fbe';

const authDraftKey = (projectId?: string) => `rsya-auth-draft:${projectId || 'new'}`;

interface DirectAccount {
  login: string;
  name: string;
  source: 'owner' | 'agency' | 'manual' | string;
  role?: string;
}

interface AccessCheckState {
  status: 'ok' | 'error';
  message: string;
}

export default function RSYAAuth() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState('');
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [yandexToken, setYandexToken] = useState('');
  const [clientLogin, setClientLogin] = useState('');
  const [accounts, setAccounts] = useState<DirectAccount[]>([]);
  const [accountNotes, setAccountNotes] = useState<string[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [accessCheck, setAccessCheck] = useState<AccessCheckState | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const uid = userStr ? JSON.parse(userStr).id.toString() : '1';
    setUserId(uid);

    if (projectId) {
      loadProject(uid);
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'yandex_oauth_token') {
        const token = event.data.token;
        if (token) {
          setYandexToken(token);
          setAccessCheck(null);
          setAccountsLoaded(false);
          loadAccounts(token);
          toast({ title: '✅ Токен получен из Яндекса!' });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [projectId]);

  const loadProject = async (uid: string) => {
    try {
      setLoading(true);

      const response = await fetch(`${RSYA_PROJECTS_URL}?project_id=${projectId}`, {
        headers: { 'X-User-Id': uid }
      });

      if (!response.ok) {
        toast({ title: 'Проект не найден', variant: 'destructive' });
        navigate('/rsya');
        return;
      }

      const data = await response.json();
      setProject(data.project);

      if (data.project.yandex_token) {
        setYandexToken(data.project.yandex_token);
      }
      if (data.project.client_login) {
        setClientLogin(data.project.client_login);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({ title: 'Ошибка загрузки проекта', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async (tokenOverride?: string) => {
    const token = (tokenOverride || yandexToken).trim();
    if (!token) {
      toast({ title: 'Сначала вставьте OAuth-токен', variant: 'destructive' });
      return;
    }

    try {
      setLoadingAccounts(true);
      const response = await fetch(`${YANDEX_DIRECT_URL}?action=accounts`, {
        headers: {
          'X-Auth-Token': token,
          ...(clientLogin ? { 'X-Client-Login': clientLogin } : {})
        }
      });
      const data = await response.json();
      const loadedAccounts: DirectAccount[] = data.accounts || [];
      const errors: string[] = data.errors || [];
      const diagnostics: string[] = data.diagnostics || [];
      const notes: string[] = [];

      setAccounts(loadedAccounts);
      setAccountsLoaded(true);

      if (!clientLogin && loadedAccounts.length === 1 && loadedAccounts[0].source !== 'owner') {
        setClientLogin(loadedAccounts[0].login);
      }

      if (loadedAccounts.length > 0) {
        toast({ title: `Найдено аккаунтов: ${loadedAccounts.length}` });
      } else {
        toast({
          title: 'Список аккаунтов не получен',
          description: 'Введите Client-Login вручную, если аккаунт агентский, eLama или расшаренный.'
        });
      }

      if (errors.some((error) => error.startsWith('agencyclients:54'))) {
        notes.push('Этот OAuth-токен не имеет агентских прав в Директе, поэтому список клиентов организации/агентства автоматически не отдается.');
      }
      if (diagnostics.includes('agency_access:no')) {
        notes.push('Если кампании лежат в eLama или организационном аккаунте, нужен токен пользователя/аккаунта, которому открыт API-доступ к этому рекламному кабинету.');
      }
      if (loadedAccounts.length === 1 && loadedAccounts[0].source === 'owner') {
        notes.push(`Сейчас токен принадлежит логину ${loadedAccounts[0].login}. Другие организационные аккаунты этот токен через API не показывает.`);
      }
      setAccountNotes(notes);
    } catch (error) {
      console.error('Error loading Direct accounts:', error);
      setAccountsLoaded(true);
      setAccountNotes(['Не удалось получить список аккаунтов. Проверьте токен и доступ к Direct API.']);
      toast({ title: 'Не удалось загрузить аккаунты Директа', variant: 'destructive' });
    } finally {
      setLoadingAccounts(false);
    }
  };

  const checkDirectAccess = async (
    tokenOverride?: string,
    clientLoginOverride?: string
  ): Promise<{ ok: boolean; message: string }> => {
    const token = (tokenOverride ?? yandexToken).trim();
    const login = (clientLoginOverride ?? clientLogin).trim();

    if (!token) {
      const message = 'Сначала вставьте OAuth-токен';
      setAccessCheck({ status: 'error', message });
      toast({ title: message, variant: 'destructive' });
      return { ok: false, message };
    }

    try {
      setCheckingAccess(true);
      setAccessCheck(null);

      const response = await fetch(`${YANDEX_DIRECT_URL}?action=check_access`, {
        headers: {
          'X-Auth-Token': token,
          ...(login ? { 'X-Client-Login': login } : {})
        }
      });
      const data = await response.json();

      if (!data.success) {
        const detail = data.error_detail ? ` ${data.error_detail}` : '';
        let message = `${data.error || 'Доступ к кампаниям не подтвержден.'}${detail}`.trim();
        if (data.hint) {
          message = data.hint;
        } else if (Number(data.error_code) === 8800) {
          message = `Яндекс не нашел Client-Login "${login}". Нужен именно API-логин рекламного клиента в Директе, который доступен этому OAuth-токену.`;
        } else if (data.campaigns_count === 0) {
          message = login
            ? `Доступ есть, но по Client-Login "${login}" кампании не найдены. Проверьте, что это логин клиента с кампаниями.`
            : 'Токен принят, но кампании не найдены. Если кампании в eLama/агентском кабинете, укажите Client-Login рекламного клиента.';
        }
        setAccessCheck({ status: 'error', message });
        return { ok: false, message };
      }

      const campaignsCount = Number(data.campaigns_count || 0);
      const message = `Доступ подтвержден, кампаний найдено: ${campaignsCount}`;
      setAccessCheck({ status: 'ok', message });
      if (projectId) {
        sessionStorage.setItem(authDraftKey(projectId), JSON.stringify({
          yandex_token: token,
          client_login: login,
          checked_at: new Date().toISOString()
        }));
      }
      return { ok: true, message };
    } catch (error) {
      console.error('Error checking Direct access:', error);
      const message = 'Не удалось проверить доступ к Директу';
      setAccessCheck({ status: 'error', message });
      return { ok: false, message };
    } finally {
      setCheckingAccess(false);
    }
  };

  const openYandexOAuth = () => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const scope = encodeURIComponent('direct:api');
    const authUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${YANDEX_CLIENT_ID}&scope=${scope}`;

    window.open(
      authUrl,
      'YandexOAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0`
    );
  };

  const saveToken = async () => {
    if (!yandexToken.trim()) {
      toast({ title: 'Введите токен', variant: 'destructive' });
      return;
    }

    try {
      setSavingToken(true);

      const access = await checkDirectAccess(yandexToken.trim(), clientLogin.trim());
      if (!access.ok) {
        toast({
          title: 'Доступ не подтвержден',
          description: access.message,
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(RSYA_PROJECTS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          project_id: parseInt(projectId!),
          yandex_token: yandexToken.trim(),
          client_login: clientLogin.trim()
        })
      });

      if (!response.ok) throw new Error('Ошибка сохранения токена');

      sessionStorage.setItem(authDraftKey(projectId), JSON.stringify({
        yandex_token: yandexToken.trim(),
        client_login: clientLogin.trim(),
        checked_at: new Date().toISOString()
      }));

      toast({ title: '✅ Доступ к Директу сохранён' });
      navigate(`/rsya/${projectId}/setup`);
    } catch (error) {
      console.error('Error saving token:', error);
      toast({ title: 'Ошибка сохранения доступа', variant: 'destructive' });
    } finally {
      setSavingToken(false);
    }
  };

  const accountBadge = (source: string) => {
    if (source === 'agency') return 'агентский';
    if (source === 'owner') return 'основной';
    if (source === 'direct') return 'прямой';
    if (source === 'manual') return 'ручной';
    return source || 'аккаунт';
  };

  if (loading) {
    return (
      <>
        <AppSidebar />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 p-8 ml-64">
          <div className="flex items-center justify-center h-screen">
            <Icon name="Loader2" className="animate-spin h-12 w-12" />
          </div>
        </div>
      </>
    );
  }

  if (!project) return null;

  return (
    <>
      <AppSidebar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 p-8 ml-64">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button onClick={() => navigate('/rsya')} variant="outline" size="icon">
              <Icon name="ArrowLeft" className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">{project?.name}</h1>
              <p className="text-lg text-slate-600">Авторизация Яндекс.Директ</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Подключение к Яндекс.Директ</CardTitle>
              <CardDescription>
                Токен дает доступ к API, а Client-Login выбирает конкретный рекламный аккаунт для чистки.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Button onClick={openYandexOAuth} variant="outline" className="w-full">
                <Icon name="ExternalLink" className="mr-2" />
                Запросить токен у Яндекса
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">или</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">OAuth-токен</label>
                <Input
                  type="text"
                  placeholder="y0_AgAAAAA..."
                  value={yandexToken}
                  onChange={(event) => {
                    setYandexToken(event.target.value);
                    setAccessCheck(null);
                    setAccountNotes([]);
                    setAccountsLoaded(false);
                  }}
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Куда подключаем токен</div>
                    <p className="text-xs text-slate-600">
                      Если кампании лежат в этом же аккаунте Яндекс.Директа, ничего выбирать не нужно.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => loadAccounts()}
                    disabled={loadingAccounts || !yandexToken.trim()}
                    className="shrink-0"
                  >
                    {loadingAccounts ? (
                      <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Icon name="RefreshCw" className="mr-2 h-4 w-4" />
                    )}
                    Найти аккаунты
                  </Button>
                </div>

                {!clientLogin.trim() && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-900">
                    Будет использоваться прямой доступ по OAuth-токену. Client-Login не нужен.
                  </div>
                )}

                {accounts.length > 0 && (
                  <div className="grid gap-2">
                    {accounts.map((account) => {
                      const accountClientLogin = account.source === 'owner' || account.source === 'direct' ? '' : account.login;
                      const active = clientLogin.toLowerCase() === accountClientLogin.toLowerCase();
                      return (
                        <button
                          key={`${account.source}-${account.login}`}
                          type="button"
                          onClick={() => {
                            setClientLogin(accountClientLogin);
                            setAccessCheck(null);
                          }}
                          className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition ${
                            active
                              ? 'border-green-500 bg-white shadow-sm ring-2 ring-green-100'
                              : 'border-slate-200 bg-white hover:border-green-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{account.name || account.login}</div>
                            <div className="truncate text-xs text-slate-500">
                              {account.source === 'owner' || account.source === 'direct'
                                ? 'Это тот же аккаунт токена. Выбирать его не обязательно.'
                                : `Client-Login: ${account.login}`}
                            </div>
                          </div>
                          <Badge variant={account.source === 'agency' ? 'default' : 'secondary'} className="shrink-0">
                            {accountBadge(account.source)}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Client-Login другого рекламного кабинета</label>
                  <Input
                    type="text"
                    placeholder="Заполняйте только для агентского, eLama, расшаренного или организационного доступа"
                    value={clientLogin}
                    onChange={(event) => {
                      setClientLogin(event.target.value.trim());
                      setAccessCheck(null);
                    }}
                  />
                  <p className="text-xs text-slate-500">
                    Оставьте пустым, если у токена уже есть прямой доступ к нужным кампаниям.
                  </p>
                </div>

                {accountNotes.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-1">
                    {accountNotes.map((note) => (
                      <p key={note}>{note}</p>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => checkDirectAccess()}
                    disabled={checkingAccess || !yandexToken.trim()}
                    className="shrink-0"
                  >
                    {checkingAccess ? (
                      <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Icon name="ShieldCheck" className="mr-2 h-4 w-4" />
                    )}
                    Проверить доступ
                  </Button>

                  {accessCheck && (
                    <div
                      className={`rounded-lg px-3 py-2 text-sm ${
                        accessCheck.status === 'ok'
                          ? 'border border-green-200 bg-green-50 text-green-800'
                          : 'border border-red-200 bg-red-50 text-red-800'
                      }`}
                    >
                      {accessCheck.message}
                    </div>
                  )}
                </div>

                {accountsLoaded && accounts.length === 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    Список не найден автоматически. Для расшаренного, организационного или eLama-доступа введите клиентский логин вручную.
                  </div>
                )}
              </div>

              <Button
                onClick={saveToken}
                disabled={savingToken || checkingAccess || !yandexToken.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {savingToken ? (
                  <>
                    <Icon name="Loader2" className="mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Check" className="mr-2" />
                    Сохранить и продолжить
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
