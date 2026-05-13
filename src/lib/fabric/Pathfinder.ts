import { fabric } from 'fabric';
import paper from 'paper';

// Inicializar o paper em um escopo "headless"
const hiddenCanvas = document.createElement('canvas');
paper.setup(hiddenCanvas);

export type PathfinderOperation = 'union' | 'subtract' | 'intersect' | 'exclude';

export class Pathfinder {
  /**
   * Executa uma operação de Pathfinder entre os objetos selecionados.
   * @param canvas O canvas do Fabric
   * @param operation A operação a ser executada
   */
  static async apply(canvas: fabric.Canvas, operation: PathfinderOperation) {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length < 2) return null;

    // Se estiverem em uma seleção ativa, precisamos das coordenadas reais do mundo
    // O Fabric.js lida com isso automaticamente ao pegar getActiveObjects(), 
    // mas o toSVG() pode se comportar de forma diferente se não estivermos atentos.

    // Ordenar objetos pela ordem de empilhamento (do fundo para o topo)
    const sortedObjects = [...activeObjects].sort((a, b) => {
      const allObjects = canvas.getObjects();
      return allObjects.indexOf(a) - allObjects.indexOf(b);
    });

    try {
      // 1. Converter objetos Fabric para caminhos do Paper.js
      const paperItems: paper.PathItem[] = [];

      for (const obj of sortedObjects) {
        // Para garantir coordenadas globais corretas, vamos clonar o objeto e garantir 
        // que ele tenha as propriedades de mundo aplicadas se estiver em um grupo (seleção ativa)
        const clone = await new Promise<fabric.Object>((resolve) => {
          obj.clone((cloned: fabric.Object) => {
            // Pegar a matriz de transformação real do objeto no mundo
            const transform = obj.calcTransformMatrix();
            // Decompor a matriz para obter as propriedades individuais
            const options = fabric.util.qrDecompose(transform) as any;
            
            // Forçamos a origem para 'left'/'top' tanto no clone quanto no resultado final
            // para que a posição translateX/Y corresponda exatamente ao canto superior esquerdo.
            cloned.set({
              originX: 'left',
              originY: 'top',
              left: options.translateX,
              top: options.translateY,
              scaleX: options.scaleX,
              scaleY: options.scaleY,
              angle: options.angle,
              skewX: options.skewX,
              skewY: options.skewY,
            });
            
            // @ts-ignore
            cloned.group = undefined;
            cloned.setCoords();
            resolve(cloned);
          });
        });

        const svgString = clone.toSVG();
        const item = paper.project.importSVG(svgString) as paper.Item;
        
        // Achatar grupos para obter caminhos simples
        const pathItem = this.convertToPathItem(item);
        if (pathItem) {
          paperItems.push(pathItem);
        }
      }

      if (paperItems.length < 2) {
        console.warn('Não foi possível obter caminhos válidos o suficiente para a operação.');
        this.cleanup();
        return null;
      }

      // 2. Executar a operação booleana sequencialmente
      let result = paperItems[0];
      
      for (let i = 1; i < paperItems.length; i++) {
        const next = paperItems[i];
        
        const prevResult = result;
        switch (operation) {
          case 'union':
            result = result.unite(next) as paper.PathItem;
            break;
          case 'subtract':
            // Minus Front: O objeto de cima (next) subtrai o de baixo (result)
            result = result.subtract(next) as paper.PathItem;
            break;
          case 'intersect':
            result = result.intersect(next) as paper.PathItem;
            break;
          case 'exclude':
            result = result.exclude(next) as paper.PathItem;
            break;
        }
        
        // Limpeza intermediária para evitar vazamento de memória no paper
        if (prevResult !== result) prevResult.remove();
        next.remove();
      }

      // 3. Converter de volta para Fabric
      // Exportamos como string e envolvemos em uma tag <svg> para garantir um carregamento correto
      const svgString = result.exportSVG({ asString: true }) as string;
      const svgOutput = `<svg xmlns="http://www.w3.org/2000/svg">${svgString}</svg>`;
      
      // Bounds calculados pelo Paper.js. Usamos 'bounds' (que inclui o stroke) 
      // mas como forçamos a origem para 'left'/'top' em ambos os lados, o alinhamento deve ser corrigido.
      const resultBounds = result.bounds;
      
      this.cleanup();

      // 4. Carregar o SVG resultante de volta no Fabric
      return new Promise<fabric.Object | null>((resolve) => {
        fabric.loadSVGFromString(svgOutput, (objects, options) => {
          if (!objects || objects.length === 0) {
            resolve(null);
            return;
          }

          // Usar utilitário do Fabric para agrupar elementos se necessário
          let resultObj = fabric.util.groupSVGElements(objects, options);
          
          // Aplicamos as propriedades básicas do primeiro objeto original (fundo) para manter o estilo
          const baseObj = sortedObjects[0];
          resultObj.set({
            fill: baseObj.fill,
            stroke: baseObj.stroke,
            strokeWidth: baseObj.strokeWidth,
            originX: 'left',
            originY: 'top',
            left: resultBounds.left,
            top: resultBounds.top,
          });
          
          resultObj.setCoords();

          // Remover os originais e adicionar o novo
          sortedObjects.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.add(resultObj);
          canvas.setActiveObject(resultObj);
          canvas.requestRenderAll();

          resolve(resultObj);
        });
      });

    } catch (error) {
      console.error('Erro ao executar Pathfinder:', error);
      this.cleanup();
      return null;
    }
  }

  private static convertToPathItem(item: paper.Item): paper.PathItem | null {
    if (item instanceof paper.PathItem) {
      return item;
    }
    
    // Converter Shapes (Circle, Rectangle, etc) para caminhos reais
    if ((item as any).toPath) {
      try {
        const path = (item as any).toPath();
        item.remove();
        return path;
      } catch (e) {
        console.warn('Falha ao converter item para path:', e);
      }
    }

    if (item instanceof paper.Group) {
      // Se for um grupo, tentamos unir todos os seus filhos PathItems em um só
      let combined: paper.PathItem | null = null;
      // Clonamos a lista de filhos porque removeremos itens durante o processamento
      const children = [...item.children];
      for (const child of children) {
        const path = this.convertToPathItem(child);
        if (path) {
          if (!combined) {
            combined = path;
          } else {
            const nextCombined = combined.unite(path) as paper.PathItem;
            combined.remove();
            path.remove();
            combined = nextCombined;
          }
        }
      }
      item.remove();
      return combined;
    }
    
    return null;
  }

  private static cleanup() {
    paper.project.activeLayer.removeChildren();
  }
}
