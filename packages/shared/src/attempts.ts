import type { Modo } from './modes';

export const RESULTADOS = ['ok', 'ko', 'skip'] as const;
export type Resultado = (typeof RESULTADOS)[number];

/** How the app was opened: on phone unlock, or from its icon. */
export type Origen = 'desbloqueo' | 'icono';

/** A word of an article: sentence `frase_id`, word `posicion` (1-based) in that sentence. */
export type WordRef = {
  articleId: string;
  frase_id: number;
  posicion: number;
};

/**
 * One row per answer, with SPEC.md's field names. Every statistic is derived
 * from these rows.
 */
export type Attempt = WordRef & {
  id?: string;
  userId?: string;
  modo: Modo;
  resultado: Resultado;
  silaba_elegida?: string;
  respuesta_texto?: string;
  ms: number;
  /** ISO 8601 timestamp. */
  creado_en: string;
  origen: Origen;
};

export function wordKey(ref: WordRef): string {
  return `${ref.articleId}:${ref.frase_id}:${ref.posicion}`;
}

export function isSameWord(a: WordRef, b: WordRef): boolean {
  return a.articleId === b.articleId && a.frase_id === b.frase_id && a.posicion === b.posicion;
}

/** Oldest first. */
export function byTime(a: Attempt, b: Attempt): number {
  return Date.parse(a.creado_en) - Date.parse(b.creado_en);
}
