import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export type TabType = 'dashboard' | 'users' | 'analytics' | 'bulk' | 'affiliates';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
}

interface AdminTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: TabConfig[] = [
  { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
  { id: 'users', label: 'Пользователи', icon: 'Users' },
  { id: 'affiliates', label: 'Партнеры', icon: 'UserCheck' },
  { id: 'analytics', label: 'Аналитика', icon: 'BarChart3' },
  { id: 'bulk', label: 'Массовые операции', icon: 'FileStack' }
];

export default function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              className="rounded-t-lg rounded-b-none"
              onClick={() => onTabChange(tab.id)}
            >
              <Icon name={tab.icon} className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}