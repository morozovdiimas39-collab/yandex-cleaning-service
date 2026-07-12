import { ReactNode, useEffect, useState } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { adminAuthRequest, clearAdminSession, getAdminSession, setAdminSession } from '@/lib/admin-auth';

export default function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verify = async () => {
    const session = getAdminSession();
    if (!session) {
      setChecking(false);
      return;
    }
    try {
      const response = await adminAuthRequest({ action: 'verify' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Сессия истекла');
      setAuthenticated(true);
      setMustChangePassword(Boolean(data.must_change_password));
    } catch {
      clearAdminSession();
      setAuthenticated(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    verify();
    const handleExpired = () => {
      setAuthenticated(false);
      setMustChangePassword(false);
    };
    window.addEventListener('admin-session-expired', handleExpired);
    return () => window.removeEventListener('admin-session-expired', handleExpired);
  }, []);

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAuthRequest({ action: 'login', username, password });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось войти');
      setAdminSession(data);
      setAuthenticated(true);
      setMustChangePassword(Boolean(data.must_change_password));
    } catch (err: any) {
      setError(err.message || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }
    if (newPassword.length < 12 || !/[a-zа-я]/.test(newPassword) || !/[A-ZА-Я]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Новый пароль: минимум 12 символов, заглавная и строчная буквы, цифра.');
      return;
    }
    setLoading(true);
    try {
      const response = await adminAuthRequest({
        action: 'change_password',
        current_password: currentPassword,
        new_password: newPassword,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Не удалось изменить пароль');
      const session = getAdminSession();
      if (session) setAdminSession({ ...session, must_change_password: false });
      setMustChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Не удалось изменить пароль');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onLogin={handleLogin} loading={loading} error={error} />;
  }

  if (mustChangePassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Смените пароль</CardTitle>
            <CardDescription>Первичный пароль больше нельзя использовать для доступа к админке.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Текущий пароль</Label>
                <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Новый пароль</Label>
                <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                <p className="text-xs text-slate-500">Минимум 12 символов, заглавная и строчная буквы, цифра.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Повторите пароль</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить новый пароль
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
