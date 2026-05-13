/**
 * Stubs for a11y translation utilities to be fully implemented in Part 4.
 */

export function getObjectTypeName(type: string, lang: string): string {
  const translations: Record<string, Record<string, string>> = {
    'pt-br': {
      'rect': 'Retângulo',
      'circle': 'Círculo',
      'triangle': 'Triângulo',
      'i-text': 'Texto',
      'textbox': 'Caixa de texto',
      'image': 'Imagem',
      'path': 'Desenho',
      'group': 'Conjunto'
    },
    'en': {
      'rect': 'Rectangle',
      'circle': 'Circle',
      'triangle': 'Triangle',
      'i-text': 'Text',
      'textbox': 'Text box',
      'image': 'Image',
      'path': 'Drawing',
      'group': 'Set'
    }
  };
  const l = lang.toLowerCase() === 'pt-br' ? 'pt-br' : 'en';
  return translations[l][type] || type;
}

export function translateFontName(fontFamily: string): string {
  // Simple pass-through for now
  return fontFamily;
}

export function translateAssetName(src: string, lang: string): string {
  // Simple extraction for now
  const filename = src.split('/').pop() || '';
  return filename.split('.')[0] || (lang === 'pt-br' ? 'Ativo' : 'Asset');
}
