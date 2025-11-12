import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import DraggablePhrase from './DraggablePhrase';

interface Phrase {
  phrase: string;
  count: number;
  id: string;
}

interface Cluster {
  id: string;
  cluster_name: string;
  phrases: Phrase[];
  color: string;
  searchText: string;
  highlightedPhrases?: Set<string>;
}

interface ClusterColumnProps {
  cluster: Cluster;
  clusterIndex: number;
  dragOverCluster: string | null;
  onSearchChange: (clusterIndex: number, value: string) => void;
  onMoveHighlighted: (clusterIndex: number) => void;
  onRenameCluster: (clusterIndex: number, newName: string) => void;
  onDeleteCluster: (clusterIndex: number) => void;
  onCopyPhrases: (clusterIndex: number) => void;
  onRemovePhrase: (clusterIndex: number, phraseId: string) => void;
  onDragStart: (phrase: Phrase) => void;
  onDragEnd: (phrase: Phrase) => void;
  onDragOver: (clusterId: string) => void;
  onDragLeave: () => void;
  onDrop: (clusterId: string, phraseId: string) => void;
  onClusterClick?: (clusterId: string) => void;
  isInSubClusterMode?: boolean;
}

export default function ClusterColumn({
  cluster,
  clusterIndex,
  dragOverCluster,
  onSearchChange,
  onMoveHighlighted,
  onRenameCluster,
  onDeleteCluster,
  onCopyPhrases,
  onRemovePhrase,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onClusterClick,
  isInSubClusterMode
}: ClusterColumnProps) {
  return (
    <>
      <th 
        className="px-2 py-2 text-left font-bold text-slate-700 border-r min-w-[200px] relative"
        style={{ backgroundColor: cluster.color }}
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            {isInSubClusterMode ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClusterClick?.('back');
                  }}
                  className="text-slate-600 hover:text-slate-800 p-1 hover:bg-slate-200 rounded"
                  title="Назад к списку"
                >
                  <Icon name="ArrowLeft" size={14} />
                </button>
                <Input
                  value={cluster.cluster_name}
                  onChange={(e) => onRenameCluster(clusterIndex, e.target.value)}
                  className="h-6 text-xs font-bold border-none bg-transparent p-0 flex-1"
                />
              </div>
            ) : (
              <>
                <Input
                  value={cluster.cluster_name}
                  onChange={(e) => onRenameCluster(clusterIndex, e.target.value)}
                  className="h-6 text-xs font-bold border-none bg-transparent p-0"
                />
                <div className="flex items-center gap-1 shrink-0">
                  {onClusterClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClusterClick(cluster.id);
                      }}
                      className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-100 rounded"
                      title="Открыть сегмент"
                    >
                      <Icon name="FolderOpen" size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCluster(clusterIndex);
                    }}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded"
                    title="Удалить сегмент"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-1">
            <Input
              placeholder="Найти фразы..."
              value={cluster.searchText}
              onChange={(e) => onSearchChange(clusterIndex, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onMoveHighlighted(clusterIndex);
                }
              }}
              className="h-6 text-xs flex-1"
            />
            {cluster.searchText && (
              <Button
                size="sm"
                onClick={() => onMoveHighlighted(clusterIndex)}
                className="h-6 px-2"
                title="Перенести найденные фразы"
              >
                <Icon name="ArrowDown" size={12} />
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {cluster.phrases.length} фраз
              {cluster.highlightedPhrases && cluster.highlightedPhrases.size > 0 && (
                <span className="ml-1 text-blue-600 font-bold">
                  ({cluster.highlightedPhrases.size} найдено)
                </span>
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyPhrases(clusterIndex)}
              className="h-5 px-1 text-[10px]"
            >
              <Icon name="Copy" size={10} className="mr-1" />
              Копировать
            </Button>
          </div>
        </div>
      </th>
      <td 
        className="border-r align-top p-0 relative"
        style={{ backgroundColor: `${cluster.color}30`, height: 'calc(100vh - 250px)' }}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(cluster.id);
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          const phraseId = e.dataTransfer.getData('phraseId');
          if (phraseId) onDrop(cluster.id, phraseId);
        }}
      >
        {dragOverCluster === cluster.id && (
          <div className="absolute inset-0 bg-blue-200 opacity-30 pointer-events-none z-10" />
        )}
        <div className="min-h-full overflow-y-auto">
          {cluster.phrases.map((phrase) => {
            const isHighlighted = cluster.highlightedPhrases?.has(phrase.phrase) || false;
            return (
              <DraggablePhrase
                key={phrase.id}
                phrase={phrase}
                onRemove={() => onRemovePhrase(clusterIndex, phrase.id)}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isHighlighted={isHighlighted}
                highlightColor={cluster.color}
              />
            );
          })}
        </div>
      </td>
    </>
  );
}