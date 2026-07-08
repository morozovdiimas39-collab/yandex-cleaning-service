import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import SEOHead from '@/components/SEOHead';
import LandingHeader from '@/components/LandingHeader';

export default function WordstatParserPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 font-sans antialiased">
      <SEOHead 
        title="Яндекс Вордстат | Сбор семантики и профессиональный парсинг"
        description="Облачный парсер Яндекс Вордстат без капчи. 10 000+ запросов за 30 минут с выгрузкой в Excel. Официальный API Яндекса."
        keywords="вордстат, яндекс вордстат, парсер wordstat, сбор семантики"
        canonical="https://directkit.ru/wordstat-parser"
      />

      <LandingHeader />

      {/* Hero Section - Left Aligned with Illustration */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight text-slate-900 leading-tight">
                Сбор семантики<br />
                Яндекс <span className="text-emerald-600">Вордстат</span>
              </h1>
              
              <p className="text-base md:text-lg text-slate-600 max-w-lg leading-relaxed mb-8 font-medium">
                Облачный парсинг без капчи и блокировок IP. 10 000+ запросов за 30 минут с выгрузкой в Excel. Официальный API Яндекса.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 py-6 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  Начать бесплатно
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-emerald-500/5 blur-3xl rounded-full" />
              <img 
                src="/images/wordstat-illustration.png" 
                alt="Wordstat Data Illustration" 
                className="relative z-10 w-full h-auto drop-shadow-2xl rounded-3xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Video Section - Bigger Header */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-left mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
              Как пользоваться сервисом
            </h2>
            <p className="text-xl text-slate-500 font-medium max-w-3xl leading-relaxed">
              Посмотрите короткий видео-обзор: от ввода первых ключевых слов до получения готового файла Excel.
            </p>
          </div>
          <div className="max-w-5xl">
            <Card className="border-0 shadow-2xl rounded-[2rem] overflow-hidden group relative">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
                  <div className="relative z-10 text-center">
                    <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-all cursor-pointer shadow-xl shadow-emerald-600/40">
                      <Icon name="Play" size={32} className="fill-current ml-1" />
                    </div>
                    <p className="text-white font-bold text-xl drop-shadow-md">Смотреть обзор (2 мин)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Efficiency Section - Bigger Header */}
      <section className="py-28 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-left mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
              Эффективность парсинга
            </h2>
            <p className="text-xl text-slate-500 max-w-3xl font-medium leading-relaxed">
              Почему облачный парсинг DirectKit выигрывает у классических методов
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-16 h-16 bg-white border-4 border-slate-50 rounded-full shadow-xl">
              <span className="text-xl font-black text-slate-400">VS</span>
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-4 relative">
              <div className="bg-slate-50/50 rounded-[2.5rem] p-10 md:pr-16 border border-slate-100 transition-all hover:bg-slate-50 group">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                    <Icon name="XCircle" size={28} className="text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Обычный сбор</h3>
                    <p className="text-slate-400 font-medium">Устаревшие методы</p>
                  </div>
                </div>
                
                <div className="space-y-6 text-left">
                  {[
                    { t: 'Капча', d: 'Каждые 30-60 секунд. Невозможно автоматизировать.' },
                    { t: 'Лимиты', d: 'Только 40 страниц WordStat. Вы теряете 80% семантики.' },
                    { t: 'Блокировки', d: 'Постоянный риск бана IP и аккаунта в Яндексе.' },
                    { t: 'Сложность', d: 'Нужно искать, покупать и настраивать прокси.' },
                    { t: 'Рутина', d: 'Часы ожидания у монитора для контроля процесса.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <div>
                        <span className="block font-bold text-slate-700 text-lg mb-0.5">{item.t}</span>
                        <span className="text-slate-500 font-medium">{item.d}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-600 rounded-[2.5rem] p-10 md:pl-16 text-white shadow-2xl shadow-emerald-600/20 relative overflow-hidden group text-left">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl transition-all group-hover:scale-110" />
                <div className="flex items-center gap-4 mb-10 relative z-10">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                    <Icon name="CheckCircle2" size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">DirectKit API</h3>
                    <p className="text-emerald-100 font-medium">Облачные технологии</p>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  {[
                    { t: 'Без капчи', d: 'Работаем через официальный API v2. Никаких проверок.' },
                    { t: 'Вся глубина', d: 'Парсим 100% данных, включая правую колонку и хвосты.' },
                    { t: 'Безопасность', d: 'Официальный доступ по токену. Риск бана — 0%.' },
                    { t: 'Всё включено', d: 'Прокси и аккаунты наши. Вам не нужно ничего докупать.' },
                    { t: 'Скорость', d: '10 000 фраз за 30 мин. В 10 раз быстрее любого парсера.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="mt-1.5 shrink-0">
                        <Icon name="Check" size={20} className="text-emerald-300" />
                      </div>
                      <div>
                        <span className="block font-bold text-white text-lg mb-0.5">{item.t}</span>
                        <span className="text-emerald-50/80 font-medium">{item.d}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid - Bigger Header */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-left mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
              Возможности платформы
            </h2>
            <p className="text-xl text-slate-500 font-medium max-w-3xl leading-relaxed">
              Инструменты, которые делают сбор ключевых слов быстрым и качественным
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: 'MapPin', title: 'Регионы', desc: 'Сбор по любому городу, области или всей России.' },
              { icon: 'Zap', title: 'Облако', desc: 'Закройте вкладку — парсинг идет на наших серверах.' },
              { icon: 'Layers', title: 'Глубина', desc: 'Парсим все уровни вложенности и правую колонку.' },
              { icon: 'Filter', title: 'Минус-фразы', desc: 'Очистка мусора прямо во время работы.' },
              { icon: 'FileSpreadsheet', title: 'Экспорт', desc: 'Чистый Excel со всей статистикой для Директа.' },
              { icon: 'Shield', title: 'Безопасность', desc: 'Официальный доступ через API Яндекса.' }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all text-left">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 border border-emerald-100 shadow-sm">
                  <Icon name={feature.icon as any} className="text-emerald-600" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final - Bigger Header */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full -mr-64 -mt-64 blur-[120px]" />
            <div className="relative z-10 max-w-4xl">
              <h2 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight leading-tight">
                Готовы начать работу?
              </h2>
              <p className="text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed font-medium">
                Бесплатный тариф доступен сразу после регистрации. Попробуйте все возможности облачного парсера прямо сейчас.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl px-12 py-8 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-600/30"
              >
                Попробовать бесплатно
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-10">
            <div className="flex items-center gap-3">
              <img 
                src="/images/directkit-logo.png" 
                alt="Logo" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="flex gap-10 text-base font-bold text-slate-400">
              <a href="/pricing" className="hover:text-emerald-600 transition-colors">Цены</a>
              <a href="/about-us" className="hover:text-emerald-600 transition-colors">О нас</a>
              <a href="mailto:support@directkit.ru" className="hover:text-emerald-600 transition-colors">Поддержка</a>
            </div>
          </div>
          <div className="text-left text-slate-400 text-sm font-medium">
            © 2026 DirectKit. Профессиональный инструмент для работы с ключевыми словами.
          </div>
        </div>
      </footer>
    </div>
  );
}
