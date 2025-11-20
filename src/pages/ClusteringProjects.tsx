import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { BACKEND_URLS } from '@/config/backend-urls';

const API_URL = BACKEND_URLS.api;
const SUBSCRIPTION_URL = BACKEND_URLS.subscription;

interface Project {
  id: number;
  name: string;
  domain?: string;
  createdAt: string;
  updatedAt: string;
  keywordsCount: number;
  clustersCount: number;
  minusWordsCount: number;
  status: string;
}



export default function ClusteringProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const navigate = useNavigate();
  const { user, sessionToken, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    checkSubscription();
    loadProjects();
  }, [authLoading]);

  const checkSubscription = async () => {
    if (!user?.id) {
      setCheckingSubscription(false);
      return;
    }

    try {
      const response = await fetch(SUBSCRIPTION_URL, {
        headers: {
          'X-User-Id': user.id.toString()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHasAccess(data.hasAccess || false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const loadProjects = async () => {
    if (!sessionToken || !user?.id) {
      console.log('❌ ClusteringProjects: No session token or user ID, redirecting to auth');
      setLoading(false);
      navigate('/auth');
      return;
    }

    const cacheKey = `clustering_projects_${user.id}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    const now = Date.now();
    
    // Проверяем что кэш валиден и принадлежит ТЕКУЩЕМУ пользователю
    if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 60000) {
      try {
        const parsed = JSON.parse(cachedData);
        console.log('📦 ClusteringProjects: Found cached data for user', user.id);
        setProjects(parsed);
        setLoading(false);
        return;
      } catch (e) {
        console.log('❌ ClusteringProjects: Invalid cache, removing...');
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(`${cacheKey}_time`);
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?endpoint=projects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        }
      });

      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        localStorage.setItem(cacheKey, JSON.stringify(data.projects || []));
        localStorage.setItem(`${cacheKey}_time`, now.toString());
      } else {
        toast.error('Ошибка загрузки проектов');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = async () => {
    if (!hasAccess) {
      toast.error('Подписка закончилась', {
        description: 'Продлите подписку чтобы создавать новые проекты',
        action: {
          label: 'Подписка',
          onClick: () => navigate('/subscription')
        }
      });
      return;
    }

    if (!newProjectName.trim()) {
      toast.error('Введите название проекта');
      return;
    }

    if (!sessionToken) {
      navigate('/auth');
      return;
    }

    try {
      const res = await fetch(`${API_URL}?endpoint=projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          name: newProjectName,
          domain: '',
          intentFilter: 'all'
        })
      });

      if (res.ok) {
        const newProject = await res.json();
        const updatedProjects = [newProject, ...projects];
        setProjects(updatedProjects);
        
        // Обновляем кэш
        if (user?.id) {
          const cacheKey = `clustering_projects_${user.id}`;
          localStorage.setItem(cacheKey, JSON.stringify(updatedProjects));
          localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        }
        
        setNewProjectName('');
        setIsDialogOpen(false);
        navigate(`/clustering/${newProject.id}`);
        toast.success(`Проект "${newProjectName}" создан`);
      } else {
        toast.error('Ошибка создания проекта');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const handleOpenProject = (projectId: number) => {
    navigate(`/clustering/${projectId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete || !sessionToken) return;

    try {
      const res = await fetch(`${API_URL}?endpoint=projects&id=${projectToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        }
      });

      if (res.ok) {
        const project = projects.find(p => p.id === projectToDelete);
        const updatedProjects = projects.filter(p => p.id !== projectToDelete);
        setProjects(updatedProjects);
        
        // Обновляем кэш
        if (user?.id) {
          const cacheKey = `clustering_projects_${user.id}`;
          localStorage.setItem(cacheKey, JSON.stringify(updatedProjects));
          localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        }
        
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
        toast.success(`Проект "${project?.name}" удалён из базы данных`);
      } else {
        toast.error('Ошибка удаления проекта');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Ошибка соединения');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Неизвестно';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Загрузка проектов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50">
      <Header />
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-semibold text-slate-800 mb-2 tracking-tight">
                Сегментация ключей
              </h1>
              <p className="text-slate-500">Собирайте и сегментируйте запросы в несколько раз быстрее</p>
            </div>

            <div className="flex gap-3">
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2 shadow-lg border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={() => navigate('/rsya')}
              >
                <Icon name="Shield" size={20} />
                Чистка РСЯ
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2 shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                    <Icon name="Plus" size={20} />
                    Создать проект
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новый проект</DialogTitle>
                  <DialogDescription>Введите название проекта для сегментации</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="projectName">Название проекта</Label>
                    <Input
                      id="projectName"
                      placeholder="Например: Недвижимость Москва"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                    />
                  </div>
                  <Button onClick={handleCreateProject} className="w-full">
                    Создать
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Поиск по проектам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <Icon name="FolderOpen" size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-700 mb-2">Нет проектов</h3>
              <p className="text-slate-500 mb-6">Создайте первый проект для начала работы</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 border border-slate-200 bg-white hover:border-emerald-400 cursor-pointer"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">
                        {project.name}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity -mt-2 -mr-2 hover:bg-red-50 hover:text-red-600"
                        onClick={(e) => handleDeleteClick(e, project.id)}
                      >
                        <Icon name="Trash2" size={18} />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 text-sm mb-6">
                      <Icon name="Calendar" size={16} className="text-slate-400" />
                      <span>Создан: {formatDate(project.createdAt)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
                        <div className="text-xs text-slate-600 font-medium mb-2 whitespace-nowrap">Ключевые слова</div>
                        <div className="font-bold text-3xl text-slate-900 tabular-nums">{project.keywordsCount}</div>
                      </div>
                      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
                        <div className="text-xs text-slate-600 font-medium mb-2">Сегменты</div>
                        <div className="font-bold text-3xl text-slate-900 tabular-nums">{project.clustersCount}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить проект?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Проект и все его данные будут удалены.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1">
              Удалить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}