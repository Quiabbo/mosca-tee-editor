/**
 * Descriptors for generic font styles.
 */
export const fontStyleDescriptors: Record<string, { pt: string; en: string }> = {
  serif: { pt: 'com serifa', en: 'serif' },
  'sans-serif': { pt: 'sem serifa', en: 'sans-serif' },
  monospace: { pt: 'monoespaçada', en: 'monospace' },
  cursive: { pt: 'cursiva', en: 'cursive' },
  fantasy: { pt: 'fantasia', en: 'fantasy' },
};

/**
 * Friendly nicknames for specific font families in Portuguese.
 */
export const fontNicknames: Record<string, string> = {
  'Dancing Script': 'Manuscrita elegante',
  'Playfair Display': 'Serifada clássica',
  'Roboto Mono': 'Código moderna',
  'Comic Sans MS': 'Escrita informal',
};

/**
 * Translates a font family name to a more descriptive or localized version.
 * @param fontFamily The font family name.
 * @param lang Language code ('pt' or 'en').
 */
export function translateFontName(fontFamily: string, lang: 'pt' | 'en'): string {
  if (lang === 'en') return fontFamily;
  return fontNicknames[fontFamily] || fontFamily;
}
