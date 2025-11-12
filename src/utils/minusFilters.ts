import { City, RUSSIAN_CITIES } from '@/data/russian-cities';

/**
 * Получает список городов для минус-слов (все города кроме выбранного региона)
 */
export function getCityMinusWords(selectedCities: City[]): string[] {
  if (selectedCities.length === 0) return [];
  
  // Если выбрана "Вся Россия" - не добавляем минус-города
  if (selectedCities.some(city => city.id === 0)) {
    return [];
  }
  
  const selectedIds = new Set(selectedCities.map(c => c.id));
  const selectedRegions = new Set(selectedCities.map(c => c.region).filter(Boolean));
  
  // Получаем все города, которые НЕ входят в выбранные города и регионы
  const citiesToExclude = RUSSIAN_CITIES
    .filter(city => {
      // Пропускаем "Вся Россия"
      if (city.id === 0) return false;
      
      // Если город выбран - не добавляем его в минус-слова
      if (selectedIds.has(city.id)) return false;
      
      // Если регион города входит в выбранные регионы - не добавляем
      if (city.region && selectedRegions.has(city.region)) return false;
      
      return true;
    })
    .map(city => {
      // Разбиваем название города на отдельные слова
      // "Нижний Новгород" → ["нижний", "новгород"]
      // "Ростов-на-Дону" → ["ростов", "дону"]
      return city.name
        .toLowerCase()
        .replace(/[^\u0400-\u04FF\s]/g, ' ') // Заменяем дефисы и небуквенные символы на пробелы
        .split(/\s+/)
        .filter(word => 
          word.length > 2 && // Минимум 3 буквы
          !['на', 'по', 'над', 'под', 'об', 'из', 'от'].includes(word) // Исключаем предлоги
        );
    })
    .flat();
  
  // Убираем дубликаты
  return Array.from(new Set(citiesToExclude));
}

/**
 * Применяет выбранные фильтры минус-слов и возвращает массив одиночных слов
 */
export function getMinusWordsFromFilters(
  selectedFilters: string[],
  selectedCities: City[]
): string[] {
  const allMinusWords: string[] = [];
  
  // Информационные
  if (selectedFilters.includes('informational')) {
    allMinusWords.push(
      'отзыв', 'обзор', 'рейтинг', 'сравнение', 'как', 'что', 'такое', 
      'выбрать', 'какой', 'лучше', 'топ', 'обсуждение', 'форум', 'мнение'
    );
  }
  
  // Города (динамически из выбранных регионов)
  if (selectedFilters.includes('cities')) {
    const cityWords = getCityMinusWords(selectedCities);
    allMinusWords.push(...cityWords);
  }
  
  // Конкуренты
  if (selectedFilters.includes('competitors')) {
    allMinusWords.push(
      'циан', 'авито', 'домклик', 'яндекс', 'юла', 'сдам', 'сниму'
    );
  }
  
  // DIY
  if (selectedFilters.includes('diy')) {
    allMinusWords.push(
      'своими', 'руками', 'самому', 'сам', 'инструкция', 'чертеж', 
      'схема', 'самостоятельно'
    );
  }
  
  // Вакансии
  if (selectedFilters.includes('jobs')) {
    allMinusWords.push(
      'работа', 'вакансия', 'резюме', 'зарплата', 'требуется', 
      'ищу', 'hh', 'соискатель'
    );
  }
  
  // Обучение
  if (selectedFilters.includes('education')) {
    allMinusWords.push(
      'курсы', 'обучение', 'тренинг', 'семинар', 'вебинар', 
      'учиться', 'школа', 'преподаватель'
    );
  }
  
  // Б/У
  if (selectedFilters.includes('used')) {
    allMinusWords.push(
      'бу', 'б/у', 'рук', 'авито', 'юла', 'дром'
    );
  }
  
  // Бесплатное
  if (selectedFilters.includes('free')) {
    allMinusWords.push(
      'бесплатно', 'даром', 'отдам', 'дар', 'халява'
    );
  }
  
  // Медиа
  if (selectedFilters.includes('media')) {
    allMinusWords.push(
      'фото', 'картинки', 'видео', 'скачать', 'смотреть', 
      'изображение', 'рисунок', 'обои'
    );
  }
  
  // Академические
  if (selectedFilters.includes('academic')) {
    allMinusWords.push(
      'реферат', 'курсовая', 'доклад', 'презентация', 'диплом', 'дипломная'
    );
  }
  
  // Убираем дубликаты и возвращаем уникальные слова
  return Array.from(new Set(allMinusWords));
}
