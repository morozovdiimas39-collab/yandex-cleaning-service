import { BACKEND_URLS } from '@/config/backend-urls';
import { RUSSIAN_CITIES, City } from '@/data/russian-cities';

export type KeywordPlan = {
  translation: IntentTranslation;
  collectionBranches: CollectionBranch[];
  seedQueries: string[];
  masks: string[];
  minusWords: string[];
  clusters: Array<{
    name: string;
    intent: string;
    examples: string[];
  }>;
  questions: string[];
  source: 'openai' | 'local';
};

export type IntentTranslation = {
  businessDescription: string;
  industry: 'real_estate' | 'service';
  businessRole: string;
  customerSearchIntent: string;
  coreProduct: string;
  targetActions: string[];
  mustNotOverfitTo: string[];
};

export type CollectionBranch = {
  name: string;
  priority: 'high' | 'medium' | 'low';
  seedMasks: string[];
};

export type WordstatPhrase = {
  phrase: string;
  count: number;
};

export type WordstatCollection = {
  verifiedPhrases: WordstatPhrase[];
  candidateMasks: string[];
  rejectedMasks: string[];
  followUpMasks: string[];
};

const AI_PLANNER_URL = (BACKEND_URLS as Record<string, string>)['ai-keyword-planner'];
const WORDSTAT_API_URL = BACKEND_URLS['wordstat-parser'];

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function uniq(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

export function findCity(region: string): City | undefined {
  const normalized = region.trim().toLowerCase();
  if (!normalized) return undefined;
  return RUSSIAN_CITIES.find((city) => city.name.toLowerCase() === normalized)
    || RUSSIAN_CITIES.find((city) => city.name.toLowerCase().includes(normalized));
}

function detectIndustry(text: string): 'real_estate' | 'service' {
  const lower = text.toLowerCase();
  if (/(квартир|новостро|застройщик|жк|ипотек|студи|однокомнат|двухкомнат|дом|недвиж)/.test(lower)) {
    return 'real_estate';
  }
  return 'service';
}

function normalizeRealEstateIntent(rawInput: string): IntentTranslation {
  return {
    businessDescription: rawInput,
    industry: 'real_estate',
    businessRole: /(застройщик|новостро|жк)/i.test(rawInput) ? 'developer_or_new_building_seller' : 'seller_or_agency',
    customerSearchIntent: 'купить квартиру',
    coreProduct: 'квартира',
    targetActions: ['купить', 'подобрать', 'узнать цену', 'оформить ипотеку'],
    mustNotOverfitTo: ['продажа'],
  };
}

export function buildLocalPlan(theme: string, services: string, region: string, exclusions: string): KeywordPlan {
  const baseTheme = theme.trim() || 'услуга';
  const serviceList = uniq(services.split(/\n|,/));
  const geo = region.trim();
  const industry = detectIndustry(`${baseTheme} ${services}`);

  if (industry === 'real_estate') {
    const translation = normalizeRealEstateIntent(baseTheme);
    const branchOverrides = serviceList.length > 0 ? serviceList : [];
    const collectionBranches: CollectionBranch[] = [
      {
        name: 'Покупка квартиры',
        priority: 'high',
        seedMasks: ['купить квартиру', 'квартира купить', 'квартиры купить', 'квартира цена', 'стоимость квартиры'],
      },
      {
        name: 'Новостройки',
        priority: 'high',
        seedMasks: ['новостройки', 'квартиры в новостройках', 'купить квартиру в новостройке', 'квартира от застройщика'],
      },
      {
        name: 'От застройщика',
        priority: 'high',
        seedMasks: ['квартиры от застройщика', 'застройщик квартиры', 'купить квартиру от застройщика'],
      },
      {
        name: 'Комнатность',
        priority: 'medium',
        seedMasks: ['квартира студия', 'однокомнатная квартира', 'двухкомнатная квартира', 'трехкомнатная квартира'],
      },
      {
        name: 'Ипотека и цена',
        priority: 'medium',
        seedMasks: ['квартира в ипотеку', 'купить квартиру в ипотеку', 'квартира без первоначального взноса', 'квартира стоимость'],
      },
      {
        name: 'ЖК и районы',
        priority: 'medium',
        seedMasks: ['жк', 'жилой комплекс', 'квартира район', 'квартира с отделкой'],
      },
    ];

    if (branchOverrides.length > 0) {
      collectionBranches.unshift({
        name: 'Уточнения пользователя',
        priority: 'high',
        seedMasks: branchOverrides,
      });
    }

    const branchMasks = collectionBranches.flatMap((branch) => branch.seedMasks);
    const seedQueries = uniq(branchMasks.flatMap((item) => [item, geo ? `${item} ${geo}` : '']));
    const masks = uniq(branchMasks.flatMap((item) => [
      item,
      geo ? `${item} ${geo}` : '',
      item.includes('купить') ? item : `купить ${item}`,
      geo && !item.includes('купить') ? `купить ${item} ${geo}` : '',
    ]));

    return {
      translation,
      collectionBranches,
      seedQueries: seedQueries.slice(0, 40),
      masks: masks.slice(0, 50),
      minusWords: uniq([...exclusions.split(/\n|,/), 'снять', 'аренда', 'посуточно', 'вакансии', 'работа', 'реферат']).slice(0, 40),
      clusters: [
        { name: 'Новостройки', intent: 'commercial', examples: uniq(['новостройки', geo ? `новостройки ${geo}` : '', 'квартиры в новостройках']) },
        { name: 'От застройщика', intent: 'commercial', examples: uniq(['квартиры от застройщика', geo ? `застройщик ${geo}` : '']) },
        { name: 'Комнатность', intent: 'commercial', examples: uniq(['студия', 'однокомнатная квартира', 'двухкомнатная квартира']) },
        { name: 'Ипотека и цена', intent: 'commercial', examples: uniq(['квартира в ипотеку', 'квартира цена', 'квартира стоимость']) },
      ],
      questions: ['Нужны ли вторичка и аренда?', 'Какие районы важны?', 'Нужно ли отделять ЖК и застройщиков?'],
      source: 'local',
    };
  }

  const servicesToUse = serviceList.length > 0 ? serviceList : [baseTheme];
  const translation: IntentTranslation = {
    businessDescription: baseTheme,
    industry: 'service',
    businessRole: 'service_provider',
    customerSearchIntent: servicesToUse[0],
    coreProduct: servicesToUse[0],
    targetActions: ['заказать', 'купить', 'узнать цену'],
    mustNotOverfitTo: [],
  };
  const collectionBranches: CollectionBranch[] = servicesToUse.map((service, index) => ({
    name: service,
    priority: index === 0 ? 'high' : 'medium',
    seedMasks: [service, `заказать ${service}`, `${service} цена`, `${service} стоимость`],
  }));
  const commercialModifiers = ['цена', 'стоимость', 'заказать', 'купить', 'под ключ', 'рядом'];

  return {
    translation,
    collectionBranches,
    seedQueries: uniq([
      baseTheme,
      geo ? `${baseTheme} ${geo}` : '',
      ...servicesToUse,
      ...servicesToUse.flatMap((service) => commercialModifiers.map((modifier) => `${service} ${modifier}${geo ? ` ${geo}` : ''}`)),
    ]).slice(0, 40),
    masks: uniq(servicesToUse.flatMap((service) => [
      `${service} цена`,
      `${service} стоимость`,
      `заказать ${service}`,
      `${service} под ключ`,
      `${service} ${geo}`.trim(),
    ])).slice(0, 50),
    minusWords: uniq([...exclusions.split(/\n|,/), 'бесплатно', 'своими руками', 'вакансии', 'работа', 'скачать', 'форум']).slice(0, 40),
    clusters: servicesToUse.slice(0, 8).map((service) => ({
      name: service[0]?.toUpperCase() + service.slice(1),
      intent: 'commercial',
      examples: uniq([service, geo ? `${service} ${geo}` : '', `заказать ${service}`]).slice(0, 4),
    })),
    questions: ['Какие услуги самые маржинальные?', 'Какие районы или города нужно исключить?', 'Есть ли конкуренты или агрегаторы?'],
    source: 'local',
  };
}

export function fallbackWordstatPhrases(plan: KeywordPlan, region: string): WordstatPhrase[] {
  const geo = region.trim();
  const bases = uniq([...plan.seedQueries, ...plan.masks]).slice(0, 60);
  return bases.flatMap((phrase, index) => [
    { phrase, count: Math.max(10, 900 - index * 13) },
    geo && !phrase.toLowerCase().includes(geo.toLowerCase())
      ? { phrase: `${phrase} ${geo}`, count: Math.max(10, 700 - index * 11) }
      : null,
  ]).filter(Boolean) as WordstatPhrase[];
}

export async function loadKeywordPlan(input: {
  theme: string;
  services: string;
  region: string;
  exclusions: string;
  audience: string;
}): Promise<KeywordPlan> {
  if (AI_PLANNER_URL) {
    const response = await fetchWithTimeout(AI_PLANNER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }, 25000);

    if (response.ok) {
      const data = await response.json();
      const fallback = buildLocalPlan(input.theme, input.services, input.region, input.exclusions);
      return {
        ...fallback,
        ...data,
        translation: data.translation || fallback.translation,
        collectionBranches: data.collectionBranches || fallback.collectionBranches,
        source: 'openai',
      };
    }
  }

  return buildLocalPlan(input.theme, input.services, input.region, input.exclusions);
}

