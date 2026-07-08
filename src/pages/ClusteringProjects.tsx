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
import Sidebar from '@/components/Sidebar';
import { BACKEND_URLS } from '@/config/backend-urls';

const API_URL = BACKEND_URLS.api;

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
  const navigate = useNavigate();
  const { user, sessionToken, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    loadProjects();
  }, [authLoading]);

  const loadProjects = async () => {
    if (!sessionToken || !user?.id) {
      setLoading(false);
      navigate('/auth');
      return;
    }

    const cacheKey = `clustering_projects_${user.id}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    const now = Date.now();
    
    if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 60000) {
      try {
        setProjects(JSON.parse(cachedData));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?endpoint=projects`, {
        headers: { 'X-Session-Token': sessionToken }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        localStorage.setItem(cacheKey, JSON.stringify(data.projects || []));
        localStorage.setItem(`${cacheKey}_time`, now.toString());
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch(`${API_URL}?endpoint=projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ name: newProjectName, domain: '', intentFilter: 'all' })
      });
      if (res.ok) {
        const newProject = await res.json();
        const cacheKey = `clustering_projects_${user.id}`;
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(`${cacheKey}_time`);
        navigate(`/clustering/${newProject.id}`);
      } else {
        toast.error('Не удалось создать проект');
      }
    } catch (e) {
      toast.error('Не удалось создать проект');
    }
  };

  const confirmDelete = async () => {
    if (!projectToDelete || !sessionToken) return;
    try {
      const res = await fetch(`${API_URL}?endpoint=projects&id=${projectToDelete}`, {
        method: 'DELETE',
        headers: { 'X-Session-Token': sessionToken }
      });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== projectToDelete));
        const cacheKey = `clustering_projects_${user.id}`;
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(`${cacheKey}_time`);
        setDeleteDialogOpen(false);
      } else {
        toast.error('Не удалось удалить проект');
      }
    } catch (e) {
      toast.error('Не удалось удалить проект');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Icon name="Loader2" size={48} className="animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Сбор ключей Wordstat</h1>
              <p className="text-slate-500 text-lg">Собирайте и сегментируйте запросы в несколько раз быстрее</p>
            </div>
            <div className="flex gap-3">
              <Button size="lg" onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">Создать проект</Button>
            </div>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input placeholder="Поиск по проектам..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-12 text-lg" />
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <Icon name="FolderOpen" size={64} className="mx-auto mb-4 text-slate-200" />
              <h3 className="text-2xl font-bold text-slate-800">Нет проектов</h3>
              <p className="text-slate-500">Создайте первый проект для начала работы</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((p) => (
                <Card key={p.id} className="p-8 cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate(`/clustering/${p.id}`)}>
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-bold text-slate-900">{p.name}</h3>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setProjectToDelete(p.id); setDeleteDialogOpen(true); }}>
                      <Icon name="Trash2" size={18} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <div className="text-xs font-bold text-emerald-800 mb-1 uppercase tracking-wider">Фразы</div>
                      <div className="text-3xl font-black text-emerald-900">{p.keywordsCount}</div>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                      <div className="text-xs font-bold text-teal-800 mb-1 uppercase tracking-wider">Сегменты</div>
                      <div className="text-3xl font-black text-teal-900">{p.clustersCount}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Создать новый проект</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Название проекта" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
              <Button onClick={handleCreateProject} className="w-full">Создать</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Удалить проект?</DialogTitle></DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="flex-1">Отмена</Button>
              <Button variant="destructive" onClick={confirmDelete} className="flex-1">Удалить</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
