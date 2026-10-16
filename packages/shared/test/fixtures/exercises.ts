import type { Exercises } from '../../src';

/**
 * SPEC.md's reference example, completed for every word so it passes all
 * rules (at least 9 − n distractors each). Reasons are written as the
 * generator must write them: in the learner's language (Spanish here).
 */
export const THIS_SHIP: Exercises = {
  idioma_original: 'en',
  idioma_estudiante: 'es',
  sistema_fonetico: 'AFI simplificado (fonémico)',
  texto_original: 'This ship is very cheap.',
  frases: [
    {
      id: 1,
      original: 'This ship is very cheap.',
      traduccion: 'Este barco es muy barato.',
      fonetica: '/ðɪs ʃɪp ɪz ˈvɛ.ɹi tʃiːp/',
      palabras: [
        {
          posicion: 1,
          original: 'This',
          traduccion: 'este / esta',
          traduccion_en_frase: 'Este',
          posicion_en_traduccion: 1,
          palabra_silabeada: 'ðɪs',
          silabas_correctas: ['ðɪs'],
          distractores: [
            { silaba: 'dɪs', motivo: 'ð → d (en español la d inicial suena oclusiva)' },
            { silaba: 'θɪs', motivo: 'ð → θ (se confunde con la z castellana)' },
            { silaba: 'ðis', motivo: 'ɪ → i (la i corta inglesa se alarga como la española)' },
            { silaba: 'dis', motivo: 'ð → d, ɪ → i (dos transferencias del español a la vez)' },
            { silaba: 'ðɪz', motivo: 's → z (sonorización de la s final)' },
            { silaba: 'zɪs', motivo: 'ð → z (sustitución por una sibilante)' },
            { silaba: 'ðes', motivo: 'ɪ → e (la ɪ se percibe como e española)' },
            { silaba: 'tɪs', motivo: 'ð → t (se ensordece la consonante inicial)' },
          ],
        },
        {
          posicion: 2,
          original: 'ship',
          traduccion: 'barco',
          traduccion_en_frase: 'barco',
          posicion_en_traduccion: 2,
          palabra_silabeada: 'ʃɪp',
          silabas_correctas: ['ʃɪp'],
          distractores: [
            { silaba: 'ʃiːp', motivo: 'ɪ → iː (ship se confunde con sheep)' },
            { silaba: 'tʃɪp', motivo: 'ʃ → tʃ (el español no tiene ʃ y usa la ch)' },
            { silaba: 'sɪp', motivo: 'ʃ → s (se simplifica a la s española)' },
            { silaba: 'ʃip', motivo: 'ɪ → i (vocal corta pronunciada como i española)' },
            { silaba: 'tʃip', motivo: 'ʃ → tʃ, ɪ → i (dos transferencias del español a la vez)' },
            { silaba: 'ʃɪb', motivo: 'p → b (sonorización de la p final)' },
            { silaba: 'ʃep', motivo: 'ɪ → e (la ɪ se percibe como e española)' },
            { silaba: 'ʃɪpe', motivo: 'p → pe (se añade una e: el español evita acabar en p)' },
          ],
        },
        {
          posicion: 3,
          original: 'is',
          traduccion: 'es / está',
          traduccion_en_frase: 'es',
          posicion_en_traduccion: 3,
          palabra_silabeada: 'ɪz',
          silabas_correctas: ['ɪz'],
          distractores: [
            { silaba: 'ɪs', motivo: 'z → s (el español no tiene s sonora)' },
            { silaba: 'is', motivo: 'ɪ → i, z → s (dos transferencias del español a la vez)' },
            { silaba: 'iz', motivo: 'ɪ → i (vocal corta pronunciada como i española)' },
            { silaba: 'es', motivo: 'ɪ → e, z → s (se lee como el «es» español)' },
            { silaba: 'ez', motivo: 'ɪ → e (la ɪ se percibe como e española)' },
            { silaba: 'ɪθ', motivo: 'z → θ (se confunde con la z castellana)' },
            { silaba: 'ɪð', motivo: 'z → ð (se suaviza como la d intervocálica)' },
            { silaba: 'ɪzə', motivo: 'z → zə (se añade una vocal final)' },
          ],
        },
        {
          posicion: 4,
          original: 'very',
          traduccion: 'muy',
          traduccion_en_frase: 'muy',
          posicion_en_traduccion: 4,
          palabra_silabeada: 'ˈvɛ.ɹi',
          silabas_correctas: ['vɛ', 'ɹi'],
          distractores: [
            { silaba: 'bɛ', motivo: 'v → b (en español b y v suenan igual)' },
            { silaba: 'ri', motivo: 'ɹ → r (se usa la r vibrante española)' },
            { silaba: 'be', motivo: 'v → b, ɛ → e (dos transferencias del español a la vez)' },
            { silaba: 've', motivo: 'ɛ → e (la ɛ abierta se cierra como e española)' },
            { silaba: 'rri', motivo: 'ɹ → rr (se usa la r múltiple española)' },
            { silaba: 'ɹiː', motivo: 'i → iː (se alarga la vocal final)' },
            { silaba: 'fɛ', motivo: 'v → f (se ensordece la v)' },
          ],
        },
        {
          posicion: 5,
          original: 'cheap',
          traduccion: 'barato',
          traduccion_en_frase: 'barato',
          posicion_en_traduccion: 5,
          palabra_silabeada: 'tʃiːp',
          silabas_correctas: ['tʃiːp'],
          distractores: [
            { silaba: 'tʃɪp', motivo: 'iː → ɪ (cheap se confunde con chip)' },
            { silaba: 'ʃiːp', motivo: 'tʃ → ʃ (cheap se confunde con sheep)' },
            { silaba: 'tʃip', motivo: 'iː → i (se acorta la vocal larga)' },
            { silaba: 'tʃiːb', motivo: 'p → b (sonorización de la p final)' },
            { silaba: 'tʃiːpe', motivo: 'p → pe (se añade una e: el español evita acabar en p)' },
            { silaba: 'siːp', motivo: 'tʃ → s (se simplifica la africada)' },
            { silaba: 'tʃiː', motivo: 'p → ∅ (se omite la consonante final)' },
            { silaba: 'dʒiːp', motivo: 'tʃ → dʒ (cheap se confunde con jeep)' },
          ],
        },
      ],
    },
  ],
};

/** A deep copy to break one rule at a time. */
export function copyOfThisShip(): Exercises {
  return JSON.parse(JSON.stringify(THIS_SHIP)) as Exercises;
}
