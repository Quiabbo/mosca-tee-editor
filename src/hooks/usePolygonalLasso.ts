import { useState, useCallback, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import {
  createLassoState,
  isNearStartPoint,
  eventToCanvasPoint,
  extractPolygonRegion,
  erasePolygonRegion,
  type LassoPoint,
} from '../tools/PolygonalLassoTool';

export function usePolygonalLasso(
  fabricCanvas: any,
  isActiveTool: boolean,  // true quando a ferramenta está selecionada na toolbar
  documentWidth: number,
  documentHeight: number,
  saveToHistory: (canvas: any) => void
) {
  const [state, setState] = useState(createLassoState());
  const stateRef = useRef(state);
  stateRef.current = state;

  const lastActiveObjectRef = useRef<any>(null);

  // Ativar/desativar modo de desenho no Fabric
  useEffect(() => {
    if (!fabricCanvas) return;
    if (isActiveTool) {
      // Capturar objeto ativo antes de desativar seleção
      lastActiveObjectRef.current = fabricCanvas.getActiveObject();
      
      fabricCanvas.isDrawingMode = false;
      fabricCanvas.selection     = false;
      fabricCanvas.discardActiveObject();
      fabricCanvas.defaultCursor = 'crosshair';
      fabricCanvas.hoverCursor   = 'crosshair';
      fabricCanvas.getObjects().forEach((o: any) => { o.selectable = false; o.evented = false; });
      setState(s => ({ ...s, active: true }));
    } else {
      // Restaurar ao desativar
      fabricCanvas.selection     = true;
      fabricCanvas.defaultCursor = 'default';
      fabricCanvas.hoverCursor   = 'move';
      fabricCanvas.getObjects().forEach((o: any) => { o.selectable = true; o.evented = true; });
      setState(createLassoState());
      lastActiveObjectRef.current = null;
    }
    fabricCanvas.renderAll();
  }, [fabricCanvas, isActiveTool]);

  // Handler de clique no canvas
  const handleCanvasClick = useCallback((e: MouseEvent) => {
    if (!isActiveTool || !fabricCanvas) return;
    const s = stateRef.current;
    if (s.selectionClosed) return;

    const point = eventToCanvasPoint(e, fabricCanvas);

    // Fechar polígono se clicou perto do ponto inicial
    if (s.points.length >= 3 && isNearStartPoint(point, s.points[0])) {
      setState(prev => ({ ...prev, selectionClosed: true, drawing: false }));
      return;
    }

    setState(prev => ({
      ...prev,
      drawing: true,
      points: [...prev.points, point],
      mousePos: point,
    }));
  }, [isActiveTool, fabricCanvas]);

  // Handler de duplo clique — fechar polígono
  const handleDblClick = useCallback((e: MouseEvent) => {
    if (!isActiveTool || !fabricCanvas) return;
    const s = stateRef.current;
    if (s.points.length >= 3) {
      setState(prev => ({ ...prev, selectionClosed: true, drawing: false }));
    }
  }, [isActiveTool, fabricCanvas]);

  // Handler de movimento do mouse
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActiveTool || !fabricCanvas) return;
    const s = stateRef.current;
    if (!s.drawing && s.points.length === 0) return;

    const point = eventToCanvasPoint(e, fabricCanvas);
    const nearStart = s.points.length >= 3
      ? isNearStartPoint(point, s.points[0])
      : false;

    setState(prev => ({
      ...prev,
      mousePos: point,
      nearStartPoint: nearStart,
    }));

    // Update cursor based on state
    if (fabricCanvas) {
      fabricCanvas.defaultCursor = 'crosshair';
      fabricCanvas.hoverCursor = 'crosshair';
    }
  }, [isActiveTool, fabricCanvas]);

  // Tecla Escape — cancelar, Enter — fechar
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActiveTool) return;
    if (e.key === 'Escape') {
      setState(createLassoState());
      setState(s => ({ ...s, active: true })); // manter ativa, só limpar
    } else if (e.key === 'Enter') {
      const s = stateRef.current;
      if (s.points.length >= 3) {
        setState(prev => ({ ...prev, selectionClosed: true, drawing: false }));
      }
    } else if (e.key === 'Alt') {
      setState(prev => ({ ...prev, altPressed: true }));
    }
  }, [isActiveTool]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Alt') {
      setState(prev => ({ ...prev, altPressed: false }));
    }
  }, []);

  // Registrar/desregistrar eventos
  useEffect(() => {
    if (!isActiveTool) return;
    const el = fabricCanvas?.getElement()?.parentElement ?? document;
    el.addEventListener('click',    handleCanvasClick);
    el.addEventListener('dblclick', handleDblClick);
    el.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      el.removeEventListener('click',    handleCanvasClick);
      el.removeEventListener('dblclick', handleDblClick);
      el.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isActiveTool, handleCanvasClick, handleDblClick, handleMouseMove, handleKeyDown, handleKeyUp, fabricCanvas]);

  const findTargetObject = useCallback(() => {
    const s = stateRef.current;
    if (!fabricCanvas || s.points.length < 3) return null;

    // 1. Preferir o objeto que estava selecionado antes de entrar no laço
    if (lastActiveObjectRef.current && lastActiveObjectRef.current.canvas) {
      const obj = lastActiveObjectRef.current;
      // Verifica se o laço intersecta ou contém o objeto (simplificado: verifica centro do laço)
      const cx = s.points.reduce((a, p) => a + p.x, 0) / s.points.length;
      const cy = s.points.reduce((a, p) => a + p.y, 0) / s.points.length;
      if (obj.containsPoint({ x: cx, y: cy })) {
        return obj;
      }
    }

    // 2. Procurar objeto de cima para baixo que contenha o centro do laço
    const cx = s.points.reduce((a, p) => a + p.x, 0) / s.points.length;
    const cy = s.points.reduce((a, p) => a + p.y, 0) / s.points.length;

    const objects = fabricCanvas.getObjects();
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (obj.id === 'artboard_bg' || obj.id === 'grid_rect' || obj.excludeFromExport) continue;
      
      if (obj.containsPoint({ x: cx, y: cy })) {
        return obj;
      }
    }

    // 3. Fallback: procurar qualquer objeto que intersecte o bounding box do laço
    const minX = Math.min(...s.points.map(p => p.x));
    const minY = Math.min(...s.points.map(p => p.y));
    const maxX = Math.max(...s.points.map(p => p.x));
    const maxY = Math.max(...s.points.map(p => p.y));
    
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (obj.id === 'artboard_bg' || obj.id === 'grid_rect' || obj.excludeFromExport) continue;
      
      const br = obj.getBoundingRect();
      if (!(br.left > maxX || br.left + br.width < minX || br.top > maxY || br.top + br.height < minY)) {
        return obj;
      }
    }

    return null;
  }, [fabricCanvas]);

  const actionCropAsObject = useCallback(async () => {
    const s = stateRef.current;
    if (!fabricCanvas || !s.selectionClosed || s.points.length < 3) return;

    const targetObj = findTargetObject();
    if (!targetObj) {
      setState(createLassoState());
      setState(sv => ({ ...sv, active: true }));
      return;
    }

    const dataUrl = await extractPolygonRegion(
      targetObj,
      s.points,
      documentWidth,
      documentHeight
    );

    if (!dataUrl) { setState(createLassoState()); return; }

    const minX = Math.min(...s.points.map(p => p.x));
    const minY = Math.min(...s.points.map(p => p.y));

    fabric.Image.fromURL(dataUrl, (img: any) => {
      img.set({ 
        left: minX, 
        top: minY, 
        selectable: true, 
        evented: true,
        id: `crop_${Date.now()}`
      });
      fabricCanvas.add(img);
      fabricCanvas.setActiveObject(img);
      fabricCanvas.renderAll();
      
      // Trigger history save if available in parent
      if (fabricCanvas.fire) fabricCanvas.fire('object:added', { target: img });
    }, { crossOrigin: 'anonymous' });

    setState(createLassoState());
    setState(sv => ({ ...sv, active: true }));
  }, [fabricCanvas, documentWidth, documentHeight, findTargetObject]);

  const actionApplyAsMask = useCallback(() => {
    const s = stateRef.current;
    if (!fabricCanvas || !s.selectionClosed || s.points.length < 3) return;

    const targetObj = findTargetObject();
    if (!targetObj) {
      setState(createLassoState());
      setState(sv => ({ ...sv, active: true }));
      return;
    }

    const minX = Math.min(...s.points.map(p => p.x));
    const minY = Math.min(...s.points.map(p => p.y));
    
    // Criar polígono Fabric como clipPath
    // Precisamos converter pontos globais para locais do objeto
    // Fabric clipPath usa coordenadas relativas ao centro do objeto por padrão se originX/Y for center
    // Mas se usarmos absolutePositioned: true, podemos usar coordenadas globais
    
    const clipPoly = new fabric.Polygon(s.points.map(p => ({ x: p.x, y: p.y })), {
      absolutePositioned: true,
    });
    
    targetObj.set({
      clipPath: clipPoly,
      dirty: true
    });
    
    fabricCanvas.renderAll();
    if (fabricCanvas.fire) fabricCanvas.fire('object:modified', { target: targetObj });

    setState(createLassoState());
    setState(sv => ({ ...sv, active: true }));
  }, [fabricCanvas, findTargetObject]);

  const actionDelete = useCallback(async () => {
    const s = stateRef.current;
    if (!fabricCanvas || !s.selectionClosed || s.points.length < 3) return;

    const targetObj = findTargetObject();
    if (!targetObj) {
      setState(createLassoState());
      setState(sv => ({ ...sv, active: true }));
      return;
    }

    if (targetObj.type === 'image') {
      // Apagar pixels da imagem
      const newDataUrl = await erasePolygonRegion(targetObj, s.points);
      if (newDataUrl) {
        targetObj.setSrc(newDataUrl, () => {
          fabricCanvas.renderAll();
          if (fabricCanvas.fire) fabricCanvas.fire('object:modified', { target: targetObj });
        }, { crossOrigin: 'anonymous' });
      }
    } else {
      // Para outros objetos, apenas remove o objeto inteiro se estiver sob a seleção
      fabricCanvas.remove(targetObj);
      if (fabricCanvas.fire) fabricCanvas.fire('object:removed', { target: targetObj });
    }

    fabricCanvas.renderAll();
    setState(createLassoState());
    setState(sv => ({ ...sv, active: true }));
  }, [fabricCanvas, findTargetObject]);

  const actionCutAsObject = useCallback(async () => {
    const s = stateRef.current;
    if (!fabricCanvas || !s.selectionClosed || s.points.length < 3) return;

    const targetObj = findTargetObject();
    if (!targetObj) {
      setState(createLassoState());
      setState(sv => ({ ...sv, active: true }));
      return;
    }

    // 1. Extrair
    const dataUrl = await extractPolygonRegion(
      targetObj,
      s.points,
      documentWidth,
      documentHeight
    );

    if (!dataUrl) { setState(createLassoState()); return; }

    // 2. Apagar do original (se for imagem)
    if (targetObj.type === 'image') {
      const newDataUrl = await erasePolygonRegion(targetObj, s.points);
      if (newDataUrl) {
        targetObj.setSrc(newDataUrl, () => {
          fabricCanvas.renderAll();
        }, { crossOrigin: 'anonymous' });
      }
    } else {
      // Para outros, removemos o objeto se ele estiver totalmente contido? 
      // Ou apenas deixamos como está. Geralmente "Cut" em vetor é remover o objeto.
      // Mas aqui o laço é raster.
    }

    // 3. Adicionar novo
    const minX = Math.min(...s.points.map(p => p.x));
    const minY = Math.min(...s.points.map(p => p.y));

    fabric.Image.fromURL(dataUrl, (img: any) => {
      img.set({ 
        left: minX, 
        top: minY, 
        selectable: true, 
        evented: true,
        id: `crop_${Date.now()}`
      });
      fabricCanvas.add(img);
      fabricCanvas.setActiveObject(img);
      fabricCanvas.renderAll();
      if (fabricCanvas.fire) fabricCanvas.fire('object:added', { target: img });
    }, { crossOrigin: 'anonymous' });

    setState(createLassoState());
    setState(sv => ({ ...sv, active: true }));
  }, [fabricCanvas, documentWidth, documentHeight, findTargetObject]);

  const actionExtractOnly = useCallback(async () => {
    const s = stateRef.current;
    if (!fabricCanvas || !s.selectionClosed || s.points.length < 3) return null;

    const targetObj = findTargetObject();
    if (!targetObj) return null;

    const dataUrl = await extractPolygonRegion(
      targetObj,
      s.points,
      documentWidth,
      documentHeight
    );

    if (!dataUrl) return null;

    const minX = Math.min(...s.points.map(p => p.x));
    const minY = Math.min(...s.points.map(p => p.y));

    return new Promise<any>((resolve) => {
      fabric.Image.fromURL(dataUrl, (img: any) => {
        img.set({ 
          left: minX, 
          top: minY, 
          selectable: true, 
          evented: true,
          backgroundColor: null,
          id: `crop_${Date.now()}`
        });
        resolve(img);
      }, { crossOrigin: 'anonymous' });
    });
  }, [fabricCanvas, documentWidth, documentHeight, findTargetObject]);

  const actionCutOnly = useCallback(async () => {
    const s = stateRef.current;
    if (!fabricCanvas || !s.selectionClosed || s.points.length < 3) return null;

    const targetObj = findTargetObject();
    if (!targetObj) return null;

    const dataUrl = await extractPolygonRegion(
      targetObj,
      s.points,
      documentWidth,
      documentHeight
    );

    if (!dataUrl) return null;

    // Apagar a área no original
    const erasedUrl = await erasePolygonRegion(
      targetObj,
      s.points
    );

    if (erasedUrl) {
      if (targetObj.type === 'image') {
        (targetObj as any).setSrc(erasedUrl, () => {
          fabricCanvas.renderAll();
          saveToHistory(fabricCanvas);
        });
      } else {
        // Para outros tipos, rasterizamos o resultado
        fabric.Image.fromURL(erasedUrl, (img: any) => {
          img.set({
            left: targetObj.left,
            top: targetObj.top,
            scaleX: targetObj.scaleX,
            scaleY: targetObj.scaleY,
            angle: targetObj.angle,
          });
          fabricCanvas.add(img);
          fabricCanvas.remove(targetObj);
          fabricCanvas.renderAll();
          saveToHistory(fabricCanvas);
        });
      }
    }

    const minX = Math.min(...s.points.map(p => p.x));
    const minY = Math.min(...s.points.map(p => p.y));

    const extracted = await new Promise<any>((resolve) => {
      fabric.Image.fromURL(dataUrl, (img: any) => {
        img.set({
          left: minX,
          top: minY,
          selectable: true,
          evented: true,
          id: `crop_${Date.now()}`
        });
        resolve(img);
      }, { crossOrigin: 'anonymous' });
    });

    // Fechar seleção
    setState(createLassoState());
    setState(sv => ({ ...sv, active: true }));

    return extracted;
  }, [fabricCanvas, documentWidth, documentHeight, findTargetObject, saveToHistory]);

  const cancelSelection = useCallback(() => {
    setState(createLassoState());
    setState(s => ({ ...s, active: true }));
  }, []);

  return {
    lassoState: state,
    actionCropAsObject,
    actionCutAsObject,
    actionExtractOnly,
    actionCutOnly,
    actionApplyAsMask,
    actionDelete,
    cancelSelection,
  };
}
