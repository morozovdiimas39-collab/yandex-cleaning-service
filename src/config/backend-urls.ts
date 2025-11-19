// Ручное переопределение URL для функций, размещённых в Yandex Cloud
// Эти URL не меняются автоматически при билде

const CUSTOM_FUNCTION_URLS = {
  'rsya-scheduler': 'https://functions.yandexcloud.net/d4et4pke4rosupb0kahm',
  'wordstat-parser': 'https://functions.yandexcloud.net/d4eplgobfovf52ln9bsv',
};

// Импортируем автогенерируемый файл
import func2url from '../../backend/func2url.json';

// Мержим: кастомные URL имеют приоритет
export const BACKEND_URLS = {
  ...func2url,
  ...CUSTOM_FUNCTION_URLS
};

export default BACKEND_URLS;