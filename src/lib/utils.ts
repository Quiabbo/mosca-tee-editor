import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadFile(data: Blob | string, fileName: string) {
  const isBlob = data instanceof Blob;
  const url = isBlob ? URL.createObjectURL(data) : data;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  
  if (document.body) {
    document.body.appendChild(link);
    link.click();
    
    // Pequeno delay para garantir que o download comece em dispositivos móveis
    setTimeout(() => {
      try {
        if (link && link.parentNode && typeof link.parentNode.removeChild === 'function') {
          link.parentNode.removeChild(link);
        }
      } catch (e) {
        console.warn('Error removing download link:', e);
      }
      if (isBlob) {
        URL.revokeObjectURL(url);
      }
    }, 100);
  } else {
    // Fallback if document.body is not available
    link.click();
    if (isBlob) {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}
