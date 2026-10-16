import { pickForReview } from './srs';
import type { Collection, Word } from './types';

export type ExerciseKind = 'choose-translation' | 'choose-term' | 'type-term' | 'listen';

export type Exercise = {
  kind: ExerciseKind;
  collectionId: string;
  learningLang: string;
  word: Word;
  /** What the learner must produce or pick. */
  answer: string;
  /** Present for multiple-choice kinds; includes `answer`. */
  options?: string[];
};

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;

// Rotated so a session mixes recognition, recall and listening.
const KIND_ROTATION: ExerciseKind[] = ['choose-translation', 'choose-term', 'listen', 'type-term'];

export function buildSession(collections: Collection[], count: number): Exercise[] {
  const items = collections.flatMap((collection) => collection.words.map((word) => ({ word, collection })));
  const offset = Math.floor(Math.random() * KIND_ROTATION.length);
  return pickForReview(items, count).map(({ word, collection }, i) =>
    buildExercise(word, collection, KIND_ROTATION[(offset + i) % KIND_ROTATION.length]),
  );
}

function buildExercise(word: Word, collection: Collection, kind: ExerciseKind): Exercise {
  const base = { collectionId: collection.id, learningLang: collection.learningLang, word };

  if (kind === 'type-term') {
    return { ...base, kind, answer: word.term };
  }

  const field = kind === 'choose-translation' ? 'translation' : 'term';
  const answer = word[field];
  const options = pickOptions(answer, collection.words.map((w) => w[field]));
  if (options.length < MIN_OPTIONS) {
    // Not enough distinct words in the collection for multiple choice.
    return { ...base, kind: 'type-term', answer: word.term };
  }
  return { ...base, kind, answer, options };
}

function pickOptions(answer: string, candidates: string[]): string[] {
  const used = new Set([normalize(answer)]);
  const distractors: string[] = [];
  for (const candidate of shuffle(candidates)) {
    const key = normalize(candidate);
    if (!key || used.has(key)) continue;
    used.add(key);
    distractors.push(candidate);
    if (distractors.length === MAX_OPTIONS - 1) break;
  }
  return shuffle([answer, ...distractors]);
}

/** The same exercise, options reshuffled, for a missed word to come back later in the session. */
export function retryOf(exercise: Exercise): Exercise {
  return { ...exercise, options: exercise.options && shuffle(exercise.options) };
}

export type Verdict = { correct: boolean; note?: string };

export function checkAnswer(exercise: Exercise, given: string): Verdict {
  if (exercise.options) {
    return { correct: given === exercise.answer };
  }
  const expected = normalize(exercise.answer);
  const actual = normalize(given);
  if (actual === expected) return { correct: true };
  if (stripAccents(actual) === stripAccents(expected)) {
    return { correct: true, note: `Watch the accents: ${exercise.answer}` };
  }
  return { correct: false };
}

function normalize(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[¡¿]+|[.!?¡¿]+$/g, '');
}

function stripAccents(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
