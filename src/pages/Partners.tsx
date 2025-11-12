import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface PartnerStats {
  referral_code: string;
  total_earned: number;
  total_referrals: number;
  commission_rate: number;
  clicks: number;
  conversions: number;
  pending_amount: number;
}

const Partners = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralUrl = stats?.referral_code 
    ? `${window.location.origin}/?ref=${stats.referral_code}`
    : '';

  useEffect(() => {
    loadPartnerData();
  }, []);

  const loadPartnerData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partners/stats', {
        headers: {
          'X-Auth-Token': user?.session_token || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const becomePartner = async () => {
    try {
      const response = await fetch('/api/partners/register', {
        method: 'POST',
        headers: {
          'X-Auth-Token': user?.session_token || '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
        toast.success('Вы стали партнёром!');
      } else {
        toast.error('Ошибка при регистрации в партнёрской программе');
      }
    } catch (error) {
      toast.error('Ошибка подключения');
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('Ссылка скопирована!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <Icon name="Loader2" className="animate-spin" size={32} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto flex items-center justify-center">
                <Icon name="Users" size={40} className="text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">Партнёрская программа</CardTitle>
              <CardDescription className="text-lg">
                Зарабатывайте 15% с каждой покупки по вашей реферальной ссылке
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">15%</div>
                  <div className="text-sm text-gray-600">Комиссия</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">∞</div>
                  <div className="text-sm text-gray-600">Без лимитов</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-600">24/7</div>
                  <div className="text-sm text-gray-600">Поддержка</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Как это работает?</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold">1</span>
                    </div>
                    <div>
                      <div className="font-medium">Получите уникальную ссылку</div>
                      <div className="text-sm text-gray-600">Станьте партнёром и получите персональную реферальную ссылку</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-semibold">2</span>
                    </div>
                    <div>
                      <div className="font-medium">Делитесь ссылкой</div>
                      <div className="text-sm text-gray-600">Размещайте ссылку в соц.сетях, блогах, у друзей</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-semibold">3</span>
                    </div>
                    <div>
                      <div className="font-medium">Получайте 15%</div>
                      <div className="text-sm text-gray-600">С каждой покупки по вашей ссылке вы получаете комиссию</div>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={becomePartner} 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                size="lg"
              >
                <Icon name="Rocket" className="mr-2" />
                Стать партнёром
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Партнёрская программа</h1>
            <p className="text-gray-600">Отслеживайте свою статистику и заработок</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {stats.commission_rate}% комиссия
          </Badge>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Заработано</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.total_earned.toLocaleString('ru-RU')} ₽
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Рефералов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_referrals}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Переходов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.clicks}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Конверсия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.clicks > 0 ? ((stats.conversions / stats.clicks) * 100).toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ваша реферальная ссылка</CardTitle>
            <CardDescription>Делитесь этой ссылкой для привлечения новых пользователей</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={referralUrl} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button onClick={copyReferralLink} variant="outline">
                <Icon name={copied ? "Check" : "Copy"} className="mr-2" />
                {copied ? 'Скопировано' : 'Копировать'}
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="Info" className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <strong>Совет:</strong> Размещайте ссылку в соцсетях, блогах, YouTube описаниях, рассказывайте коллегам. 
                  Чем больше переходов — тем больше заработок!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {stats.pending_amount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ожидает выплаты</CardTitle>
              <CardDescription>Средства будут доступны для вывода после подтверждения оплаты</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.pending_amount.toLocaleString('ru-RU')} ₽
                </div>
                <Badge variant="outline">В обработке</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Partners;
