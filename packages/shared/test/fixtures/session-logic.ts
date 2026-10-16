import { MODES, type Attempt, type LastResult, type Modo, type SessionWord } from '../../src';

/**
 * The "Sesión · lógica" artboard of the "Plantilla minijuegos" canvas, as
 * attempt history. Per mode, in MODES order: [ok, ko] totals and the last 4
 * results. Totals were chosen so the rounded percentages match the artboard:
 *
 *   word   overall  TRAD_ORIG ORIG_TRAD ORIG_PRON TRAD_PRON
 *   This     62 %     70 %      74 %      55 %      49 %
 *   ship     58 %     81 %      77 %      42 %      35 %
 *   is       84 %     92 %      95 %      76 %     100 % (artboard: 73 %)
 *   very     49 %     88 %      85 %      31 %      27 %
 *   cheap    66 %     79 %      83 %      52 %      67 % (artboard: 50 %)
 *
 * The two differences are unavoidable: the artboard shows "not proposed" in
 * their last 4, i.e. fewer than 4 answers ever, which cannot give 73 % or
 * 50 %. Neither changes which words or pairs the sessions pick.
 */
type ModeHistory = { ok: number; ko: number; last: LastResult[] };

const ARTBOARD: Record<string, ModeHistory[]> = {
  This: [
    { ok: 7, ko: 3, last: ['ok', 'ok', 'ko', 'ok'] },
    { ok: 26, ko: 9, last: ['ok', 'ok', 'ok', 'ok'] },
    { ok: 6, ko: 5, last: ['ko', 'ok', 'ko', 'ok'] },
    { ok: 17, ko: 18, last: ['ko', 'ko', 'ok', 'ko'] },
  ],
  ship: [
    { ok: 17, ko: 4, last: ['ok', 'ok', 'ok', 'ok'] },
    { ok: 10, ko: 3, last: ['ok', 'ko', 'ok', 'ok'] },
    { ok: 5, ko: 7, last: ['ko', 'ko', 'ok', 'ko'] },
    { ok: 8, ko: 15, last: ['ko', 'ko', 'ko', 'ok'] },
  ],
  is: [
    { ok: 11, ko: 1, last: ['ok', 'ok', 'ok', 'ok'] },
    { ok: 18, ko: 1, last: ['ok', 'ok', 'ok', 'ok'] },
    { ok: 28, ko: 9, last: ['ok', 'ko', 'ok', 'ok'] },
    { ok: 2, ko: 0, last: ['none', 'none', 'ok', 'ok'] },
  ],
  very: [
    { ok: 7, ko: 1, last: ['ok', 'ok', 'ko', 'ok'] },
    { ok: 11, ko: 2, last: ['ok', 'ok', 'ok', 'ok'] },
    { ok: 5, ko: 11, last: ['ko', 'ko', 'ko', 'ok'] },
    { ok: 6, ko: 16, last: ['ko', 'ko', 'ko', 'ko'] },
  ],
  cheap: [
    { ok: 11, ko: 3, last: ['ok', 'ok', 'ok', 'ok'] },
    { ok: 5, ko: 1, last: ['ok', 'ko', 'ok', 'ok'] },
    { ok: 11, ko: 10, last: ['ko', 'ok', 'ok', 'ko'] },
    { ok: 2, ko: 1, last: ['none', 'ko', 'ok', 'ok'] },
  ],
};

export const ARTICLE_ID = 'this-ship';
const START = Date.parse('2026-10-01T09:00:00Z');

/** The sentence's words in order: This = 1 … cheap = 5, all four modes active. */
export const WORDS: SessionWord[] = Object.keys(ARTBOARD).map((_, i) => ({
  articleId: ARTICLE_ID,
  frase_id: 1,
  posicion: i + 1,
  modos_activos: [...MODES],
}));

export const WORD_NAMES = Object.keys(ARTBOARD);

/** Older answers first, then the last 4 in order, one minute apart. */
export function artboardAttempts(): Attempt[] {
  const attempts: Attempt[] = [];
  let minute = 0;
  WORD_NAMES.forEach((name, w) => {
    ARTBOARD[name]!.forEach((history, m) => {
      const last = history.last.filter((r): r is 'ok' | 'ko' => r !== 'none');
      const earlierOk = history.ok - last.filter((r) => r === 'ok').length;
      const earlierKo = history.ko - last.filter((r) => r === 'ko').length;
      const results = [...Array<'ok'>(earlierOk).fill('ok'), ...Array<'ko'>(earlierKo).fill('ko'), ...last];
      for (const resultado of results) {
        attempts.push({
          articleId: ARTICLE_ID,
          frase_id: 1,
          posicion: w + 1,
          modo: MODES[m] as Modo,
          resultado,
          ms: 3000,
          creado_en: new Date(START + minute++ * 60_000).toISOString(),
          origen: 'icono',
        });
      }
    });
  });
  return attempts;
}

export function nameOf(posicion: number): string {
  return WORD_NAMES[posicion - 1] ?? '?';
}
