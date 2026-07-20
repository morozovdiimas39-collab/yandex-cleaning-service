import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Clock3,
  Home,
  KeyRound,
  Landmark,
  MapPin,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import "./DeveloperQuiz.css";

type QuizAnswers = {
  purpose: string;
  rooms: string[];
  moveIn: string;
  payment: string;
  budget: string;
  location: string[];
};

type Option = {
  value: string;
  title: string;
  note: string;
  icon: typeof Home;
};

type QuizStep = {
  key: keyof QuizAnswers;
  eyebrow: string;
  title: string;
  description: string;
  multi?: boolean;
  options: Option[];
};

const initialAnswers: QuizAnswers = {
  purpose: "",
  rooms: [],
  moveIn: "",
  payment: "",
  budget: "",
  location: [],
};

const steps: QuizStep[] = [
  {
    key: "purpose",
    eyebrow: "Начнём с главного",
    title: "Для чего вы выбираете квартиру?",
    description: "Так мы поймём, какие проекты и условия показать в первую очередь.",
    options: [
      { value: "live", title: "Для себя", note: "Подберём комфортный вариант для жизни", icon: Home },
      { value: "family", title: "Для семьи", note: "Учтём школы, дворы и инфраструктуру", icon: Building2 },
      { value: "invest", title: "Для инвестиций", note: "Сфокусируемся на ликвидности и доходности", icon: Landmark },
      { value: "children", title: "Для детей или родителей", note: "Найдём удобный и спокойный район", icon: KeyRound },
    ],
  },
  {
    key: "rooms",
    eyebrow: "Планировка",
    title: "Сколько комнат рассматриваете?",
    description: "Можно выбрать несколько вариантов — покажем всё подходящее.",
    multi: true,
    options: [
      { value: "studio", title: "Студия", note: "Компактно и функционально", icon: Home },
      { value: "1", title: "1 комната", note: "Для одного или пары", icon: Home },
      { value: "2", title: "2 комнаты", note: "Баланс пространства и бюджета", icon: Home },
      { value: "3", title: "3 комнаты", note: "Простор для всей семьи", icon: Home },
      { value: "4plus", title: "4+ комнаты", note: "Максимум личного пространства", icon: Home },
    ],
  },
  {
    key: "moveIn",
    eyebrow: "Сроки",
    title: "Когда планируете переезд?",
    description: "Подберём готовые корпуса или выгодные предложения на этапе строительства.",
    options: [
      { value: "ready", title: "Как можно скорее", note: "Ключи сразу или в ближайшие месяцы", icon: KeyRound },
      { value: "year", title: "В течение года", note: "Рассматриваю сдачу в этом году", icon: Clock3 },
      { value: "two-years", title: "Через 1–2 года", note: "Готов подождать ради лучших условий", icon: Building2 },
      { value: "exploring", title: "Пока изучаю рынок", note: "Хочу понять цены и варианты", icon: Sparkles },
    ],
  },
  {
    key: "payment",
    eyebrow: "Способ покупки",
    title: "Как планируете оплачивать?",
    description: "Это поможет сразу рассчитать реалистичный ежемесячный платёж.",
    options: [
      { value: "mortgage", title: "Ипотека", note: "С господдержкой или стандартная", icon: Landmark },
      { value: "installment", title: "Рассрочка", note: "Платежи застройщику без банка", icon: WalletCards },
      { value: "cash", title: "Полная оплата", note: "Собственные средства", icon: ShieldCheck },
      { value: "trade-in", title: "Продам другую недвижимость", note: "Рассмотрю trade-in или альтернативу", icon: Building2 },
      { value: "consultation", title: "Нужна консультация", note: "Сравним все доступные способы", icon: Sparkles },
    ],
  },
  {
    key: "budget",
    eyebrow: "Бюджет",
    title: "В каком диапазоне ищете квартиру?",
    description: "Можно выбрать ориентировочно — точную сумму обсудим позже.",
    options: [
      { value: "under-8", title: "До 8 млн ₽", note: "Покажем самые доступные предложения", icon: WalletCards },
      { value: "8-12", title: "8–12 млн ₽", note: "Популярный диапазон", icon: WalletCards },
      { value: "12-18", title: "12–18 млн ₽", note: "Больше площади и выбор районов", icon: WalletCards },
      { value: "18-25", title: "18–25 млн ₽", note: "Бизнес-класс и просторные планировки", icon: WalletCards },
      { value: "25plus", title: "Более 25 млн ₽", note: "Премиальные проекты", icon: WalletCards },
      { value: "undecided", title: "Пока не определился", note: "Поможем оценить возможности", icon: Sparkles },
    ],
  },
  {
    key: "location",
    eyebrow: "Локация",
    title: "Что важнее всего рядом с домом?",
    description: "Выберите до трёх пунктов — это основа персональной подборки.",
    multi: true,
    options: [
      { value: "metro", title: "Метро рядом", note: "До станции можно дойти пешком", icon: MapPin },
      { value: "schools", title: "Школы и детские сады", note: "Всё для семьи рядом с домом", icon: Building2 },
      { value: "parks", title: "Парки и набережные", note: "Больше зелени и мест для прогулок", icon: Sparkles },
      { value: "center", title: "Близость к центру", note: "Экономия времени в дороге", icon: MapPin },
      { value: "quiet", title: "Тишина и приватность", note: "Спокойный район без суеты", icon: ShieldCheck },
      { value: "future", title: "Перспективный район", note: "Потенциал роста стоимости", icon: Landmark },
    ],
  },
];

