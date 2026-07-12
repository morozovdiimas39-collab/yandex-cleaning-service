import { Button } from '@/components/ui/button';

interface LandingHeaderProps {
  onBetaClick?: () => void;
  onSectionClick?: (sectionId: string) => void;
}

const menuItems = [
  { label: 'Преимущества', sectionId: 'benefits' },
  { label: 'Экономия', sectionId: 'savings' },
  { label: 'Как работает', sectionId: 'how-it-works' },
  { label: 'Результат', sectionId: 'result' }
];

export default function LandingHeader({ onBetaClick, onSectionClick }: LandingHeaderProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <button className="flex items-center gap-3" onClick={scrollToTop} aria-label="DirectKit">
          <img 
            src="/images/directkit-logo.png" 
            alt="Логотип DirectKit - автоматизация Яндекс.Директ, парсер Wordstat и чистка РСЯ" 
            className="h-7 w-auto object-contain sm:h-9"
            width="108"
            height="36"
          />
        </button>

        <nav className="hidden items-center gap-6 lg:flex">
          {menuItems.map((item) => (
            <button
              key={item.sectionId}
              onClick={() => onSectionClick?.(item.sectionId)}
              className="text-sm font-bold text-slate-600 transition hover:text-emerald-700"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            onClick={onBetaClick}
            className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-lg shadow-emerald-600/15 hover:bg-emerald-700 sm:h-11 sm:px-5 sm:text-sm"
          >
            <span className="sm:hidden">Заявка</span>
            <span className="hidden sm:inline">Оставить заявку</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
