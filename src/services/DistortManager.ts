import { fabric } from 'fabric';

/**
 * DistortManager handles the "Photoshop-like" vertex editing for Fabric.js shapes.
 * It allows pushing/pulling corners of a shape independently.
 */
export class DistortManager {
  private canvas: fabric.Canvas;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
  }

  /**
   * Enters or exits distort mode for the given object.
   */
  public toggleDistort(obj: fabric.Object) {
    if (!obj) return;

    // If it's already a polygon and in edit mode, we just toggle it off
    // @ts-ignore
    if (obj.type === 'polygon' && obj.edit) {
      // @ts-ignore
      obj.edit = false;
      obj.set('objectCaching', true);
      this.restoreControls(obj as fabric.Polygon);
      this.canvas.requestRenderAll();
      return;
    }

    // Convert non-polygon objects to polygon
    let poly: fabric.Polygon;

    if (obj.type !== 'polygon') {
      poly = this.objectToPolygon(obj);
      this.canvas.remove(obj);
      this.canvas.add(poly);
      this.canvas.setActiveObject(poly);
      obj = poly;
    } else {
      poly = obj as fabric.Polygon;
    }

    // @ts-ignore
    poly.edit = !poly.edit;

    // @ts-ignore
    if (poly.edit) {
      poly.set('objectCaching', false);
      this.setupControls(poly);
    } else {
      poly.set('objectCaching', true);
      this.restoreControls(poly);
    }

    this.canvas.requestRenderAll();
  }

  private objectToPolygon(obj: fabric.Object): fabric.Polygon {
    const matrix = obj.calcTransformMatrix();
    const width = obj.width || 0;
    const height = obj.height || 0;
    
    let localPoints: { x: number, y: number }[] = [];

    if (obj.type === 'rect' || obj.type === 'image') {
      localPoints = [
        { x: -width / 2, y: -height / 2 },
        { x: width / 2, y: -height / 2 },
        { x: width / 2, y: height / 2 },
        { x: -width / 2, y: height / 2 }
      ];
    } else if (obj.type === 'triangle') {
      localPoints = [
        { x: 0, y: -height / 2 },
        { x: width / 2, y: height / 2 },
        { x: -width / 2, y: height / 2 }
      ];
    } else if (obj.type === 'circle' || obj.type === 'ellipse') {
      const rx = obj.type === 'circle' ? (obj as fabric.Circle).radius || 0 : (obj as fabric.Ellipse).rx || 0;
      const ry = obj.type === 'circle' ? (obj as fabric.Circle).radius || 0 : (obj as fabric.Ellipse).ry || 0;
      const sectors = 16; // 16 points is a good balance between precision and usability
      for (let i = 0; i < sectors; i++) {
        const angle = (i / sectors) * Math.PI * 2;
        localPoints.push({
          x: Math.cos(angle) * rx,
          y: Math.sin(angle) * ry
        });
      }
    } else if (obj.type === 'polygon' || obj.type === 'polyline') {
      const poly = obj as fabric.Polygon;
      localPoints = poly.points || [];
      // Offset points for polygon if they are relative to center
      if (poly.pathOffset) {
         localPoints = localPoints.map(p => ({
           x: p.x - poly.pathOffset!.x,
           y: p.y - poly.pathOffset!.y
         }));
      }
    } else if (obj.type === 'path') {
      const pathObj = obj as fabric.Path;
      // Extract points from path commands
      // For Star/Heart shapes which are paths
      const commands = (pathObj.path as any) || [];
      
      // Ensure commands are in array format even if they are string-based
      const parsedCommands = Array.isArray(commands) ? commands : fabric.util.parsePath(commands as any);
      
      let currentX = 0;
      let currentY = 0;
      
      parsedCommands.forEach((cmd: any) => {
        const type = cmd[0];
        if (type === 'M' || type === 'L') {
          currentX = cmd[1];
          currentY = cmd[2];
          localPoints.push({ x: currentX, y: currentY });
        } else if (type === 'C') {
          const x1 = currentX, y1 = currentY;
          const cp1x = cmd[1], cp1y = cmd[2];
          const cp2x = cmd[3], cp2y = cmd[4];
          const x2 = cmd[5], y2 = cmd[6];
          
          // Sample 12 points per cubic curve for smooth distortion
          for (let t = 1/12; t <= 1; t += 1/12) {
            const cx = Math.pow(1 - t, 3) * x1 + 3 * Math.pow(1 - t, 2) * t * cp1x + 3 * (1 - t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * x2;
            const cy = Math.pow(1 - t, 3) * y1 + 3 * Math.pow(1 - t, 2) * t * cp1y + 3 * (1 - t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * y2;
            localPoints.push({ x: cx, y: cy });
          }
          currentX = x2;
          currentY = y2;
        } else if (type === 'Q') {
          const x1 = currentX, y1 = currentY;
          const cpx = cmd[1], cpy = cmd[2];
          const x2 = cmd[3], y2 = cmd[4];
          
          for (let t = 0.2; t <= 1; t += 0.2) {
            const cx = Math.pow(1 - t, 2) * x1 + 2 * (1 - t) * t * cpx + Math.pow(t, 2) * x2;
            const cy = Math.pow(1 - t, 2) * y1 + 2 * (1 - t) * t * cpy + Math.pow(t, 2) * y2;
            localPoints.push({ x: cx, y: cy });
          }
          currentX = x2;
          currentY = y2;
        }
      });

      // Offset path points
      if (pathObj.pathOffset) {
         localPoints = localPoints.map(p => ({
           x: p.x - pathObj.pathOffset!.x,
           y: p.y - pathObj.pathOffset!.y
         }));
      }
    } else {
      // Fallback to bounding box
      localPoints = [
        { x: -width / 2, y: -height / 2 },
        { x: width / 2, y: -height / 2 },
        { x: width / 2, y: height / 2 },
        { x: -width / 2, y: height / 2 }
      ];
    }

    const points = localPoints.map(p => {
      return fabric.util.transformPoint(p as fabric.Point, matrix);
    });
    
    const polyOptions: any = {
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
      opacity: obj.opacity,
      // @ts-ignore
      name: (obj as any).name || `${obj.type} (Distorcido)`,
      // @ts-ignore
      id: (obj as any).id || `poly_${Math.random().toString(36).substr(2, 9)}`,
      objectCaching: false,
    };

    // If it's an image, we use it as a pattern fill
    if (obj.type === 'image') {
      const img = obj as fabric.Image;
      const element = img.getElement();
      
      // Calculate matrix that mapped image element (0,0) to logical coordinates (-w/2, -h/2)
      // Then original matrix maps logical coordinates to global coordinates.
      const logicalToGlobal = img.calcTransformMatrix();
      
      // Matrix that maps element pixels [0...eW, 0...eH] to logical coordinates [-w/2...w/2, -h/2...h/2]
      // logicalX = (pixelX / factorX) - w/2 => factorX = eW / w
      const elementToLogical = [
        (img.width || element.width) / element.width, 0,
        0, (img.height || element.height) / element.height,
        -(img.width || 0) / 2, -(img.height || 0) / 2
      ];

      // elementToGlobal = logicalToGlobal * elementToLogical
      const elementToGlobal = fabric.util.multiplyTransformMatrices(
        logicalToGlobal,
        elementToLogical
      );

      polyOptions.fill = new fabric.Pattern({
        source: element,
        repeat: 'no-repeat'
      });
      
      // Store the global relation so we can update it during distortion
      // @ts-ignore
      polyOptions._elementToGlobal = elementToGlobal;
    }

    const poly = new fabric.Polygon(points, polyOptions);

    // After creation, Fabric might have calculated positioning (left/top)
    // We must update the patternTransform to match the global pinning
    // @ts-ignore
    if (obj.type === 'image' && poly.fill instanceof fabric.Pattern && poly._elementToGlobal) {
      const polyMatrixInv = fabric.util.invertTransform(poly.calcTransformMatrix());
      (poly.fill as fabric.Pattern).patternTransform = fabric.util.multiplyTransformMatrices(
        polyMatrixInv,
        // @ts-ignore
        poly._elementToGlobal
      );
    }

    return poly;
  }

  private setupControls(poly: fabric.Polygon) {
    const lastControl = poly.points!.length - 1;
    poly.cornerStyle = 'circle';
    poly.cornerColor = 'rgba(255,255,255,1)';
    poly.cornerStrokeColor = 'rgba(0,0,0,1)';
    poly.transparentCorners = false;
    poly.cornerSize = 10;
    
    // We do NOT bind the handlers here if we want to access control properties via 'this'
    // but Fabric.js context is tricky with arrow functions vs regular ones.
    // Let's use regular functions for handlers and pass the manager instance if needed.
    const manager = this;

    // Filter points in case there is any overlap
    poly.controls = poly.points!.reduce((acc: any, point, index) => {
      acc['p' + index] = new fabric.Control({
        positionHandler: function(dim: any, finalMatrix: any, fabricObject: fabric.Polygon, control: any) {
          // Use control argument or 'this' context as fallback
          const ctrl = control || this;
          if (!ctrl || ctrl.pointIndex === undefined) return new fabric.Point(0, 0);
          const pointIndex = ctrl.pointIndex;

          if (!fabricObject.points || !fabricObject.points[pointIndex]) return new fabric.Point(0, 0);
          
          const x = (fabricObject.points[pointIndex].x - (fabricObject.pathOffset?.x || 0));
          const y = (fabricObject.points[pointIndex].y - (fabricObject.pathOffset?.y || 0));
          
          return fabric.util.transformPoint(
              { x: x, y: y } as fabric.Point,
              fabric.util.multiplyTransformMatrices(
                  fabricObject.canvas!.viewportTransform!,
                  fabricObject.calcTransformMatrix()
              )
          );
        },
        actionHandler: manager.anchorWrapper(index > 0 ? index - 1 : lastControl, manager.actionHandler.bind(manager)),
        actionName: 'modifyPolygon',
        // @ts-ignore
        pointIndex: index
      });
      return acc;
    }, {});
    poly.hasBorders = false;
  }

  private restoreControls(poly: fabric.Polygon) {
    poly.cornerColor = '#2563EB';
    poly.cornerStyle = 'circle';
    poly.transparentCorners = false;
    poly.controls = fabric.Object.prototype.controls;
    poly.hasBorders = true;
  }

  // Anchor wrapper ensures the object doesn't "jump" when moving a point
  private anchorWrapper(anchorIndex: number, fn: Function) {
    return (eventData: any, transform: any, x: number, y: number) => {
      const fabricObject = transform.target as fabric.Polygon;
      if (!fabricObject.points || !fabricObject.points[anchorIndex]) return false;

      const pathOffsetX = fabricObject.pathOffset?.x || 0;
      const pathOffsetY = fabricObject.pathOffset?.y || 0;

      const absolutePoint = fabric.util.transformPoint({
              x: (fabricObject.points[anchorIndex].x - pathOffsetX),
              y: (fabricObject.points[anchorIndex].y - pathOffsetY),
            } as fabric.Point, fabricObject.calcTransformMatrix());
      
      const actionPerformed = fn(eventData, transform, x, y);
      
      // @ts-ignore
      fabricObject._setPositionDimensions({});
      
      // @ts-ignore
      const polygonBaseSize = fabricObject._getNonTransformedDimensions();
      const newX = (fabricObject.points[anchorIndex].x - pathOffsetX) / polygonBaseSize.x;
      const newY = (fabricObject.points[anchorIndex].y - pathOffsetY) / polygonBaseSize.y;
      
      fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);

      // Update pattern transform to keep content globally pinned
      // @ts-ignore
      if (fabricObject.fill instanceof fabric.Pattern && fabricObject._elementToGlobal) {
        const polyMatrixInv = fabric.util.invertTransform(fabricObject.calcTransformMatrix());
        (fabricObject.fill as fabric.Pattern).patternTransform = fabric.util.multiplyTransformMatrices(
          polyMatrixInv,
          // @ts-ignore
          fabricObject._elementToGlobal
        );
      }

      return actionPerformed;
    };
  }

  // Action handler updates the point coordinate
  private actionHandler(eventData: any, transform: any, x: number, y: number) {
    const polygon = transform.target as fabric.Polygon;
    const currentControl = polygon.controls[transform.corner];
    if (!currentControl) return false;

    const mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(x, y), 'center', 'center');
    
    // @ts-ignore
    const polygonBaseSize = polygon._getNonTransformedDimensions();
    // @ts-ignore
    const size = polygon._getTransformedDimensions(0, 0);
    
    const pathOffsetX = polygon.pathOffset?.x || 0;
    const pathOffsetY = polygon.pathOffset?.y || 0;

    const finalPoint = {
      x: mouseLocalPosition.x * polygonBaseSize.x / (size.x || 1) + pathOffsetX,
      y: mouseLocalPosition.y * polygonBaseSize.y / (size.y || 1) + pathOffsetY
    };
    
    const pointIndex = (currentControl as any).pointIndex;
    if (polygon.points && polygon.points[pointIndex]) {
      polygon.points[pointIndex] = finalPoint;
    }
    return true;
  }
}
