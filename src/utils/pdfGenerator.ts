import jsPDF from 'jspdf';

interface Slide {
  title: string;
  subtitle?: string;
  content: string[];
  stats?: { label: string; value: string; color: string }[];
  bgGradient?: string;
}

export const generateWordstatPDF = () => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const width = 297;
  const height = 210;

  const slides: Slide[] = [
    {
      title: 'Парсер Wordstat',
      subtitle: 'Автоматический сбор семантики из Яндекс Вордстат',
      content: [
        '10 000+ запросов за 30 минут',
        'Без капчи и ограничений',
        'Выгрузка в Excel за 1 клик',
        'Фильтры по региону и частотности'
      ],
      bgGradient: 'emerald'
    },
    {
      title: 'Проблема ручного сбора',
      content: [
        '❌ 1-2 недели на сбор 5000 запросов',
        '❌ Капча каждые 50 запросов',
        '❌ Ошибки при копировании данных',
        '❌ Невозможно собрать больше 1000 запросов',
        '❌ Нужно вручную форматировать в Excel'
      ]
    },
    {
      title: 'Решение: Парсер Wordstat',
      content: [
        '✅ 10 000 запросов за 30 минут',
        '✅ Никаких капч — парсинг через API',
        '✅ 100% точность данных',
        '✅ До 50 000 запросов за раз',
        '✅ Автоматический экспорт в Excel'
      ],
      stats: [
        { label: 'Экономия времени', value: '95%', color: '#10b981' },
        { label: 'Больше запросов', value: '10x', color: '#14b8a6' },
        { label: 'Ошибок', value: '0', color: '#22c55e' }
      ]
    },
    {
      title: 'Как это работает',
      content: [
        '1️⃣ Добавьте базовые ключевые слова',
        '   Введите запросы для парсинга',
        '',
        '2️⃣ Настройте параметры',
        '   Регион, минимальная частотность, глубина',
        '',
        '3️⃣ Скачайте Excel',
        '   Готовый файл с частотностью и метриками'
      ]
    },
    {
      title: 'Ключевые возможности',
      content: [
        '🚀 Максимальная скорость',
        '   10 000 запросов за 30 минут',
        '',
        '📍 Парсинг по регионам',
        '   Любой город России с локальной частотностью',
        '',
        '🔍 Умные фильтры',
        '   Минус-слова, фильтрация по частоте',
        '',
        '📊 Готовый экспорт',
        '   Excel и CSV с метриками'
      ]
    },
    {
      title: 'Преимущества',
      content: [
        '✓ Самый быстрый парсер на рынке',
        '✓ Без блокировок — официальный API Яндекса',
        '✓ Точные актуальные данные из Вордстата',
        '✓ Удобный экспорт для кластеризации',
        '✓ Все регионы России',
        '✓ Глубокий парсинг до 50 000 запросов',
        '✓ Поддержка 24/7'
      ]
    },
    {
      title: 'Результаты клиентов',
      stats: [
        { label: 'Экономия времени', value: '95%', color: '#10b981' },
        { label: 'Больше запросов', value: '10x', color: '#14b8a6' },
        { label: 'Ошибок при сборе', value: '0', color: '#22c55e' },
        { label: 'Время работы', value: '30 мин', color: '#10b981' }
      ],
      content: [
        '«10 000 запросов собрали за 30 минут вместо недели»',
        '— Александр К., PPC-специалист',
        '',
        '«Капчи больше нет, данные точные, всё в Excel»',
        '— Мария С., владелица бизнеса'
      ]
    },
    {
      title: 'Начните прямо сейчас',
      subtitle: '1000 запросов бесплатно',
      content: [
        '✓ Регистрация за 30 секунд',
        '✓ Не требуется кредитная карта',
        '✓ Полный функционал сразу',
        '✓ Первая выгрузка через 10 минут',
        '',
        '💰 Платные тарифы от 990₽/мес',
        '   До 50 000 запросов в месяц',
        '',
        '🌐 directkit.ru/wordstat-parser'
      ],
      bgGradient: 'emerald'
    }
  ];

  slides.forEach((slide, index) => {
    if (index > 0) doc.addPage();

    // Background gradient
    if (slide.bgGradient === 'emerald') {
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, width, height, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(250, 250, 250);
      doc.rect(0, 0, width, height, 'F');
      doc.setTextColor(15, 23, 42);
    }

    // Title
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text(slide.title, width / 2, 40, { align: 'center' });

    // Subtitle
    if (slide.subtitle) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'normal');
      const subtitleColor = slide.bgGradient === 'emerald' ? [255, 255, 255, 0.9] : [100, 116, 139];
      doc.setTextColor(subtitleColor[0], subtitleColor[1], subtitleColor[2]);
      doc.text(slide.subtitle, width / 2, 55, { align: 'center' });
    }

    // Content
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    if (slide.bgGradient === 'emerald') {
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(51, 65, 85);
    }

    let yPos = slide.subtitle ? 75 : 65;
    slide.content.forEach((line) => {
      doc.text(line, 30, yPos);
      yPos += 10;
    });

    // Stats
    if (slide.stats) {
      const statsStartX = 50;
      const statsY = 130;
      const statWidth = 50;

      slide.stats.forEach((stat, i) => {
        const x = statsStartX + i * (statWidth + 20);
        
        // Stat box
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, statsY, statWidth, 35, 3, 3, 'F');

        // Value
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(stat.color);
        doc.text(stat.value, x + statWidth / 2, statsY + 18, { align: 'center' });

        // Label
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const labelLines = doc.splitTextToSize(stat.label, statWidth - 4);
        doc.text(labelLines, x + statWidth / 2, statsY + 28, { align: 'center' });
      });
    }

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (slide.bgGradient === 'emerald') {
      doc.setTextColor(255, 255, 255, 0.7);
    } else {
      doc.setTextColor(148, 163, 184);
    }
    doc.text('DirectKit — Автоматизация Яндекс.Директ', width / 2, height - 15, { align: 'center' });
    doc.text(`${index + 1} / ${slides.length}`, width - 20, height - 15, { align: 'right' });
  });

  doc.save('DirectKit-Парсер-Wordstat.pdf');
};

