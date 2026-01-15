import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from '@/config/backend-urls';
import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
  id: number;
  name: string;
  bot_token: string;
  telegram_chat_id: string;
  created_at: string;
  metrika_counter_id?: string;
  yandex_metrika_token?: string;
}

export default function TelegaCRMProject({ project, onUpdate }: { project: Project; onUpdate?: () => void }) {
  const { user } = useAuth();
  const webhookUrl = BACKEND_URLS['telega-button-handler'] || '[URL not found]';
  const leadUrl = BACKEND_URLS['telega-lead-webhook'] || '[URL not found]';
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [webhookMessage, setWebhookMessage] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    metrika_counter_id: project.metrika_counter_id || ''
  });

  const setupWebhook = async () => {
    setWebhookStatus('loading');
    setWebhookMessage('');

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${project.bot_token}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl })
        }
      );

      const data = await response.json();

      if (data.ok) {
        setWebhookStatus('success');
        setWebhookMessage('Вебхук успешно установлен!');
        toast.success('Вебхук установлен!');
      } else {
        setWebhookStatus('error');
        setWebhookMessage(`Ошибка: ${data.description}`);
        toast.error(`Ошибка: ${data.description}`);
      }
    } catch (error) {
      setWebhookStatus('error');
      setWebhookMessage('Ошибка подключения к Telegram API');
      toast.error('Ошибка подключения');
    }
  };

  const updateProject = async () => {
    if (!user?.id) return;

    try {
      const url = BACKEND_URLS['telega-crm'];
      if (!url) {
        toast.error('Сервис временно недоступен');
        return;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          user_id: user.id,
          metrika_counter_id: editFormData.metrika_counter_id
        })
      });

      if (response.ok) {
        toast.success('Проект обновлён!');
        setIsEditDialogOpen(false);
        if (onUpdate) onUpdate();
      } else {
        toast.error('Ошибка обновления проекта');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Icon name="MessageSquare" className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
            <p className="text-sm text-slate-600">
              Создан {new Date(project.created_at).toLocaleDateString('ru-RU')}
            </p>
            {project.metrika_counter_id && (
              <p className="text-xs text-slate-500 mt-1">
                <Icon name="TrendingUp" className="h-3 w-3 inline mr-1" />
                Метрика: {project.metrika_counter_id}
                {project.yandex_metrika_token && (
                  <span className="ml-2 text-emerald-600">✓ подключена</span>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {project.metrika_counter_id && !project.yandex_metrika_token && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const oauthUrl = `https://functions.poehali.dev/61ff1445-d92e-4f1f-9900-fe5b339f3e56?project_id=${project.id}`;
                window.open(oauthUrl, 'metrika-oauth', 'width=600,height=700');
              }}
            >
              <Icon name="Link" className="h-4 w-4 mr-2" />
              Подключить Метрику
            </Button>
          )}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Icon name="Settings" className="h-4 w-4 mr-2" />
                Настройки
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Настройки проекта</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="metrika_edit">ID счётчика Яндекс.Метрики</Label>
                  <Input
                    id="metrika_edit"
                    placeholder="12345678"
                    value={editFormData.metrika_counter_id}
                    onChange={(e) => setEditFormData({ metrika_counter_id: e.target.value })}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Для отправки конверсий в Метрику ("Записался на пробное", "Записался на обучение")
                  </p>
                </div>
                <Button onClick={updateProject} className="w-full">
                  Сохранить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 space-y-4">
        {!project.telegram_chat_id && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Icon name="Info" className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Заявки придут вам в личку</p>
                <p className="text-xs text-blue-700">
                  Чтобы получать заявки, напишите боту любое сообщение или нажмите /start.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <span className="bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
            Настройте webhook для кнопок
          </h4>
          <p className="text-xs text-slate-600 mb-2">Нажмите кнопку, чтобы подключить бота:</p>
          
          <Button 
            onClick={setupWebhook} 
            disabled={webhookStatus === 'loading'}
            className="w-full mb-2"
          >
            {webhookStatus === 'loading' && <Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />}
            {webhookStatus === 'success' && <Icon name="CheckCircle2" className="h-4 w-4 mr-2" />}
            {webhookStatus === 'error' && <Icon name="AlertCircle" className="h-4 w-4 mr-2" />}
            {webhookStatus === 'idle' && 'Установить вебхук'}
            {webhookStatus === 'loading' && 'Устанавливаю...'}
            {webhookStatus === 'success' && 'Вебхук установлен!'}
            {webhookStatus === 'error' && 'Попробовать снова'}
          </Button>

          {webhookMessage && (
            <div className={`p-2 rounded text-xs ${
              webhookStatus === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {webhookMessage}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
            Добавьте форму на сайт
          </h4>
          <p className="text-xs text-slate-600 mb-2">Вставьте этот HTML на свой сайт:</p>
          <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
{`<form id="leadForm">
  <input name="phone" placeholder="Телефон" required />
  <input name="name" placeholder="Имя" />
  <input name="course" placeholder="Курс" />
  <button type="submit">Отправить</button>
</form>

<script>
document.getElementById('leadForm').onsubmit = async (e) => {
  e.preventDefault();
  const data = {
    project_id: ${project.id},
    phone: e.target.phone.value,
    name: e.target.name.value,
    course: e.target.course.value
  };
  
  const res = await fetch('${leadUrl}', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  
  if (res.ok) alert('Заявка отправлена!');
  else alert('Ошибка');
};
</script>`}
          </pre>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Icon name="CheckCircle2" className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-900">Готово!</p>
              <p className="text-xs text-emerald-700">
                Теперь заявки с сайта будут приходить в ваш Telegram-канал с кнопками статусов.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}