import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

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
            <CardContent className="grid gap-4 text-sm">
              <div className="grid gap-1">
                <span className="text-slate-500">Почта</span>
                <span className="font-medium text-slate-900">{user?.email || 'Не указана'}</span>
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
