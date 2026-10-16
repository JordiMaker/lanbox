import { describe, expect, it } from 'vitest';

import {
  SKIP_PASSES_AFTER_MISSES,
  advance,
  buildSession,
  isFinished,
  modeAccuracy,
  type Attempt,
  type Session,
  type SessionWord,
} from '../src';
import { ARTICLE_ID, WORDS, artboardAttempts, nameOf } from './fixtures/session-logic';

const attempts = artboardAttempts();
const label = (s: Session) => s.queue.map((item) => `${nameOf(item.posicion)} ${item.modo}`);

describe('buildSession — "Sesión · lógica" artboard', () => {
  it('on unlock with 3 hits picks very, ship and This, all in Traducción → Pronunciación', () => {
    const session = buildSession(WORDS, attempts, { aciertos_desbloqueo: 3 }, 'desbloqueo');
    expect(label(session)).toEqual(['very TRAD_PRON', 'ship TRAD_PRON', 'This TRAD_PRON']);
    expect(session).toMatchObject({ origen: 'desbloqueo', done: 0, total: 3 });
  });

  it('from the icon queues the 14 pairs not yet mastered, worst first', () => {
    const session = buildSession(WORDS, attempts, { aciertos_desbloqueo: 3 }, 'icono');
    expect(session.total).toBe(14);
    expect(label(session)).toEqual([
      'very TRAD_PRON',
      'very ORIG_PRON',
      'ship TRAD_PRON',
      'ship ORIG_PRON',
      'This TRAD_PRON',
      'cheap ORIG_PRON',
      'This ORIG_PRON',
      'cheap TRAD_PRON',
      'This TRAD_ORIG',
      'is ORIG_PRON',
      'ship ORIG_TRAD',
      'cheap ORIG_TRAD',
      'very TRAD_ORIG',
      'is TRAD_PRON',
    ]);
    const accuracies = session.queue.map((item) => modeAccuracy(attempts, item, item.modo));
    expect(accuracies).toEqual([...accuracies].sort((a, b) => a - b));
  });
});

describe('buildSession — rules', () => {
  const word = (posicion: number, modos_activos: SessionWord['modos_activos']): SessionWord => ({
    articleId: 'a',
    frase_id: 1,
    posicion,
    modos_activos,
  });
  const attempt = (posicion: number, modo: Attempt['modo'], resultado: Attempt['resultado'], minute: number): Attempt => ({
    articleId: 'a',
    frase_id: 1,
    posicion,
    modo,
    resultado,
    ms: 1000,
    creado_en: new Date(Date.UTC(2026, 9, 1, 9, minute)).toISOString(),
    origen: 'desbloqueo',
  });

  it('counts a word without attempts as 0 % and takes N words', () => {
    const words = [word(1, ['TRAD_ORIG']), word(2, ['TRAD_ORIG']), word(3, ['TRAD_ORIG'])];
    const history = [attempt(1, 'TRAD_ORIG', 'ok', 1), attempt(3, 'TRAD_ORIG', 'ko', 2), attempt(3, 'TRAD_ORIG', 'ok', 3)];
    const session = buildSession(words, history, { aciertos_desbloqueo: 2 }, 'desbloqueo');
    expect(session.queue.map((i) => i.posicion)).toEqual([2, 3]);
  });

  it('breaks a mode tie by the mode proposed longest ago', () => {
    const words = [word(1, ['TRAD_ORIG', 'ORIG_TRAD'])];
    const history = [
      attempt(1, 'ORIG_TRAD', 'ok', 1),
      attempt(1, 'ORIG_TRAD', 'ko', 2),
      attempt(1, 'TRAD_ORIG', 'ko', 3),
      attempt(1, 'TRAD_ORIG', 'ok', 4),
    ];
    const session = buildSession(words, history, { aciertos_desbloqueo: 1 }, 'desbloqueo');
    expect(session.queue[0]?.modo).toBe('ORIG_TRAD');
  });

  it('prefers a never-proposed mode on a tie', () => {
    const words = [word(1, ['TRAD_ORIG', 'TRAD_PRON'])];
    const history = [attempt(1, 'TRAD_ORIG', 'skip', 1)];
    const session = buildSession(words, history, { aciertos_desbloqueo: 1 }, 'desbloqueo');
    expect(session.queue[0]?.modo).toBe('TRAD_PRON');
  });

  it('only uses active modes and skips words without any', () => {
    const words = [word(1, ['ORIG_TRAD']), word(2, [])];
    const session = buildSession(words, [], { aciertos_desbloqueo: 5 }, 'icono');
    expect(session.queue).toEqual([{ articleId: 'a', frase_id: 1, posicion: 1, modo: 'ORIG_TRAD' }]);
  });
});

describe('advance', () => {
  const start = () => buildSession(WORDS, attempts, { aciertos_desbloqueo: 3 }, 'desbloqueo');

  it('removes the exercise on a hit and counts it as cleared', () => {
    const session = advance(start(), 'ok');
    expect(label(session)).toEqual(['ship TRAD_PRON', 'This TRAD_PRON']);
    expect(session.done).toBe(1);
  });

  it('sends a miss to the end of the queue with the same mode', () => {
    const session = advance(start(), 'ko');
    expect(label(session)).toEqual(['ship TRAD_PRON', 'This TRAD_PRON', 'very TRAD_PRON']);
    expect(session.done).toBe(0);
    expect(session.misses[`${ARTICLE_ID}:1:4`]).toBe(1);
  });

  it('sends a skip to the end without counting it as a miss', () => {
    const session = advance(start(), 'skip');
    expect(label(session)).toEqual(['ship TRAD_PRON', 'This TRAD_PRON', 'very TRAD_PRON']);
    expect(session.misses).toEqual({});
  });

  it(`lets a skip pass after ${SKIP_PASSES_AFTER_MISSES} misses in a row of the same word`, () => {
    let session = buildSession(WORDS.slice(3, 4), attempts, { aciertos_desbloqueo: 1 }, 'desbloqueo');
    session = advance(advance(session, 'ko'), 'ko');
    expect(advance(session, 'skip').queue).toHaveLength(1);
    session = advance(session, 'ko');
    session = advance(session, 'skip');
    expect(session.queue).toHaveLength(0);
    expect(session.done).toBe(1);
  });

  it('resets the miss count after a hit', () => {
    let session = buildSession(WORDS, attempts, { aciertos_desbloqueo: 5 }, 'icono');
    session = advance(session, 'ko');
    const veryKey = `${ARTICLE_ID}:1:4`;
    expect(session.misses[veryKey]).toBe(1);
    // very ORIG_PRON is next: the same word, cleared.
    session = advance(session, 'ok');
    expect(session.misses[veryKey]).toBeUndefined();
  });

  it('finishes when every exercise is cleared, without changing a finished session', () => {
    let session = start();
    session = advance(session, 'ko');
    while (!isFinished(session)) session = advance(session, 'ok');
    expect(session).toMatchObject({ done: 3, total: 3, queue: [] });
    expect(advance(session, 'ok')).toBe(session);
  });
});
