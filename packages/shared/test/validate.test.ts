import { describe, expect, it } from 'vitest';

import { validateExercises, type Exercises, type Palabra } from '../src';
import { THIS_SHIP, copyOfThisShip } from './fixtures/exercises';

/** Breaks one rule on a fresh copy and returns the validator's errors. */
function errorsAfter(breakIt: (json: Exercises) => void): string[] {
  const json = copyOfThisShip();
  breakIt(json);
  const result = validateExercises(json);
  if (result.ok) throw new Error('expected the broken JSON to be rejected');
  return result.errors;
}

function word(json: Exercises, posicion: number): Palabra {
  const palabra = json.frases[0]!.palabras.find((p) => p.posicion === posicion);
  if (!palabra) throw new Error(`no word at position ${posicion}`);
  return palabra;
}

const VERY = 4;

describe('validateExercises', () => {
  it('accepts the complete "This ship is very cheap." example', () => {
    const result = validateExercises(THIS_SHIP);
    expect(result).toEqual({ ok: true, data: THIS_SHIP });
  });

  describe('rejects each broken rule', () => {
    const cases: [string, (json: Exercises) => void, string][] = [
      ['schema: a required field is missing', (json) => delete (json as Partial<Exercises>).frases, 'frases:'],
      ['schema: text over 612 characters', (json) => (json.texto_original = 'a'.repeat(613)), 'texto_original:'],
      ['sentence ids are unique', (json) => json.frases.push(json.frases[0]!), 'duplicate sentence id 1'],
      ['posicion points to the word', (json) => (word(json, VERY).posicion = 3), 'word 3 of the sentence is "is", not "very"'],
      ['posicion is inside the sentence', (json) => (word(json, VERY).posicion = 9), '9 is outside the sentence'],
      ['positions are unique in a sentence', (json) => (word(json, 5).posicion = VERY), 'duplicate position 4'],
      [
        'one phonetic word per word',
        (json) => (json.frases[0]!.fonetica = '/ðɪs ʃɪp ˈvɛ.ɹi tʃiːp/'),
        'has 4 phonetic words but original has 5 words',
      ],
      [
        'stress only at the start of a syllable',
        (json) => {
          json.frases[0]!.fonetica = '/ðɪs ʃɪp ɪz vˈɛ.ɹi tʃiːp/';
          word(json, VERY).palabra_silabeada = 'vˈɛ.ɹi';
        },
        'stress mark that is not at the start of a syllable',
      ],
      [
        'syllables separated by single dots',
        (json) => {
          json.frases[0]!.fonetica = '/ðɪs ʃɪp ɪz ˈvɛ..ɹi tʃiːp/';
          word(json, VERY).palabra_silabeada = 'ˈvɛ..ɹi';
        },
        'has an empty syllable',
      ],
      [
        'at most one primary stress',
        (json) => {
          json.frases[0]!.fonetica = '/ðɪs ʃɪp ɪz ˈvɛ.ˈɹi tʃiːp/';
          word(json, VERY).palabra_silabeada = 'ˈvɛ.ˈɹi';
        },
        'more than one primary stress mark',
      ],
      [
        'palabra_silabeada is the phonetic word at its position',
        (json) => {
          word(json, VERY).palabra_silabeada = 'ˈvɛ.ri';
          word(json, VERY).silabas_correctas = ['vɛ', 'ri'];
        },
        'differs from phonetic word 4 of fonetica',
      ],
      [
        'correct syllables joined give the word without stress',
        (json) => (word(json, VERY).silabas_correctas = ['vɛ', 'ri']),
        'joined with "." they give "vɛ.ri", expected "vɛ.ɹi"',
      ],
      [
        'at most 9 correct syllables',
        (json) => (word(json, VERY).silabas_correctas = Array.from({ length: 10 }, (_, i) => `s${i}`)),
        'do not fit the 9-cell grid',
      ],
      ['translation alternatives are not empty', (json) => (word(json, 1).traduccion = 'este / '), 'empty alternative'],
      [
        'posicion_en_traduccion points to the translated word',
        (json) => (word(json, VERY).posicion_en_traduccion = 2),
        'word 2 of the translation is "barco", not "muy"',
      ],
      [
        'enough distractors to fill the grid',
        (json) => (word(json, 2).distractores = word(json, 2).distractores.slice(0, 5)),
        'has 5, needs at least 8',
      ],
      [
        'distractors are distinct',
        (json) => (word(json, 5).distractores[1] = { ...word(json, 5).distractores[0]! }),
        '"tʃɪp" is repeated',
      ],
      [
        'no distractor equals a correct syllable',
        (json) => (word(json, VERY).distractores[0] = { silaba: 'vɛ', motivo: 'x → y (z)' }),
        '"vɛ" is one of the correct syllables',
      ],
    ];

    it.each(cases)('%s', (_rule, breakIt, expected) => {
      const errors = errorsAfter(breakIt);
      expect(errors.some((e) => e.includes(expected)), errors.join('\n')).toBe(true);
    });
  });

  it('points to where the problem is', () => {
    const errors = errorsAfter((json) => (word(json, VERY).posicion_en_traduccion = 2));
    expect(errors).toContain(
      'frases[0].palabras[3].posicion_en_traduccion: word 2 of the translation is "barco", not "muy"',
    );
  });
});
