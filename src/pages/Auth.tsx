import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from '@/config/backend-urls';

const API_URL = BACKEND_URLS.api;

type AuthMode = 'login' | 'register' | 'verify';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem('referral_code', ref);
    }
  }, [searchParams]);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const saveSession = (data: { userId: number; email: string; sessionToken: string }) => {
    const normalizedEmail = normalizeEmail(data.email);
    const user = {
      id: data.userId,
      email: normalizedEmail,
      phone: '',
      userId: `user_${data.userId}`,
      createdAt: new Date().toISOString(),
      sessionToken: data.sessionToken,
      session_token: data.sessionToken,
    };

    setAuthData(user, data.sessionToken);
    toast({ title: 'Вход выполнен', description: 'Добро пожаловать в DirectKit' });
    setTimeout(() => navigate('/rsya'), 300);
  };

  const requestAuth = async (payload: Record<string, string>) => {
    const response = await fetch(`${API_URL}?endpoint=auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Не удалось выполнить запрос');
    }
    return data;
  };

  const handleRegister = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail.includes('@')) {
      toast({ title: 'Укажите корректную почту', variant: 'destructive' });
      return;
    }
    if (password.length < 8) {
      toast({ title: 'Пароль должен быть минимум 8 символов', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Пароли не совпадают', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await requestAuth({
        action: 'register_email',
        email: normalizedEmail,
        password,
      });
      setEmail(normalizedEmail);
      setMode('verify');
      toast({ title: 'Код отправлен', description: 'Проверьте почту и введите код подтверждения' });
    } catch (error) {
      toast({
        title: 'Ошибка регистрации',
        description: error instanceof Error ? error.message : 'Попробуйте еще раз',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      toast({ title: 'Укажите почту и пароль', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const data = await requestAuth({
        action: 'login_email',
        email: normalizedEmail,
        password,
      });
      saveSession(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Проверьте данные и попробуйте еще раз';
      if (message.includes('Подтвердите')) {
        setEmail(normalizedEmail);
        setMode('verify');
      }
      toast({ title: 'Не удалось войти', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (code.length !== 6) {
      toast({ title: 'Введите 6-значный код', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const data = await requestAuth({
        action: 'verify_email',
        email: normalizedEmail,
        code,
      });
      saveSession(data);
    } catch (error) {
      toast({
        title: 'Код не подошел',
        description: error instanceof Error ? error.message : 'Проверьте код из письма',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return;

    setLoading(true);
    try {
      await requestAuth({
        action: 'resend_email_code',
        email: normalizedEmail,
      });
      toast({ title: 'Код отправлен повторно' });
    } catch (error) {
      toast({
        title: 'Не удалось отправить код',
        description: error instanceof Error ? error.message : 'Попробуйте позже',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const submitOnEnter = (handler: () => void) => (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handler();
  };

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1fr_440px]">
          <div className="hidden lg:block">
            <Link to="/" className="mb-10 inline-flex items-center gap-3 text-slate-700 hover:text-slate-950">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <Icon name="ShieldCheck" size={22} />
              </div>
              <div>
                <div className="text-xl font-semibold text-slate-950">DirectKit</div>
                <div className="text-sm text-slate-500">Чистка площадок РСЯ 24/7</div>
              </div>
            </Link>

            <div className="max-w-xl">
              <div className="mb-5 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                Закрытый бета-тест
              </div>
              <h1 className="text-5xl font-bold leading-tight tracking-normal text-slate-950">
                Вход в сервис автоматической чистки площадок
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Регистрируйтесь по почте, подтверждайте кодом и подключайте проекты без SMS и ручной выдачи доступа.
              </p>
            </div>
          </div>

          <Card className="border-slate-200 shadow-xl shadow-slate-200/60">
            <CardHeader className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Icon name={mode === 'verify' ? 'MailCheck' : 'LockKeyhole'} size={24} />
              </div>
              <div>
                <CardTitle className="text-2xl text-slate-950">
                  {isLogin && 'Вход'}
                  {isRegister && 'Регистрация'}
                  {mode === 'verify' && 'Подтверждение почты'}
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  {isLogin && 'Введите почту и пароль от аккаунта DirectKit'}
                  {isRegister && 'Создайте аккаунт, код подтверждения придет на почту'}
                  {mode === 'verify' && `Введите код, который мы отправили на ${email || 'почту'}`}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Почта</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={submitOnEnter(isLogin ? handleLogin : isRegister ? handleRegister : handleVerify)}
                  autoComplete="email"
                  disabled={mode === 'verify'}
                />
              </div>

              {mode !== 'verify' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Минимум 8 символов"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={submitOnEnter(isLogin ? handleLogin : handleRegister)}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                </div>
              )}

              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Повторите пароль</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Еще раз пароль"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    onKeyDown={submitOnEnter(handleRegister)}
                    autoComplete="new-password"
                  />
                </div>
              )}

              {mode === 'verify' && (
                <div className="space-y-2">
                  <Label htmlFor="code">Код из письма</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    placeholder="000000"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={submitOnEnter(handleVerify)}
                    maxLength={6}
                    autoFocus
                  />
                </div>
              )}

              <Button
                onClick={isLogin ? handleLogin : isRegister ? handleRegister : handleVerify}
                disabled={loading}
                className="h-12 w-full bg-emerald-600 text-base font-semibold hover:bg-emerald-700"
              >
                {loading && <Icon name="Loader2" size={18} className="mr-2 animate-spin" />}
                {isLogin && 'Войти'}
                {isRegister && 'Зарегистрироваться'}
                {mode === 'verify' && 'Подтвердить почту'}
              </Button>

              {mode === 'verify' ? (
                <div className="grid gap-2 text-center text-sm text-slate-600">
                  <button type="button" className="font-medium text-emerald-700 hover:text-emerald-800" onClick={handleResendCode} disabled={loading}>
                    Отправить код еще раз
                  </button>
                  <button type="button" className="text-slate-500 hover:text-slate-800" onClick={() => setMode('register')} disabled={loading}>
                    Изменить почту
                  </button>
                </div>
              ) : (
                <div className="text-center text-sm text-slate-600">
                  {isLogin ? 'Еще нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
                  <button
                    type="button"
                    className="font-semibold text-emerald-700 hover:text-emerald-800"
                    onClick={() => setMode(isLogin ? 'register' : 'login')}
                  >
                    {isLogin ? 'Зарегистрироваться' : 'Войти'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