export const generateRSYAPDF = () => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const width = 297;
  const height = 210;

  const slides: Slide[] = [
    {
      title: 'Автоматическая Чистка РСЯ',
      subtitle: 'Блокировка мусорных площадок 24/7',
      content: [
        'Мониторинг 3 раза в день',
        'Анализ 15+ метрик',
        'Автоматическая блокировка',
        'Снижение CPA на 30-50%'
      ],
      bgGradient: 'emerald'
    },
    {
      title: 'Проблема РСЯ',
      subtitle: '40-60% бюджета — мусор',
      content: [
        '❌ 40-60% бюджета на мусорные площадки',
        '❌ 2-3 часа в неделю на ручной анализ',
        '❌ Боты и фрод съедают бюджет 24/7',
        '❌ Высокий CPA и низкая конверсия',
        '❌ ROI около нуля или отрицательный'
      ]
    },
    {
      title: 'Решение: Автоматическая чистка',
      content: [
        '✅ Трафик только с качественных площадок',
        '✅ Мониторинг 3 раза в день автоматически',
        '✅ Блокировка мусора в течение 8 часов',
        '✅ CPA снижается на 30-50%',
        '✅ ROI становится положительным'
      ],
      stats: [
        { label: 'Снижение CPA', value: '-40%', color: '#10b981' },
        { label: 'Мониторинг', value: '3x/день', color: '#14b8a6' },
        { label: 'Метрик анализа', value: '15+', color: '#22c55e' }
      ]
    },
    {
      title: 'Как это работает',
      content: [
        '1️⃣ Мониторинг 3 раза в день',
        '   Каждые 8 часов: конверсии, клики, отказы, CPA, CPC, CTR',
        '',
        '2️⃣ Выявление мусора',
        '   Нет конверсий + 100₽, высокие отказы >70%, паттерны фрода',
        '',
        '3️⃣ Автоматическая блокировка',
        '   Добавление в Excluded Sites через API Яндекса'
      ]
    },
    {
      title: 'Анализируемые метрики',
      content: [
        '💰 Финансовые метрики',
        '   CPA, CPC, расход без конверсий, CPM',
        '',
        '🖱️ Поведенческие метрики',
        '   Bounce Rate, время на сайте, глубина, CTR',
        '',
        '📈 Конверсионные метрики',
        '   Количество конверсий, CR, ROI, ROAS',
        '',
        '⚙️ Настраиваемые правила',
        '   Создавайте свои условия блокировки'
      ]
    },
    {
      title: 'Умная ротация',
      subtitle: 'Лимит 1000 площадок в Яндексе',
      content: [
        'Яндекс.Директ разрешает блокировать максимум',
        '1000 площадок на кампанию',
        '',
        '✓ Система автоматически ротирует:',
        '  • Разблокирует наименее вредные (min расход)',
        '  • Добавляет новые самые дорогие мусорные',
        '',
        '→ Всегда заблокированы самые опасные площадки',
        '→ Максимальная экономия бюджета'
      ]
    },
    {
      title: 'Реальные результаты',
      stats: [
        { label: 'Экономия бюджета', value: '40%', color: '#10b981' },
        { label: 'Рост конверсии', value: '2.8x', color: '#14b8a6' },
        { label: 'Блокировок/мес', value: '350+', color: '#22c55e' },
        { label: 'Ручная работа', value: '0 мин', color: '#10b981' }
      ],
      content: [
        '«CPA снизился на 35%, а конверсий в 2 раза больше»',
        '— Александр К., PPC-специалист',
        '',
        '«Экономим клиентам до 30% бюджета на каждом проекте»',
        '— Дмитрий П., Digital-агентство'
      ]
    },
    {
      title: 'Начните экономить сегодня',
      subtitle: 'Бесплатный тариф: 1 проект, 3 кампании',
      content: [
        '✓ Настройка за 5 минут',
        '✓ Первые результаты через 8 часов',
        '✓ Снижение CPA через неделю',
        '✓ Без привязки карты',
        '',
        '💰 Платные тарифы от 990₽/мес',
        '   Неограниченные проекты и кампании',
        '',
        '🌐 directkit.ru/rsya-cleaning'
      ],
      bgGradient: 'emerald'
    }
  ];

  slides.forEach((slide, index) => {
    if (index > 0) doc.addPage();

    // Background
    if (slide.bgGradient === 'emerald') {
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, width, height, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(250, 250, 250);
      doc.rect(0, 0, width, height, 'F');
      doc.setTextColor(15, 23, 42);
    }

    // Title
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text(slide.title, width / 2, 40, { align: 'center' });

    // Subtitle
    if (slide.subtitle) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'normal');
      const subtitleColor = slide.bgGradient === 'emerald' ? [255, 255, 255, 0.9] : [100, 116, 139];
      doc.setTextColor(subtitleColor[0], subtitleColor[1], subtitleColor[2]);
      doc.text(slide.subtitle, width / 2, 55, { align: 'center' });
    }

    // Content
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    if (slide.bgGradient === 'emerald') {
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(51, 65, 85);
    }

    let yPos = slide.subtitle ? 75 : 65;
    slide.content.forEach((line) => {
      doc.text(line, 30, yPos);
      yPos += 10;
    });

    // Stats
    if (slide.stats) {
      const statsStartX = 50;
      const statsY = 130;
      const statWidth = 50;

      slide.stats.forEach((stat, i) => {
        const x = statsStartX + i * (statWidth + 20);
        
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, statsY, statWidth, 35, 3, 3, 'F');

        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(stat.color);
        doc.text(stat.value, x + statWidth / 2, statsY + 18, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const labelLines = doc.splitTextToSize(stat.label, statWidth - 4);
        doc.text(labelLines, x + statWidth / 2, statsY + 28, { align: 'center' });
      });
    }

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (slide.bgGradient === 'emerald') {
      doc.setTextColor(255, 255, 255, 0.7);
    } else {
      doc.setTextColor(148, 163, 184);
    }
    doc.text('DirectKit — Автоматизация Яндекс.Директ', width / 2, height - 15, { align: 'center' });
    doc.text(`${index + 1} / ${slides.length}`, width - 20, height - 15, { align: 'right' });
  });

  doc.save('DirectKit-Чистка-РСЯ.pdf');
};
