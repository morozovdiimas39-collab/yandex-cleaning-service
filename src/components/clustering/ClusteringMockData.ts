export interface Phrase {
  phrase: string;
  count: number;
}

export interface Cluster {
  name: string;
  intent: string;
  color: string;
  icon: string;
  phrases: Phrase[];
}

export const minusWordsMock: string[] = [
  'бесплатно',
  'даром',
  'своими руками',
  'самому',
  'игра',
  'в игре',
  'скачать',
  'торрент',
  'порно',
  'xxx',
  'вакансия',
  'работа'
];

export const aiClustersMock: Cluster[] = [
  {
    name: 'Вторичный рынок',
    intent: 'commercial',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: 'Home',
    phrases: [
      { phrase: 'купить квартиру вторичку', count: 12000 },
      { phrase: 'купить квартиру вторичный рынок', count: 3800 },
      { phrase: 'купить квартиру вторичное жилье', count: 2900 },
      { phrase: 'купить квартиру от собственника', count: 11000 },
      { phrase: 'купить квартиру без посредников', count: 14000 }
    ]
  },
  {
    name: 'Новостройки от застройщика',
    intent: 'commercial',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'Building2',
    phrases: [
      { phrase: 'купить квартиру от застройщика', count: 8500 },
      { phrase: 'купить квартиру новостройка', count: 15000 },
      { phrase: 'купить квартиру в новостройке москва', count: 6200 },
      { phrase: 'купить квартиру у застройщика', count: 11000 },
      { phrase: 'купить квартиру на первичном рынке', count: 6800 },
      { phrase: 'купить квартиру первичка', count: 4200 },
      { phrase: 'купить квартиру пик', count: 8900 },
      { phrase: 'купить квартиру самолет', count: 7200 },
      { phrase: 'купить квартиру лср', count: 5600 },
      { phrase: 'купить квартиру эталон', count: 4500 }
    ]
  },
  {
    name: 'Агрегаторы и площадки',
    intent: 'informational',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: 'Globe',
    phrases: [
      { phrase: 'купить квартиру авито', count: 19000 },
      { phrase: 'купить квартиру циан', count: 16500 },
      { phrase: 'купить квартиру домклик', count: 8200 }
    ]
  },
  {
    name: 'География: Москва',
    intent: 'commercial',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: 'MapPin',
    phrases: [
      { phrase: 'купить квартиру в москве', count: 45000 },
      { phrase: 'купить квартиру недорого москва', count: 7200 },
      { phrase: 'купить квартиру центр москвы', count: 9800 },
      { phrase: 'купить квартиру в центре', count: 14000 },
      { phrase: 'купить квартиру юао', count: 4200 },
      { phrase: 'купить квартиру сао', count: 3800 },
      { phrase: 'купить квартиру свао', count: 4100 }
    ]
  },
  {
    name: 'География: Подмосковье',
    intent: 'commercial',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: 'Map',
    phrases: [
      { phrase: 'купить квартиру в подмосковье', count: 8900 },
      { phrase: 'купить квартиру московская область', count: 5600 }
    ]
  },
  {
    name: 'Планировка: 1-комнатные',
    intent: 'commercial',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'Square',
    phrases: [
      { phrase: 'купить однокомнатную квартиру', count: 32000 },
      { phrase: 'купить квартиру 1 комнатную', count: 25000 },
      { phrase: 'купить студию', count: 12000 },
      { phrase: 'купить квартиру студию', count: 9500 }
    ]
  },
  {
    name: 'Планировка: 2-комнатные',
    intent: 'commercial',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'LayoutGrid',
    phrases: [
      { phrase: 'купить двухкомнатную квартиру', count: 28000 },
      { phrase: 'купить квартиру 2 комнатную', count: 21000 }
    ]
  },
  {
    name: 'Планировка: 3-комнатные',
    intent: 'commercial',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'Grid3x3',
    phrases: [
      { phrase: 'купить трехкомнатную квартиру', count: 15000 }
    ]
  },
  {
    name: 'Финансирование: Ипотека',
    intent: 'commercial',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: 'CreditCard',
    phrases: [
      { phrase: 'купить квартиру в ипотеку', count: 35000 },
      { phrase: 'купить квартиру ипотека', count: 28000 },
      { phrase: 'купить квартиру материнский капитал', count: 8900 },
      { phrase: 'купить квартиру в кредит', count: 12000 }
    ]
  },
  {
    name: 'Финансы: Цена и бюджет',
    intent: 'commercial',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: 'DollarSign',
    phrases: [
      { phrase: 'купить квартиру недорого', count: 18000 },
      { phrase: 'купить квартиру цена', count: 22000 },
      { phrase: 'купить квартиру стоимость', count: 9800 }
    ]
  },
  {
    name: 'Расположение: Метро',
    intent: 'commercial',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'Train',
    phrases: [
      { phrase: 'купить квартиру рядом с метро', count: 8500 },
      { phrase: 'купить квартиру у метро', count: 6200 }
    ]
  },
  {
    name: 'Состояние: Ремонт',
    intent: 'commercial',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: 'Wrench',
    phrases: [
      { phrase: 'купить квартиру с ремонтом', count: 16000 },
      { phrase: 'купить квартиру без ремонта', count: 7800 },
      { phrase: 'купить квартиру под ремонт', count: 5200 },
      { phrase: 'купить квартиру с мебелью', count: 6500 }
    ]
  },
  {
    name: 'Срочность покупки',
    intent: 'commercial',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: 'Zap',
    phrases: [
      { phrase: 'купить квартиру срочно', count: 9200 },
      { phrase: 'купить квартиру срочная продажа', count: 4800 }
    ]
  },
  {
    name: 'Нерелевантные запросы',
    intent: 'informational',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: 'XCircle',
    phrases: [
      { phrase: 'купить квартиру бесплатно', count: 1200 },
      { phrase: 'купить квартиру даром', count: 800 },
      { phrase: 'купить квартиру своими руками', count: 2100 },
      { phrase: 'как купить квартиру самому', count: 3500 },
      { phrase: 'купить квартиру игра', count: 5600 },
      { phrase: 'купить квартиру в игре', count: 4200 },
      { phrase: 'скачать купить квартиру', count: 900 },
      { phrase: 'купить квартиру торрент', count: 450 },
      { phrase: 'купить квартиру порно', count: 320 },
      { phrase: 'купить квартиру xxx', count: 180 },
      { phrase: 'вакансия купить квартиру', count: 1100 },
      { phrase: 'работа купить квартиру', count: 890 }
    ]
  },
  {
    name: 'Общие запросы',
    intent: 'informational',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: 'Search',
    phrases: [
      { phrase: 'купить квартиру', count: 125000 }
    ]
  }
];
