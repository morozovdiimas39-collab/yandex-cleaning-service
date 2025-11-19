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
}

interface Counter {
  id: string;
  name: string;
  site: string;
}

const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'];
const YANDEX_DIRECT_URL = 'https://functions.poehali.dev/6b18ca7b-7f12-4758-a9db-4f774aaf2d23';

export default function RSYASetup() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  
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
      
      const projectResponse = await fetch(`${RSYA_PROJECTS_URL}?project_id=${projectId}`, {
        headers: { 'X-User-Id': uid }
      });
      
      if (!projectResponse.ok) {
        toast({ title: 'Проект не найден', variant: 'destructive' });
        navigate('/rsya');
        return;
      }
      
      const projectData = await projectResponse.json();
      const token = projectData.project.yandex_token;
      
      if (!token) {
        toast({ title: 'Нет токена Яндекса', variant: 'destructive' });
        navigate('/rsya');
        return;
      }

      const [campaignsRes, countersRes] = await Promise.all([
        fetch(YANDEX_DIRECT_URL, { headers: { 'X-Auth-Token': token } }),
        fetch(`${YANDEX_DIRECT_URL}?action=counters`, { headers: { 'X-Auth-Token': token } })
      ]);

      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        const loadedCampaigns = data.campaigns || [];
        setCampaigns(loadedCampaigns);
        
        const allCampaignIds = new Set(loadedCampaigns.map((c: Campaign) => c.id));
        setSelectedCampaigns(allCampaignIds);
      }

      if (countersRes.ok) {
        const data = await countersRes.json();
        setCounters(data.counters || []);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Ошибка загрузки данных', variant: 'destructive' });
    } finally {
      setLoading(false);
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
          auto_add_campaigns: autoAddNewCampaigns,
          is_configured: true
        })
      });

      if (!response.ok) throw new Error('Ошибка сохранения');

      toast({ title: '✅ Настройки сохранены' });
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
            <Button onClick={() => navigate('/rsya')} variant="outline" size="icon">
              <Icon name="ArrowLeft" className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Настройка проекта</h1>
              <p className="text-lg text-slate-600">Выберите кампании и счётчики для очистки площадок</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>1. Кампании для отслеживания</CardTitle>
              <CardDescription>Выберите кампании из которых будут собираться площадки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {campaigns.map(campaign => (
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
                    <span className="text-sm">{campaign.name}</span>
                    <span className="text-xs text-slate-500 ml-auto">{campaign.status}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Checkbox
                  id="auto-add"
                  checked={autoAddNewCampaigns}
                  onCheckedChange={(checked) => setAutoAddNewCampaigns(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="auto-add" className="text-sm font-medium cursor-pointer">
                    Автоматически добавлять новые кампании
                  </label>
                  <p className="text-xs text-slate-600 mt-1">
                    Новые кампании будут автоматически добавляться в задачи для очистки площадок в фоновом режиме
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Счётчики Яндекс.Метрики (необязательно)</CardTitle>
              <CardDescription>Выберите счётчики для отслеживания конверсий</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {counters.map(counter => (
                  <div key={counter.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                    <Checkbox
                      checked={selectedCounters.has(counter.id)}
                      onCheckedChange={() => {
                        const newSelected = new Set(selectedCounters);
                        if (newSelected.has(counter.id)) {
                          newSelected.delete(counter.id);
                        } else {
                          newSelected.add(counter.id);
                        }
                        setSelectedCounters(newSelected);
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{counter.name}</div>
                      <div className="text-xs text-slate-500">{counter.site}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button onClick={() => navigate('/rsya')} variant="outline">
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
                  Сохранить и начать
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}