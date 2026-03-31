import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface ExportPanelProps {
  excludeRedPhrases: boolean;
  onToggleExcludeRed: () => void;
  onExport: () => void;
}

export default function ExportPanel({
  excludeRedPhrases,
  onToggleExcludeRed,
  onExport,
}: ExportPanelProps) {
  return (
    <div className="rounded-lg border p-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="Download" size={20} />
        <h3 className="font-medium">Экспорт</h3>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={excludeRedPhrases}
            onChange={onToggleExcludeRed}
            className="w-4 h-4"
          />
          <span className="text-sm">Исключить красные фразы</span>
        </label>

        <p className="text-xs text-muted-foreground">
          Частотность в файле всегда включается
        </p>

        <Button onClick={onExport} className="w-full">
          <Icon name="Download" size={16} className="mr-2" />
          Скачать Excel
        </Button>
      </div>
    </div>
  );
}
