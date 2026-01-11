import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_URLS } from '@/config/backend-urls';

interface Schedule {
  id: number;
  project_id: number;
  project_name: string;
  interval_hours: number;
  next_run_at: string;
  last_run_at: string | null;
  is_active: boolean;
}

export default function ScheduleTab() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URLS.admin}?action=get_schedules`, {
        headers: { 'X-Admin-Key': 'directkit_admin_2024' }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInterval = async (scheduleId: number, newInterval: number) => {
    try {
      const response = await fetch(`${BACKEND_URLS.admin}?action=update_schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'directkit_admin_2024'
        },
        body: JSON.stringify({
          schedule_id: scheduleId,
          interval_hours: newInterval
        })
      });

      if (response.ok) {
        toast({ title: '✅ Интервал обновлен' });
        loadSchedules();
      } else {
        toast({ title: 'Ошибка обновления', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const triggerNow = async (projectId: number) => {
    try {
      const response = await fetch(`${BACKEND_URLS.admin}?action=trigger_schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'directkit_admin_2024'
        },
        body: JSON.stringify({ project_id: projectId })
      });

      if (response.ok) {
        toast({ title: '✅ Чистка запущена' });
        loadSchedules();
      } else {
        toast({ title: 'Ошибка запуска', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Icon name="Clock" className="h-6 w-6 text-blue-500" />
            Управление расписанием чистки
          </CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Настройте интервалы автоматической чистки площадок для каждого проекта
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">
                          {schedule.project_name}
                        </h3>
                        <Badge className={schedule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {schedule.is_active ? 'Активно' : 'Отключено'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Проект #{schedule.project_id}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Интервал:</span>
                          <p className="font-semibold text-gray-900 mt-1">
                            {schedule.interval_hours} {schedule.interval_hours === 1 ? 'час' : 'часов'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Последний запуск:</span>
                          <p className="font-semibold text-gray-900 mt-1">
                            {formatDate(schedule.last_run_at)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Следующий запуск:</span>
                          <p className="font-semibold text-gray-900 mt-1">
                            {formatDate(schedule.next_run_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-6">
                      <IntervalEditor
                        currentInterval={schedule.interval_hours}
                        onSave={(newInterval) => updateInterval(schedule.id, newInterval)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerNow(schedule.project_id)}
                        className="gap-2"
                      >
                        <Icon name="Play" className="h-4 w-4" />
                        Запустить сейчас
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {schedules.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Icon name="Clock" className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Нет активных расписаний</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Icon name="AlertCircle" className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Быстрое тестирование</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• <strong>1 час</strong> — для быстрого тестирования</li>
                <li>• <strong>8 часов</strong> — стандартный интервал (3 раза в день)</li>
                <li>• <strong>24 часа</strong> — для экономных проектов</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IntervalEditor({ currentInterval, onSave }: { currentInterval: number; onSave: (interval: number) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentInterval.toString());

  const handleSave = () => {
    const newInterval = parseInt(value);
    if (newInterval > 0 && newInterval <= 168) {
      onSave(newInterval);
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsEditing(true)}
        className="gap-2"
      >
        <Icon name="Edit" className="h-4 w-4" />
        Изменить интервал
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        type="number"
        min="1"
        max="168"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 h-9"
        placeholder="8"
      />
      <Button size="sm" onClick={handleSave} className="gap-1">
        <Icon name="Check" className="h-4 w-4" />
        OK
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setIsEditing(false);
          setValue(currentInterval.toString());
        }}
      >
        <Icon name="X" className="h-4 w-4" />
      </Button>
    </div>
  );
}
