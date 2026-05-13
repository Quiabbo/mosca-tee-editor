/**
 * Dictionary mapping Fabric.js internal object types to localized names.
 */
const objectTypeNames: Record<string, { pt: string; en: string }> = {
  rect: { pt: 'Retângulo', en: 'Rectangle' },
  circle: { pt: 'Círculo', en: 'Circle' },
  ellipse: { pt: 'Elipse', en: 'Ellipse' },
  triangle: { pt: 'Triângulo', en: 'Triangle' },
  polygon: { pt: 'Polígono', en: 'Polygon' },
  polyline: { pt: 'Polilinha', en: 'Polyline' },
  line: { pt: 'Linha', en: 'Line' },
  path: { pt: 'Caminho', en: 'Path' },
  'i-text': { pt: 'Texto editável', en: 'Editable text' },
  text: { pt: 'Texto', en: 'Text' },
  textbox: { pt: 'Caixa de texto', en: 'Text box' },
  image: { pt: 'Imagem', en: 'Image' },
  group: { pt: 'Conjunto', en: 'Set' },
  activeSelection: { pt: 'Seleção ativa', en: 'Active selection' },
};

/**
 * Returns the localized name for a Fabric.js object type.
 * @param obj The Fabric object or an object with a 'type' property.
 * @param lang Language code ('pt' or 'en').
 */
export function getObjectTypeName(obj: any, lang: 'pt' | 'en' = 'pt'): string {
  const type = obj?.type || 'object';
  return objectTypeNames[type]?.[lang] || type;
}
