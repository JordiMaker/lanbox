import { attemptsOf, isMastered, modeAccuracy, wordAccuracy } from './stats';
import { wordKey, type Attempt, type Origen, type Resultado, type WordRef } from './attempts';
import { MODES, type Modo } from './modes';

/** A word that can appear in a session, with its article's active modes. */
export type SessionWord = WordRef & { modos_activos: Modo[] };

export type SessionSettings = {
  /** How many words must be cleared to unlock the phone (1–20). */
  aciertos_desbloqueo: number;
};

export type SessionItem = WordRef & { modo: Modo };

export type Session = {
  origen: Origen;
  /** Head is the current exercise. */
  queue: SessionItem[];
  /** Items cleared so far; the progress bar shows done / total. */
  done: number;
  total: number;
  /** Consecutive misses per word (wordKey), for the skip safety rule. */
  misses: Record<string, number>;
};

/** After this many consecutive misses of a word, skipping it counts as passed so the user is never locked out. */
export const SKIP_PASSES_AFTER_MISSES = 3;

/**
 * Builds the session queue. `words` must already be limited to the user's
 * published articles.
 *
 * - desbloqueo: the N worst words (N = aciertos_desbloqueo; no answers = 0 %),
 *   each with its worst active mode; ties go to the mode proposed longest ago.
 * - icono: every word × active mode pair not yet mastered, worst first.
 */
export function buildSession(
  words: SessionWord[],
  attempts: Attempt[],
  settings: SessionSettings,
  origen: Origen,
): Session {
  const practicable = words.filter((w) => w.modos_activos.length > 0);
  const queue = origen === 'desbloqueo' ? unlockQueue(practicable, attempts, settings) : iconQueue(practicable, attempts);
  return { origen, queue, done: 0, total: queue.length, misses: {} };
}

function unlockQueue(words: SessionWord[], attempts: Attempt[], settings: SessionSettings): SessionItem[] {
  return sortStable(words, (w) => wordAccuracy(attempts, w))
    .slice(0, Math.max(0, settings.aciertos_desbloqueo))
    .map((word) => ({ ...toRef(word), modo: weakestMode(word, attempts) }));
}

function iconQueue(words: SessionWord[], attempts: Attempt[]): SessionItem[] {
  const pending = words.flatMap((word) =>
    orderedModes(word.modos_activos)
      .filter((modo) => !isMastered(attempts, word, modo))
      .map((modo): SessionItem => ({ ...toRef(word), modo })),
  );
  return sortStable(pending, (item) => modeAccuracy(attempts, item, item.modo));
}

/** Lowest accuracy among the active modes; ties → the mode proposed longest ago (never proposed first). */
function weakestMode(word: SessionWord, attempts: Attempt[]): Modo {
  const ranked = orderedModes(word.modos_activos).map((modo) => ({
    modo,
    accuracy: modeAccuracy(attempts, word, modo),
    lastProposed: lastProposedAt(attempts, word, modo),
  }));
  ranked.sort((a, b) => a.accuracy - b.accuracy || compareTimes(a.lastProposed, b.lastProposed));
  return ranked[0]!.modo;
}

/** Like a − b, but two "never" (−Infinity) values compare equal instead of giving NaN. */
function compareTimes(a: number, b: number): number {
  return a === b ? 0 : a - b;
}

function lastProposedAt(attempts: Attempt[], word: WordRef, modo: Modo): number {
  return attemptsOf(attempts, word, modo).reduce((latest, a) => Math.max(latest, Date.parse(a.creado_en)), -Infinity);
}

/**
 * Applies the result of the current exercise:
 * - ok: leaves the session and counts as cleared;
 * - ko: goes to the end of the queue with the same mode;
 * - skip: goes to the end too, unless the word has SKIP_PASSES_AFTER_MISSES
 *   consecutive misses, in which case it counts as cleared.
 */
export function advance(session: Session, resultado: Resultado): Session {
  const [head, ...rest] = session.queue;
  if (!head) return session;
  const key = wordKey(head);
  const misses = session.misses[key] ?? 0;

  if (resultado === 'ko') {
    return { ...session, queue: [...rest, head], misses: { ...session.misses, [key]: misses + 1 } };
  }
  if (resultado === 'skip' && misses < SKIP_PASSES_AFTER_MISSES) {
    return { ...session, queue: [...rest, head] };
  }
  const remaining = { ...session.misses };
  delete remaining[key];
  return { ...session, queue: rest, done: session.done + 1, misses: remaining };
}

/** Empty queue: "Móvil desbloqueado" (desbloqueo) or "Todo al día" (icono). */
export function isFinished(session: Session): boolean {
  return session.queue.length === 0;
}

function toRef({ articleId, frase_id, posicion }: WordRef): WordRef {
  return { articleId, frase_id, posicion };
}

/** Active modes in the canonical MODES order, so ties resolve the same way everywhere. */
function orderedModes(modes: Modo[]): Modo[] {
  return MODES.filter((modo) => modes.includes(modo));
}

/** Ascending by score; equal scores keep their input order. */
function sortStable<T>(items: T[], score: (item: T) => number): T[] {
  return items
    .map((item, index) => ({ item, index, score: score(item) }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map(({ item }) => item);
}
