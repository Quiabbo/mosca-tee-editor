import { fabric } from 'fabric';

export interface LassoPoint {
  x: number;
  y: number;
}

export interface PolygonalLassoState {
  active: boolean;          // ferramenta está selecionada
  drawing: boolean;         // usuário está adicionando pontos
  points: LassoPoint[];     // vértices definidos até agora
  mousePos: LassoPoint;     // posição atual do mouse (para linha guia)
  selectionClosed: boolean; // polígono foi fechado, seleção ativa
  nearStartPoint: boolean;  // cursor está perto do ponto inicial
  altPressed: boolean;      // tecla Alt pressionada
}

const CLOSE_RADIUS = 12; // px — distância para "snap" ao ponto inicial

export function createLassoState(): PolygonalLassoState {
  return {
    active: false,
    drawing: false,
    points: [],
    mousePos: { x: 0, y: 0 },
    selectionClosed: false,
    nearStartPoint: false,
    altPressed: false,
  };
}

export function isNearStartPoint(
  current: LassoPoint,
  start: LassoPoint
): boolean {
  if (!start) return false;
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  return Math.sqrt(dx * dx + dy * dy) < CLOSE_RADIUS;
}

/**
 * Converte coordenada de evento de mouse para coordenada do canvas Fabric,
 * levando em conta zoom e pan.
 */
export function eventToCanvasPoint(
  e: MouseEvent,
  fabricCanvas: any
): LassoPoint {
  if (!fabricCanvas || !fabricCanvas.getElement()) return { x: 0, y: 0 };
  const rect = (fabricCanvas.getElement() as HTMLCanvasElement)
    .getBoundingClientRect();
  const zoom = fabricCanvas.getZoom() || 1;
  const vpt  = fabricCanvas.viewportTransform ?? [1,0,0,1,0,0];
  return {
    x: (e.clientX - rect.left - vpt[4]) / zoom,
    y: (e.clientY - rect.top  - vpt[5]) / zoom,
  };
}

/**
 * Extrai a região dentro do polígono ou caminho de um objeto Fabric
 * e retorna um data URL PNG com fundo transparente.
 */
export async function extractPolygonRegion(
  fabricObject: any,
  pointsOrPath: LassoPoint[] | string,
  canvasWidth: number,
  canvasHeight: number
): Promise<string | null> {
  if (!fabricObject) return null;

  let minX, minY, maxX, maxY;
  let pathData = '';

  if (typeof pointsOrPath === 'string') {
    pathData = pointsOrPath;
    // For path string, we need to calculate bounding box if not provided
    // But we can get it from the fabricObject if it's a path, or we can use a temporary path object
    const tempPath = new fabric.Path(pathData);
    const br = tempPath.getBoundingRect();
    minX = br.left;
    minY = br.top;
    maxX = br.left + br.width;
    maxY = br.top + br.height;
  } else {
    if (pointsOrPath.length < 3) return null;
    minX = Math.min(...pointsOrPath.map(p => p.x));
    minY = Math.min(...pointsOrPath.map(p => p.y));
    maxX = Math.max(...pointsOrPath.map(p => p.x));
    maxY = Math.max(...pointsOrPath.map(p => p.y));
    
    // Create path data from points
    pointsOrPath.forEach((p, i) => {
      pathData += (i === 0 ? 'M ' : ' L ') + `${p.x} ${p.y}`;
    });
    pathData += ' Z';
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  // Criamos um canvas temporário para o recorte
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return null;

  // Desenha o polígono de recorte no canvas temporário
  ctx.save();
  ctx.translate(-minX, -minY);
  const p2d = new Path2D(pathData);
  ctx.clip(p2d);

  // Agora desenhamos o objeto original no canvas temporário
  fabricObject.setCoords();
  
  // O render do Fabric irá desenhar o objeto em suas coordenadas world (left, top)
  // Como já transladamos o ctx por (-minX, -minY), ele cairá no lugar certo 
  // do nosso canvas de recorte.
  fabricObject.render(ctx);
  
  ctx.restore();

  return tempCanvas.toDataURL('image/png');
}

/**
 * Apaga a região dentro do polígono ou caminho de um objeto Fabric (Image)
 * de forma a preservar a resolução original da imagem.
 * Retorna um novo dataURL da imagem modificada.
 */
export async function erasePolygonRegion(
  fabricObject: any,
  pointsOrPath: LassoPoint[] | string
): Promise<string | null> {
  if (!fabricObject || fabricObject.type !== 'image') return null;

  const imageElement = fabricObject.getElement();
  if (!imageElement) return null;

  const originalWidth = imageElement.width || imageElement.naturalWidth;
  const originalHeight = imageElement.height || imageElement.naturalHeight;

  // Criamos um canvas com a resolução ORIGINAL da imagem
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = originalWidth;
  tempCanvas.height = originalHeight;
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return null;

  // Desenha a imagem original completa
  ctx.drawImage(imageElement, 0, 0);

  // Agora precisamos transformar os pontos da seleção (que estão no mundo do canvas)
  // para as coordenadas locais da imagem (0 a originalWidth, 0 a originalHeight).
  
  // O Fabric tem uma função utilitária para isso
  const worldToLocal = (p: LassoPoint) => {
    const point = new fabric.Point(p.x, p.y);
    // toLocalPoint com 'left' e 'top' retorna a coordenada relativa ao canto superior esquerdo do objeto
    return fabricObject.toLocalPoint(point, 'left', 'top');
  };

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();

  if (typeof pointsOrPath === 'string') {
    // Para simplificar paths complexos em coordenadas locais, 
    // idealmente converteríamos o path inteiro, mas aqui vamos 
    // usar a estratégia visual se for string por agora ou falhar graciosamente.
    // NOTA: No sistema atual as seleções manuais passam pontos.
  } else {
    pointsOrPath.forEach((p, i) => {
      const lp = worldToLocal(p);
      if (i === 0) ctx.moveTo(lp.x, lp.y);
      else ctx.lineTo(lp.x, lp.y);
    });
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.restore();

  return tempCanvas.toDataURL('image/png');
}
