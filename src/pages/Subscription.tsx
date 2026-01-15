import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { BACKEND_URLS } from '@/config/backend-urls';

interface SubscriptionStatus {
  hasAccess: boolean;
  planType: 'trial' | 'monthly';
  status: 'active' | 'expired';
  expiresAt?: string;
  trialEndsAt?: string;
}

export default function Subscription() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    loadSubscription();
    
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    
    if (paymentStatus === 'success') {
      checkPaymentStatus();
    }
  }, [authLoading]);

  const loadSubscription = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(BACKEND_URLS.subscription, {
        headers: {
          'X-User-Id': user.id.toString()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!user?.id) return;

    setActivating(true);
    try {
      const response = await fetch(BACKEND_URLS.subscription, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({ action: 'activate' })
      });

      if (response.ok) {
        toast({
          title: 'Подписка активирована',
          description: 'Пробный период успешно активирован'
        });
        await loadSubscription();
      } else {
        throw new Error('Activation failed');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось активировать подписку',
        variant: 'destructive'
      });
    } finally {
      setActivating(false);
    }
  };

  const handlePayment = async (planType: 'wordstat' | 'rsya_project', amount: string) => {
    if (!user?.id) {
      return;
    }

    setPaymentLoading(true);
    
    try {
      const requestBody = {
        userId: user.id.toString(),
        planType: planType,
        amount: amount
      };
      
      const response = await fetch(BACKEND_URLS['yookassa-payment'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.confirmationUrl) {
          window.location.href = data.confirmationUrl;
        } else {
          throw new Error('No payment URL');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment creation failed');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать платёж',
        variant: 'destructive'
      });
      setPaymentLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!user?.id) return;

    try {
      toast({
        title: 'Оплата прошла успешно!',
        description: 'Подписка активируется автоматически'
      });
      
      setTimeout(async () => {
        await loadSubscription();
      }, 2000);
    } catch (error) {
      console.error('Payment check error:', error);
    } finally {
      window.history.replaceState({}, '', '/subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Icon name="Loader2" className="animate-spin h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  const daysLeft = subscription?.expiresAt 
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50">
      <Sidebar />
      <div className="flex-1">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Подписка</h1>
                <p className="text-gray-600">Управление тарифом и доступом к сервису</p>
              </div>
            </div>

            <Card className="p-6 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Текущий статус</h2>
                  <p className="text-sm text-gray-500">Информация о вашей подписке</p>
                </div>
                {subscription?.hasAccess ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-medium text-sm">
                    <Icon name="CheckCircle2" size={16} />
                    Активна
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-lg font-medium text-sm">
                    <Icon name="XCircle" size={16} />
                    Неактивна
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Package" size={18} className="text-emerald-600" />
                    <span className="text-sm font-medium text-gray-600">Тариф</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900">
                    {subscription?.planType === 'trial' ? 'Триал' : 'Месячная'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Calendar" size={18} className="text-emerald-600" />
                    <span className="text-sm font-medium text-gray-600">Действует до</span>
                  </div>
                  <p className="text-base font-semibold text-gray-900">
                    {subscription?.hasAccess ? formatDate(subscription.expiresAt) : '—'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Clock" size={18} className="text-emerald-600" />
                    <span className="text-sm font-medium text-gray-600">Осталось дней</span>
                  </div>
                  <p className="text-xl font-semibold">
                    {subscription?.hasAccess ? (
                      <span className={daysLeft < 3 ? 'text-red-600' : 'text-emerald-600'}>
                        {daysLeft}
                      </span>
                    ) : '0'}
                  </p>
                </div>
              </div>

              {subscription?.hasAccess && daysLeft < 3 && subscription.planType === 'trial' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon name="AlertTriangle" size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-orange-900">Триал скоро закончится</p>
                      <p className="text-orange-800 text-sm mt-1">
                        Осталось {daysLeft} {daysLeft === 1 ? 'день' : 'дня'}. Оформите подписку, чтобы продолжить.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!subscription?.hasAccess && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon name="XCircle" size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-900">Подписка неактивна</p>
                      <p className="text-red-800 text-sm mt-1">
                        Для продолжения работы необходимо оформить подписку
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <div>
              <h2 className="text-2xl font-semibold mb-6">Выберите тариф</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                      ТРИАЛ
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2">Пробный период</h3>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-bold text-emerald-600">Бесплатно</span>
                      <span className="text-gray-500 text-sm">/ 1 день</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Попробуйте все возможности
                    </p>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-start gap-2">
                      <Icon name="Check" size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Безлимит ключей</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Check" size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Безлимит сегментов</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Check" size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Безлимит проектов</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Check" size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Все функции</span>
                    </div>
                  </div>

                  {(!subscription || !subscription.hasAccess) && subscription?.planType !== 'monthly' && (
                    <Button
                      onClick={handleActivate}
                      disabled={activating}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {activating ? (
                        <>
                          <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                          Активация...
                        </>
                      ) : (
                        'Активировать'
                      )}
                    </Button>
                  )}
                  
                  {subscription?.hasAccess && subscription.planType === 'trial' && (
                    <div className="text-center py-2 px-4 bg-emerald-50 text-emerald-700 rounded-lg font-medium text-sm">
                      <Icon name="CheckCircle2" className="inline mr-2" size={16} />
                      Активен
                    </div>
                  )}
                </Card>

                <Card className="p-6 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      РСЯ
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2">Чистка РСЯ</h3>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-bold text-emerald-600">250₽</span>
                      <span className="text-gray-600 text-sm">/ проект</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Один проект для чистки площадок РСЯ
                    </p>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-start gap-2">
                      <Icon name="Check" size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Автоматическая чистка</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Check" size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Фильтры и исключения</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Check" size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">1 проект</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePayment('rsya_project', '250')}
                    disabled={paymentLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {paymentLoading ? (
                      <>
                        <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                        Переход к оплате...
                      </>
                    ) : (
                      'Купить'
                    )}
                  </Button>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-500 shadow-lg relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <div className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-semibold">
                      ПОПУЛЯРНЫЙ
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2">Парсер Вордстат</h3>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-bold text-emerald-600">1500₽</span>
                      <span className="text-gray-600 text-sm">/ месяц</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Парсинг и кластеризация ключей
                    </p>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-start gap-2">
                      <Icon name="Check" size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-gray-900">Безлимит ключей</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Check" size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-gray-900">Безлимит сегментов</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Check" size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-gray-900">Кластеризация GPT-4</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Headphones" size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-gray-900">Приоритетная поддержка</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePayment('wordstat', '1500')}
                    disabled={paymentLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {paymentLoading ? (
                      <>
                        <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                        Переход к оплате...
                      </>
                    ) : (
                      'Оформить подписку'
                    )}
                  </Button>
                </Card>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Icon name="Info" size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">О подписке</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Безопасная оплата через ЮКасса</li>
                    <li>• Подписка активируется автоматически после оплаты</li>
                    <li>• Парсер Вордстат — доступ на 30 дней</li>
                    <li>• Чистка РСЯ — оплата за 1 проект</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}