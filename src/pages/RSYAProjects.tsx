import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';
import { BACKEND_URLS } from '@/config/backend-urls';

interface Project {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  has_token: boolean;
}

interface BillingStatus {
  projectCount: number;
  projectLimit: number;
  remainingProjects: number;
  pricePerProjectRub: number;
}

const RSYA_PROJECTS_URL = BACKEND_URLS['rsya-projects'];
const SUBSCRIPTION_URL = BACKEND_URLS.subscription;

export default function RSYAProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
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
    loadBilling(uid);
  }, []);

  const loadProjects = async (uid: string) => {
    setLoading(true);
    try {
      const response = await fetch(RSYA_PROJECTS_URL, { headers: { 'X-User-Id': uid } });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBilling = async (uid: string) => {
    try {
      const response = await fetch(SUBSCRIPTION_URL, { headers: { 'X-User-Id': uid } });
      if (response.ok) {
        const data = await response.json();
        setBilling(data);
      }
    } catch {}
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    if (billing && billing.remainingProjects <= 0) {
      setIsDialogOpen(false);
      navigate('/billing');
      return;
    }
    try {
      const response = await fetch(RSYA_PROJECTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ name: newProjectName })
      });
      if (response.ok) {
        const data = await response.json();
        setProjects([data.project, ...projects]);
        loadBilling(userId);
        setIsDialogOpen(false);
        navigate(`/rsya/${data.project.id}`);
      } else if (response.status === 402) {
        const data = await response.json();
        setBilling({
          projectCount: data.project_count,
          projectLimit: data.project_limit,
          remainingProjects: data.remaining_projects,
          pricePerProjectRub: data.price_per_project_rub,
        });
        setIsDialogOpen(false);
        toast({
          title: 'Лимит проектов исчерпан',
          description: 'Первый проект бесплатный. Для следующего проекта нужна оплата.',
          variant: 'destructive',
        });
        navigate('/billing');
      }
    } finally {}
  };

  const deleteProject = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить проект?')) return;
    try {
      const response = await fetch(`${RSYA_PROJECTS_URL}?project_id=${projectId}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId }
      });
      if (response.ok) setProjects(projects.filter(p => p.id !== projectId));
    } catch (e) {}
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Чистка РСЯ</h1>
              <p className="text-slate-600">Управляйте проектами по чистке площадок РСЯ</p>
              {billing && (
                <p className="mt-2 text-sm text-slate-500">
                  Доступно проектов: {billing.projectCount}/{billing.projectLimit}. Дополнительный проект — {billing.pricePerProjectRub} ₽.
                </p>
              )}
            </div>
            <Button
              size="lg"
              onClick={() => billing && billing.remainingProjects <= 0 ? navigate('/billing') : setIsDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {billing && billing.remainingProjects <= 0 ? 'Оплатить проект' : 'Создать проект'}
            </Button>
          </div>

          {projects.length === 0 && !loading ? (
            <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <Icon name="ShieldOff" size={64} className="mx-auto mb-4 text-slate-200" />
              <h3 className="text-xl font-semibold mb-2 text-slate-700">Нет проектов</h3>
              <p className="text-slate-500 mb-6">Создайте первый проект для начала работы</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((p) => (
                <Card key={p.id} className="hover:shadow-lg transition-all border bg-white relative">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center"><Icon name="ShieldOff" size={24} className="text-green-600" /></div>
                      <Button variant="ghost" size="sm" onClick={(e) => deleteProject(p.id, e)}><Icon name="Trash2" size={16} /></Button>
                    </div>
                    <CardTitle className="text-xl">{p.name}</CardTitle>
                    <CardDescription>Создан {new Date(p.created_at).toLocaleDateString('ru-RU')}</CardDescription>
                  </CardHeader>
                  <CardContent><Button onClick={() => navigate(`/rsya/${p.id}`)} className="w-full bg-emerald-600 hover:bg-emerald-700">Открыть</Button></CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Новый проект РСЯ</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Название проекта" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
            {billing && billing.remainingProjects <= 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Бесплатный лимит исчерпан. Следующий проект стоит {billing.pricePerProjectRub} ₽.
              </div>
            )}
            <Button onClick={createProject} className="w-full bg-emerald-600 hover:bg-emerald-700">Создать</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
