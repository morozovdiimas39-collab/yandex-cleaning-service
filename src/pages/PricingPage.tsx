import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';
import LandingHeader from '@/components/LandingHeader';

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="DirectKit — Пока бесплатно"
        description="Сервис для сбора ключей, кластеризации и чистки РСЯ. Пока полностью бесплатно."
        keywords="directkit, парсер wordstat, кластеризация, чистка рся, бесплатно"
        canonical="https://directkit.ru/pricing"
      />

      <LandingHeader />

      <section className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Пока всё бесплатно</h1>
          <p className="text-xl text-slate-600 mb-8">
            Сбор ключей, кластеризация, чистка РСЯ — без ограничений и без оплаты.
          </p>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <Icon name="CheckCircle2" size={28} className="text-emerald-600" />
                </div>
                <span className="text-3xl font-bold text-slate-900">0₽</span>
              </div>
              <p className="text-slate-600 mb-8">
                Все функции доступны без подписки и оплаты.
              </p>
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Начать
                <Icon name="ArrowRight" size={18} className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400">© DirectKit</p>
        </div>
      </footer>
    </div>
  );
}
