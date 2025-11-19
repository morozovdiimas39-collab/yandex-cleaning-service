import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import AppSidebar from '@/components/layout/AppSidebar';
import { BACKEND_URLS } from '@/config/backend-urls';

const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'];
const YANDEX_CLIENT_ID = 'fa264103fca547b7baa436de1a416fbe';

export default function RSYAAuth() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState('');
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [yandexToken, setYandexToken] = useState('');
  const [savingToken, setSavingToken] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const uid = userStr ? JSON.parse(userStr).id.toString() : '1';
    setUserId(uid);
    
    if (projectId) {
      loadProject(uid);
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'yandex_oauth_token') {
        const token = event.data.token;
        if (token) {
          setYandexToken(token);
          toast({ title: '✅ Токен получен из Яндекса!' });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [projectId]);

  const loadProject = async (uid: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${RSYA_PROJECTS_URL}?project_id=${projectId}`, {
        headers: { 'X-User-Id': uid }
      });
      
      if (!response.ok) {
        toast({ title: 'Проект не найден', variant: 'destructive' });
        navigate('/rsya');
        return;
      }
      
      const data = await response.json();
      setProject(data.project);
      
      if (data.project.yandex_token) {
        setYandexToken(data.project.yandex_token);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({ title: 'Ошибка загрузки проекта', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openYandexOAuth = () => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const authUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${YANDEX_CLIENT_ID}`;
    
    window.open(
      authUrl,
      'YandexOAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0`
    );
  };

  const saveToken = async () => {
    if (!yandexToken.trim()) {
      toast({ title: 'Введите токен', variant: 'destructive' });
      return;
    }

    try {
      setSavingToken(true);
      
      const response = await fetch(RSYA_PROJECTS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          project_id: parseInt(projectId!),
          yandex_token: yandexToken
        })
      });

      if (!response.ok) throw new Error('Ошибка сохранения токена');

      toast({ title: '✅ Токен сохранён!' });
      
      navigate(`/rsya/${projectId}/setup`);
    } catch (error) {
      console.error('Error saving token:', error);
      toast({ title: 'Ошибка сохранения токена', variant: 'destructive' });
    } finally {
      setSavingToken(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppSidebar />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 p-8 ml-64">
          <div className="flex items-center justify-center h-screen">
            <Icon name="Loader2" className="animate-spin h-12 w-12" />
          </div>
        </div>
      </>
    );
  }
  
  if (!project) {
    return null;
  }

  return (
    <>
      <AppSidebar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 p-8 ml-64">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button onClick={() => navigate('/rsya')} variant="outline" size="icon">
              <Icon name="ArrowLeft" className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">{project?.name}</h1>
              <p className="text-lg text-slate-600">Авторизация Яндекс.Директ</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Подключение к Яндекс.Директ</CardTitle>
              <CardDescription>
                Запросите OAuth-токен у Яндекса или введите вручную
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={openYandexOAuth}
                variant="outline"
                className="w-full"
              >
                <Icon name="ExternalLink" className="mr-2" />
                Запросить токен у Яндекса
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">или</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Вставьте токен вручную</label>
                <Input
                  type="text"
                  placeholder="y0_AgAAAAA..."
                  value={yandexToken}
                  onChange={(e) => setYandexToken(e.target.value)}
                />
              </div>

              <Button 
                onClick={saveToken} 
                disabled={savingToken || !yandexToken}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {savingToken ? (
                  <>
                    <Icon name="Loader2" className="mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Check" className="mr-2" />
                    Сохранить и продолжить
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}