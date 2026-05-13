// Conecta os blend modes internos do Mosca Tee com os valores do ag-psd.
// Usado pela importação e exportação de arquivos PSD.

export const FABRIC_TO_AGPSD: Record<string, string> = {
  'source-over': 'normal',
  'multiply':    'multiply',
  'screen':      'screen',
  'overlay':     'overlay',
  'darken':      'darken',
  'lighten':     'lighten',
  'color-burn':  'color burn',
  'color-dodge': 'color dodge',
  'hard-light':  'hard light',
  'soft-light':  'soft light',
  'difference':  'difference',
  'exclusion':   'exclusion',
  'hue':         'hue',
  'saturation':  'saturation',
  'color':       'color',
  'luminosity':  'luminosity',
  'lighter':     'linear dodge',
};

export const AGPSD_TO_FABRIC: Record<string, string> = {
  'normal':        'source-over',
  'dissolve':      'source-over',
  'multiply':      'multiply',
  'screen':        'screen',
  'overlay':       'overlay',
  'darken':        'darken',
  'lighten':       'lighten',
  'color burn':    'color-burn',
  'linear burn':   'color-burn',
  'color dodge':   'color-dodge',
  'linear dodge':  'lighter',
  'hard light':    'hard-light',
  'soft light':    'soft-light',
  'vivid light':   'hard-light',
  'linear light':  'hard-light',
  'pin light':     'hard-light',
  'difference':    'difference',
  'exclusion':     'exclusion',
  'subtract':      'difference',
  'divide':        'color-dodge',
  'hue':           'hue',
  'saturation':    'saturation',
  'color':         'color',
  'luminosity':    'luminosity',
  'pass through':  'source-over',
};

export function fabricToAgPsd(compositeOperation: string): string {
  return FABRIC_TO_AGPSD[compositeOperation] ?? 'normal';
}

export function agPsdToFabric(agPsdMode: string): string {
  return AGPSD_TO_FABRIC[agPsdMode] ?? 'source-over';
}
