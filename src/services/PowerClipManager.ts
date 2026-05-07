import { fabric } from 'fabric';

// ─────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────

export interface PowerClip {
  id: string;
  proxy: fabric.Rect;
  container: fabric.Object & {
    _origFill?: string | fabric.Pattern | fabric.Gradient;
    _origStroke?: string;
    _origSWidth?: number;
    _pcContainer?: boolean;
    _pcId?: string;
    powerClipGroupId?: string;
    powerClipRole?: string;
  };
  content: fabric.Object & {
    _pcContent?: boolean;
    _pcId?: string;
    _savedOpacity?: number;
    powerClipGroupId?: string;
    powerClipRole?: string;
  };
  locked: boolean;
}

// ─────────────────────────────────────────────
//  PowerClipManager
// ─────────────────────────────────────────────

export class PowerClipManager {
  private cvs: fabric.Canvas;
  public clips: Map<string, PowerClip>;
  public editingId: string | null = null;
  private _editGuide: fabric.Object | null = null;
  public placementMode: boolean = false;
  public placementContent: any = null;
  private _dragStart: any = null;
  private _idCounter: number = 0;
  private onStatusChange?: (msg: string, type: string) => void;
  private onUIUpdate?: () => void;

  // ── Histórico de undo/redo ──────────────────
  // Nota: O histórico principal é gerenciado pelo MoscaTeePage.
  // O PCM foca em reidratar os vínculos após loadFromJSON.
  private _ignoreHistory: boolean = false;

  constructor(
    cvs: fabric.Canvas,
    options?: {
      onStatusChange?: (msg: string, type: string) => void;
      onUIUpdate?: () => void;
    }
  ) {
    this.cvs = cvs;
    this.clips = new Map();
    this.onStatusChange = options?.onStatusChange;
    this.onUIUpdate = options?.onUIUpdate;
    this._bindEvents();
  }

  // ─────────────────────────────────────────────
  //  Utilitários internos
  // ─────────────────────────────────────────────

