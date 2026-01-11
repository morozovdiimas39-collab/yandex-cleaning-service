import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const products = [
  {
    id: 1,
    name: 'iPhone 15 Pro',
    price: 119990,
    image: 'https://cdn.poehali.dev/projects/wvl5tqp1sh/bucket/iphone15pro.jpg',
    category: 'iPhone',
    badge: 'Новинка',
    specs: ['A17 Pro', '256 ГБ', 'Титан']
  },
  {
    id: 2,
    name: 'MacBook Pro 16"',
    price: 289990,
    image: 'https://cdn.poehali.dev/projects/wvl5tqp1sh/bucket/macbookpro.jpg',
    category: 'Mac',
    badge: 'Хит продаж',
    specs: ['M3 Max', '36 ГБ', '1 ТБ SSD']
  },
  {
    id: 3,
    name: 'iPad Pro 12.9"',
    price: 129990,
    image: 'https://cdn.poehali.dev/projects/wvl5tqp1sh/bucket/ipadpro.jpg',
    category: 'iPad',
    badge: null,
    specs: ['M2', '128 ГБ', 'Wi-Fi + Cellular']
  },
  {
    id: 4,
    name: 'AirPods Pro 2',
    price: 29990,
    image: 'https://cdn.poehali.dev/projects/wvl5tqp1sh/bucket/airpodspro.jpg',
    category: 'Аксессуары',
    badge: 'Бестселлер',
    specs: ['USB-C', 'Шумоподавление', 'MagSafe']
  },
  {
    id: 5,
    name: 'Apple Watch Ultra 2',
    price: 89990,
    image: 'https://cdn.poehali.dev/projects/wvl5tqp1sh/bucket/watchultra.jpg',
    category: 'Watch',
    badge: 'Новинка',
    specs: ['GPS + Cellular', '49 мм', 'Титановый']
  },
  {
    id: 6,
    name: 'Mac Studio',
    price: 239990,
    image: 'https://cdn.poehali.dev/projects/wvl5tqp1sh/bucket/macstudio.jpg',
    category: 'Mac',
    badge: null,
    specs: ['M2 Ultra', '64 ГБ', '1 ТБ SSD']
  }
];

const categories = ['Все', 'iPhone', 'Mac', 'iPad', 'Watch', 'Аксессуары'];

export default function AppleStore() {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<number[]>([]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Все' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (productId: number) => {
    setCart([...cart, productId]);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Smartphone" size={32} className="text-slate-800" />
              <h1 className="text-2xl font-bold text-slate-800">GO-Store</h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#catalog" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">Каталог</a>
              <a href="#about" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">О нас</a>
              <a href="#delivery" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">Доставка</a>
              <a href="#contacts" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">Контакты</a>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Icon name="ShoppingCart" size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-slate-800 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon">
                <Icon name="User" size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-5xl font-bold text-slate-900 mb-4">
              Официальная техника Apple
            </h2>
            <p className="text-xl text-slate-600">
              Широкий выбор оригинальных устройств с гарантией и доставкой по всей России
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Поиск устройства..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-slate-200 h-12"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-10" id="catalog">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category 
                  ? 'bg-slate-900 hover:bg-slate-800 text-white' 
                  : 'border-slate-200 hover:bg-slate-50'}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-2xl transition-all duration-300 border-slate-200 overflow-hidden bg-white">
                <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 p-6 aspect-square flex items-center justify-center overflow-hidden">
                  {product.badge && (
                    <Badge className="absolute top-4 left-4 bg-slate-800 text-white border-0">
                      {product.badge}
                    </Badge>
                  )}
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="Smartphone" size={120} className="text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="mb-3">
                    <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                      {product.category}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {product.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.specs.map((spec, index) => (
                      <span key={index} className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    <Button
                      onClick={() => addToCart(product.id)}
                      className="bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      <Icon name="ShoppingCart" size={18} className="mr-2" />
                      Купить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50" id="about">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="CheckCircle" size={28} className="text-slate-800" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Оригинальная продукция
                </h3>
                <p className="text-slate-600">
                  Все товары официальные с полной гарантией производителя
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Truck" size={28} className="text-slate-800" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Быстрая доставка
                </h3>
                <p className="text-slate-600">
                  Доставим ваш заказ в течение 1-2 дней по Москве
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Shield" size={28} className="text-slate-800" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Гарантия качества
                </h3>
                <p className="text-slate-600">
                  Возврат и обмен в течение 14 дней без объяснения причин
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12 px-4" id="contacts">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Smartphone" size={24} />
                <h3 className="text-xl font-bold">GO-Store</h3>
              </div>
              <p className="text-slate-400">
                Официальный магазин техники Apple в России
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Каталог</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">iPhone</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mac</a></li>
                <li><a href="#" className="hover:text-white transition-colors">iPad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Watch</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Информация</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">О компании</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Доставка и оплата</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Гарантия</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Контакты</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Контакты</h4>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center gap-2">
                  <Icon name="Phone" size={16} />
                  <span>+7 (495) 123-45-67</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Mail" size={16} />
                  <span>info@go-store.ru</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="MapPin" size={16} />
                  <span>Москва, ул. Примерная, 123</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 GO-Store.ru — Официальный магазин техники Apple</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
