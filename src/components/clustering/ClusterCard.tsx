import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";

interface Phrase {
  phrase: string;
  count: number;
  sourceCluster?: string;
  sourceColor?: string;
  isTemporary?: boolean;
  removedPhrases?: Phrase[];
  isMinusWord?: boolean;
  minusTerm?: string;
}

interface ClusterWithExtras {
  name: string;
  intent: string;
  color: string;
  icon: string;
  phrases: Phrase[];
  bgColor: string;
  searchText: string;
  hovering: boolean;
}

interface ClusterCardProps {
  cluster: ClusterWithExtras;
  index: number;
  searchText: string;
  filteredPhrases: Phrase[];
  isDragging: boolean;
  quickMinusMode: boolean;
  onSearchChange: (index: number, value: string) => void;
  onConfirmSearch: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetIndex: number) => void;
  onMouseEnter: (index: number) => void;
  onMouseLeave: (index: number) => void;
  onRenameCluster: (index: number) => void;
  onDeleteCluster: (index: number) => void;
  onPhraseDragStart: (clusterIdx: number, phraseIdx: number) => void;
  onPhraseDragEnd: () => void;
  onPhraseClick: (clusterIdx: number, phrase: Phrase, phraseIdx: number) => void;
  onAddToMinus: (phrase: Phrase, clusterIdx: number, phraseIdx: number) => void;
  onUndoMinusWord: (clusterIdx: number, phraseIdx: number) => void;
}

export default function ClusterCard({
  cluster,
  index,
  searchText,
  filteredPhrases,
  isDragging,
  quickMinusMode,
  onSearchChange,
  onConfirmSearch,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onMouseEnter,
  onMouseLeave,
  onRenameCluster,
  onDeleteCluster,
  onPhraseDragStart,
  onPhraseDragEnd,
  onPhraseClick,
  onAddToMinus,
  onUndoMinusWord,
}: ClusterCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent, clusterIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onConfirmSearch(clusterIndex);
    }
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={() => onDrop(index)}
      onMouseEnter={() => onMouseEnter(index)}
      onMouseLeave={() => onMouseLeave(index)}
      style={{
        backgroundColor: cluster.bgColor,
        opacity: isDragging ? 0.4 : 1,
        border: cluster.hovering ? "2px dashed #2563eb" : "1px solid #e5e7eb",
      }}
      className="rounded-lg p-4 cursor-move transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name={cluster.icon} size={20} />
          <h3 className="font-medium">{cluster.name}</h3>
          <span className="text-sm text-gray-500">
            ({cluster.phrases.filter((p) => !p.isTemporary).length})
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRenameCluster(index)}
          >
            <Icon name="Pencil" size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteCluster(index)}
          >
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <Input
          placeholder="Поиск или перемещение фраз..."
          value={searchText}
          onChange={(e) => onSearchChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="text-sm"
        />
        {searchText && (
          <Button size="sm" onClick={() => onConfirmSearch(index)}>
            <Icon name="Check" size={16} />
          </Button>
        )}
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto">
        {filteredPhrases.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            Кластер пуст
          </p>
        ) : (
          filteredPhrases.map((phrase, phraseIdx) => {
            const isMinusConfirmed =
              phrase.isMinusWord && phrase.minusTerm === undefined;

            return (
              <div
                key={phraseIdx}
                draggable={!phrase.isTemporary && !isMinusConfirmed}
                onDragStart={() => {
                  if (!phrase.isTemporary && !isMinusConfirmed) {
                    onPhraseDragStart(index, phraseIdx);
                  }
                }}
                onDragEnd={onPhraseDragEnd}
                onClick={() => {
                  if (!phrase.isTemporary) {
                    onPhraseClick(index, phrase, phraseIdx);
                  }
                }}
                style={{
                  backgroundColor: phrase.isTemporary
                    ? phrase.sourceColor
                    : isMinusConfirmed
                      ? "#fee"
                      : phrase.isMinusWord
                        ? "#ffeeee"
                        : "#fff",
                  cursor: phrase.isTemporary
                    ? "default"
                    : isMinusConfirmed
                      ? "default"
                      : "move",
                  opacity: isMinusConfirmed ? 0.4 : 1,
                }}
                className="flex items-center justify-between p-2 rounded text-sm group hover:shadow-sm"
              >
                <span className="flex-1">
                  {phrase.phrase}{" "}
                  <span className="text-gray-400 text-xs">
                    ({phrase.count})
                  </span>
                </span>

                {phrase.isTemporary && (
                  <span className="text-xs text-gray-500 italic ml-2">
                    из {phrase.sourceCluster}
                  </span>
                )}

                {!phrase.isTemporary && phrase.isMinusWord && (
                  <>
                    {phrase.minusTerm ? (
                      <span className="text-xs text-red-600 ml-2">
                        минус: {phrase.minusTerm}
                      </span>
                    ) : (
                      <span className="text-xs text-red-600 ml-2 font-medium">
                        ✓ исключена
                      </span>
                    )}
                  </>
                )}

                {!phrase.isTemporary && !isMinusConfirmed && (
                  <div
                    className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {phrase.isMinusWord ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUndoMinusWord(index, phraseIdx);
                        }}
                        className="h-6 px-2"
                      >
                        <Icon name="Undo" size={14} />
                      </Button>
                    ) : (
                      quickMinusMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToMinus(phrase, index, phraseIdx);
                          }}
                          className="h-6 px-2 text-red-600 hover:text-red-700"
                        >
                          <Icon name="Minus" size={14} />
                        </Button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
