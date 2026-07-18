import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';
import { BACKEND_URLS } from '@/config/backend-urls';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type BillingStatus = {
  trialActive: boolean;
  trialDaysLeft: number;
  trialEndsAt: string | null;
  pricePerProjectRub: number;
  baseFreeProjects: number;
  paidProjectSlots: number;
  projectLimit: number;
  projectCount: number;
  remainingProjects: number;
};

const SUBSCRIPTION_URL = BACKEND_URLS.subscription;

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [projectSlots, setProjectSlots] = useState(1);

  const userId = user?.id?.toString() || user?.userId || '';
  const totalAmount = useMemo(
    () => projectSlots * (billing?.pricePerProjectRub || 250),
    [projectSlots, billing?.pricePerProjectRub],
  );

  const loadBilling = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(SUBSCRIPTION_URL, {
        headers: { 'X-User-Id': userId },
      });
      if (!response.ok) throw new Error('billing_failed');
      const data = await response.json();
      setBilling(data);
    } catch {
      toast({
        title: 'Не удалось загрузить оплату',
        description: 'Попробуйте обновить страницу.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPayment = async (orderNumber: string) => {
    if (!userId) return;
    setChecking(true);
    try {
      const response = await fetch(SUBSCRIPTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ action: 'check_project_payment', orderNumber }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'check_failed');
      if (data.is_paid) {
        setBilling(data.billing);
        toast({
          title: 'Оплата прошла',
          description: 'Лимит проектов обновлен.',
        });
      } else {
        toast({
          title: 'Оплата еще не подтверждена',
          description: data.status_text || 'Попробуйте проверить позже.',
        });
      }
    } catch {
      toast({
        title: 'Не удалось проверить платеж',
        description: 'Если деньги списались, повторите проверку через пару минут.',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, [userId]);

  useEffect(() => {
    const orderNumber = searchParams.get('order');
    if (searchParams.get('payment') === 'success' && orderNumber && userId) {
      checkPayment(orderNumber);
    }
  }, [searchParams, userId]);

  const createPayment = async () => {
    if (!userId) return;
    setPaying(true);
    try {
      const response = await fetch(SUBSCRIPTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ action: 'create_project_payment', projectSlots }),
      });
      const data = await response.json();
      if (!response.ok || !data.payment_url) throw new Error(data?.error || 'payment_failed');
      window.location.href = data.payment_url;
    } catch {
      toast({
        title: 'Не удалось создать платеж',
        description: 'Проверьте настройки Альфа-Банка в облачной функции.',
        variant: 'destructive',
      });
      setPaying(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge className="mb-3 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
                Оплата проектов
              </Badge>
              <h1 className="text-3xl font-bold text-slate-950">Оплата</h1>
              <p className="mt-2 text-slate-600">
                Первый проект доступен бесплатно. Каждый дополнительный проект стоит 250 ₽.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/rsya')} className="h-11">
              Вернуться к проектам
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-slate-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Проекты</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-950">
                  {loading ? '...' : `${billing?.projectCount || 0}/${billing?.projectLimit || 1}`}
                </div>
                <p className="mt-2 text-sm text-slate-500">Создано из доступного лимита</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Пробный период</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-950">
                  {loading ? '...' : billing?.trialActive ? `${billing.trialDaysLeft} дн.` : 'завершен'}
                </div>
                <p className="mt-2 text-sm text-slate-500">7 дней для нового аккаунта</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Оплачено слотов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-950">
                  {loading ? '...' : billing?.paidProjectSlots || 0}
                </div>
                <p className="mt-2 text-sm text-slate-500">Дополнительные проекты сверх первого</p>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden border-slate-200 bg-white">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl bg-slate-950 p-6 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500">
                  <Icon name="CreditCard" size={24} />
                </div>
                <h2 className="mt-5 text-2xl font-bold">Добавить проекты</h2>
                <p className="mt-2 max-w-xl text-slate-300">
                  Оплата открывает возможность создавать дополнительные проекты РСЯ. Текущие проекты и задачи не меняются.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[1, 3, 5].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setProjectSlots(count)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        projectSlots === count
                          ? 'border-emerald-400 bg-emerald-500/15'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-2xl font-bold">+{count}</div>
                      <div className="mt-1 text-sm text-slate-300">{count * (billing?.pricePerProjectRub || 250)} ₽</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 p-6">
                <div>
                  <div className="text-sm font-medium text-slate-500">К оплате</div>
                  <div className="mt-2 text-5xl font-bold text-slate-950">{totalAmount.toLocaleString('ru-RU')} ₽</div>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Дополнительных проектов</span>
                      <span className="font-semibold text-slate-950">{projectSlots}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Цена за проект</span>
                      <span className="font-semibold text-slate-950">{billing?.pricePerProjectRub || 250} ₽</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Будет доступно проектов</span>
                      <span className="font-semibold text-slate-950">{(billing?.projectLimit || 1) + projectSlots}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 space-y-3">
                  <Button
                    onClick={createPayment}
                    disabled={paying || checking || loading}
                    className="h-12 w-full bg-emerald-600 text-base hover:bg-emerald-700"
                  >
                    {paying ? 'Создаем платеж...' : `Оплатить ${totalAmount.toLocaleString('ru-RU')} ₽`}
                  </Button>
                  {checking && <p className="text-center text-sm text-slate-500">Проверяем оплату...</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
