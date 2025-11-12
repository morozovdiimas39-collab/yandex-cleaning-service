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

export const matchWithYandexOperators = (phrase: string, query: string): boolean => {
  const phraseLower = phrase.toLowerCase();
  const queryLower = query.toLowerCase().trim();

  if (queryLower.startsWith('"') && queryLower.endsWith('"')) {
    const quotedText = queryLower.slice(1, -1).trim();
    const queryWords = quotedText.split(/\s+/).filter((w) => w.length > 0);
    const phraseWords = phraseLower.split(/\s+/).filter((w) => w.length > 0);

    const allWordsPresent = queryWords.every((qw) =>
      phraseWords.includes(qw),
    );
    const noExtraWords = phraseWords.every((pw) => queryWords.includes(pw));

    return allWordsPresent && noExtraWords;
  }

  if (queryLower.startsWith("[") && queryLower.endsWith("]")) {
    const bracketText = queryLower.slice(1, -1).trim();
    const queryWords = bracketText.split(/\s+/).filter((w) => w.length > 0);
    const phraseWords = phraseLower.split(/\s+/).filter((w) => w.length > 0);

    for (let i = 0; i <= phraseWords.length - queryWords.length; i++) {
      let match = true;
      for (let j = 0; j < queryWords.length; j++) {
        if (phraseWords[i + j] !== queryWords[j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  }

  const exactFormMatches = queryLower.matchAll(/!([а-яёa-z]+)/gi);
  const exactWords = Array.from(exactFormMatches, (m) => m[1].toLowerCase());

  if (exactWords.length > 0) {
    const phraseWords = phraseLower.split(/\s+/).filter((w) => w.length > 0);

    for (const exactWord of exactWords) {
      if (!phraseWords.includes(exactWord)) {
        return false;
      }
    }

    const queryWithoutExact = queryLower.replace(/!([а-яёa-z]+)/gi, "$1");
    const remainingWords = queryWithoutExact
      .split(/\s+/)
      .filter((w) => w.length > 0 && !w.startsWith("!"));

    return remainingWords.every((word) => phraseLower.includes(word));
  }

  const stopWordMatches = queryLower.matchAll(/\+([а-яёa-z]+)/gi);
  const stopWords = Array.from(stopWordMatches, (m) => m[1].toLowerCase());

  if (stopWords.length > 0) {
    const phraseWords = phraseLower.split(/\s+/).filter((w) => w.length > 0);

    for (const stopWord of stopWords) {
      if (!phraseWords.includes(stopWord)) {
        return false;
      }
    }

    const queryWithoutStop = queryLower.replace(/\+([а-яёa-z]+)/gi, "$1");
    const remainingWords = queryWithoutStop
      .split(/\s+/)
      .filter((w) => w.length > 0 && !w.startsWith("+"));

    return remainingWords.every((word) => phraseLower.includes(word));
  }

  const words = queryLower.split(/\s+/).filter((w) => w.length > 0);
  return words.every((word) => phraseLower.includes(word));
};

export const sortPhrases = (phrases: Phrase[]) => {
  return phrases.sort((a, b) => {
    const aIsMinusConfirmed = a.isMinusWord && a.minusTerm === undefined;
    const bIsMinusConfirmed = b.isMinusWord && b.minusTerm === undefined;

    if (aIsMinusConfirmed && !bIsMinusConfirmed) return 1;
    if (!aIsMinusConfirmed && bIsMinusConfirmed) return -1;

    return b.count - a.count;
  });
};
