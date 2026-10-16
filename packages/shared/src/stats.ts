import { byTime, isSameWord, type Attempt, type WordRef } from './attempts';
import type { Exercises } from './exercises/schema';
import type { Modo } from './modes';

export type LastResult = 'ok' | 'ko' | 'none';

const LAST_COUNT = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Attempts of one word, optionally of one mode. */
export function attemptsOf(attempts: Attempt[], word: WordRef, modo?: Modo): Attempt[] {
  return attempts.filter((a) => isSameWord(a, word) && (modo === undefined || a.modo === modo));
}

/** ok / (ok + ko) as a percentage (0–100, unrounded). Skips don't count; no answers count as 0 %. */
export function accuracy(attempts: Attempt[]): number {
  let ok = 0;
  let ko = 0;
  for (const a of attempts) {
    if (a.resultado === 'ok') ok++;
    else if (a.resultado === 'ko') ko++;
  }
  return ok + ko === 0 ? 0 : (ok / (ok + ko)) * 100;
}

export function wordAccuracy(attempts: Attempt[], word: WordRef): number {
  return accuracy(attemptsOf(attempts, word));
}

export function modeAccuracy(attempts: Attempt[], word: WordRef, modo: Modo): number {
  return accuracy(attemptsOf(attempts, word, modo));
}

export type AttemptSummary = { attempts: number; skips: number; averageMs: number };

/** Counts and average answer time of a set of attempts (usually one word's). */
export function summarize(attempts: Attempt[]): AttemptSummary {
  const skips = attempts.filter((a) => a.resultado === 'skip').length;
  const totalMs = attempts.reduce((sum, a) => sum + a.ms, 0);
  return {
    attempts: attempts.length,
    skips,
    averageMs: attempts.length === 0 ? 0 : totalMs / attempts.length,
  };
}

/**
 * The 4 most recent ok/ko results, oldest first so the most recent is on the
 * right; padded on the left with "none" (not proposed yet).
 */
export function lastFour(attempts: Attempt[], word: WordRef, modo?: Modo): LastResult[] {
  const results = attemptsOf(attempts, word, modo)
    .filter((a) => a.resultado !== 'skip')
    .sort(byTime)
    .slice(-LAST_COUNT)
    .map((a): LastResult => (a.resultado === 'ok' ? 'ok' : 'ko'));
  return [...Array<LastResult>(LAST_COUNT - results.length).fill('none'), ...results];
}

/** A word × mode pair is mastered when its last 4 results are all ok. */
export function isMastered(attempts: Attempt[], word: WordRef, modo: Modo): boolean {
  return lastFour(attempts, word, modo).every((r) => r === 'ok');
}

export type FrequentError = WordRef & { silaba: string; motivo?: string; count: number };

/**
 * The most repeated wrong syllables picked in pronunciation exercises, with
 * the reason stored for that distractor in the article's exercises JSON.
 */
export function topErrors(
  attempts: Attempt[],
  exercisesByArticle: Record<string, Exercises>,
  limit = 3,
): FrequentError[] {
  const counts = new Map<string, FrequentError>();
  for (const a of attempts) {
    if (a.resultado !== 'ko' || !a.silaba_elegida) continue;
    const key = `${a.articleId}:${a.frase_id}:${a.posicion}:${a.silaba_elegida}`;
    const entry = counts.get(key);
    if (entry) {
      entry.count++;
    } else {
      counts.set(key, {
        articleId: a.articleId,
        frase_id: a.frase_id,
        posicion: a.posicion,
        silaba: a.silaba_elegida,
        motivo: findReason(exercisesByArticle[a.articleId], a, a.silaba_elegida),
        count: 1,
      });
    }
  }
  return [...counts.values()]
    .sort((x, y) => y.count - x.count || x.silaba.localeCompare(y.silaba))
    .slice(0, limit);
}

function findReason(exercises: Exercises | undefined, word: WordRef, silaba: string): string | undefined {
  const frase = exercises?.frases.find((f) => f.id === word.frase_id);
  const palabra = frase?.palabras.find((p) => p.posicion === word.posicion);
  return palabra?.distractores.find((d) => d.silaba === silaba)?.motivo;
}

export type DailyGames = { date: string; count: number };

/**
 * Finished sessions per day for the last 7 days, oldest first, ending today.
 * Days are UTC calendar days (YYYY-MM-DD).
 */
export function gamesLast7Days(finishedSessionTimes: string[], now: Date): DailyGames[] {
  const days = Array.from({ length: 7 }, (_, i) => utcDay(new Date(now.getTime() - (6 - i) * DAY_MS)));
  const counts = new Map(days.map((day) => [day, 0]));
  for (const time of finishedSessionTimes) {
    const day = utcDay(new Date(time));
    const current = counts.get(day);
    if (current !== undefined) counts.set(day, current + 1);
  }
  return days.map((date) => ({ date, count: counts.get(date) ?? 0 }));
}

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
