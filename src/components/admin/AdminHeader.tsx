import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminHeaderProps {
  onLogout: () => void;
}

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon name="Shield" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Админ-панель</h1>
              <p className="text-sm text-slate-500">Управление подписками</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <Icon name="LogOut" className="w-4 h-4 mr-2" />
            Выход
          </Button>
        </div>
      </div>
    </div>
  );
}
