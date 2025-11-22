// Ручное переопределение URL для функций, размещённых в Yandex Cloud
// Эти URL не меняются автоматически при билде

const CUSTOM_FUNCTION_URLS = {
  // Оставляем пустым - все URL берутся из func2url.json
};

// Импортируем автогенерируемый файл
import func2url from '../../backend/func2url.json';

// Мержим: кастомные URL имеют приоритет
export const BACKEND_URLS = {
  ...func2url,
  ...CUSTOM_FUNCTION_URLS
};

export default BACKEND_URLS;