  private _uid() {
    return 'pc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  }

  private _safeSetCoords(obj: fabric.Object) {
    if (obj && obj.canvas) obj.setCoords();
  }

  private setStatus(msg: string, type: string = '') {
    if (this.onStatusChange) this.onStatusChange(msg, type);
  }

  private _syncUI() {
    if (this.onUIUpdate) this.onUIUpdate();
  }

  // ─────────────────────────────────────────────
  //  Eventos do canvas
  // ─────────────────────────────────────────────

  private _bindEvents() {
    const c = this.cvs;

    // ── mouse:down ──────────────────────────────
    c.on('mouse:down', (e) => {
      const obj = e.target;
      if (obj && (obj as any)._pcProxy) {
        const clip = this.clips.get((obj as any)._pcId);
        if (!clip) return;

        // Desabilitar cache durante transformação
        clip.container.set('objectCaching', false);
        clip.content.set('objectCaching', false);

        // Calcular posição do centro do content em espaço local do proxy
        // Isso permite manter a posição relativa exata durante rotação/escala do proxy
        const pMatrix = obj.calcTransformMatrix();
        const pInvMatrix = fabric.util.invertTransform(pMatrix);
        const cCenter = clip.content.getCenterPoint();
        const localCenter = fabric.util.transformPoint(cCenter, pInvMatrix);

        this._dragStart = {
          // Proxy inicial
          pL: obj.left,
          pT: obj.top,
          pSX: obj.scaleX,
          pSY: obj.scaleY,
          pA: obj.angle,

          // Container inicial
          cL: clip.container.left,
          cT: clip.container.top,
          cSX: clip.container.scaleX,
          cSY: clip.container.scaleY,
          cA: clip.container.angle,

          // Content inicial
          iSX: clip.content.scaleX,
          iSY: clip.content.scaleY,
          iA: clip.content.angle,
          localCenter,
        };
      } else {
        this._dragStart = null;
      }
    });

    // ── Sincronização durante transforms ────────
    const syncAction = (e: fabric.IEvent) => {
      const obj = e.target;
      if (!obj || !(obj as any)._pcProxy || !this._dragStart) return;
      const clip = this.clips.get((obj as any)._pcId);
      if (!clip) return;

      const dx = (obj.left ?? 0) - this._dragStart.pL;
      const dy = (obj.top ?? 0) - this._dragStart.pT;
      const ratioX = (obj.scaleX ?? 1) / (this._dragStart.pSX || 1);
      const ratioY = (obj.scaleY ?? 1) / (this._dragStart.pSY || 1);
      const da = (obj.angle ?? 0) - (this._dragStart.pA ?? 0);

      // 1. Sincronizar container com proxy (offset linear + escala/rotação)
      clip.container.set({
        left: this._dragStart.cL + dx,
        top: this._dragStart.cT + dy,
        scaleX: this._dragStart.cSX * ratioX,
        scaleY: this._dragStart.cSY * ratioY,
        angle: this._dragStart.cA + da,
      });
      clip.container.setCoords();

      // 2. Sincronizar conteúdo mantendo posição relativa ao proxy via matriz
      const currentProxyMatrix = obj.calcTransformMatrix();
      const newGlobalPoint = fabric.util.transformPoint(
        this._dragStart.localCenter,
        currentProxyMatrix
      );

      clip.content.setPositionByOrigin(newGlobalPoint, 'center', 'center');
      clip.content.set({
        scaleX: this._dragStart.iSX * ratioX,
        scaleY: this._dragStart.iSY * ratioY,
        angle: this._dragStart.iA + da,
        dirty: true,
      });
      clip.content.setCoords();

      // 3. Recriar clipPath SEMPRE a partir do container atualizado (mais robusto que tentar atualizar o clipPath manual)
      clip.content.clipPath = this._makeClipShape(clip.container);

      c.requestRenderAll();
    };

    c.on('object:moving', syncAction);
    c.on('object:scaling', syncAction);
    c.on('object:rotating', syncAction);
    c.on('object:modified', (e) => {
      syncAction(e);
    });

    // ── mouse:up ────────────────────────────────
    c.on('mouse:up', (e) => {
      const obj = e.target;
      if (obj && (obj as any)._pcProxy) {
        const clip = this.clips.get((obj as any)._pcId);
        if (clip) {
          clip.container.set('objectCaching', true);
          clip.content.set('objectCaching', true);
        }
      }

      if (!this.placementMode) return;
      const target = e.target;
      if (!target) {
        this.cancelPlacement();
        return;
      }
      if (target === this.placementContent) return;
      if (
        (target as any)._pcProxy ||
        (target as any)._pcContent ||
        (target as any)._pcContainer
      )
        return;

      this._applyClip(this.placementContent, target);
    });

    // ── Seleção ─────────────────────────────────
    c.on('selection:created', () => this._syncUI());
    c.on('selection:updated', () => this._syncUI());
    c.on('selection:cleared', () => this._syncUI());
  }

  // ─────────────────────────────────────────────
  //  Modo de posicionamento (placement)
  // ─────────────────────────────────────────────

  public startPlacement(contentObj: any) {
    if (!contentObj) return;
    this.placementMode = true;
    this.placementContent = contentObj;
    contentObj._savedOpacity = contentObj.opacity;
    contentObj.set({ opacity: 0.45 });
    this.cvs.discardActiveObject();
    this.cvs.renderAll();
    this.cvs.defaultCursor = 'crosshair';
    this.cvs.hoverCursor = 'crosshair';
    this.setStatus('🎯 Clique no objeto que será o frame container...', 'info');
    this._syncUI();
  }

  public cancelPlacement() {
    if (!this.placementMode) return;
    if (this.placementContent) {
      this.placementContent.set({
        opacity: this.placementContent._savedOpacity ?? 1,
      });
    }
    this.placementMode = false;
    this.placementContent = null;
    this.cvs.defaultCursor = 'default';
    this.cvs.hoverCursor = 'move';
    this.cvs.renderAll();
    this.setStatus('Cancelado.', 'warn');
    this._syncUI();
  }

  // ─────────────────────────────────────────────
  //  Criar PowerClip
  // ─────────────────────────────────────────────

  private _applyClip(contentObj: any, containerObj: any) {
    const id = this._uid();
    contentObj.set({ opacity: contentObj._savedOpacity ?? 1 });
    delete contentObj._savedOpacity;

    // Proxy espelha o container exatamente
    const proxy = new fabric.Rect({
      left: containerObj.left,
      top: containerObj.top,
      width: containerObj.width,
      height: containerObj.height,
      scaleX: containerObj.scaleX,
      scaleY: containerObj.scaleY,
      angle: containerObj.angle,
      originX: containerObj.originX,
      originY: containerObj.originY,
      fill: 'rgba(255,255,255,0.01)',
      stroke: 'transparent',
      strokeWidth: 0,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      transparentCorners: false,
      cornerColor: '#3b82f6',
      cornerStrokeColor: '#ffffff',
      cornerSize: 8,
      borderColor: '#3b82f6',
      perPixelTargetFind: false,
    }) as any;

    if (containerObj.type === 'rect') {
      proxy.set({
        rx: (containerObj as fabric.Rect).rx,
        ry: (containerObj as fabric.Rect).ry,
      });
    }

    // 1. Configurar flags e roles de PowerClip
    proxy._pcProxy = true;
    proxy._pcId = id;
    proxy.powerClipGroupId = id;
    proxy.powerClipRole = 'proxy';

    contentObj._pcContent = true;
    contentObj._pcId = id;
    contentObj.powerClipGroupId = id;
    contentObj.powerClipRole = 'content';
    contentObj.selectable = false;
    contentObj.evented = false;

    containerObj._pcContainer = true;
    containerObj._pcId = id;
    containerObj.powerClipGroupId = id;
    containerObj.powerClipRole = 'container';
    containerObj.selectable = false;
    containerObj.evented = false;
    containerObj._origFill = containerObj.fill;
    containerObj._origStroke = containerObj.stroke;
    containerObj._origSWidth = containerObj.strokeWidth;
    containerObj.set({
      fill: 'transparent',
    });

    this.clips.set(id, {
      id,
      proxy,
      container: containerObj,
      content: contentObj,
      locked: false,
    });

    // 2. Preencher e centralizar ANTES de criar o clipPath
    // Isso garante que capturamos a posição final correta
    const clip = this.clips.get(id)!;
    this._fillClip(clip);

    // 3. Criar clipPath baseado no container final
    const clipShape = this._makeClipShape(containerObj);
    contentObj.set({ clipPath: clipShape, dirty: true });

    this.cvs.add(proxy);
    this.cvs.bringToFront(proxy);

    this.placementMode = false;
    this.placementContent = null;
    this.cvs.defaultCursor = 'default';
    this.cvs.hoverCursor = 'move';

    this.cvs.setActiveObject(proxy);
    this.cvs.renderAll();

    this.setStatus('✅ PowerClip criado!', 'ok');
    this._syncUI();
  }

  // ─────────────────────────────────────────────
  //  Clonar
  // ─────────────────────────────────────────────

  public async cloneClip(id: string): Promise<string | null> {
    const clip = this.clips.get(id);
    if (!clip) return null;

    return new Promise((resolve) => {
      clip.container.clone((clonedContainer: any) => {
        clip.content.clone((clonedContent: any) => {
          const newId = `pc_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 5)}`;

          const container = clonedContainer as fabric.Object & any;
          const content = clonedContent as fabric.Object & any;

          container.set({ selectable: false, evented: false });
          container._pcContainer = true;
          container._pcId = newId;
          container._origFill = clip.container._origFill;
          container._origStroke = clip.container._origStroke;
          container._origSWidth = clip.container._origSWidth;

          content._pcContent = true;
          content._pcId = newId;
          content.set({ selectable: false, evented: false });

          const newClipPath = this._makeClipShape(container);
          content.set({ clipPath: newClipPath });

          this.cvs.add(content);
          this.cvs.add(container);

          const proxy = new fabric.Rect({
            left: (clip.proxy.left ?? 0) + 20,
            top: (clip.proxy.top ?? 0) + 20,
            width: clip.proxy.width,
            height: clip.proxy.height,
            scaleX: clip.proxy.scaleX,
            scaleY: clip.proxy.scaleY,
            angle: clip.proxy.angle,
            fill: 'rgba(255,255,255,0.01)',
            stroke: 'transparent',
            selectable: true,
            evented: true,
            perPixelTargetFind: false,
          }) as any;

          proxy._pcProxy = true;
          proxy._pcId = newId;
          proxy.name = (clip.proxy as any).name || 'PowerClip';

          this.clips.set(newId, {
            id: newId,
            proxy,
            container,
            content,
            locked: false,
          });

          this.cvs.add(proxy);
          this.cvs.bringToFront(proxy);
          this.cvs.setActiveObject(proxy);
          this.cvs.renderAll();

          resolve(newId);
        });
      });
    });
  }

  // ─────────────────────────────────────────────
  //  Formas auxiliares
  // ─────────────────────────────────────────────

  private _makeClipShape(src: fabric.Object): fabric.Object {
    const center = src.getCenterPoint();
    const w = src.getScaledWidth();
    const h = src.getScaledHeight();

    const base: any = {
      originX: 'center',
      originY: 'center',
      left: center.x,
      top: center.y,
      width: w,
      height: h,
      scaleX: 1,
      scaleY: 1,
      angle: src.angle || 0,
      absolutePositioned: true,
      selectable: false,
      evented: false,
      fill: 'black', // use black for clipping areas in fabric
    };

    switch (src.type) {
      case 'circle': {
        return new fabric.Circle({ ...base, radius: w / 2 });
      }
      case 'ellipse': {
        return new fabric.Ellipse({
          ...base,
          rx: w / 2,
          ry: h / 2,
        });
      }
      case 'triangle':
        return new fabric.Triangle({ ...base });
      default: {
        const rx = ((src as any).rx || 0) * (src.scaleX || 1);
        const ry = ((src as any).ry || 0) * (src.scaleY || 1);
        return new fabric.Rect({
          ...base,
          rx,
          ry,
        });
      }
    }
  }

  private _makeGuideShape(src: fabric.Object): fabric.Object {
    const base = {
      left: src.left,
      top: src.top,
      width: src.width,
      height: src.height,
      scaleX: src.scaleX,
      scaleY: src.scaleY,
      originX: src.originX || 'left',
      originY: src.originY || 'top',
      angle: src.angle || 0,
      fill: 'transparent',
      stroke: '#3b82f6',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      opacity: 0.8,
    };

    switch (src.type) {
      case 'circle':
        return new fabric.Circle({ ...base, radius: (src as fabric.Circle).radius || 50 });
      case 'ellipse':
        return new fabric.Ellipse({
          ...base,
          rx: (src as fabric.Ellipse).rx || 60,
          ry: (src as fabric.Ellipse).ry || 40,
        });
      case 'triangle':
        return new fabric.Triangle({ ...base });
      default:
        return new fabric.Rect({
          ...base,
          rx: (src as fabric.Rect).rx || 0,
          ry: (src as fabric.Rect).ry || 0,
        });
    }
  }

  public enterEditMode() {
    const active = this.cvs.getActiveObject();
    if (active && (active as any)._pcProxy) {
      this.enterEditModeById((active as any)._pcId);
    }
  }

  public enterEditModeById(id: string) {
    if (this.editingId) this.exitEditMode();
    const clip = this.clips.get(id);
    if (!clip) return;

    this.editingId = id;
    clip.proxy.set({ visible: false, selectable: false, evented: false });
    this.cvs.discardActiveObject();

    this._editGuide = this._makeGuideShape(clip.container);
    this.cvs.add(this._editGuide);
    this.cvs.bringToFront(this._editGuide);

    clip.content.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
    });

