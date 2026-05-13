// Mapeamento de cores hexadecimais para nomes legíveis em PT-BR e EN
const colorNames: Record<string, { pt: string; en: string }> = {
  '#000000': { pt: 'preto', en: 'black' },
  '#ffffff': { pt: 'branco', en: 'white' },
  '#ff0000': { pt: 'vermelho', en: 'red' },
  '#00ff00': { pt: 'verde', en: 'green' },
  '#0000ff': { pt: 'azul', en: 'blue' },
  '#ffff00': { pt: 'amarelo', en: 'yellow' },
  '#ff8800': { pt: 'laranja', en: 'orange' },
  '#ffa500': { pt: 'laranja', en: 'orange' },
  '#ff00ff': { pt: 'magenta', en: 'magenta' },
  '#00ffff': { pt: 'ciano', en: 'cyan' },
  '#808080': { pt: 'cinza', en: 'gray' },
  '#a52a2a': { pt: 'marrom', en: 'brown' },
  '#800080': { pt: 'roxo', en: 'purple' },
  '#ffc0cb': { pt: 'rosa', en: 'pink' },
  '#ffb6c1': { pt: 'rosa claro', en: 'light pink' },
  '#ffd700': { pt: 'dourado', en: 'gold' },
  '#c0c0c0': { pt: 'prateado', en: 'silver' },
  '#333333': { pt: 'cinza escuro', en: 'dark gray' },
  '#3f3f46': { pt: 'cinza escuro', en: 'dark gray' },
  '#666666': { pt: 'cinza médio', en: 'medium gray' },
  '#999999': { pt: 'cinza claro', en: 'light gray' },
  '#cccccc': { pt: 'cinza muito claro', en: 'very light gray' },
  '#2563eb': { pt: 'azul vibrante', en: 'vibrant blue' },
  '#ef4444': { pt: 'vermelho vibrante', en: 'vibrant red' },
  '#10b981': { pt: 'verde esmeralda', en: 'emerald green' },
  '#f59e0b': { pt: 'laranja âmbar', en: 'amber orange' },
  '#8b5cf6': { pt: 'azul violeta', en: 'violet blue' },
  '#ec4899': { pt: 'rosa vibrante', en: 'vibrant pink' },
};

export function getColorName(hex: string, lang: 'pt' | 'en'): string {
  const normalized = hex.toLowerCase();
  if (colorNames[normalized]) return colorNames[normalized][lang];
  
  // Fallback: descrever por componentes RGB
  try {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return lang === 'pt' ? 'cor personalizada' : 'custom color';
    }

    if (lang === 'pt') return 'cor personalizada';
    return 'custom color';
  } catch (e) {
    return lang === 'pt' ? 'cor personalizada' : 'custom color';
  }
}
