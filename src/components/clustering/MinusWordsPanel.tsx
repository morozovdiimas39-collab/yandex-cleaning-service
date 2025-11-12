import { useState } from "react";
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

interface MinusWordsPanelProps {
  minusWords: Phrase[];
  searchText: string;
  editingIndex: number | null;
  editingText: string;
  onSearchChange: (value: string) => void;
  onStartEdit: (index: number, text: string) => void;
  onEditTextChange: (value: string) => void;
  onSaveEdit: (index: number) => void;
  onCancelEdit: () => void;
  onDelete: (index: number) => void;
  onAddManual: () => void;
}

export default function MinusWordsPanel({
  minusWords,
  searchText,
  editingIndex,
  editingText,
  onSearchChange,
  onStartEdit,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onAddManual,
}: MinusWordsPanelProps) {
  const filteredMinusWords = minusWords.filter((mw) =>
    mw.phrase.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="rounded-lg border p-4 bg-red-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="Ban" size={20} className="text-red-600" />
          <h3 className="font-medium text-red-900">Минус-слова</h3>
          <span className="text-sm text-red-700">({minusWords.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddManual}
          className="text-red-600 hover:text-red-700"
        >
          <Icon name="Plus" size={16} />
        </Button>
      </div>

      <div className="mb-3">
        <Input
          placeholder="Поиск минус-слов..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto">
        {filteredMinusWords.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            Минус-слова отсутствуют
          </p>
        ) : (
          filteredMinusWords.map((mw, idx) => {
            const globalIdx = minusWords.findIndex((m) => m.phrase === mw.phrase);

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded text-sm bg-white group hover:shadow-sm"
              >
                {editingIndex === globalIdx ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editingText}
                      onChange={(e) => onEditTextChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onSaveEdit(globalIdx);
                        } else if (e.key === "Escape") {
                          onCancelEdit();
                        }
                      }}
                      className="text-sm h-7"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSaveEdit(globalIdx)}
                      className="h-7 px-2"
                    >
                      <Icon name="Check" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCancelEdit}
                      className="h-7 px-2"
                    >
                      <Icon name="X" size={14} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-red-900">{mw.phrase}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStartEdit(globalIdx, mw.phrase)}
                        className="h-6 px-2"
                      >
                        <Icon name="Pencil" size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(globalIdx)}
                        className="h-6 px-2 text-red-600 hover:text-red-700"
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
