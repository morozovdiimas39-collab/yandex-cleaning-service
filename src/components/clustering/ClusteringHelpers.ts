interface Phrase {
  phrase: string;
  count: number;
}

interface Cluster {
  name: string;
  intent: string;
  color: string;
  icon: string;
  phrases: Phrase[];
}

export const mockClusters: Cluster[] = [
  {
    name: 'Вторичный рынок',
    intent: 'commercial',
    color: 'blue',
    icon: 'Home',
    phrases: [
      { phrase: 'купить квартиру вторичку', count: 12000 },
      { phrase: 'купить квартиру вторичный рынок', count: 3800 },
      { phrase: 'купить квартиру от собственника', count: 11000 },
      { phrase: 'купить квартиру без посредников', count: 14000 }
    ]
  },
  {
    name: 'Новостройки от застройщика',
    intent: 'commercial',
    color: 'emerald',
    icon: 'Building2',
    phrases: [
      { phrase: 'купить квартиру от застройщика', count: 8500 },
      { phrase: 'купить квартиру новостройка', count: 15000 },
      { phrase: 'купить квартиру у застройщика', count: 11000 },
      { phrase: 'купить квартиру на первичном рынке', count: 6800 }
    ]
  },
  {
    name: 'Агрегаторы и площадки',
    intent: 'navigational',
    color: 'purple',
    icon: 'Globe',
    phrases: [
      { phrase: 'купить квартиру авито', count: 19000 },
      { phrase: 'купить квартиру циан', count: 16500 },
      { phrase: 'купить квартиру домклик', count: 8200 }
    ]
  }
];

export const mockMinusWords: Phrase[] = [
  { phrase: 'бесплатно', count: 0 },
  { phrase: 'даром', count: 0 },
  { phrase: 'игра', count: 0 },
  { phrase: 'в игре', count: 0 },
  { phrase: 'скачать', count: 0 },
  { phrase: 'торрент', count: 0 },
  { phrase: 'порно', count: 0 },
  { phrase: 'xxx', count: 0 },
  { phrase: 'вакансия', count: 0 },
  { phrase: 'работа', count: 0 }
];

export function generateClustersFromKeywords(keywords: string[], intents: string[]): Cluster[] {
  if (keywords.length === 0) return mockClusters;
  
  const clusters: Cluster[] = [];
  const clusterColors = ['blue', 'emerald', 'purple', 'orange'];
  const clusterIcons = ['Home', 'Building2', 'Globe', 'ShoppingCart'];
  
  const groupedKeywords = new Map<string, string[]>();
  
  keywords.forEach(kw => {
    const words = kw.toLowerCase().split(' ');
    const mainWord = words[words.length - 1] || words[0];
    
    if (!groupedKeywords.has(mainWord)) {
      groupedKeywords.set(mainWord, []);
    }
    groupedKeywords.get(mainWord)!.push(kw);
  });
  
  let colorIdx = 0;
  groupedKeywords.forEach((phrases, mainWord) => {
    if (phrases.length > 0) {
      clusters.push({
        name: `Сегмент: ${mainWord}`,
        intent: intents[0] || 'commercial',
        color: clusterColors[colorIdx % clusterColors.length],
        icon: clusterIcons[colorIdx % clusterIcons.length],
        phrases: phrases.map(p => ({
          phrase: p,
          count: Math.floor(Math.random() * 15000) + 1000
        }))
      });
      colorIdx++;
    }
  });
  
  return clusters.length > 0 ? clusters : mockClusters;
}

export function generateMinusWords(keywords: string[]): Phrase[] {
  const commonMinusWords = ['бесплатно', 'даром', 'скачать', 'торрент', 'игра', 'вакансия', 'работа'];
  const keywordWords = keywords.flatMap(kw => kw.toLowerCase().split(' '));
  
  const excludeWords = new Set(['купить', 'заказать', 'цена', 'москва', 'спб']);
  const minusWords = keywordWords.filter(w => 
    w.length > 3 && 
    !excludeWords.has(w) &&
    Math.random() > 0.7
  );
  
  const allMinusWords = [...new Set([...commonMinusWords, ...minusWords])].slice(0, 15);
  return allMinusWords.map(phrase => ({ phrase, count: 0 }));
}

export const PROCESSING_STAGES = [
  { label: 'Анализ ключевых фраз...', duration: 1500 },
  { label: 'Определение интентов...', duration: 2000 },
  { label: 'Группировка в сегменты...', duration: 2500 },
  { label: 'Выделение минус-слов...', duration: 1500 },
  { label: 'Финализация результатов...', duration: 1000 }
];