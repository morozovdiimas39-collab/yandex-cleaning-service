import Icon from '@/components/ui/icon';

interface Phrase {
  phrase: string;
  count: number;
  id: string;
}

interface DraggablePhraseProps {
  phrase: Phrase;
  onRemove: () => void;
  onDragStart: (phrase: Phrase) => void;
  onDragEnd: (phrase: Phrase) => void;
  isHighlighted?: boolean;
  highlightColor?: string;
}

export default function DraggablePhrase({ 
  phrase, 
  onRemove,
  onDragStart,
  onDragEnd,
  isHighlighted,
  highlightColor
}: DraggablePhraseProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('phraseId', phrase.id);
        onDragStart(phrase);
      }}
      onDragEnd={() => onDragEnd(phrase)}
      className="px-2 py-1 border-b border-slate-200 hover:bg-slate-50 cursor-move flex items-center justify-between group"
      style={isHighlighted ? { 
        backgroundColor: highlightColor || '#FFF59D',
        borderLeft: `3px solid ${highlightColor || '#FBC02D'}`,
        fontWeight: 600
      } : {}}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Icon name="GripVertical" size={12} className="text-slate-400 flex-shrink-0" />
        <span className="truncate text-xs">{phrase.phrase}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 font-mono">{phrase.count}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
        >
          <Icon name="X" size={12} />
        </button>
      </div>
    </div>
  );
}
