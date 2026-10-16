import type { WordEntry } from './types';

// Tried in order; only the first occurrence on a line splits term from translation.
// Dashes need surrounding spaces so hyphenated words ("well-known") survive.
const SEPARATORS = [/\t/, /\s*=\s*/, /\s+[-–—]\s+/, /\s*:\s*/, /\s*;\s*/];

const BULLET = /^\s*(?:[-*•·]|\d+[.)])\s+/;

/**
 * Turns pasted text into word entries. Accepts one entry per line in the form
 * "term = translation" (or tab, " - ", ":", ";"), and bare comma-separated
 * terms with no translation.
 */
export function parseWordList(text: string): WordEntry[] {
  const entries: WordEntry[] = [];
  const seen = new Set<string>();

  const add = (term: string, translation: string) => {
    term = term.trim();
    translation = translation.trim();
    const key = term.toLowerCase();
    if (!term || seen.has(key)) return;
    seen.add(key);
    entries.push({ term, translation });
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(BULLET, '').trim();
    if (!line) continue;

    const separator = SEPARATORS.find((s) => s.test(line));
    if (separator) {
      const match = line.match(separator)!;
      const at = match.index!;
      add(line.slice(0, at), line.slice(at + match[0].length));
    } else if (line.includes(',')) {
      line.split(',').forEach((term) => add(term, ''));
    } else {
      add(line, '');
    }
  }

  return entries;
}
