import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_URLS } from '@/config/backend-urls';

export default function Profile() {
  const { user, sessionToken, setAuthData } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPhone(formatPhone(user?.phone || ''));
  }, [user?.phone]);

  const normalizePhone = (value: string) => {
    const digits = value.replace(/\D/g, '').replace(/^8/, '7');
    if (digits.length === 10) return `+7${digits}`;
    if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
    return '';
  };

  const saveProfile = async () => {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      toast({ title: 'Укажите телефон', variant: 'destructive' });
      return;
    }
    if (!sessionToken || !user) return;

    setSaving(true);
    try {
      const response = await fetch(`${BACKEND_URLS.api}?endpoint=profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken,
        },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Не удалось сохранить профиль');

      const updatedUser = {
        ...user,
        phone: data.phone || normalizedPhone,
        email: data.email || user.email,
      };
      setAuthData(updatedUser, sessionToken);
      toast({ title: 'Профиль сохранен' });
    } catch (error) {
      toast({
        title: 'Не удалось сохранить профиль',
        description: error instanceof Error ? error.message : 'Попробуйте еще раз',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-950">Профиль</h1>
            <p className="mt-2 text-slate-600">Данные аккаунта DirectKit</p>
          </div>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon name="UserRound" size={20} />
                </span>
                Аккаунт
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 text-sm">
              <div className="grid gap-1">
                <span className="text-slate-500">Почта</span>
                <span className="font-medium text-slate-900">{user?.email || 'Не указана'}</span>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-phone" className="text-slate-500">Телефон</Label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="profile-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(formatPhone(event.target.value))}
                    placeholder="+7 (999) 000-00-00"
                    className="h-11"
                  />
                  <Button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving}
                    className="h-11 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {saving ? 'Сохраняем...' : 'Сохранить'}
                  </Button>
                </div>
              </div>
              <div className="grid gap-1">
                <span className="text-slate-500">ID пользователя</span>
                <span className="font-mono text-slate-900">{user?.id || user?.userId || '—'}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-slate-500">Поддержка</span>
                <a className="font-medium text-emerald-700 hover:text-emerald-800" href="mailto:support@directkit.ru">
                  support@directkit.ru
                </a>
              </div>
              <div className="grid gap-1">
                <span className="text-slate-500">Telegram</span>
                <a className="font-medium text-emerald-700 hover:text-emerald-800" href="https://t.me/mooz26" target="_blank" rel="noopener noreferrer">
                  @mooz26
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^8/, '7').slice(0, 11);
  const normalized = digits.startsWith('7') ? digits : `7${digits}`.slice(0, 11);
  const body = normalized.slice(1);
  const p1 = body.slice(0, 3);
  const p2 = body.slice(3, 6);
  const p3 = body.slice(6, 8);
  const p4 = body.slice(8, 10);

  let result = '+7';
  if (p1) result += ` (${p1}`;
  if (p1.length === 3) result += ')';
  if (p2) result += ` ${p2}`;
  if (p3) result += `-${p3}`;
  if (p4) result += `-${p4}`;
  return result;
}