    if (clip.content.canvas) {
      (clip.content as any)._pcOldIndex = this.cvs.getObjects().indexOf(clip.content);
      clip.content.bringToFront();
      this.cvs.setActiveObject(clip.content);
    }

    this.cvs.renderAll();
    this.setStatus('✏️ Modo edição ativo.', 'info');
    this._syncUI();
  }

  public exitEditMode() {
    if (!this.editingId) return;
    const clip = this.clips.get(this.editingId);

    if (clip) {
      if (this._editGuide) {
        this.cvs.remove(this._editGuide);
        this._editGuide = null;
      }
      clip.content.set({ selectable: false, evented: false });

      if (
        (clip.content as any)._pcOldIndex !== undefined &&
        clip.content.canvas
      ) {
        const index = (clip.content as any)._pcOldIndex;
        if (index >= 0) clip.content.moveTo(index);
        delete (clip.content as any)._pcOldIndex;
      }

      if (clip.proxy.canvas) {
        clip.proxy.set({ visible: true, selectable: true, evented: true });
        this.cvs.setActiveObject(clip.proxy);
      }
    }

    this.editingId = null;
    this.cvs.renderAll();
    this.setStatus('✅ Edição concluída.', 'ok');
    this._syncUI();
  }

  // ─────────────────────────────────────────────
  //  Extrair conteúdo
  // ─────────────────────────────────────────────

  public extractContent() {
    const active = this.cvs.getActiveObject();
    let id: string | null = null;
    if (active && (active as any)._pcProxy) id = (active as any)._pcId;
    else if (this.editingId) id = this.editingId;

    if (!id) return;
    if (this.editingId === id) this.exitEditMode();

    const clip = this.clips.get(id);
    if (!clip) return;

    this.cvs.remove(clip.proxy);

    clip.container.set({
      selectable: true,
      evented: true,
      fill:
        clip.container._origFill !== undefined
          ? clip.container._origFill
          : 'transparent',
      stroke:
        clip.container._origStroke !== undefined
          ? clip.container._origStroke
          : undefined,
      strokeWidth:
        clip.container._origSWidth !== undefined
          ? clip.container._origSWidth
          : 1,
      perPixelTargetFind: false,
    });
    delete clip.container._pcContainer;
    delete clip.container._pcId;

    clip.content.set({ clipPath: undefined, selectable: true, evented: true });
    delete clip.content._pcContent;
    delete clip.content._pcId;

    this.clips.delete(id);
    this.cvs.fire('object:modified');

    this.cvs.setActiveObject(clip.container);
    this.cvs.renderAll();
    this.setStatus('📤 Conteúdo extraído.', 'ok');
    this._syncUI();
  }

  // ─────────────────────────────────────────────
  //  Remover clip
  // ─────────────────────────────────────────────

  public removeClip(id: string) {
    const clip = this.clips.get(id);
    if (!clip) return;

    if (this.editingId === id) this.exitEditMode();
    if (clip.proxy.canvas) this.cvs.remove(clip.proxy);
    if (clip.container.canvas) this.cvs.remove(clip.container);
    if (clip.content.canvas) this.cvs.remove(clip.content);
    this.clips.delete(id);
    this.cvs.fire('object:modified');

    this.cvs.renderAll();
    this._syncUI();
  }

  // ─────────────────────────────────────────────
  //  Helpers de clip ativo
  // ─────────────────────────────────────────────

  private _activeClip(): PowerClip | undefined {
    if (this.editingId) return this.clips.get(this.editingId);
    const a = this.cvs.getActiveObject();
    if (a && (a as any)._pcProxy) return this.clips.get((a as any)._pcId);
    return undefined;
  }

  // ─────────────────────────────────────────────
  //  Ajuste de conteúdo
  // ─────────────────────────────────────────────

  public centerContent() {
    const clip = this._activeClip();
    if (!clip?.content) return;
    const cp = clip.container.getCenterPoint();
    clip.content.setPositionByOrigin(
      new fabric.Point(cp.x, cp.y),
      'center',
      'center'
    );
    this._safeSetCoords(clip.content);
    this.cvs.renderAll();
    this.setStatus('⊕ Centralizado.', 'ok');
  }

  public fitContent() {
    const clip = this._activeClip();
    if (!clip) return;
    const cW = clip.container.getScaledWidth();
    const cH = clip.container.getScaledHeight();
    const iW = clip.content.width;
    const iH = clip.content.height;
    if (!iW || !iH) return;
    const s = Math.min(cW / iW, cH / iH);
    clip.content.set({ scaleX: s, scaleY: s });
    this.centerContent();
  }

  public fillContent() {
    const clip = this._activeClip();
    if (!clip) return;
    this._fillClip(clip);
    this.cvs.renderAll();
    this.setStatus('⊕ Preenchido.', 'ok');
  }

  private _fillClip(clip: PowerClip) {
    if (!clip.content || !clip.container) return;
    const cW = clip.container.getScaledWidth();
    const cH = clip.container.getScaledHeight();
    const iW = clip.content.width;
    const iH = clip.content.height;
    if (!iW || !iH) return;
    const s = Math.max(cW / iW, cH / iH);
    clip.content.set({ scaleX: s, scaleY: s });

    const cp = clip.container.getCenterPoint();
    clip.content.setPositionByOrigin(
      new fabric.Point(cp.x, cp.y),
      'center',
      'center'
    );
    this._safeSetCoords(clip.content);
  }

  public stretchContent() {
    const clip = this._activeClip();
    if (!clip) return;
    const cW = clip.container.getScaledWidth();
    const cH = clip.container.getScaledHeight();
    const iW = clip.content.width;
    const iH = clip.content.height;
    if (!iW || !iH) return;
    clip.content.set({ scaleX: cW / iW, scaleY: cH / iH });
    this.centerContent();
  }

  // ─────────────────────────────────────────────
  //  Reidratação e Sincronização de Histórico Global
  // ─────────────────────────────────────────────

  public clearAllRegistrations() {
    this.clips.clear();
  }

  public reregister(id: string, proxy: fabric.Object, container: fabric.Object, content: fabric.Object, silent: boolean = false) {
    this.clips.set(id, {
      id,
      proxy,
      container,
      content,
      locked: false
    });

    if (!silent) {
      this.cvs.fire('object:modified', { target: proxy });
    }

    // Reconfigura estados básicos
    proxy.set({ selectable: true, evented: true });
    container.set({ selectable: false, evented: false });
    content.set({ selectable: false, evented: false });
  }

  public createClipGeometryFrom(container: fabric.Object): fabric.Object {
    return this._makeClipShape(container);
  }

  public rebuildClipsFromCanvas() {
    this._ignoreHistory = true;
    this.clearAllRegistrations();
    const objs = this.cvs.getObjects();
    
    // Agrupa por powerClipGroupId
    const groups = new Map<string, { proxy?: fabric.Object, container?: fabric.Object, content?: fabric.Object }>();

    objs.forEach(obj => {
      const gid = (obj as any).powerClipGroupId || (obj as any)._pcId;
      const role = (obj as any).powerClipRole || 
                   ((obj as any)._pcProxy ? 'proxy' : 
                    (obj as any)._pcContainer ? 'container' : 
                    (obj as any)._pcContent ? 'content' : null);
      
      if (gid && role) {
        if (!groups.has(gid)) groups.set(gid, {});
        const g = groups.get(gid)!;
        g[role as 'proxy' | 'container' | 'content'] = obj;
      }
    });

    groups.forEach((group, id) => {
      if (group.proxy && group.container && group.content) {
        // Garantir que as coordenadas estão atualizadas para que o clipPath seja criado na posição correta
        group.proxy.setCoords();
        group.container.setCoords();
        group.content.setCoords();

        this.reregister(id, group.proxy, group.container, group.content, true);
        
        // RECRIAR o clipPath PARA GARANTIR PERFEIÇÃO
        group.content.clipPath = this._makeClipShape(group.container);
        group.content.set('dirty', true);
      }
    });

    this._ignoreHistory = false;
    // Removido renderAll manual para permitir que o MoscaTeePage controle a renderização atômica
  }
}