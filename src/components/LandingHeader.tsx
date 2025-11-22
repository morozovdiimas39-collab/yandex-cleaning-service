import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function LandingHeader() {
  const navigate = useNavigate();

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-white/90">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img 
            src="https://cdn.poehali.dev/projects/e8511f31-5a6a-4fd5-9a7c-5620b5121f26/files/16625d69-4f43-4dfb-a302-c6efe2ad9bc7.jpg" 
            alt="DirectKit Logo" 
            className="w-10 h-10 rounded-xl object-cover shadow-sm"
          />
          <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            DirectKit
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <button onClick={() => navigate('/wordstat-parser')} className="text-slate-600 hover:text-emerald-600 transition font-medium">
            Сбор фраз Wordstat
          </button>
          <button onClick={() => navigate('/rsya-cleaning')} className="text-slate-600 hover:text-emerald-600 transition font-medium">
            Чистка РСЯ
          </button>
          <button onClick={() => navigate('/pricing')} className="text-slate-600 hover:text-emerald-600 transition font-medium">
            Цены
          </button>
          <button onClick={() => navigate('/cases')} className="text-slate-600 hover:text-emerald-600 transition font-medium">
            Кейсы
          </button>
          <button onClick={() => navigate('/blog')} className="text-slate-600 hover:text-emerald-600 transition font-medium">
            Блог
          </button>
          <button onClick={() => navigate('/about-us')} className="text-slate-600 hover:text-emerald-600 transition font-medium">
            О нас
          </button>
        </nav>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/login')} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
            Войти
          </Button>
          <Button onClick={() => navigate('/auth')} className="bg-emerald-600 hover:bg-emerald-700">
            Регистрация
          </Button>
        </div>
      </div>
    </header>
  );
}
