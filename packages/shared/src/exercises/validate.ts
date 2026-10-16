import { ExercisesSchema, type Exercises, type Frase, type Palabra } from './schema';
import {
  SECONDARY_STRESS,
  STRESS,
  SYLLABLE_SEPARATOR,
  sameWord,
  splitPhoneticWords,
  splitWords,
  stripPunctuation,
  stripStress,
} from './text';

/** The pronunciation exercises show a 3×3 grid of syllables. */
export const GRID_SIZE = 9;

export type ValidationResult = { ok: true; data: Exercises } | { ok: false; errors: string[] };

/**
 * Checks a generated exercises JSON against the schema and every rule in
 * SPEC.md. Error messages are precise enough to send back to Claude for the
 * retry.
 */
export function validateExercises(input: unknown): ValidationResult {
  const parsed = ExercisesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => `${formatPath(issue.path)}: ${issue.message}`),
    };
  }

  const errors: string[] = [];
  const fraseIds = new Set<number>();
  parsed.data.frases.forEach((frase, i) => {
    const path = `frases[${i}]`;
    if (fraseIds.has(frase.id)) errors.push(`${path}.id: duplicate sentence id ${frase.id}`);
    fraseIds.add(frase.id);
    errors.push(...checkFrase(frase, path));
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true, data: parsed.data };
}

function checkFrase(frase: Frase, path: string): string[] {
  const errors: string[] = [];
  const words = splitWords(frase.original);
  const phoneticWords = splitPhoneticWords(frase.fonetica);
  const countsMatch = phoneticWords.length === words.length;

  if (!countsMatch) {
    errors.push(
      `${path}.fonetica: has ${phoneticWords.length} phonetic words but original has ${words.length} words; ` +
        'there must be one phonetic word per word, in the same order',
    );
  }
  phoneticWords.forEach((phoneticWord, i) => {
    const problem = syllabificationProblem(phoneticWord);
    if (problem) errors.push(`${path}.fonetica: word ${i + 1} "${phoneticWord}" ${problem}`);
  });

  const positions = new Set<number>();
  frase.palabras.forEach((palabra, j) => {
    const wordPath = `${path}.palabras[${j}]`;
    if (positions.has(palabra.posicion)) {
      errors.push(`${wordPath}.posicion: duplicate position ${palabra.posicion} in the sentence`);
    }
    positions.add(palabra.posicion);
    errors.push(...checkPalabra(palabra, frase, words, countsMatch ? phoneticWords : null, wordPath));
  });

  return errors;
}

function checkPalabra(
  palabra: Palabra,
  frase: Frase,
  words: string[],
  phoneticWords: string[] | null,
  path: string,
): string[] {
  const errors: string[] = [];

  // posicion points to the word in `original`.
  const word = words[palabra.posicion - 1];
  if (word === undefined) {
    errors.push(`${path}.posicion: ${palabra.posicion} is outside the sentence, which has ${words.length} words`);
  } else if (!sameWord(word, stripPunctuation(palabra.original))) {
    errors.push(`${path}.posicion: word ${palabra.posicion} of the sentence is "${word}", not "${palabra.original}"`);
  }

  // The phonetic word at that position is this word, syllabified.
  const phoneticWord = phoneticWords?.[palabra.posicion - 1];
  if (phoneticWord !== undefined && phoneticWord !== palabra.palabra_silabeada) {
    errors.push(
      `${path}.palabra_silabeada: "${palabra.palabra_silabeada}" differs from phonetic word ` +
        `${palabra.posicion} of fonetica, "${phoneticWord}"`,
    );
  }

  const problem = syllabificationProblem(palabra.palabra_silabeada);
  if (problem) errors.push(`${path}.palabra_silabeada: "${palabra.palabra_silabeada}" ${problem}`);

  // Correct syllables joined with dots give the syllabified word without stress.
  const joined = palabra.silabas_correctas.join(SYLLABLE_SEPARATOR);
  const expected = stripStress(palabra.palabra_silabeada);
  if (joined !== expected) {
    errors.push(`${path}.silabas_correctas: joined with "." they give "${joined}", expected "${expected}"`);
  }
  const syllableCount = palabra.silabas_correctas.length;
  if (syllableCount > GRID_SIZE) {
    errors.push(`${path}.silabas_correctas: ${syllableCount} syllables do not fit the ${GRID_SIZE}-cell grid`);
  }

  // Every "/" alternative of the translation is a usable answer.
  if (palabra.traduccion.split('/').some((alternative) => alternative.trim() === '')) {
    errors.push(`${path}.traduccion: "${palabra.traduccion}" has an empty alternative around "/"`);
  }

  // posicion_en_traduccion points to traduccion_en_frase inside the translated sentence.
  const translatedWords = splitWords(frase.traduccion);
  const target = splitWords(palabra.traduccion_en_frase);
  const start = palabra.posicion_en_traduccion - 1;
  const found = translatedWords.slice(start, start + target.length);
  if (found.length !== target.length || found.some((w, k) => !sameWord(w, target[k] ?? ''))) {
    errors.push(
      `${path}.posicion_en_traduccion: word ${palabra.posicion_en_traduccion} of the translation is ` +
        `"${found.join(' ')}", not "${palabra.traduccion_en_frase}"`,
    );
  }

  // Enough distinct distractors to fill the grid, none equal to a correct syllable.
  const needed = Math.max(0, GRID_SIZE - syllableCount);
  if (palabra.distractores.length < needed) {
    errors.push(
      `${path}.distractores: has ${palabra.distractores.length}, needs at least ${needed} ` +
        `(${GRID_SIZE} − ${syllableCount} correct syllables)`,
    );
  }
  const correct = new Set(palabra.silabas_correctas);
  const seen = new Set<string>();
  palabra.distractores.forEach((distractor, k) => {
    if (correct.has(distractor.silaba)) {
      errors.push(`${path}.distractores[${k}]: "${distractor.silaba}" is one of the correct syllables`);
    } else if (seen.has(distractor.silaba)) {
      errors.push(`${path}.distractores[${k}]: "${distractor.silaba}" is repeated`);
    }
    seen.add(distractor.silaba);
  });

  return errors;
}

/** Null when the word is correctly syllabified: syllables separated by dots, stress only at a syllable start. */
function syllabificationProblem(word: string): string | null {
  const syllables = word.split(SYLLABLE_SEPARATOR);
  if (syllables.some((syllable) => stripStress(syllable) === '')) {
    return 'has an empty syllable (check the "." separators)';
  }
  const misplaced = syllables.some((syllable) =>
    [...syllable].some((char, i) => i > 0 && (char === STRESS || char === SECONDARY_STRESS)),
  );
  if (misplaced) return `has a stress mark that is not at the start of a syllable`;
  if (word.split(STRESS).length - 1 > 1) return `has more than one primary stress mark "${STRESS}"`;
  return null;
}

function formatPath(path: PropertyKey[]): string {
  return path.reduce<string>(
    (out, key) => (typeof key === 'number' ? `${out}[${key}]` : out ? `${out}.${String(key)}` : String(key)),
    '',
  ) || '(root)';
}
