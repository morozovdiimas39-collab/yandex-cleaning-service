import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { BACKEND_URLS } from '@/config/backend-urls';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(BACKEND_URLS.subscription, {
          method: 'GET',
          headers: {
            'X-User-Id': user.id
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки подписки:', error);
      }
    };

    fetchSubscription();
  }, [user]);

  const renderSubscriptionBanner = () => {
    if (!subscription) return null;

    const daysLeft = subscription.expiresAt 
      ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    // Триал активен
    if (subscription.planType === 'trial' && subscription.hasAccess) {
      return (
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Icon name="CheckCircle2" size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-green-900">Триал активен</h3>
                  <p className="text-green-700">
                    Осталось {daysLeft} {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'} пробного периода
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/subscription')}
                variant="outline"
                className="border-green-600 text-green-700 hover:bg-green-100"
              >
                Оформить подписку
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Подписка истекла или нет доступа
    if (!subscription.hasAccess || subscription.status === 'expired') {
      return (
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Icon name="AlertTriangle" size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-orange-900">Подписка истекла</h3>
                  <p className="text-orange-700">
                    Оформите подписку для продолжения работы с сервисом
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/subscription')}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Оформить подписку
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Подписка monthly активна
    if (subscription.planType === 'monthly' && subscription.hasAccess) {
      const endDate = subscription.expiresAt 
        ? new Date(subscription.expiresAt).toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })
        : 'не указана';
      
      return (
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Icon name="Crown" size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-blue-900">Подписка активна</h3>
                  <p className="text-blue-700">
                    Подписка действует до {endDate}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/subscription')}
                variant="outline"
                className="border-blue-600 text-blue-700 hover:bg-blue-100"
              >
                Управление подпиской
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <AppSidebar />
      <div className="flex-1 overflow-auto ml-64">
        <div className="max-w-5xl mx-auto p-6">
          {/* Шапка */}
          <div className="text-center mb-12 pt-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl mb-4 shadow-lg">
              <Icon name="Zap" size={32} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">
              DirectKit
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Профессиональный сервис для сбора, кластеризации и очистки семантического ядра Яндекс.Директ
            </p>
          </div>

          {/* Баннер подписки */}
          {renderSubscriptionBanner()}

          {/* Основные возможности */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Search" size={24} className="text-white" />
                </div>
                <CardTitle>Сбор семантики</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Автоматический парсинг запросов из Яндекс.Wordstat с поддержкой регионов и глубокой выгрузки данных
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Grid3x3" size={24} className="text-white" />
                </div>
                <CardTitle>Кластеризация</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Умная группировка запросов по интентам с поддержкой операторов Яндекс.Директ: кавычки, скобки, ! и +
                </CardDescription>
              </CardHeader>
            </Card>


          </div>

          {/* Подробнее о функциях */}
          <Card className="mb-12 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl">Возможности платформы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Icon name="CheckCircle2" size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Операторы соответствия Яндекс.Директ</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Полная поддержка операторов: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">"фраза"</span>, <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">[точный порядок]</span>, <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">!словоформа</span>, <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">+предлог</span> для точного таргетинга
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="CheckCircle2" size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Многопроектная работа</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Управляйте неограниченным количеством проектов: Wordstat, кластеризация и очистка РСЯ в одном интерфейсе
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Icon name="CheckCircle2" size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Экспорт в форматах Excel и CSV</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Выгружайте готовые кластеры и минус-слова для быстрой загрузки в Яндекс.Директ и Директ Коммандер
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Icon name="CheckCircle2" size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">История изменений</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Автосохранение работы и возможность отката к предыдущим версиям кластеризации
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}