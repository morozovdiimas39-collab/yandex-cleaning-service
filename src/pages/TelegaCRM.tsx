import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BACKEND_URLS } from '@/config/backend-urls';
import TelegaCRMProject from '@/components/TelegaCRMProject';

interface Project {
  id: number;
  name: string;
  bot_token: string;
  telegram_chat_id: string;
  created_at: string;
}

export default function TelegaCRM() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bot_token: '',
    telegram_chat_id: '',
    metrika_counter_id: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadProjects();
      checkTelegramLink();
    }
  }, [user]);

  const checkTelegramLink = async () => {
    if (!user?.id) return;
    try {
      const url = BACKEND_URLS['api'];
      const response = await fetch(`${url}/user/${user.id}`);
      const data = await response.json();
      setTelegramLinked(!!data.telegram_id);
    } catch (error) {
      console.error('Failed to check telegram link:', error);
    }
  };

  const loadProjects = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const url = BACKEND_URLS['telega-crm'];
      if (!url) {
        console.error('telega-crm URL not found');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${url}?user_id=${user.id}`);
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!user?.id) return;
    
    if (!formData.name || !formData.bot_token) {
      toast.error('Заполните название и токен бота');
      return;
    }

    try {
      const url = BACKEND_URLS['telega-crm'];
      if (!url) {
        toast.error('Сервис временно недоступен');
        return;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          ...formData
        })
      });

      if (response.ok) {
        toast.success('Проект создан!');
        setIsDialogOpen(false);
        setFormData({ name: '', bot_token: '', telegram_chat_id: '', metrika_counter_id: '' });
        loadProjects();
      } else {
        toast.error('Ошибка создания проекта');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Icon name="Loader2" className="h-8 w-8 animate-spin text-emerald-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Алерт о привязке Telegram */}
          {!telegramLinked && projects.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Icon name="AlertTriangle" className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-1">
                    Привяжите Telegram, чтобы получать заявки
                  </h3>
                  <p className="text-sm text-amber-700 mb-3">
                    Бот не знает куда отправлять заявки. Нажмите на кнопку ниже и напишите /start вашему боту.
                  </p>
                  {projects[0]?.bot_token && (
                    <a
                      href={`https://t.me/${projects[0].bot_token.split(':')[0]}bot?start=user_id_${user?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                        <Icon name="Send" className="h-4 w-4 mr-2" />
                        Привязать Telegram
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Hero секция */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
              <Icon name="MessageSquare" className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              TelegaCRM
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              CRM прямо в Telegram. Заявки с сайта → кнопки в боте → конверсии в Метрику.
              <br />Без кабинетов, без обучения сотрудников.
            </p>
          </div>

          {/* Быстрый старт */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Icon name="Zap" className="h-6 w-6 text-emerald-500" />
              Быстрый старт
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Создайте бота в Telegram</h3>
                  <p className="text-slate-600 text-sm">
                    Откройте @BotFather → /newbot → скопируйте токен
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Подключите бота</h3>
                  <p className="text-slate-600 text-sm">
                    Вставьте токен. ID канала необязателен — если пусто, заявки придут вам в личку.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Добавьте форму на сайт</h3>
                  <p className="text-slate-600 text-sm">
                    Скопируйте код формы и вставьте на свой сайт
                  </p>
                </div>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700">
                  <Icon name="Plus" className="h-5 w-5 mr-2" />
                  Создать первый проект
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Подключить Telegram-бота</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Название проекта</Label>
                    <Input
                      id="name"
                      placeholder="Например: Школа актёрского мастерства"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bot_token">Токен бота</Label>
                    <Input
                      id="bot_token"
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      value={formData.bot_token}
                      onChange={(e) => setFormData({ ...formData, bot_token: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="chat_id">ID канала (необязательно)</Label>
                    <Input
                      id="chat_id"
                      placeholder="-1001234567890 или оставьте пустым"
                      value={formData.telegram_chat_id}
                      onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Если пусто - заявки придут вам в личку. Если указан - в группу/канал.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="metrika_counter">ID счётчика Яндекс.Метрики (необязательно)</Label>
                    <Input
                      id="metrika_counter"
                      placeholder="12345678"
                      value={formData.metrika_counter_id}
                      onChange={(e) => setFormData({ ...formData, metrika_counter_id: e.target.value })}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Для отправки конверсий в Метрику ("Записался на пробное", "Записался на обучение")
                    </p>
                  </div>
                  <Button onClick={createProject} className="w-full">
                    Создать проект
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Преимущества */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Icon name="Zap" className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Мгновенные уведомления</h3>
              <p className="text-slate-600 text-sm">
                Заявка пришла → ОП видит в телеге за секунду. Никаких задержек.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Icon name="MousePointerClick" className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Кнопки статусов</h3>
              <p className="text-slate-600 text-sm">
                "Позвонил", "Записался", "Думает", "Нецелевой" — всё в один клик.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                <Icon name="TrendingUp" className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Конверсии в Метрику</h3>
              <p className="text-slate-600 text-sm">
                Статус → Яндекс.Метрика → Директ обучается на реальных конверсиях.
              </p>
            </div>
          </div>

          {/* Пример заявки */}
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Icon name="Eye" className="h-6 w-6 text-slate-400" />
              Как это выглядит в Telegram
            </h2>
            
            <div className="bg-slate-900 rounded-lg p-6 max-w-md mx-auto">
              <div className="bg-slate-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700">
                  <Icon name="Bell" className="h-5 w-5 text-yellow-400" />
                  <span className="text-white font-semibold">НОВАЯ ЗАЯВКА</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Icon name="Phone" className="h-4 w-4" />
                    <span>+7 (903) 379-58-58</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Icon name="GraduationCap" className="h-4 w-4" />
                    <span>Курс: Актёрское мастерство</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Icon name="Calendar" className="h-4 w-4" />
                    <span>14 января 2026 в 20:48</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm flex items-center justify-center gap-2 transition-colors">
                  <Icon name="Phone" className="h-4 w-4" />
                  Позвонил клиенту
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 rounded text-white text-sm flex items-center justify-center gap-2 transition-colors">
                    <Icon name="Check" className="h-4 w-4" />
                    Записался на пробное
                  </button>
                  <button className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm flex items-center justify-center gap-2 transition-colors">
                    <Icon name="Pencil" className="h-4 w-4" />
                    Записался на обучение
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm flex items-center justify-center gap-2 transition-colors">
                    <Icon name="Clock" className="h-4 w-4" />
                    Думает
                  </button>
                  <button className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded text-white text-sm flex items-center justify-center gap-2 transition-colors">
                    <Icon name="X" className="h-4 w-4" />
                    Нецелевой
                  </button>
                </div>
              </div>
            </div>
          </div>

          {projects.length > 0 && (
            <>
              <div className="flex items-center justify-between mt-12 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Мои проекты</h2>
                  <p className="text-slate-600">Управляйте заявками через Telegram</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Icon name="Plus" className="h-4 w-4 mr-2" />
                      Новый проект
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Подключить Telegram-бота</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name2">Название проекта</Label>
                        <Input
                          id="name2"
                          placeholder="Например: Школа актёрского мастерства"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bot_token2">Токен бота</Label>
                        <Input
                          id="bot_token2"
                          placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                          value={formData.bot_token}
                          onChange={(e) => setFormData({ ...formData, bot_token: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="chat_id2">ID канала (необязательно)</Label>
                        <Input
                          id="chat_id2"
                          placeholder="-1001234567890 или оставьте пустым"
                          value={formData.telegram_chat_id}
                          onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Если пусто - заявки придут вам в личку. Если указан - в группу/канал.
                        </p>
                      </div>
                      <Button onClick={createProject} className="w-full">
                        Создать проект
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {projects.map((project) => (
                  <TelegaCRMProject key={project.id} project={project} />
                ))}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}