import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';
import LandingHeader from '@/components/LandingHeader';
import { BACKEND_URLS } from '@/config/backend-urls';

export default function LandingPage() {
  const [betaSubmitted, setBetaSubmitted] = useState(false);
  const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [animatedSavings, setAnimatedSavings] = useState(0);
  const totalClientSavings = 12483729;
  const leadEmail = 'morozov.diimas39@yandex.ru';
  const leadApiUrl = `${BACKEND_URLS.api}?endpoint=landing-lead`;
  const formattedSavings = `${animatedSavings.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} ₽`;

  useEffect(() => {
    const duration = 1600;
    const startedAt = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedSavings(Math.round(totalClientSavings * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleBetaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phone = String(formData.get('phone') || '').trim();

    if (phone.length < 7) {
      setLeadError('Введите телефон, чтобы мы могли связаться.');
      return;
    }

    setIsLeadSubmitting(true);
    setLeadError('');

    try {
      const response = await fetch(leadApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          source: window.location.href
        })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Не удалось отправить заявку');
      }

      setBetaSubmitted(true);
      event.currentTarget.reset();
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : 'Не удалось отправить заявку');
    } finally {
      setIsLeadSubmitting(false);
    }
  };

  const openBetaModal = () => {
    setBetaSubmitted(false);
    setLeadError('');
    setIsBetaModalOpen(true);
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const benefits = [
    {
      icon: 'RefreshCwOff',
      title: 'Можно забыть о рутине',
      text: 'Сервис сам будет удалять мусорные площадки из РСЯ по заданным правилам, без ежедневной ручной проверки отчетов.'
    },
    {
      icon: 'ShieldCheck',
      title: 'Качественные площадки остаются',
      text: 'Площадки фильтруются по вашим условиям: расход, клики, конверсии, отказы и исключения. Хорошие источники не удаляются вслепую.'
    },
    {
      icon: 'Clock3',
      title: 'Проверка несколько раз в день',
      text: 'Чистка запускается регулярно, поэтому новые слабые площадки не копятся неделями и быстрее уходят в блок.'
    }
  ];

  const savings = [
    {
      icon: 'BadgePercent',
      title: 'До 30% бюджета можно вернуть в работу',
      text: 'Мусорные площадки быстрее уходят в блок, поэтому меньше денег тратится на клики без результата.'
    },
    {
      icon: 'Gauge',
      title: 'Быстрая реакция на слив',
      text: 'Сервис проверяет площадки несколько раз в день и не ждет, пока слабые источники накопят большой расход.'
    },
    {
      icon: 'TrendingUp',
      title: 'Бюджет остается на качественный трафик',
      text: 'После чистки показы продолжаются на площадках, которые проходят фильтры и дают нормальные сигналы.'
    }
  ];

  const steps = [
    {
      icon: 'PlugZap',
      title: 'Подключаем проект',
      text: 'Выбираем кампании РСЯ, цели Метрики и расписание проверки.'
    },
    {
      icon: 'SlidersHorizontal',
      title: 'Задаем фильтры',
      text: 'Настраиваем условия по расходу, кликам, конверсиям, отказам и исключениям.'
    },
    {
      icon: 'ShieldMinus',
      title: 'Блокируем мусор',
      text: 'Сервис несколько раз в день находит слабые площадки и добавляет их в исключения.'
    }
  ];

  const outcomes = [
    'Меньше ручной проверки отчетов',
    'Меньше слива бюджета на слабые площадки',
    'Хорошие площадки остаются в работе',
    'Понятный контроль по каждому запуску'
  ];

  return (
    <div className="min-h-screen bg-[#f6fbf8] text-slate-900 selection:bg-emerald-100">
      <SEOHead
        title="DirectKit - чистка площадок РСЯ для Яндекс Директ"
        description="DirectKit помогает специалистам по Яндекс Директу вручную настраивать автоматическую чистку площадок РСЯ, проверять preview перед блокировкой и контролировать проекты клиентов."
        keywords="DirectKit, чистка РСЯ, площадки РСЯ, блокировка площадок РСЯ, Яндекс Директ, Direct API"
        canonical="https://directkit.ru/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'DirectKit',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: 'Сервис для парсинга Wordstat и чистки площадок РСЯ в Яндекс Директе.'
        }}
      />

      <LandingHeader onBetaClick={openBetaModal} onSectionClick={scrollToSection} />

      <main>
        <section id="hero" className="relative scroll-mt-24 overflow-hidden bg-[radial-gradient(circle_at_75%_18%,rgba(20,184,166,0.16),transparent_34%),linear-gradient(135deg,#ffffff_0%,#effbf5_54%,#e7f8f7_100%)]">
          <div className="mx-auto grid min-h-[600px] max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[1fr_0.95fr]">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white/75 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm backdrop-blur">
                <Icon name="LockKeyhole" size={16} />
                Закрытая бета для ручного подключения клиентов
              </div>
              <h1 className="max-w-2xl text-4xl font-black leading-[1.08] tracking-normal text-slate-900 md:text-5xl">
                Сервис автоматической чистки площадок РСЯ 24/7
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Уберите рутину! Эффективная чистка площадок РСЯ по заданным фильтрам.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={openBetaModal}
                  className="h-14 rounded-md bg-emerald-600 px-7 text-base font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                >
                  <Icon name="Rocket" size={19} className="mr-2" />
                  Оставить заявку на закрытый бета-тест
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-emerald-200/25 blur-3xl" aria-hidden="true" />
              <div className="relative mx-auto max-w-[560px] overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/85 p-3 shadow-2xl shadow-emerald-900/10 backdrop-blur">
                <img
                  src="/images/rsya-cleaning-hero.png"
                  alt="Чистка площадок РСЯ: preview перед блокировкой в Direct API"
                  className="w-full rounded-[1.55rem] object-cover"
                  width="1448"
                  height="1086"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="benefits" className="scroll-mt-24 border-y border-emerald-100 bg-white py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-9 max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Преимущества платформы</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">
                Чистка РСЯ работает по правилам, а не на глаз
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {benefits.map((benefit) => (
                <article key={benefit.title} className="rounded-xl border border-emerald-100 bg-[#f8fffb] p-6 shadow-sm">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Icon name={benefit.icon} size={23} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{benefit.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{benefit.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="savings" className="scroll-mt-24 bg-white py-20">
          <div className="w-full px-6 py-10 text-center">
            <p className="mb-8 text-2xl font-black tracking-normal text-emerald-900 md:text-4xl">
              Всего помогли сэкономить
            </p>

            <div className="whitespace-nowrap text-[13vw] font-black leading-none tracking-[-0.08em] text-emerald-950">
              {formattedSavings}
            </div>

            <Button
              size="lg"
              onClick={openBetaModal}
              className="mt-10 h-14 rounded-xl bg-emerald-600 px-8 text-base font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              Записаться на закрытый бета-тест
            </Button>
          </div>
        </section>

        <section id="economy" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20">
          <div className="overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-xl shadow-emerald-900/5">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              <div className="bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_34%),linear-gradient(135deg,#ecfdf5,#ffffff)] p-8 md:p-10">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Экономия бюджета</p>
                <div className="mt-7 inline-flex items-end gap-3">
                  <span className="text-7xl font-black leading-none text-emerald-700 md:text-8xl">30%</span>
                  <span className="pb-3 text-xl font-black text-slate-900">до</span>
                </div>
                <h2 className="mt-6 max-w-xl text-3xl font-black tracking-normal text-slate-900 md:text-4xl">
                  меньше бюджета уходит на мусорные площадки
                </h2>
                <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-slate-600">
                  Быстрая чистка останавливает площадки, которые тратят деньги без заявок и конверсий, пока они не успели съесть существенную часть бюджета.
                </p>
                <div className="mt-8 rounded-xl border border-emerald-100 bg-white/80 p-4">
                  <div className="mb-3 flex items-center justify-between text-sm font-black">
                    <span className="text-slate-700">Расход на слабые площадки</span>
                    <span className="text-emerald-700">снижается</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="grid gap-px bg-emerald-100 p-px md:grid-cols-3 lg:grid-cols-1">
                {savings.map((item) => (
                  <article key={item.title} className="grid gap-4 bg-white p-6 md:grid-cols-[56px_1fr] md:p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <Icon name={item.icon} size={23} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">{item.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-white py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Как это работает</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-5xl">
                Настроили один раз, дальше чистка идет по расписанию
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <article key={step.title} className="relative rounded-2xl border border-emerald-100 bg-[#f8fffb] p-7">
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Icon name={step.icon} size={23} />
                    </div>
                    <span className="text-5xl font-black leading-none text-emerald-100">0{index + 1}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="result" className="scroll-mt-24 bg-[#f6fbf8] py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Результат для клиента</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-5xl">
                Контроль площадок без ежедневной рутины
              </h2>
              <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-slate-600">
                Клиент получает не просто список заблокированных доменов, а понятную систему контроля качества трафика в РСЯ.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {outcomes.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
                  <Icon name="CheckCircle2" size={20} className="shrink-0 text-emerald-600" />
                  <span className="text-base font-black text-slate-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="request" className="scroll-mt-24 border-y border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#f8fffb_54%,#edfafa_100%)] py-20 text-slate-900">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Закрытый бета-тест</p>
            <h2 className="mt-3 text-3xl font-black tracking-normal md:text-5xl">
              Оставьте заявку на подключение
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
              Уникальная возможность подключить сервис автоматической чистки площадок РСЯ до публичного запуска.
            </p>

            <Button
              size="lg"
              onClick={openBetaModal}
              className="mt-8 h-14 rounded-xl bg-emerald-600 px-8 text-base font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              Оставить заявку
            </Button>

            {betaSubmitted && (
              <div className="mx-auto mt-4 max-w-2xl rounded-lg border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-emerald-800">
                Заявка отправлена. Скоро свяжемся.
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-emerald-100 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 md:flex-row md:items-center md:justify-between">
          <img
            src="/images/directkit-logo.png"
            alt="DirectKit"
            className="h-8 w-auto object-contain"
            width="108"
            height="36"
          />
          <nav className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-slate-500">
            <button onClick={() => scrollToSection('benefits')} className="hover:text-emerald-700">Преимущества</button>
            <button onClick={() => scrollToSection('savings')} className="hover:text-emerald-700">Экономия</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-emerald-700">Как работает</button>
            <button onClick={() => scrollToSection('result')} className="hover:text-emerald-700">Результат</button>
            <button onClick={openBetaModal} className="hover:text-emerald-700">Оставить заявку</button>
            <a href={`mailto:${leadEmail}`} className="hover:text-emerald-700">{leadEmail}</a>
          </nav>
        </div>
      </footer>

      <Dialog open={isBetaModalOpen} onOpenChange={setIsBetaModalOpen}>
        <DialogContent className="max-w-md overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl">
          <div className="bg-[linear-gradient(135deg,#ecfdf5,#ffffff)] px-6 pb-5 pt-6">
            <DialogHeader className="space-y-3 text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Icon name="Sparkles" size={22} />
              </div>
              <DialogTitle className="text-2xl font-black leading-tight text-slate-900">
                Заявка на закрытый бета-тест
              </DialogTitle>
              <DialogDescription className="text-sm font-semibold leading-6 text-slate-600">
                Оставьте телефон, и мы свяжемся для подключения чистки площадок РСЯ.
              </DialogDescription>
            </DialogHeader>
          </div>

          {betaSubmitted ? (
            <div className="px-6 pb-6">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Icon name="Check" size={22} />
                </div>
                <p className="text-lg font-black text-emerald-950">Заявка отправлена</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Телефон уже ушел нам на почту. Скоро свяжемся.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBetaSubmit} className="space-y-4 px-6 pb-6">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-800">Телефон</span>
                <Input
                  name="phone"
                  required
                  autoFocus
                  inputMode="tel"
                  placeholder="+7 (999) 000-00-00"
                  className="h-12 rounded-xl border-slate-200 text-base font-semibold focus-visible:ring-emerald-100"
                />
              </label>

              {leadError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {leadError}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLeadSubmitting}
                className="h-14 w-full rounded-xl bg-emerald-600 text-base font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLeadSubmitting ? 'Отправляем...' : 'Отправить заявку'}
              </Button>

              <p className="text-center text-xs font-semibold leading-5 text-slate-500">
                Нажимая кнопку, вы отправляете телефон для связи по закрытому бета-тесту.
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
