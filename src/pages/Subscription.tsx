import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';

export default function Subscription() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50">
      <Sidebar />
      <div className="flex-1">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Доступ к сервису</h1>
              <p className="text-gray-600">Пока сервис полностью бесплатный</p>
            </div>

            <Card className="p-6 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="CheckCircle2" size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-1">Всё бесплатно</h2>
                  <p className="text-gray-600">
                    Сбор ключей, кластеризация, чистка РСЯ и остальные функции доступны без ограничений и без оплаты.
                  </p>
                </div>
              </div>
            </Card>

            <Button variant="outline" onClick={() => navigate('/home')}>
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              На главную
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
