import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdfjs using CDN for better compatibility in external hosting
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Generates a thumbnail for a specific page of a PDF.
 * @param arrayBuffer The PDF file as an ArrayBuffer.
 * @param pageNumber The page number (1-based).
 * @param scale The scale of the thumbnail (default 0.3).
 * @returns A promise that resolves to a data URL of the thumbnail.
 */
export async function generateThumbnail(arrayBuffer: ArrayBuffer, pageNumber: number = 1, scale: number = 0.3): Promise<string> {
  try {
    // Use a slice to avoid detaching the original ArrayBuffer
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ 
      canvasContext: context, 
      viewport,
      canvas: canvas 
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return '';
  }
}

/**
 * Generates thumbnails for all pages of a PDF.
 * @param arrayBuffer The PDF file as an ArrayBuffer.
 * @param scale The scale of the thumbnails.
 * @returns A promise that resolves to an array of data URLs.
 */
export async function generateAllThumbnails(arrayBuffer: ArrayBuffer, scale: number = 0.3): Promise<string[]> {
  try {
    // Use a slice to avoid detaching the original ArrayBuffer
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    const thumbnails: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        thumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
      }
    }
    return thumbnails;
  } catch (error) {
    console.error('Error generating all thumbnails:', error);
    return [];
  }
}
