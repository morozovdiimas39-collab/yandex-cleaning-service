import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface SettingsPanelProps {
  hasChanges: boolean;
  onSaveChanges?: () => void;
  onNewProject: () => void;
}

export default function SettingsPanel({
  hasChanges,
  onSaveChanges,
  onNewProject,
}: SettingsPanelProps) {
  return (
    <div className="rounded-lg border p-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="Settings" size={20} />
        <h3 className="font-medium">Настройки</h3>
      </div>

      <div className="space-y-3">
        {onSaveChanges && (
          <Button
            onClick={onSaveChanges}
            variant="outline"
            className="w-full"
            disabled={!hasChanges}
          >
            <Icon name="Save" size={16} className="mr-2" />
            Сохранить изменения
          </Button>
        )}

        <Button onClick={onNewProject} variant="outline" className="w-full">
          <Icon name="Plus" size={16} className="mr-2" />
          Новый проект
        </Button>
      </div>
    </div>
  );
}
