import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import { BACKEND_URLS } from '@/config/backend-urls';

interface Project {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  has_token: boolean;
}

const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'] || 'https://functions.poehali.dev/08f68ba6-cbbb-4ca1-841f-185671e0757d';

export default function RSYAProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const uid = userStr ? JSON.parse(userStr).id.toString() : '1';
    setUserId(uid);
    loadProjects(uid);
  }, []);

  const loadProjects = async (uid: string) => {
    setLoading(true);
    try {
      const response = await fetch(RSYA_PROJECTS_URL, {
        method: 'GET',
        headers: {
          'X-User-Id': uid
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки проектов');

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить проекты', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast({ title: 'Введите название проекта', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(RSYA_PROJECTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          name: newProjectName
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Create project error: Status ${response.status}, Body: ${errorText}`);
        throw new Error(`Ошибка создания проекта: ${response.status}`);
      }

      const data = await response.json();
      setProjects([data.project, ...projects]);
      
      setNewProjectName('');
      setIsDialogOpen(false);
      
      toast({ title: '✅ Проект создан!', description: `Проект "${newProjectName}" успешно создан` });
      
      navigate(`/rsya/${data.project.id}`);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать проект', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!confirm('Удалить проект и все его задачи?')) return;
    
    try {
      const response = await fetch(`${RSYA_PROJECTS_URL}?project_id=${projectId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка удаления');
      }

      setProjects(projects.filter(p => p.id !== projectId));
      toast({ title: '✅ Проект и все задачи удалены' });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({ title: 'Ошибка', description: error.message || 'Не удалось удалить проект', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Header />
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Чистка РСЯ</h1>
                <p className="text-slate-600">
                  Управляйте проектами по чистке площадок РСЯ
                </p>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                  >
                    <Icon name="Plus" size={20} className="mr-2" />
                    Создать проект
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новый проект РСЯ</DialogTitle>
                    <DialogDescription>
                      Введите название для нового проекта чистки площадок
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName">Название проекта</Label>
                      <Input
                        id="projectName"
                        placeholder="Например: Недвижимость Москва"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && createProject()}
                        autoFocus
                      />
                    </div>
                    <Button 
                      onClick={createProject}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                    >
                      {loading ? 'Создание...' : 'Создать проект'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {projects.length === 0 && !loading ? (
              <div className="p-12 text-center">
                <Icon name="ShieldOff" size={64} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold mb-2 text-slate-700">Нет проектов</h3>
                <p className="text-slate-500 mb-6">Создайте первый проект для начала работы</p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                >
                  <Icon name="Plus" size={20} className="mr-2" />
                  Создать проект
                </Button>
              </div>
            ) : (

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card 
                    key={project.id}
                    className="hover:shadow-lg transition-all group border hover:border-green-200 bg-white relative"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon name="ShieldOff" size={24} className="text-green-600" />
                        </div>
                        <div className="flex items-center gap-2">
                          {project.has_token ? (
                            <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Подключён
                            </div>
                          ) : (
                            <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                              Не подключён
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => deleteProject(project.id, e)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-xl">
                        {project.name}
                      </CardTitle>
                      <CardDescription>
                        Создан {new Date(project.created_at).toLocaleDateString('ru-RU')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rsya/${project.id}`);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          Открыть
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}