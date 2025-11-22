import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from '@/config/backend-urls';
import { useToast } from '@/hooks/use-toast';

interface Partner {
  user_id: number;
  referral_code: string;
  commission_rate: number;
  total_earned: number;
  total_referrals: number;
  is_active: boolean;
}

interface Referral {
  id: number;
  partner_id: number;
  referred_user_id: number;
  phone: string;
  status: string;
  commission_amount: number;
  created_at: string;
  paid_at: string | null;
}

const ADMIN_KEY = 'directkit_admin_2024';

export default function AffiliatesTab() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URLS.subscription}?action=admin_affiliates`,
        {
          method: 'GET',
          headers: {
            'X-Admin-Key': ADMIN_KEY
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || []);
        setReferrals(data.referrals || []);
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные партнеров',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading affiliates:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.referral_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user_id.toString().includes(searchQuery)
  );

  const totalEarned = partners.reduce((sum, p) => sum + p.total_earned, 0);
  const totalReferrals = partners.reduce((sum, p) => sum + p.total_referrals, 0);
  const activePartners = partners.filter((p) => p.is_active && p.total_referrals > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Icon name="Loader2" className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Статистика */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Всего партнеров
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{partners.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Активные партнеры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{activePartners}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Всего рефералов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Выплачено комиссий
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {totalEarned.toFixed(0)} ₽
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Поиск */}
      <Card>
        <CardHeader>
          <CardTitle>Партнеры</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Поиск по коду или User ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Реферальный код</TableHead>
                <TableHead>Комиссия</TableHead>
                <TableHead>Рефералов</TableHead>
                <TableHead>Заработано</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow key={partner.user_id}>
                  <TableCell className="font-mono">{partner.user_id}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {partner.referral_code}
                  </TableCell>
                  <TableCell>{partner.commission_rate}%</TableCell>
                  <TableCell>{partner.total_referrals}</TableCell>
                  <TableCell className="font-semibold">
                    {partner.total_earned.toFixed(2)} ₽
                  </TableCell>
                  <TableCell>
                    <Badge variant={partner.is_active ? 'default' : 'secondary'}>
                      {partner.is_active ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPartners.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Партнеры не найдены
            </div>
          )}
        </CardContent>
      </Card>

      {/* Последние рефералы */}
      <Card>
        <CardHeader>
          <CardTitle>Последние рефералы</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Партнер ID</TableHead>
                <TableHead>Реферал ID</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Комиссия</TableHead>
                <TableHead>Дата регистрации</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.slice(0, 20).map((ref) => (
                <TableRow key={ref.id}>
                  <TableCell className="font-mono">{ref.partner_id}</TableCell>
                  <TableCell className="font-mono">{ref.referred_user_id}</TableCell>
                  <TableCell>{ref.phone || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={ref.status === 'paid' ? 'default' : 'secondary'}>
                      {ref.status === 'paid' ? 'Оплачено' : 'Ожидание'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {ref.commission_amount > 0
                      ? `${ref.commission_amount.toFixed(2)} ₽`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(ref.created_at).toLocaleDateString('ru-RU')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {referrals.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Рефералов пока нет
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
