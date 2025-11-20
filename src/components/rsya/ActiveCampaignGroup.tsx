import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Placement {
  id: string;
  domain: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  campaign_id: string;
  campaign_name?: string;
}

interface ActiveCampaignGroupProps {
  campaignId: string;
  campaignName: string;
  placements: Placement[];
  selectedPlacements: Set<string>;
  markedForBlock: Set<string>;
  onToggleSelection: (placementId: string, checked: boolean) => void;
  canBlockDomain?: (domain: string) => boolean;
}

export default function ActiveCampaignGroup({
  campaignId,
  campaignName,
  placements,
  selectedPlacements,
  markedForBlock,
  onToggleSelection,
  canBlockDomain
}: ActiveCampaignGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_VISIBLE = 100;

  const visiblePlacements = placements.slice(0, MAX_VISIBLE);
  const hasMore = placements.length > MAX_VISIBLE;

  const allSelected = placements.every(p => selectedPlacements.has(p.id));
  const someSelected = placements.some(p => selectedPlacements.has(p.id));

  const toggleAll = (checked: boolean) => {
    placements.forEach(p => onToggleSelection(p.id, checked));
  };

  const campaignTotals = placements.reduce((acc, p) => ({
    impressions: acc.impressions + p.impressions,
    clicks: acc.clicks + p.clicks,
    cost: acc.cost + p.cost,
    conversions: acc.conversions + p.conversions
  }), { impressions: 0, clicks: 0, cost: 0, conversions: 0 });

  const campaignCTR = campaignTotals.impressions > 0 ? (campaignTotals.clicks / campaignTotals.impressions) * 100 : 0;
  const campaignCPC = campaignTotals.clicks > 0 ? campaignTotals.cost / campaignTotals.clicks : 0;
  const campaignCPA = campaignTotals.conversions > 0 ? campaignTotals.cost / campaignTotals.conversions : 0;

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
        <TableCell>
          <div className="flex items-center gap-2 font-medium">
            <Icon 
              name={isExpanded ? "ChevronDown" : "ChevronRight"} 
              size={16} 
              className="text-muted-foreground" 
            />
            <Icon name="FolderOpen" size={16} className="text-green-500" />
            <span>{campaignName || `Кампания ${campaignId}`}</span>
            <Badge variant="secondary" className="ml-2">
              {placements.length} площадок
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-right font-medium">{campaignTotals.impressions.toLocaleString()}</TableCell>
        <TableCell className="text-right font-medium">{campaignTotals.clicks.toLocaleString()}</TableCell>
        <TableCell className="text-right font-medium">{campaignTotals.conversions}</TableCell>
        <TableCell className="text-right font-medium">{campaignTotals.cost.toFixed(2)}₽</TableCell>
        <TableCell className="text-right font-medium">{campaignCTR.toFixed(2)}%</TableCell>
        <TableCell className="text-right font-medium">{campaignCPC.toFixed(2)}₽</TableCell>
        <TableCell className="text-right font-medium">
          {campaignTotals.conversions > 0 ? `${campaignCPA.toFixed(2)}₽` : '—'}
        </TableCell>
      </TableRow>

      {isExpanded && (
        <>
          {visiblePlacements.map(placement => {
            const isMarked = markedForBlock.has(placement.id);
            const isProtected = canBlockDomain && !canBlockDomain(placement.domain);
            return (
              <TableRow 
                key={placement.id} 
                className={`hover:bg-muted/50 ${isMarked ? 'bg-red-50' : ''} ${isProtected ? 'bg-blue-50/30' : ''}`}
              >
                <TableCell className="w-12 pl-8" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedPlacements.has(placement.id)}
                    onCheckedChange={(checked) => onToggleSelection(placement.id, !!checked)}
                    disabled={isProtected}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2 pl-6">
                    {isProtected ? (
                      <Icon name="Shield" size={14} className="text-blue-500 flex-shrink-0" />
                    ) : isMarked ? (
                      <Icon name="Ban" size={14} className="text-red-500 flex-shrink-0" />
                    ) : (
                      <Icon name="CircleCheck" size={14} className="text-green-500 flex-shrink-0" />
                    )}
                    <span className={`truncate text-sm ${isMarked ? 'line-through text-red-600' : ''} ${isProtected ? 'text-blue-600' : ''}`}>
                      {placement.domain}
                    </span>
                    {isMarked && !isProtected && (
                      <Badge variant="destructive" className="text-xs ml-2">
                        Будет заблокирована
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className={`text-right text-sm ${isMarked ? 'text-red-600' : ''}`}>
                  {placement.impressions.toLocaleString()}
                </TableCell>
                <TableCell className={`text-right text-sm ${isMarked ? 'text-red-600' : ''}`}>
                  {placement.clicks.toLocaleString()}
                </TableCell>
                <TableCell className={`text-right text-sm ${isMarked ? 'text-red-600' : ''}`}>
                  {placement.conversions}
                </TableCell>
                <TableCell className={`text-right text-sm ${isMarked ? 'text-red-600' : ''}`}>
                  {placement.cost.toFixed(2)}₽
                </TableCell>
                <TableCell className={`text-right text-sm ${isMarked ? 'text-red-600' : ''}`}>
                  {placement.ctr.toFixed(2)}%
                </TableCell>
                <TableCell className={`text-right text-sm ${isMarked ? 'text-red-600' : ''}`}>
                  {placement.cpc.toFixed(2)}₽
                </TableCell>
                <TableCell className={`text-right text-sm ${isMarked ? 'text-red-600' : ''}`}>
                  {placement.conversions > 0 ? `${placement.cpa.toFixed(2)}₽` : '—'}
                </TableCell>
              </TableRow>
            );
          })}
          {hasMore && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-3 bg-yellow-50">
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