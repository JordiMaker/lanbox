import type { Word } from './types';

const DAY = 24 * 60 * 60 * 1000;

/** Review interval per Leitner box. A failed word drops to box 0 and is due again at once. */
const BOX_INTERVALS = [0, 1, 2, 4, 8, 16].map((days) => days * DAY);
export const MAX_BOX = BOX_INTERVALS.length - 1;
export const LEARNED_BOX = 3;

export function review(word: Word, correct: boolean, now = Date.now()): Word {
  const box = correct ? Math.min(word.box + 1, MAX_BOX) : 0;
  return {
    ...word,
    box,
    dueAt: now + BOX_INTERVALS[box],
    seen: word.seen + 1,
    correct: word.correct + (correct ? 1 : 0),
  };
}

/** Words can only be exercised once they have a translation. */
export function isPracticable(word: Word) {
  return word.translation.length > 0;
}

export function isDue(word: Word, now = Date.now()) {
  return isPracticable(word) && word.dueAt <= now;
}

export function isLearned(word: Word) {
  return word.box >= LEARNED_BOX;
}

/** Due words first, then the least known ones; ties are shuffled. */
export function pickForReview<T extends { word: Word }>(items: T[], count: number, now = Date.now()): T[] {
  return items
    .filter((item) => isPracticable(item.word))
    .map((item) => ({ item, rank: [isDue(item.word, now) ? 0 : 1, item.word.box, Math.random()] }))
    .sort((a, b) => a.rank[0] - b.rank[0] || a.rank[1] - b.rank[1] || a.rank[2] - b.rank[2])
    .slice(0, count)
    .map(({ item }) => item);
}
