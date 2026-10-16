/** Primary stress mark (U+02C8). */
export const STRESS = 'ˈ';
/** Secondary stress mark (U+02CC); tolerated wherever STRESS is. */
export const SECONDARY_STRESS = 'ˌ';
export const SYLLABLE_SEPARATOR = '.';

// Explicit list instead of \p{P}: Unicode property escapes are not guaranteed
// on every JS engine the app runs on.
const PUNCTUATION = `.,;:!?¡¿"'«»“”‘’()[\\]{}…—–-`;
const EDGE_PUNCTUATION = new RegExp(`^[${PUNCTUATION}]+|[${PUNCTUATION}]+$`, 'g');

/** Strips punctuation from both ends of a word ("cheap." → "cheap"); inner hyphens and apostrophes stay. */
export function stripPunctuation(word: string): string {
  return word.replace(EDGE_PUNCTUATION, '');
}

/** Words of a sentence split on spaces, without punctuation. Position n (1-based) is index n − 1. */
export function splitWords(sentence: string): string[] {
  return sentence
    .trim()
    .split(/\s+/)
    .map(stripPunctuation)
    .filter((word) => word.length > 0);
}

/** Phonetic words of a transcription such as "/ðɪs ʃɪp ɪz ˈvɛ.ɹi tʃiːp/". */
export function splitPhoneticWords(transcription: string): string[] {
  return transcription
    .trim()
    .replace(/^[/[]+|[/\]]+$/g, '')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

export function stripStress(syllabified: string): string {
  return syllabified.split(STRESS).join('').split(SECONDARY_STRESS).join('');
}

/** Compares words ignoring case. */
export function sameWord(a: string, b: string): boolean {
  return a.toLocaleLowerCase() === b.toLocaleLowerCase();
}
