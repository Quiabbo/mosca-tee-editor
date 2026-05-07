import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

extend([namesPlugin]);

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Converts RGB to CMYK
 */
export const rgbToCmyk = (r: number, g: number, b: number): CMYK => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 1 };
  }

  const c = (1 - rNorm - k) / (1 - k);
  const m = (1 - gNorm - k) / (1 - k);
  const y = (1 - bNorm - k) / (1 - k);

  return { c, m, y, k };
};

/**
 * Converts CMYK to RGB
 */
export const cmykToRgb = (c: number, m: number, y: number, k: number): RGB => {
  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);

  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b)
  };
};

/**
 * Converts any CSS color string to its CMYK gamut equivalent in RGB
 */
export const convertToCmykGamut = (colorStr: string): string => {
  if (!colorStr || colorStr === 'transparent') return colorStr;

  const color = colord(colorStr);
  if (!color.isValid()) return colorStr;

  const { r, g, b, a } = color.toRgb();
  const cmyk = rgbToCmyk(r, g, b);
  const rgb = cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k);

  if (a < 1) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
};
