export type Language = {
  code: string;
  name: string;
  /** BCP 47 locale passed to text-to-speech. */
  speechLocale: string;
};

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', speechLocale: 'en-US' },
  { code: 'es', name: 'Spanish', speechLocale: 'es-ES' },
  { code: 'fr', name: 'French', speechLocale: 'fr-FR' },
  { code: 'de', name: 'German', speechLocale: 'de-DE' },
  { code: 'it', name: 'Italian', speechLocale: 'it-IT' },
  { code: 'pt', name: 'Portuguese', speechLocale: 'pt-PT' },
  { code: 'ca', name: 'Catalan', speechLocale: 'ca-ES' },
  { code: 'nl', name: 'Dutch', speechLocale: 'nl-NL' },
  { code: 'zh', name: 'Chinese', speechLocale: 'zh-CN' },
  { code: 'ja', name: 'Japanese', speechLocale: 'ja-JP' },
  { code: 'ar', name: 'Arabic', speechLocale: 'ar-SA' },
  { code: 'ru', name: 'Russian', speechLocale: 'ru-RU' },
];

export function getLanguage(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? { code, name: code.toUpperCase(), speechLocale: code };
}
