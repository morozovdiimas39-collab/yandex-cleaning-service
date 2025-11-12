import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Placement {
  id: string;
  domain: string;
  campaign_id: string;
  campaign_name?: string;
}

interface BlockedCampaignGroupProps {
  campaignId: string;
  campaignName: string;
  placements: Placement[];
  selectedPlacements: Set<string>;
  onToggleSelection: (placementId: string, checked: boolean) => void;
  onUnblock: (placementId: string) => void;
}

export default function BlockedCampaignGroup({
  campaignId,
  campaignName,
  placements,
  selectedPlacements,
  onToggleSelection,
  onUnblock
}: BlockedCampaignGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_VISIBLE = 100;

  const visiblePlacements = placements.slice(0, MAX_VISIBLE);
  const hasMore = placements.length > MAX_VISIBLE;

  const allSelected = placements.every(p => selectedPlacements.has(p.id));
  const someSelected = placements.some(p => selectedPlacements.has(p.id));

  const toggleAll = (checked: boolean) => {
    placements.forEach(p => onToggleSelection(p.id, checked));
  };

  return (
    <>
      <TableRow className="bg-muted/30 hover:bg-muted/50 cursor-pointer border-b-2" onClick={() => setIsExpanded(!isExpanded)}>
        <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
          />
        </TableCell>
        <TableCell colSpan={2}>
          <div className="flex items-center gap-2 font-medium">
            <Icon 
              name={isExpanded ? "ChevronDown" : "ChevronRight"} 
              size={16} 
              className="text-muted-foreground" 
            />
            <Icon name="FolderOpen" size={16} className="text-blue-500" />
            <span>{campaignName || `Кампания ${campaignId}`}</span>
            <Badge variant="secondary" className="ml-2">
              {placements.length} площадок
            </Badge>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <>
          {visiblePlacements.map(placement => (
            <TableRow key={placement.id} className="hover:bg-muted/50">
              <TableCell className="w-12 pl-8" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedPlacements.has(placement.id)}
                  onCheckedChange={(checked) => onToggleSelection(placement.id, !!checked)}
                />
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2 pl-6">
                  <Icon name="Ban" size={14} className="text-red-500 flex-shrink-0" />
                  <span className="truncate text-sm">{placement.domain}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnblock(placement.id);
                  }}
                >
                  <Icon name="Trash2" size={14} />
                  Удалить
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {hasMore && (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-3 bg-yellow-50">
                <div className="flex items-center justify-center gap-2 text-yellow-800 text-sm">
                  <Icon name="AlertTriangle" size={14} />
                  <span>Показано {MAX_VISIBLE} из {placements.length} площадок. Используйте поиск для фильтрации остальных.</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </>
      )}
    </>
  );
}