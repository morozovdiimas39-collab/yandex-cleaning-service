// Ручное переопределение URL для функций, размещённых в Yandex Cloud
// Эти URL не меняются автоматически при билде

const CUSTOM_FUNCTION_URLS = {
  'rsya-scheduler': 'https://functions.yandexcloud.net/d4et4pke4rosupb0kahm',
  'wordstat-parser': 'https://functions.yandexcloud.net/d4eplgobfovf52ln9bsv',
  // Временно используем poehali.dev для subscription, пока не задеплоишь в Yandex Cloud
  'subscription': 'https://functions.poehali.dev/72f69b8a-01bc-488f-a554-2105dafc6f9c',
};

// Импортируем автогенерируемый файл
import func2url from '../../backend/func2url.json';

// Мержим: кастомные URL имеют приоритет
export const BACKEND_URLS = {
  ...func2url,
  ...CUSTOM_FUNCTION_URLS
};

export default BACKEND_URLS;