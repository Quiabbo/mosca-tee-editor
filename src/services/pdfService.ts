import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { fabric } from 'fabric';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface PdfTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
}

export interface PdfPageData {
  pageNumber: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  canvasData?: any; // Fabric.js JSON
  backgroundImage?: string; // DataURL of the rendered PDF page
  textContent?: PdfTextItem[];
}

export class PdfService {
  private static instance: PdfService;
  
  private constructor() {}

  public static getInstance(): PdfService {
    if (!PdfService.instance) {
      PdfService.instance = new PdfService();
    }
    return PdfService.instance;
  }

  /**
   * Loads a PDF and returns data for each page
   */
  async loadPdf(file: File): Promise<PdfPageData[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pagesData: PdfPageData[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      // Use a scale of 300/72 (~4.167) for high-quality rendering (300 DPI)
      const scale = 300 / 72;
      const viewport = page.getViewport({ scale, rotation: page.rotate });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        // Clear background with white
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: context, viewport, canvas }).promise;
        
        // Extract text content
        const textContent = await page.getTextContent();
        const textItems: PdfTextItem[] = textContent.items.map((item: any) => {
          // Get the transform for scale 1.0 to get original coordinates
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          
          return {
            text: item.str,
            x: tx[4],
            y: viewport.height - tx[5],
            width: item.width,
            height: item.height,
            fontSize: Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]),
            fontFamily: item.fontName
          };
        });

        pagesData.push({
          pageNumber: i,
          width: viewport.width,
          height: viewport.height,
          originalWidth: viewport.width / scale,
          originalHeight: viewport.height / scale,
          backgroundImage: canvas.toDataURL('image/png'),
          textContent: textItems,
          canvasData: null
        });
      }
    }

    return pagesData;
  }

  /**
   * Exports the edited pages back to a PDF
   */
  async exportToPdf(pages: PdfPageData[], fileName: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    
    for (const pageData of pages) {
      const page = pdfDoc.addPage([pageData.width, pageData.height]);
      
      // 1. Draw background image (the original PDF page)
      if (pageData.backgroundImage) {
        try {
          const bgImageBytes = await fetch(pageData.backgroundImage).then(res => res.arrayBuffer());
          const bgImage = await pdfDoc.embedPng(bgImageBytes);
          page.drawImage(bgImage, {
            x: 0,
            y: 0,
            width: pageData.width,
            height: pageData.height,
          });
        } catch (e) {
          console.error('Error embedding background image:', e);
        }
      }

      // 2. Render fabric objects to an overlay image
      if (pageData.canvasData) {
        try {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = pageData.width * 2; // High res export
          tempCanvas.height = pageData.height * 2;
          
          const fabricCanvas = new fabric.StaticCanvas(tempCanvas);
          fabricCanvas.setZoom(2);

          await new Promise<void>((resolve) => {
            fabricCanvas.loadFromJSON(pageData.canvasData, () => {
              // Hide the background image object if it exists in the JSON to avoid double rendering
              fabricCanvas.getObjects().forEach(obj => {
                if ((obj as any).id === 'pdf_bg') obj.visible = false;
              });
              fabricCanvas.renderAll();
              resolve();
            });
          });

          const overlayDataUrl = tempCanvas.toDataURL('image/png');
          const overlayImageBytes = await fetch(overlayDataUrl).then(res => res.arrayBuffer());
          const overlayImage = await pdfDoc.embedPng(overlayImageBytes);
          
          page.drawImage(overlayImage, {
            x: 0,
            y: 0,
            width: pageData.width,
            height: pageData.height,
          });
        } catch (e) {
          console.error('Error embedding overlay image:', e);
        }
      }
    }

    return await pdfDoc.save();
  }

  /**
   * OCR using Tesseract.js
   */
  async performOcr(imageSource: string): Promise<string> {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('por+eng');
    const ret = await worker.recognize(imageSource);
    await worker.terminate();
    return ret.data.text;
  }
}

export const pdfService = PdfService.getInstance();
