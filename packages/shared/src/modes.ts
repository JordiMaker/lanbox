import { z } from 'zod';

/**
 * Exercise modes, in the order the design uses everywhere (stats legend, artboards):
 * triangle, square, pentagon, circle.
 */
export const MODES = ['TRAD_ORIG', 'ORIG_TRAD', 'ORIG_PRON', 'TRAD_PRON'] as const;

export const ModoSchema = z.enum(MODES);
export type Modo = z.infer<typeof ModoSchema>;
