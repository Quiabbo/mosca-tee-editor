declare module 'imagetracerjs' {
  export interface ImageTracerOptions {
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    rightangleenhance?: boolean;
    colorsampling?: number;
    numberofcolors?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    blurradius?: number;
    blurdelta?: number;
    strokewidth?: number;
    linefilter?: boolean;
    scale?: number;
    roundcoords?: number;
    viewbox?: boolean;
    desc?: boolean;
    lcpr?: number;
    qcpr?: number;
    pal?: { r: number; g: number; b: number; a: number }[];
  }

  export function imageToSVG(
    url: string,
    callback: (svgString: string) => void,
    options?: ImageTracerOptions
  ): void;

  export function imageDataToSVG(
    imgData: ImageData,
    callback: (svgString: string) => void,
    options?: ImageTracerOptions
  ): void;

  const ImageTracer: {
    imageToSVG: typeof imageToSVG;
    imageDataToSVG: typeof imageDataToSVG;
  };

  export default ImageTracer;
}
