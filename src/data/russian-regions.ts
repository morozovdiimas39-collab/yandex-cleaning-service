export interface Region {
  id: number;
  name: string;
  type: string;
}

export const RUSSIAN_REGIONS: Region[] = [
  // Россия (корень)
  { id: 225, name: "Россия", type: "country" },
  
  // Федеральные округа
  { id: 3, name: "Центральный федеральный округ", type: "federal_district" },
  { id: 17, name: "Северо-Западный федеральный округ", type: "federal_district" },
  { id: 26, name: "Южный федеральный округ", type: "federal_district" },
  { id: 1106, name: "Северо-Кавказский федеральный округ", type: "federal_district" },
  { id: 11, name: "Приволжский федеральный округ", type: "federal_district" },
  { id: 52, name: "Уральский федеральный округ", type: "federal_district" },
  { id: 59, name: "Сибирский федеральный округ", type: "federal_district" },
  { id: 73, name: "Дальневосточный федеральный округ", type: "federal_district" },
  
  // Московская область и Москва
  { id: 1, name: "Московская область", type: "region" },
  { id: 213, name: "Москва", type: "city" },
  { id: 10716, name: "Балашиха", type: "city" },
  { id: 10717, name: "Бронницы", type: "city" },
  { id: 10721, name: "Волоколамск", type: "city" },
  { id: 10722, name: "Воскресенск", type: "city" },
  { id: 10723, name: "Дмитров", type: "city" },
  { id: 10724, name: "Домодедово", type: "city" },
  { id: 10725, name: "Егорьевск", type: "city" },
  { id: 10726, name: "Жуковский", type: "city" },
  { id: 10727, name: "Зарайск", type: "city" },
  { id: 10728, name: "Истра", type: "city" },
  { id: 10729, name: "Клин", type: "city" },
  { id: 10730, name: "Коломна", type: "city" },
  { id: 10731, name: "Красноармейск", type: "city" },
  { id: 10732, name: "Красногорск", type: "city" },
  { id: 10733, name: "Лобня", type: "city" },
  { id: 10734, name: "Луховицы", type: "city" },
  { id: 10735, name: "Люберцы", type: "city" },
  { id: 10736, name: "Можайск", type: "city" },
  { id: 10737, name: "Мытищи", type: "city" },
  { id: 10738, name: "Наро-Фоминск", type: "city" },
  { id: 10739, name: "Ногинск", type: "city" },
  { id: 10740, name: "Одинцово", type: "city" },
  { id: 10741, name: "Орехово-Зуево", type: "city" },
  { id: 10742, name: "Павловский Посад", type: "city" },
  { id: 10743, name: "Подольск", type: "city" },
  { id: 10744, name: "Протвино", type: "city" },
  { id: 10745, name: "Пушкино", type: "city" },
  { id: 10746, name: "Раменское", type: "city" },
  { id: 10747, name: "Реутов", type: "city" },
  { id: 10748, name: "Серпухов", type: "city" },
  { id: 10749, name: "Солнечногорск", type: "city" },
  { id: 10750, name: "Ступино", type: "city" },
  { id: 10751, name: "Талдом", type: "city" },
  { id: 10752, name: "Химки", type: "city" },
  { id: 10753, name: "Чехов", type: "city" },
  { id: 10754, name: "Шатура", type: "city" },
  { id: 10755, name: "Щёлково", type: "city" },
  { id: 10756, name: "Электросталь", type: "city" },
  { id: 10757, name: "Королёв", type: "city" },
  { id: 10758, name: "Дубна", type: "city" },
  { id: 10759, name: "Пущино", type: "city" },
  { id: 10760, name: "Фрязино", type: "city" },
  { id: 216, name: "Зеленоград", type: "city" },
  { id: 20674, name: "Троицк", type: "city" },
  { id: 21624, name: "Щербинка", type: "city" },
  
  // Санкт-Петербург и Ленинградская область
  { id: 2, name: "Санкт-Петербург", type: "city" },
  { id: 10174, name: "Ленинградская область", type: "region" },
  { id: 10849, name: "Выборг", type: "city" },
  { id: 10850, name: "Гатчина", type: "city" },
  { id: 10851, name: "Кингисепп", type: "city" },
  { id: 10852, name: "Луга", type: "city" },
  { id: 10853, name: "Тихвин", type: "city" },
  
  // Центральный ФО - области
  { id: 4, name: "Белгородская область", type: "region" },
  { id: 10650, name: "Белгород", type: "city" },
  { id: 10651, name: "Старый Оскол", type: "city" },
  
  { id: 5, name: "Брянская область", type: "region" },
  { id: 191, name: "Брянск", type: "city" },
  
  { id: 192, name: "Владимирская область", type: "region" },
  { id: 10675, name: "Владимир", type: "city" },
  { id: 10676, name: "Ковров", type: "city" },
  { id: 10677, name: "Муром", type: "city" },
  
  { id: 193, name: "Воронежская область", type: "region" },
  { id: 10645, name: "Воронеж", type: "city" },
  
  { id: 6, name: "Ивановская область", type: "region" },
  { id: 10693, name: "Иваново", type: "city" },
  
  { id: 7, name: "Калужская область", type: "region" },
  { id: 10716, name: "Калуга", type: "city" },
  { id: 10717, name: "Обнинск", type: "city" },
  
  { id: 8, name: "Костромская область", type: "region" },
  { id: 10779, name: "Кострома", type: "city" },
  
  { id: 9, name: "Курская область", type: "region" },
  { id: 10658, name: "Курск", type: "city" },
  
  { id: 10, name: "Липецкая область", type: "region" },
  { id: 10669, name: "Липецк", type: "city" },
  
  { id: 11, name: "Орловская область", type: "region" },
  { id: 10772, name: "Орёл", type: "city" },
  
  { id: 12, name: "Рязанская область", type: "region" },
  { id: 10776, name: "Рязань", type: "city" },
  
  { id: 13, name: "Смоленская область", type: "region" },
  { id: 10795, name: "Смоленск", type: "city" },
  
  { id: 14, name: "Тамбовская область", type: "region" },
  { id: 10798, name: "Тамбов", type: "city" },
  
  { id: 15, name: "Тверская область", type: "region" },
  { id: 10832, name: "Тверь", type: "city" },
  
  { id: 16, name: "Тульская область", type: "region" },
  { id: 10818, name: "Тула", type: "city" },
  { id: 10819, name: "Новомосковск", type: "city" },
  
  { id: 194, name: "Ярославская область", type: "region" },
  { id: 10705, name: "Ярославль", type: "city" },
  { id: 10706, name: "Рыбинск", type: "city" },
  
  // Северо-Западный ФО
  { id: 18, name: "Республика Карелия", type: "republic" },
  { id: 10933, name: "Петрозаводск", type: "city" },
  
  { id: 19, name: "Республика Коми", type: "republic" },
  { id: 10945, name: "Сыктывкар", type: "city" },
  
  { id: 20, name: "Архангельская область", type: "region" },
  { id: 10842, name: "Архангельск", type: "city" },
  { id: 10843, name: "Северодвинск", type: "city" },
  
  { id: 21, name: "Вологодская область", type: "region" },
  { id: 10853, name: "Вологда", type: "city" },
  { id: 10854, name: "Череповец", type: "city" },
  
  { id: 22, name: "Калининградская область", type: "region" },
  { id: 10897, name: "Калининград", type: "city" },
  
  { id: 23, name: "Мурманская область", type: "region" },
  { id: 10922, name: "Мурманск", type: "city" },
  
  { id: 24, name: "Новгородская область", type: "region" },
  { id: 10924, name: "Великий Новгород", type: "city" },
  
  { id: 25, name: "Псковская область", type: "region" },
  { id: 10945, name: "Псков", type: "city" },
  
  // Южный ФО
  { id: 27, name: "Республика Адыгея", type: "republic" },
  { id: 10949, name: "Майкоп", type: "city" },
  
  { id: 28, name: "Республика Калмыкия", type: "republic" },
  { id: 10950, name: "Элиста", type: "city" },
  
  { id: 29, name: "Республика Крым", type: "republic" },
  { id: 146, name: "Симферополь", type: "city" },
  { id: 959, name: "Севастополь", type: "city" },
  
  { id: 35, name: "Краснодарский край", type: "region" },
  { id: 10995, name: "Краснодар", type: "city" },
  { id: 239, name: "Сочи", type: "city" },
  { id: 10996, name: "Новороссийск", type: "city" },
  { id: 10997, name: "Армавир", type: "city" },
  
  { id: 37, name: "Астраханская область", type: "region" },
  { id: 11060, name: "Астрахань", type: "city" },
  
  { id: 38, name: "Волгоградская область", type: "region" },
  { id: 11069, name: "Волгоград", type: "city" },
  { id: 10945, name: "Волжский", type: "city" },
  
  { id: 39, name: "Ростовская область", type: "region" },
  { id: 11029, name: "Ростов-на-Дону", type: "city" },
  { id: 10950, name: "Таганрог", type: "city" },
  { id: 10951, name: "Шахты", type: "city" },
  { id: 10952, name: "Новочеркасск", type: "city" },
  
  // Северо-Кавказский ФО
  { id: 30, name: "Республика Дагестан", type: "republic" },
  { id: 28, name: "Махачкала", type: "city" },
  
  { id: 31, name: "Республика Ингушетия", type: "republic" },
  { id: 10274, name: "Магас", type: "city" },
  
  { id: 32, name: "Кабардино-Балкарская Республика", type: "republic" },
  { id: 10274, name: "Нальчик", type: "city" },
  
  { id: 33, name: "Карачаево-Черкесская Республика", type: "republic" },
  { id: 10276, name: "Черкесск", type: "city" },
  
  { id: 34, name: "Республика Северная Осетия — Алания", type: "republic" },
  { id: 10277, name: "Владикавказ", type: "city" },
  
  { id: 1106, name: "Чеченская Республика", type: "republic" },
  { id: 1095, name: "Грозный", type: "city" },
  
  { id: 36, name: "Ставропольский край", type: "region" },
  { id: 10995, name: "Ставрополь", type: "city" },
  { id: 10996, name: "Пятигорск", type: "city" },
  
  // Приволжский ФО
  { id: 40, name: "Республика Башкортостан", type: "republic" },
  { id: 172, name: "Уфа", type: "city" },
  { id: 10916, name: "Стерлитамак", type: "city" },
  
  { id: 41, name: "Республика Марий Эл", type: "republic" },
  { id: 10878, name: "Йошкар-Ола", type: "city" },
  
  { id: 42, name: "Республика Мордовия", type: "republic" },
  { id: 10897, name: "Саранск", type: "city" },
  
  { id: 43, name: "Республика Татарстан", type: "republic" },
  { id: 43, name: "Казань", type: "city" },
  { id: 192, name: "Набережные Челны", type: "city" },
  { id: 10916, name: "Нижнекамск", type: "city" },
  
  { id: 44, name: "Удмуртская Республика", type: "republic" },
  { id: 44, name: "Ижевск", type: "city" },
  
  { id: 45, name: "Чувашская Республика", type: "republic" },
  { id: 45, name: "Чебоксары", type: "city" },
  
  { id: 46, name: "Пермский край", type: "region" },
  { id: 50, name: "Пермь", type: "city" },
  
  { id: 47, name: "Кировская область", type: "region" },
  { id: 10878, name: "Киров", type: "city" },
  
  { id: 47, name: "Нижегородская область", type: "region" },
  { id: 11282, name: "Нижний Новгород", type: "city" },
  { id: 10916, name: "Дзержинск", type: "city" },
  
  { id: 48, name: "Оренбургская область", type: "region" },
  { id: 48, name: "Оренбург", type: "city" },
  { id: 10916, name: "Орск", type: "city" },
  
  { id: 49, name: "Пензенская область", type: "region" },
  { id: 11111, name: "Пенза", type: "city" },
  
  { id: 63, name: "Самарская область", type: "region" },
  { id: 11119, name: "Самара", type: "city" },
  { id: 16, name: "Тольятти", type: "city" },
  
  { id: 194, name: "Саратовская область", type: "region" },
  { id: 11131, name: "Саратов", type: "city" },
  { id: 10916, name: "Энгельс", type: "city" },
  { id: 10917, name: "Балаково", type: "city" },
  
  { id: 195, name: "Ульяновская область", type: "region" },
  { id: 195, name: "Ульяновск", type: "city" },
  
  // Уральский ФО
  { id: 53, name: "Курганская область", type: "region" },
  { id: 53, name: "Курган", type: "city" },
  
  { id: 54, name: "Свердловская область", type: "region" },
  { id: 11162, name: "Екатеринбург", type: "city" },
  { id: 11225, name: "Нижний Тагил", type: "city" },
  
  { id: 55, name: "Тюменская область", type: "region" },
  { id: 11316, name: "Тюмень", type: "city" },
  
  { id: 973, name: "Ханты-Мансийский АО", type: "autonomous_region" },
  { id: 973, name: "Сургут", type: "city" },
  { id: 973, name: "Нижневартовск", type: "city" },
  
  { id: 982, name: "Ямало-Ненецкий АО", type: "autonomous_region" },
  
  { id: 56, name: "Челябинская область", type: "region" },
  { id: 11225, name: "Челябинск", type: "city" },
  { id: 56, name: "Магнитогорск", type: "city" },
  
  // Сибирский ФО
  { id: 60, name: "Республика Алтай", type: "republic" },
  { id: 10251, name: "Горно-Алтайск", type: "city" },
  
  { id: 61, name: "Республика Тыва", type: "republic" },
  { id: 10252, name: "Кызыл", type: "city" },
  
  { id: 190, name: "Республика Хакасия", type: "republic" },
  { id: 10253, name: "Абакан", type: "city" },
  
  { id: 197, name: "Алтайский край", type: "region" },
  { id: 11100, name: "Барнаул", type: "city" },
  { id: 197, name: "Бийск", type: "city" },
  
  { id: 62, name: "Красноярский край", type: "region" },
  { id: 62, name: "Красноярск", type: "city" },
  
  { id: 63, name: "Иркутская область", type: "region" },
  { id: 11443, name: "Иркутск", type: "city" },
  { id: 63, name: "Братск", type: "city" },
  { id: 63, name: "Ангарск", type: "city" },
  
  { id: 64, name: "Кемеровская область", type: "region" },
  { id: 64, name: "Кемерово", type: "city" },
  { id: 234, name: "Новокузнецк", type: "city" },
  { id: 64, name: "Прокопьевск", type: "city" },
  
  { id: 65, name: "Новосибирская область", type: "region" },
  { id: 65, name: "Новосибирск", type: "city" },
  
  { id: 66, name: "Омская область", type: "region" },
  { id: 11318, name: "Омск", type: "city" },
  
  { id: 67, name: "Томская область", type: "region" },
  { id: 67, name: "Томск", type: "city" },
  
  // Дальневосточный ФО
  { id: 190, name: "Республика Бурятия", type: "republic" },
  { id: 190, name: "Улан-Удэ", type: "city" },
  
  { id: 68, name: "Республика Саха (Якутия)", type: "republic" },
  { id: 1095, name: "Якутск", type: "city" },
  
  { id: 69, name: "Забайкальский край", type: "region" },
  { id: 68, name: "Чита", type: "city" },
  
  { id: 75, name: "Приморский край", type: "region" },
  { id: 75, name: "Владивосток", type: "city" },
  
  { id: 76, name: "Хабаровский край", type: "region" },
  { id: 76, name: "Хабаровск", type: "city" },
  { id: 76, name: "Комсомольск-на-Амуре", type: "city" },
  
  { id: 77, name: "Амурская область", type: "region" },
  { id: 77, name: "Благовещенск", type: "city" },
  
  { id: 78, name: "Камчатский край", type: "region" },
  { id: 10251, name: "Петропавловск-Камчатский", type: "city" },
  
  { id: 79, name: "Магаданская область", type: "region" },
  { id: 10252, name: "Магадан", type: "city" },
  
  { id: 80, name: "Сахалинская область", type: "region" },
  { id: 10253, name: "Южно-Сахалинск", type: "city" },
  
  { id: 81, name: "Еврейская автономная область", type: "autonomous_region" },
  { id: 10254, name: "Биробиджан", type: "city" },
  
  { id: 82, name: "Чукотский АО", type: "autonomous_region" },
  { id: 10255, name: "Анадырь", type: "city" }
];
