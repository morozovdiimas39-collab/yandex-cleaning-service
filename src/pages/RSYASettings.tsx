import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_URLS } from '@/config/backend-urls';

interface Campaign {
  id: string;
  name: string;
  status: string;
  /** Тип из API Директа */
  type?: string;
  state?: string;
  status_payment?: string;
  /** РСЯ | ТК | МК — эвристика с бэкенда; если пусто, смотри type */
  channel?: string;
  network_enabled?: boolean;
  counter_ids?: string[];
}

interface Counter {
  id: string;
  name: string;
  site: string;
}

interface Goal {
  id: string;
  name: string;
  counter_id?: string;
  counter_name?: string;
}

const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'];
const YANDEX_DIRECT_URL = BACKEND_URLS['yandex-direct'];
const authDraftKey = (projectId?: string) => `rsya-auth-draft:${projectId || 'new'}`;

const isVisibleNetworkCampaign = (campaign: Campaign) => {
  const status = (campaign.status || '').toUpperCase();
  const state = (campaign.state || '').toUpperCase();
  return campaign.network_enabled === true && status !== 'DRAFT' && status !== 'ARCHIVED' && state !== 'ARCHIVED';
};

const isRunningCampaign = (campaign: Campaign) => (campaign.state || '').toUpperCase() === 'ON';

const campaignStatusLabels: Record<string, string> = {
  ACCEPTED: 'Принята',
  MODERATION: 'На модерации',
  DRAFT: 'Черновик',
  REJECTED: 'Отклонена',
  SUSPENDED: 'Приостановлена',
  ARCHIVED: 'В архиве'
};

const campaignStateLabels: Record<string, string> = {
  ON: 'Запущена',
  OFF: 'Остановлена',
  SUSPENDED: 'Приостановлена',
  ENDED: 'Завершена',
  ARCHIVED: 'В архиве'
};

const getCampaignStatusLabel = (campaign: Campaign) => {
  const state = (campaign.state || '').toUpperCase();
  const status = (campaign.status || '').toUpperCase();
  if (state === 'OFF' && status === 'ACCEPTED') return 'Нет показов / нет бюджета';
  return campaignStateLabels[state] || campaignStatusLabels[status] || campaign.status || 'Неизвестно';
};

const buildCountersFromCampaigns = (campaigns: Campaign[], campaignIds?: string[]): Counter[] => {
  const allowedIds = campaignIds ? new Set(campaignIds.map(String)) : null;
  const countersById = new Map<string, Counter>();

  campaigns.forEach((campaign) => {
    if (allowedIds && !allowedIds.has(String(campaign.id))) return;
    (campaign.counter_ids || []).forEach((counterId) => {
      const id = String(counterId).trim();
      if (!id || countersById.has(id)) return;
      countersById.set(id, {
        id,
        name: `Счётчик ${id}`,
        site: `Из кампаний Директа`
      });
    });
  });

  return Array.from(countersById.values());
};

const enrichDirectCountersWithMetrikaNames = (
  directCounters: Counter[],
  metrikaCounters: Counter[]
): Counter[] => {
  const metrikaById = new Map(metrikaCounters.map((counter) => [String(counter.id), counter]));

  return directCounters.map((counter) => {
    const metrikaCounter = metrikaById.get(String(counter.id));
    if (!metrikaCounter) return counter;

    return {
      ...counter,
      name: metrikaCounter.name || metrikaCounter.site || counter.name,
      site: metrikaCounter.site || counter.site
    };
  });
};

