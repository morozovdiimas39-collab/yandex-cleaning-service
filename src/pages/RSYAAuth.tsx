import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';
import { BACKEND_URLS } from '@/config/backend-urls';

const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'];
const YANDEX_DIRECT_URL = BACKEND_URLS['yandex-direct'];
const YANDEX_OAUTH_URL = BACKEND_URLS['yandex-oauth'];

const authDraftKey = (projectId?: string) => `rsya-auth-draft:${projectId || 'new'}`;

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
  const [savingToken, setSavingToken] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [accessCheck, setAccessCheck] = useState<AccessCheckState | null>(null);
  const [showAuthFields, setShowAuthFields] = useState(false);

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
          setShowAuthFields(true);
          toast({ title: '✅ Авторизация Яндекса получена' });
        }
      } else if (event.data?.type === 'yandex_oauth_error') {
        setShowAuthFields(true);
        toast({
          title: 'Не удалось авторизоваться в Яндексе',
          description: String(event.data.error || '').slice(0, 180),
          variant: 'destructive'
        });
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
        setShowAuthFields(true);
      }
      if (data.project.client_login) {
        setClientLogin(data.project.client_login);
        setShowAuthFields(true);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({ title: 'Ошибка загрузки проекта', variant: 'destructive' });
    } finally {
      setLoading(false);
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

  const openYandexOAuth = async () => {
    setShowAuthFields(true);
    if (!YANDEX_OAUTH_URL) {
      toast({ title: 'OAuth-функция не настроена', variant: 'destructive' });
      return;
    }

    let authUrl = '';
    try {
      const response = await fetch(YANDEX_OAUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          action: 'auth-url',
          project_id: projectId ? parseInt(projectId) : null
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.auth_url) {
        throw new Error(data?.error || 'Не удалось подготовить авторизацию');
      }
      authUrl = data.auth_url;
    } catch (error: any) {
      toast({
        title: 'Не удалось открыть авторизацию',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

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

          <Card className="overflow-hidden border-slate-200 bg-white shadow-xl shadow-emerald-950/5">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-white to-emerald-50/70 p-7">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <Icon name="ShieldCheck" className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Подключение к Яндекс.Директ</CardTitle>
                  <CardDescription className="mt-1 text-slate-500">Авторизация рекламного кабинета</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-7">
              <Button onClick={openYandexOAuth} className="h-12 w-full bg-slate-950 text-white hover:bg-slate-800">
                <Icon name="ExternalLink" className="mr-2" />
                Авторизоваться в Яндексе
              </Button>

              {showAuthFields && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Введите токен авторизации</label>
                    <Input
                      type="text"
                      placeholder="y0_AgAAAAA..."
                      value={yandexToken}
                      onChange={(event) => {
                        setYandexToken(event.target.value);
                        setAccessCheck(null);
                      }}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Введите логин</label>
                    <Input
                      type="text"
                      placeholder="login-clienta-bez-sobaki"
                      value={clientLogin}
                      onChange={(event) => {
                        setClientLogin(event.target.value.trim());
                        setAccessCheck(null);
                      }}
                      className="h-12"
                    />
                  </div>
                </div>
              )}

              {showAuthFields && (
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
              )}

              <Button
                onClick={saveToken}
                disabled={savingToken || checkingAccess || !yandexToken.trim() || !showAuthFields}
                className="h-12 w-full bg-green-600 hover:bg-green-700"
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
