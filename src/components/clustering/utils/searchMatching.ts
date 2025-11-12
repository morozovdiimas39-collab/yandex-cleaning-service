export const matchesSearch = (phrase: string, searchTerm: string, useWordForms: boolean): boolean => {
  if (!searchTerm.trim()) return false;
  return matchWithYandexOperators(phrase, searchTerm, useWordForms);
};

export const matchWithYandexOperators = (phrase: string, query: string, useWordForms: boolean): boolean => {
  const phraseLower = phrase.toLowerCase();
  const queryLower = query.toLowerCase().trim();

  const minusWords: { word: string; exact: boolean }[] = [];
  let cleanQuery = queryLower.replace(/-"([^"]+)"/g, (_, word) => {
    minusWords.push({ word, exact: true });
    return "";
  });
  cleanQuery = cleanQuery.replace(/-(\S+)/g, (_, word) => {
    minusWords.push({ word, exact: false });
    return "";
  });

  const plusWords: { word: string; exact: boolean }[] = [];
  cleanQuery = cleanQuery.replace(/\+"([^"]+)"/g, (_, word) => {
    plusWords.push({ word, exact: true });
    return "";
  });
  cleanQuery = cleanQuery.replace(/\+(\S+)/g, (_, word) => {
    plusWords.push({ word, exact: false });
    return "";
  });

  const quotedWords: string[] = [];
  cleanQuery = cleanQuery.replace(/"([^"]+)"/g, (_, word) => {
    quotedWords.push(word);
    return "";
  });

  const simpleWords = cleanQuery
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  for (const { word, exact } of minusWords) {
    if (exact) {
      const phraseWords = phraseLower.split(/\s+/);
      if (phraseWords.includes(word)) {
        return false;
      }
    } else {
      if (useWordForms) {
        if (matchesWordForm(phraseLower, word)) {
          return false;
        }
      } else {
        const phraseWords = phraseLower.split(/\s+/);
        if (phraseWords.includes(word)) {
          return false;
        }
      }
    }
  }

  for (const { word, exact } of plusWords) {
    if (exact) {
      const phraseWords = phraseLower.split(/\s+/);
      if (!phraseWords.includes(word)) {
        return false;
      }
    } else {
      if (useWordForms) {
        if (!matchesWordForm(phraseLower, word)) {
          return false;
        }
      } else {
        const phraseWords = phraseLower.split(/\s+/);
        if (!phraseWords.includes(word)) {
          return false;
        }
      }
    }
  }

  for (const quotedWord of quotedWords) {
    const phraseWords = phraseLower.split(/\s+/);
    if (!phraseWords.includes(quotedWord)) {
      return false;
    }
  }

  for (const word of simpleWords) {
    if (useWordForms) {
      if (!matchesWordForm(phraseLower, word)) {
        return false;
      }
    } else {
      const phraseWords = phraseLower.split(/\s+/);
      if (!phraseWords.includes(word)) {
        return false;
      }
    }
  }

  return true;
};

export const normalizeRoot = (word: string): string => {
  let root = word.toLowerCase().trim();

  if (root.length <= 3) return root;

  const endingsToRemove = [
    "ться",
    "тся",
    "ами",
    "ами",
    "ях",
    "ом",
    "ей",
    "ём",
    "ов",
    "ев",
    "ий",
    "ая",
    "ое",
    "ые",
    "им",
    "ым",
    "ом",
    "ем",
    "ую",
    "юю",
    "ой",
    "ей",
    "ёй",
    "ий",
    "ый",
    "ой",
    "ем",
    "им",
    "ым",
    "ом",
    "ах",
    "ях",
    "ам",
    "ям",
    "ами",
    "ями",
    "ах",
    "ях",
    "ов",
    "ев",
    "ёв",
    "ами",
    "ия",
    "ие",
    "ия",
    "ие",
    "ий",
    "ый",
    "ой",
    "ая",
    "яя",
    "ое",
    "ее",
    "ие",
    "ые",
    "ье",
    "ьё",
    "его",
    "ого",
    "ему",
    "ому",
    "им",
    "ым",
    "ом",
    "ем",
    "ём",
    "ую",
    "юю",
    "ой",
    "ей",
    "ёй",
    "ою",
    "ею",
    "ёю",
    "ами",
    "ями",
    "ах",
    "ях",
    "ов",
    "ев",
    "ёв",
    "ам",
    "ям",
    "ом",
    "ем",
    "ём",
    "ой",
    "ей",
    "ёй",
    "ою",
    "ею",
    "ёю",
    "ами",
    "ями",
    "ах",
    "ях",
  ];

  const sortedEndings = endingsToRemove.sort((a, b) => b.length - a.length);

  for (const ending of sortedEndings) {
    if (root.endsWith(ending) && root.length - ending.length >= 3) {
      root = root.slice(0, -ending.length);
      break;
    }
  }

  return root;
};

export const matchesWordForm = (phrase: string, targetWord: string): boolean => {
  const phraseLower = phrase.toLowerCase();
  const targetLower = targetWord.toLowerCase().trim();

  if (!targetLower) return false;

  const phraseWords = phraseLower.split(/\s+/);

  return phraseWords.some((word) => {
    if (word === targetLower) return true;

    const wordRoot = normalizeRoot(word);
    const targetRoot = normalizeRoot(targetLower);

    if (wordRoot === targetRoot && wordRoot.length >= 3) {
      return true;
    }

    if (wordRoot.length >= 3 && targetRoot.length >= 3) {
      const normalizedWordRoot = normalizeRoot(wordRoot);
      const normalizedTargetRoot = normalizeRoot(targetRoot);

      if (
        normalizedWordRoot === normalizedTargetRoot &&
        normalizedWordRoot.length >= 3 &&
        targetLower.length >= 5 &&
        word.length >= 5 &&
        Math.abs(word.length - targetLower.length) <= 3
      ) {
        return true;
      }
    }

    return false;
  });
};

export const matchesMinusPhrase = (phrase: string, minusPhrase: string, useWordForms: boolean): boolean => {
  const phraseLower = phrase.toLowerCase();
  const phraseWords = phraseLower.split(/\s+/);
  const minusPhraseWords = minusPhrase
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (useWordForms) {
    return minusPhraseWords.every((minusWord) => {
      if (minusWord.length <= 3) {
        return phraseWords.includes(minusWord);
      }
      return matchesWordForm(phraseLower, minusWord);
    });
  } else {
    return minusPhraseWords.every((minusWord) =>
      phraseWords.includes(minusWord)
    );
  }
};