function makeFollowUpMasks(plan: KeywordPlan, phrases: WordstatPhrase[], region: string): string[] {
  const geo = region.trim();
  const phraseText = phrases.map((item) => item.phrase.toLowerCase()).join(' ');
  const followUps: string[] = [];

  plan.clusters.forEach((cluster) => {
    cluster.examples.forEach((example) => {
      if (example && phraseText.includes(example.toLowerCase().split(' ')[0])) {
        followUps.push(geo ? `${example} ${geo}` : example);
      }
    });
  });

  if (/(квартир|новостро|застройщик|жк|ипотек|студи)/.test(phraseText)) {
    followUps.push(
      geo ? `жк ${geo}` : 'жк',
      geo ? `застройщики ${geo}` : 'застройщики',
      geo ? `квартира с отделкой ${geo}` : 'квартира с отделкой',
      geo ? `квартира в ипотеку ${geo}` : 'квартира в ипотеку',
    );
  }

  return uniq(followUps).slice(0, 8);
}

async function requestWordstat(keywords: string[], region: string): Promise<WordstatPhrase[]> {
  const city = findCity(region);

  if (!WORDSTAT_API_URL || keywords.length === 0) {
    return [];
  }

  const response = await fetchWithTimeout(WORDSTAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': 'ai-planner',
    },
    body: JSON.stringify({
      keywords,
      regions: [city?.id ?? 225],
      mode: 'context',
      numPhrases: 120,
      devices: ['all'],
    }),
  }, 90000);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const phrases: WordstatPhrase[] = [];
  data.results?.forEach((result: any) => {
    const topRequests = result.data?.results
      || result.data?.topRequests
      || result.data?.TopRequests
      || result.data?.items
      || result.data?.Items
      || [];
    if (Array.isArray(topRequests)) {
      topRequests.forEach((item: any) => {
        const phrase = item.phrase || item.query || item.text;
        if (!phrase) return;
        phrases.push({
          phrase,
          count: Number(item.count ?? item.shows ?? item.value ?? 0) || 0,
        });
      });
    }
  });

  return uniq(phrases.map((p) => p.phrase)).slice(0, 250).map((phrase) => {
    const found = phrases.find((item) => item.phrase === phrase);
    return { phrase, count: found?.count ?? 0 };
  });
}

