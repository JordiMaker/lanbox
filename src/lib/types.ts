export type Word = {
  id: string;
  /** The word or phrase in the language being learned. */
  term: string;
  /** Meaning in the learner's language. Empty until the learner or AI fills it in. */
  translation: string;
  /** Leitner box: 0 = new or just failed, higher = better known. */
  box: number;
  /** Epoch ms when the word is next due for review. */
  dueAt: number;
  seen: number;
  correct: number;
};

export type Collection = {
  id: string;
  name: string;
  /** Language code of the terms (see `LANGUAGES`). */
  learningLang: string;
  /** Language code of the translations. */
  nativeLang: string;
  words: Word[];
  createdAt: number;
};

export type WordEntry = Pick<Word, 'term' | 'translation'>;