export default function RSYASettings() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [campaignsError, setCampaignsError] = useState('');
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [activeClientLogin, setActiveClientLogin] = useState('');
  
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [selectedCounters, setSelectedCounters] = useState<Set<string>>(new Set());
  const [autoAddNewCampaigns, setAutoAddNewCampaigns] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const uid = userStr ? JSON.parse(userStr).id.toString() : '1';
    setUserId(uid);
    
    if (projectId) {
      loadData(uid);
    }
  }, [projectId]);

  const loadData = async (uid: string) => {
    try {
      setLoading(true);
      setCampaignsError('');
      
      const projectResponse = await fetch(`${RSYA_PROJECTS_URL}?project_id=${projectId}`, {
        headers: { 'X-User-Id': uid }
      });
      
      if (!projectResponse.ok) {
        toast({ title: 'Проект не найден', variant: 'destructive' });
        navigate('/rsya');
        return;
      }
      
      const projectData = await projectResponse.json();
      const draftRaw = projectId ? sessionStorage.getItem(authDraftKey(projectId)) : null;
      let authDraft: { yandex_token?: string; client_login?: string } = {};
      try {
        authDraft = draftRaw ? JSON.parse(draftRaw) : {};
      } catch {
        authDraft = {};
      }
      const token = projectData.project.yandex_token || authDraft.yandex_token;
      const clientLogin = projectData.project.client_login || authDraft.client_login || '';
      setActiveClientLogin(clientLogin);
      setSelectedCounters(new Set(projectData.project.counter_ids || []));
      
      if (!token) {
        toast({ title: 'Нет токена Яндекса', variant: 'destructive' });
        navigate('/rsya');
        return;
      }

      let loadedCampaigns: Campaign[] = [];

      const campaignsRes = await fetch(YANDEX_DIRECT_URL, {
        headers: {
          'X-Auth-Token': token,
          ...(clientLogin ? { 'X-Client-Login': clientLogin } : {})
        }
      });

      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        loadedCampaigns = (data.campaigns || []).filter(isVisibleNetworkCampaign);
        setCampaigns(loadedCampaigns);
        if ((data.client_login || '') !== clientLogin) {
          setCampaignsError(
            `Кампании загружены не из выбранного Client-Login. Ожидали "${clientLogin || 'без Client-Login'}", backend вернул "${data.client_login || 'без Client-Login'}".`
          );
        }
        if (data.error) {
          setCampaignsError(data.error_detail || data.message || data.error);
        } else if (loadedCampaigns.length === 0) {
          setCampaignsError('РСЯ-кампании с включенными показами в сетях не найдены.');
        }
        
        setSelectedCampaigns(new Set(loadedCampaigns.filter(isRunningCampaign).map((campaign) => String(campaign.id))));
      } else {
        setCampaigns([]);
        setCampaignsError('Не удалось загрузить кампании из Яндекс.Директа.');
      }

      setAutoAddNewCampaigns(projectData.project.auto_add_campaigns ?? true);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Ошибка загрузки данных', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadGoals = async (token: string, counterIds: string[]) => {
    setLoadingGoals(true);
    try {
      const response = await fetch(`${YANDEX_DIRECT_URL}?action=goals&counter_ids=${counterIds.join(',')}`, {
        headers: { 'X-Auth-Token': token }
      });
      
      if (response.ok) {
        const data = await response.json();
        const allGoals = data.goals || [];
        setGoals(allGoals);
        
        // Синхронизируем цели в базу
        if (allGoals.length > 0) {
          await syncGoals(allGoals);
        }
      } else {
        toast({ title: 'Ошибка загрузки целей', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      toast({ title: 'Ошибка загрузки целей', variant: 'destructive' });
    } finally {
      setLoadingGoals(false);
    }
  };

  const syncGoals = async (goalsToSync: Goal[]) => {
    try {
      await fetch(`${RSYA_PROJECTS_URL}?action=sync-goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          project_id: parseInt(projectId!),
          goals: goalsToSync
        })
      });
    } catch (error) {
      console.error('Error syncing goals:', error);
    }
  };

  const handleCounterChange = async (counterId: string) => {
    const newSelected = new Set(selectedCounters);
    if (newSelected.has(counterId)) {
      newSelected.delete(counterId);
    } else {
      newSelected.add(counterId);
    }
    setSelectedCounters(newSelected);
    
    // Загружаем цели для выбранных счетчиков
    if (newSelected.size > 0) {
      const projectResponse = await fetch(`${RSYA_PROJECTS_URL}?project_id=${projectId}`, {
        headers: { 'X-User-Id': userId }
      });
      const projectData = await projectResponse.json();
      const token = projectData.project.yandex_token;
      await loadGoals(token, Array.from(newSelected));
    } else {
      setGoals([]);
    }
  };

  const handleSave = async () => {
    if (selectedCampaigns.size === 0) {
      toast({ title: 'Выберите хотя бы одну кампанию', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(RSYA_PROJECTS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          project_id: parseInt(projectId!),
          campaign_ids: Array.from(selectedCampaigns),
          counter_ids: Array.from(selectedCounters),
          client_login: activeClientLogin,
          auto_add_campaigns: autoAddNewCampaigns,
          is_configured: true
        })
      });

      if (!response.ok) throw new Error('Ошибка сохранения');

      // Синхронизируем цели после сохранения counter_ids
      if (goals.length > 0) {
        await syncGoals(goals);
      }

      toast({ title: '✅ Настройки обновлены' });
      navigate(`/rsya/${projectId}`);
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppSidebar />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 p-8 ml-64">
          <div className="flex items-center justify-center h-screen">
            <Icon name="Loader2" className="animate-spin h-12 w-12 text-green-600" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppSidebar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 p-8 ml-64">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button onClick={() => navigate(`/rsya/${projectId}`)} variant="outline" size="icon">
              <Icon name="ArrowLeft" className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Настройки проекта</h1>
              <p className="text-lg text-slate-600">Измените кампании и счётчики</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>РСЯ-кампании для отслеживания</CardTitle>
              <CardDescription>
                Показываются РСЯ-кампании; черновики и архив скрыты
                {activeClientLogin ? ` · Client-Login: ${activeClientLogin}` : ' · Прямой аккаунт токена'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {campaignsError && (
                  <div className="p-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg">
                    {campaignsError}
                  </div>
                )}
                {campaigns.length > 0 && campaigns.map(campaign => (
                  <div key={campaign.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                    <Checkbox
                      checked={selectedCampaigns.has(campaign.id)}
                      onCheckedChange={() => {
                        const newSelected = new Set(selectedCampaigns);
                        if (newSelected.has(campaign.id)) {
                          newSelected.delete(campaign.id);
                        } else {
                          newSelected.add(campaign.id);
                        }
                        setSelectedCampaigns(newSelected);
                      }}
                    />
                    {campaign.channel ? (
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          campaign.channel === 'РСЯ' || campaign.channel === 'МК'
                            ? 'bg-emerald-100 text-emerald-800'
                            : campaign.channel === 'ТК'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-violet-100 text-violet-800'
                        }`}
                      >
                        РСЯ
                      </span>
                    ) : campaign.type ? (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-slate-100 text-slate-700 max-w-[140px] truncate"
                        title={campaign.type}
                      >
                        {campaign.type.replace(/_CAMPAIGN$/i, '')}
                      </span>
                    ) : null}
                    <span className="text-sm flex-1 min-w-0">{campaign.name}</span>
                    <span className="text-xs text-slate-500 shrink-0">{getCampaignStatusLabel(campaign)}</span>
                  </div>
                ))}
              </div>

              {campaigns.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Checkbox
                  id="auto-add"
                  checked={autoAddNewCampaigns}
                  onCheckedChange={(checked) => setAutoAddNewCampaigns(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="auto-add" className="text-sm font-medium cursor-pointer">
                    Автоматически добавлять новые РСЯ-кампании
                  </label>
                  <p className="text-xs text-slate-600 mt-1">
                    Новые РСЯ-кампании с включенными показами в сетях будут добавляться в очистку площадок
                  </p>
                </div>
              </div>
              )}
            </CardContent>
          </Card>

          {campaigns.length > 0 && (
          <div className="flex justify-end gap-3">
            <Button onClick={() => navigate(`/rsya/${projectId}`)} variant="outline">
              Отмена
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || selectedCampaigns.size === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <Icon name="Loader2" className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Check" className="mr-2" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </div>
          )}
        </div>
      </div>
    </>
  );
}