export async function collectWordstatWithAi(plan: KeywordPlan, region: string): Promise<WordstatCollection> {
  const branchMasks = plan.collectionBranches.flatMap((branch) => branch.seedMasks);
  const candidateMasks = uniq([...branchMasks, ...plan.seedQueries, ...plan.masks]).slice(0, 20);

  try {
    const firstPass = await requestWordstat(candidateMasks.slice(0, 12), region);
    const rejectedMasks = candidateMasks.filter((mask) => {
      const firstWord = mask.toLowerCase().split(/\s+/)[0];
      return !firstPass.some((phrase) => phrase.phrase.toLowerCase().includes(firstWord));
    });
    const followUpMasks = makeFollowUpMasks(plan, firstPass, region);
    const secondPass = followUpMasks.length > 0 ? await requestWordstat(followUpMasks, region) : [];

    const verifiedPhrases = uniq([...firstPass, ...secondPass].map((phrase) => phrase.phrase)).map((phrase) => {
      const found = [...firstPass, ...secondPass].find((item) => item.phrase === phrase);
      return { phrase, count: found?.count ?? 0 };
    });

    if (verifiedPhrases.length === 0) {
      const fallback = fallbackWordstatPhrases(plan, region);
      return {
        verifiedPhrases: fallback,
        candidateMasks,
        rejectedMasks: [],
        followUpMasks: makeFollowUpMasks(plan, fallback, region),
      };
    }

    return {
      verifiedPhrases,
      candidateMasks,
      rejectedMasks,
      followUpMasks,
    };
  } catch {
    const fallback = fallbackWordstatPhrases(plan, region);
    return {
      verifiedPhrases: fallback,
      candidateMasks,
      rejectedMasks: [],
      followUpMasks: makeFollowUpMasks(plan, fallback, region),
    };
  }
}
