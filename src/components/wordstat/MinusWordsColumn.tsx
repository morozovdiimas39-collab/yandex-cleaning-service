import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface MinusWord {
  word: string;
  count: number;
}

interface MinusWordsColumnProps {
  minusWords: MinusWord[];
  minusSearchText: string;
  onMinusSearchChange: (value: string) => void;
  onCopyMinusWords: () => void;
  onRemoveMinusWord: (word: string) => void;
}

export default function MinusWordsColumn({
  minusWords,
  minusSearchText,
  onMinusSearchChange,
  onCopyMinusWords,
  onRemoveMinusWord
}: MinusWordsColumnProps) {
  return (
    <>
      <th 
        className="px-2 py-2 text-left font-bold border-r min-w-[200px] bg-red-100"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-red-700">
            <Icon name="Ban" size={12} />
            <span className="font-bold text-xs">Минус-слова</span>
          </div>
          <Input
            placeholder="Введите минус-слово..."
            value={minusSearchText}
            onChange={(e) => onMinusSearchChange(e.target.value)}
            className="h-6 text-xs"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{minusWords.length} слов</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopyMinusWords}
              className="h-5 px-1 text-[10px]"
            >
              <Icon name="Copy" size={10} className="mr-1" />
              Копировать
            </Button>
          </div>
        </div>
      </th>
      <td className="border-r align-top p-0 bg-red-50">
        <div className="min-h-[100px]">
          {minusWords.map((minusWord) => (
            <div
              key={minusWord.word}
              className="px-2 py-1 border-b border-red-200 flex items-center justify-between group hover:bg-red-100"
            >
              <span className="text-xs text-red-700 font-medium">{minusWord.word}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-red-500 font-mono">-{minusWord.count}</span>
                <button
                  onClick={() => onRemoveMinusWord(minusWord.word)}
                  className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </td>
    </>
  );
}
