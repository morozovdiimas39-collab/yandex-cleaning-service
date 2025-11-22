import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_URLS } from '@/config/backend-urls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Referral {
  id: number;
  user_id: number;
  phone: string;
  status: string;
  commission: number;
  plan_type: string;
  subscription_amount: number;
  created_at: string;
  paid_at: string | null;
}

export default function AffiliateProgram() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<number>(20);
  const [stats, setStats] = useState({
    referrals: 0,
    earnings: 0,
    conversions: 0
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(BACKEND_URLS.subscription, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({ action: 'affiliate_stats' })
      });

      if (response.ok) {
        const data = await response.json();
        setReferralCode(data.partner.referral_code);
        setCommissionRate(data.partner.commission_rate);
        setStats(data.stats);
        setReferrals(data.referrals || []);
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const referralLink = `https://directkit.ru/auth?ref=${referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '✅ Скопировано',
      description: 'Ссылка скопирована в буфер обмена'
    });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <AppSidebar />
      <div className="flex-1 overflow-auto ml-64">
        <div className="max-w-5xl mx-auto p-6">
          {/* Шапка */}
          <div className="text-center mb-12 pt-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl mb-4 shadow-lg">
              <Icon name="Users" size={32} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">
              Партнерская программа
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Зарабатывайте {commissionRate}% с каждой покупки приведенных пользователей
            </p>
          </div>

          {/* Статистика */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon name="Users" size={20} className="text-emerald-500" />
                  Рефералы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-emerald-600">{stats.referrals}</p>
                <p className="text-sm text-muted-foreground mt-1">Зарегистрировано</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon name="CheckCircle2" size={20} className="text-green-500" />
                  Конверсии
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">{stats.conversions}</p>
                <p className="text-sm text-muted-foreground mt-1">Оплатили подписку</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon name="DollarSign" size={20} className="text-teal-500" />
                  Заработано
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-teal-600">{stats.earnings} ₽</p>
                <p className="text-sm text-muted-foreground mt-1">Всего заработано</p>
              </CardContent>
            </Card>
          </div>

          {/* Реферальная ссылка */}
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Ваша реферальная ссылка</CardTitle>
              <CardDescription>
                Делитесь этой ссылкой с коллегами и получайте {commissionRate}% с их подписок
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 font-mono text-sm"
                />
                <Button onClick={() => copyToClipboard(referralLink)} className="px-6">
                  <Icon name="Copy" size={18} />
                  <span className="ml-2">Копировать</span>
                </Button>
              </div>

              <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <Icon name="Info" size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-emerald-900 font-medium mb-1">
                    Ваш реферальный код: <span className="font-bold">{referralCode}</span>
                  </p>
                  <p className="text-sm text-emerald-700">
                    Пользователи могут ввести этот код при регистрации
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Условия программы */}
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Как это работает?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Поделитесь ссылкой</h4>
                  <p className="text-muted-foreground">
                    Отправьте реферальную ссылку коллегам, друзьям или опубликуйте в соцсетях
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Пользователь регистрируется</h4>
                  <p className="text-muted-foreground">
                    Новый пользователь переходит по вашей ссылке и регистрируется в DirectKit
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Получайте вознаграждение</h4>
                  <p className="text-muted-foreground">
                    Вы получаете {commissionRate}% с каждого платежа вашего реферала, пока действует его подписка
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Преимущества */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="TrendingUp" size={24} className="text-white" />
                </div>
                <CardTitle>Пассивный доход</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Получайте стабильный доход каждый месяц, пока ваши рефералы продлевают подписку
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Percent" size={24} className="text-white" />
                </div>
                <CardTitle>Высокий процент</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  20% комиссия - один из самых высоких показателей на рынке SaaS-сервисов
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Zap" size={24} className="text-white" />
                </div>
                <CardTitle>Быстрые выплаты</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Выплаты производятся автоматически два раза в месяц на ваш счет
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-3">
                  <Icon name="BarChart3" size={24} className="text-white" />
                </div>
                <CardTitle>Подробная статистика</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Отслеживайте количество переходов, регистраций и конверсий в реальном времени
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Список рефералов */}
          {referrals.length > 0 && (
            <Card className="border-0 shadow-lg mb-8">
              <CardHeader>
                <CardTitle>Ваши рефералы</CardTitle>
                <CardDescription>
                  История приведенных пользователей и начисленных комиссий
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Комиссия</TableHead>
                      <TableHead>Зарегистрирован</TableHead>
                      <TableHead>Оплачено</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((ref) => (
                      <TableRow key={ref.id}>
                        <TableCell className="font-mono text-sm">{ref.user_id}</TableCell>
                        <TableCell>{ref.phone || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={ref.status === 'paid' ? 'default' : 'secondary'}>
                            {ref.status === 'paid' ? 'Оплачено' : ref.status === 'pending' ? 'Ожидание' : ref.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {ref.commission > 0 ? `${ref.commission.toFixed(2)} ₽` : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(ref.created_at).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ref.paid_at ? new Date(ref.paid_at).toLocaleDateString('ru-RU') : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* FAQ */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Часто задаваемые вопросы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Когда я получу выплату?</h4>
                <p className="text-muted-foreground">
                  Выплаты производятся 1-го и 15-го числа каждого месяца. Минимальная сумма для вывода - 1000 ₽
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Сколько рефералов я могу привести?</h4>
                <p className="text-muted-foreground">
                  Без ограничений! Приводите столько пользователей, сколько сможете
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Как долго действует моя реферальная ссылка?</h4>
                <p className="text-muted-foreground">
                  Реферальная ссылка действует бессрочно. Cookie сохраняется 90 дней с момента первого перехода
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Могу ли я использовать рекламу?</h4>
                <p className="text-muted-foreground">
                  Да, вы можете продвигать DirectKit любыми легальными способами: контекстная реклама, соцсети, блоги, YouTube
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}