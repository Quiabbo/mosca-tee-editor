/**
 * Localized names for common icons and assets.
 */
const iconTranslations: Record<string, { pt: string; en: string }> = {
  'arrow-right': { pt: 'seta para direita', en: 'arrow right' },
  'arrow-left': { pt: 'seta para esquerda', en: 'arrow left' },
  'arrow-up': { pt: 'seta para cima', en: 'arrow up' },
  'arrow-down': { pt: 'seta para baixo', en: 'arrow down' },
  'check': { pt: 'confirmar', en: 'check' },
  'check-circle': { pt: 'círculo de confirmação', en: 'check circle' },
  'x': { pt: 'fechar', en: 'close' },
  'x-circle': { pt: 'círculo de fechar', en: 'close circle' },
  'star': { pt: 'estrela', en: 'star' },
  'heart': { pt: 'coração', en: 'heart' },
  'share': { pt: 'compartilhar', en: 'share' },
  'download': { pt: 'baixar', en: 'download' },
  'upload': { pt: 'enviar', en: 'upload' },
  'search': { pt: 'buscar', en: 'search' },
  'home': { pt: 'início', en: 'home' },
  'user': { pt: 'usuário', en: 'user' },
  'settings': { pt: 'configurações', en: 'settings' },
  'menu': { pt: 'menu', en: 'menu' },
  'plus': { pt: 'mais', en: 'plus' },
  'minus': { pt: 'menos', en: 'minus' },
  'edit': { pt: 'editar', en: 'edit' },
  'trash': { pt: 'lixeira', en: 'trash' },
  'copy': { pt: 'copiar', en: 'copy' },
  'lock': { pt: 'bloquear', en: 'lock' },
  'unlock': { pt: 'desbloquear', en: 'unlock' },
  'eye': { pt: 'ver', en: 'view' },
  'eye-off': { pt: 'ocultar', en: 'hide' },
  'layers': { pt: 'camadas', en: 'layers' },
  'image': { pt: 'imagem', en: 'image' },
  'photo': { pt: 'foto', en: 'photo' },
  'camera': { pt: 'câmera', en: 'camera' },
  'file': { pt: 'arquivo', en: 'file' },
  'folder': { pt: 'pasta', en: 'folder' },
  'link': { pt: 'link', en: 'link' },
  'mail': { pt: 'e-mail', en: 'email' },
  'phone': { pt: 'telefone', en: 'phone' },
  'map-pin': { pt: 'localização', en: 'location' },
  'calendar': { pt: 'calendário', en: 'calendar' },
  'clock': { pt: 'relógio', en: 'clock' },
  'refresh': { pt: 'atualizar', en: 'refresh' },
  'rotate-cw': { pt: 'girar sentido horário', en: 'rotate clockwise' },
  'rotate-ccw': { pt: 'girar sentido anti-horário', en: 'rotate counter-clockwise' },
  'zoom-in': { pt: 'aumentar zoom', en: 'zoom in' },
  'zoom-out': { pt: 'diminuir zoom', en: 'zoom out' },
  'grid': { pt: 'grade', en: 'grid' },
  'align-left': { pt: 'alinhar à esquerda', en: 'align left' },
  'align-center': { pt: 'alinhar ao centro', en: 'align center' },
  'align-right': { pt: 'alinhar à direita', en: 'align right' },
  'bold': { pt: 'negrito', en: 'bold' },
  'italic': { pt: 'itálico', en: 'italic' },
  'underline': { pt: 'sublinhado', en: 'underline' },
  'type': { pt: 'texto', en: 'text' },
  'move': { pt: 'mover', en: 'move' },
  'shape': { pt: 'forma', en: 'shape' },
  'rectangle': { pt: 'retângulo', en: 'rectangle' },
  'circle': { pt: 'círculo', en: 'circle' },
  'triangle': { pt: 'triângulo', en: 'triangle' },
  'info': { pt: 'informação', en: 'info' },
  'warning': { pt: 'aviso', en: 'warning' },
  'mic': { pt: 'microfone', en: 'microphone' },
  'volume': { pt: 'volume', en: 'volume' },
  'accessibility': { pt: 'acessibilidade', en: 'accessibility' },
};

/**
 * Translates an asset name or URL to a localized descriptive string.
 * @param nameOrUrl The asset name (kebab-case) or URL.
 * @param lang Language code ('pt' or 'en').
 */
export function translateAssetName(nameOrUrl: string, lang: 'pt' | 'en'): string {
  // Normalize kebab-case (underscores and spaces to -)
  const normalized = nameOrUrl.toLowerCase().replace(/[_\s]/g, '-');
  if (iconTranslations[normalized]) {
    return iconTranslations[normalized][lang];
  }

  // Try extract from URL or path
  try {
    const filename = nameOrUrl.split('/').pop() || '';
    const name = filename.split('.')[0];
    if (name) return name.replace(/[_\-]/g, ' ');
  } catch (e) {
    // Fallback
  }

  return nameOrUrl;
}

/**
 * Formats a description for a Pexels photo.
 * @param alt The alt text of the photo.
 * @param photographer The name of the photographer.
 * @param lang Language code ('pt' or 'en').
 */
export function translatePexelsPhoto(alt: string, photographer: string, lang: 'pt' | 'en'): string {
  if (lang === 'en') {
    return `Photo by ${photographer}: ${alt}`;
  }
  return `Foto por ${photographer}: ${alt}`;
}