const labels = Object.fromEntries(
  steps.flatMap((step) => step.options.map((option) => [option.value, option.title])),
);

const getSegmentKey = (answers: QuizAnswers) =>
  [answers.purpose, answers.rooms.sort().join("+"), answers.moveIn, answers.payment, answers.budget, answers.location.sort().join("+")]
    .map((value) => value || "any")
    .join("__");

const DeveloperQuiz = () => {
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(initialAnswers);
  const [completed, setCompleted] = useState(false);
  const step = steps[stepIndex];
  const progress = completed ? 100 : ((stepIndex + 1) / steps.length) * 100;
  const currentValue = answers[step.key];
  const canContinue = Array.isArray(currentValue) ? currentValue.length > 0 : Boolean(currentValue);

  const segmentKey = useMemo(() => getSegmentKey({ ...answers, rooms: [...answers.rooms], location: [...answers.location] }), [answers]);

  useEffect(() => {
    if (!completed) return;
    const result = { answers, segmentKey, completedAt: new Date().toISOString() };
    window.localStorage.setItem("directkit-developer-quiz", JSON.stringify(result));
    window.dispatchEvent(new CustomEvent("developer-quiz-completed", { detail: result }));
  }, [answers, completed, segmentKey]);

  const selectOption = (value: string) => {
    if (step.multi) {
      const selected = currentValue as string[];
      const limitReached = step.key === "location" && selected.length >= 3;
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : limitReached
          ? selected
          : [...selected, value];
      setAnswers((previous) => ({ ...previous, [step.key]: next }));
      return;
    }

    setAnswers((previous) => ({ ...previous, [step.key]: value }));
    window.setTimeout(() => {
      if (stepIndex < steps.length - 1) setStepIndex((index) => index + 1);
    }, 180);
  };

  const continueQuiz = () => {
    if (!canContinue) return;
    if (stepIndex === steps.length - 1) {
      setCompleted(true);
      return;
    }
    setStepIndex((index) => index + 1);
  };

  const restart = () => {
    setAnswers(initialAnswers);
    setStepIndex(0);
    setCompleted(false);
    setStarted(true);
  };

  if (!started) {
    return (
      <main className="dq-shell dq-intro">
        <div className="dq-intro-frame">
          <div className="dq-intro-photo" aria-hidden="true" />
          <header className="dq-brand">
            <span className="dq-brand-mark"><Building2 size={20} /></span>
            <span>КВАРТИРА<span>ПРО</span><small>выбирайте осознанно</small></span>
          </header>
          <section className="dq-hero">
            <div className="dq-kicker"><Sparkles size={15} /> Квиз · 6 вопросов · 2 минуты</div>
            <h1>Квартира, которая<br /><em>отвечает вашим планам</em></h1>
            <p>Расскажите, как вы хотите жить. Мы соберём персональную подборку по бюджету, району и способу покупки.</p>
            <div className="dq-benefits">
              <div><span><Building2 size={20} /></span><strong>Подходящие<br />планировки</strong></div>
              <div><span><MapPin size={20} /></span><strong>Комфортные<br />районы</strong></div>
              <div><span><WalletCards size={20} /></span><strong>Выгодный<br />способ покупки</strong></div>
            </div>
            <button className="dq-primary" onClick={() => setStarted(true)}>
              Начать подбор <ArrowRight size={20} />
            </button>
            <div className="dq-intro-meta">
              <span><ShieldCheck size={16} /> Бесплатно и ни к чему не обязывает</span>
            </div>
          </section>
          <aside className="dq-trust-card">
            <span className="dq-trust-icon"><ShieldCheck size={25} /></span>
            <span><strong>Конфиденциально</strong><small>Ответы останутся в вашем профиле</small></span>
          </aside>
          <div className="dq-intro-stats">
            <div><strong>6</strong><span>точных<br />вопросов</span></div>
            <div><strong>2</strong><span>минуты<br />на подбор</span></div>
            <div><strong>1</strong><span>персональная<br />рекомендация</span></div>
          </div>
        </div>
        <footer className="dq-footer">Демонстрационный проект · данные не отправляются застройщику</footer>
      </main>
    );
  }

  if (completed) {
    return (
      <main className="dq-shell dq-result">
        <header className="dq-brand">
          <span className="dq-brand-mark"><Building2 size={20} /></span>
          <span>КВАРТИРА<span>ПРО</span></span>
        </header>
        <section className="dq-result-card">
          <div className="dq-success-mark"><Check size={34} strokeWidth={2.2} /></div>
          <div className="dq-kicker">Профиль покупателя сформирован</div>
          <h1>Мы поняли, что вам подойдёт</h1>
          <p className="dq-result-copy">На следующем этапе здесь появится персональная посадочная страница с подходящими проектами, условиями покупки и релевантными предложениями.</p>
          <div className="dq-summary">
            <div><span>Планировка</span><strong>{answers.rooms.map((value) => labels[value]).join(", ")}</strong></div>
            <div><span>Способ покупки</span><strong>{labels[answers.payment]}</strong></div>
            <div><span>Бюджет</span><strong>{labels[answers.budget]}</strong></div>
            <div><span>Приоритеты</span><strong>{answers.location.map((value) => labels[value]).join(", ")}</strong></div>
          </div>
          <div className="dq-segment">
            <span>Ключ сегмента для ретаргетинга</span>
            <code>{segmentKey}</code>
          </div>
          <button className="dq-secondary" onClick={restart}><ArrowLeft size={18} /> Пройти заново</button>
        </section>
      </main>
    );
  }

  return (
    <main className="dq-shell dq-quiz">
      <header className="dq-topbar">
        <div className="dq-brand">
          <span className="dq-brand-mark"><Building2 size={20} /></span>
          <span>КВАРТИРА<span>ПРО</span></span>
        </div>
        <span className="dq-step-count">{String(stepIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</span>
      </header>
      <div className="dq-progress" aria-label={`Шаг ${stepIndex + 1} из ${steps.length}`}><span style={{ width: `${progress}%` }} /></div>

      <section className="dq-question" key={step.key}>
        <div className="dq-question-copy">
          <span className="dq-eyebrow">{step.eyebrow}</span>
          <h1>{step.title}</h1>
          <p>{step.description}</p>
          {step.key === "location" && <small>Выбрано: {(currentValue as string[]).length} из 3</small>}
        </div>
        <div className={`dq-options ${step.options.length > 4 ? "dq-options-compact" : ""}`}>
          {step.options.map((option, index) => {
            const Icon = option.icon;
            const selected = Array.isArray(currentValue) ? currentValue.includes(option.value) : currentValue === option.value;
            return (
              <button
                className={`dq-option ${selected ? "is-selected" : ""}`}
                key={option.value}
                onClick={() => selectOption(option.value)}
                style={{ animationDelay: `${index * 45}ms` }}
                aria-pressed={selected}
              >
                <span className="dq-option-icon"><Icon size={21} /></span>
                <span className="dq-option-text"><strong>{option.title}</strong><small>{option.note}</small></span>
                <span className="dq-option-check">{selected ? <Check size={16} /> : <ChevronRight size={18} />}</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="dq-controls">
        <button className="dq-back" onClick={() => stepIndex > 0 ? setStepIndex((index) => index - 1) : setStarted(false)}>
          <ArrowLeft size={18} /> Назад
        </button>
        {(step.multi || stepIndex === steps.length - 1) && (
          <button className="dq-primary" onClick={continueQuiz} disabled={!canContinue}>
            {stepIndex === steps.length - 1 ? "Получить результат" : "Продолжить"} <ArrowRight size={19} />
          </button>
        )}
      </footer>
    </main>
  );
};

export default DeveloperQuiz;
