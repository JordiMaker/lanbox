import { describe, expect, it } from 'vitest';

import {
  accuracy,
  gamesLast7Days,
  isMastered,
  lastFour,
  summarize,
  topErrors,
  wordAccuracy,
  type Attempt,
} from '../src';
import { THIS_SHIP } from './fixtures/exercises';

const very = { articleId: 'this-ship', frase_id: 1, posicion: 4 };

let minute = 0;
function attempt(resultado: Attempt['resultado'], extra: Partial<Attempt> = {}): Attempt {
  return {
    ...very,
    modo: 'ORIG_PRON',
    resultado,
    ms: 2000,
    creado_en: new Date(Date.UTC(2026, 9, 1, 9, minute++)).toISOString(),
    origen: 'icono',
    ...extra,
  };
}

describe('accuracy', () => {
  it('is ok / (ok + ko) and ignores skips', () => {
    expect(accuracy([attempt('ok'), attempt('ko'), attempt('skip'), attempt('ok')])).toBeCloseTo(66.67, 2);
  });

  it('is 0 % with no answers', () => {
    expect(accuracy([])).toBe(0);
    expect(wordAccuracy([attempt('skip')], very)).toBe(0);
  });

  it('only counts the given word', () => {
    expect(wordAccuracy([attempt('ok'), attempt('ko', { posicion: 1 })], very)).toBe(100);
  });
});

describe('summarize', () => {
  it('counts attempts and skips and averages the time', () => {
    expect(summarize([attempt('ok', { ms: 1000 }), attempt('skip', { ms: 3000 })])).toEqual({
      attempts: 2,
      skips: 1,
      averageMs: 2000,
    });
    expect(summarize([])).toEqual({ attempts: 0, skips: 0, averageMs: 0 });
  });
});

describe('lastFour and isMastered', () => {
  it('pads with "none" on the left and puts the most recent on the right, ignoring skips', () => {
    const history = [attempt('ko'), attempt('skip'), attempt('ok')];
    expect(lastFour(history, very)).toEqual(['none', 'none', 'ko', 'ok']);
  });

  it('keeps only the 4 most recent results, whatever the input order', () => {
    const history = [attempt('ko'), attempt('ok'), attempt('ok'), attempt('ko'), attempt('ok')].reverse();
    expect(lastFour(history, very)).toEqual(['ok', 'ok', 'ko', 'ok']);
  });

  it('is mastered only with 4 hits in a row in that mode', () => {
    const fourHits = [attempt('ko'), attempt('ok'), attempt('ok'), attempt('ok'), attempt('ok')];
    expect(isMastered(fourHits, very, 'ORIG_PRON')).toBe(true);
    expect(isMastered(fourHits, very, 'TRAD_PRON')).toBe(false);
    expect(isMastered(fourHits.slice(2), very, 'ORIG_PRON')).toBe(false);
  });
});

describe('topErrors', () => {
  it('returns the 3 most repeated wrong syllables with their reason', () => {
    const picked = (silaba: string) => attempt('ko', { silaba_elegida: silaba });
    const history = [
      picked('bɛ'),
      picked('bɛ'),
      picked('bɛ'),
      picked('ri'),
      picked('ri'),
      picked('fɛ'),
      picked('fɛ'),
      picked('be'),
      attempt('ok', { silaba_elegida: 'vɛ' }),
    ];
    expect(topErrors(history, { 'this-ship': THIS_SHIP })).toEqual([
      { ...very, silaba: 'bɛ', motivo: 'v → b (en español b y v suenan igual)', count: 3 },
      { ...very, silaba: 'fɛ', motivo: 'v → f (se ensordece la v)', count: 2 },
      { ...very, silaba: 'ri', motivo: 'ɹ → r (se usa la r vibrante española)', count: 2 },
    ]);
  });
});

describe('gamesLast7Days', () => {
  it('counts finished sessions per day for the last 7 days, ending today', () => {
    const now = new Date('2026-10-16T12:00:00Z');
    const finished = [
      '2026-10-16T08:00:00Z',
      '2026-10-16T21:30:00Z',
      '2026-10-12T10:00:00Z',
      '2026-10-10T00:05:00Z',
      '2026-10-09T23:59:00Z',
    ];
    expect(gamesLast7Days(finished, now)).toEqual([
      { date: '2026-10-10', count: 1 },
      { date: '2026-10-11', count: 0 },
      { date: '2026-10-12', count: 1 },
      { date: '2026-10-13', count: 0 },
      { date: '2026-10-14', count: 0 },
      { date: '2026-10-15', count: 0 },
      { date: '2026-10-16', count: 2 },
    ]);
  });
});
