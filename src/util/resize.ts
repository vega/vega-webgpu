export const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

export default function (
  canvas: HTMLCanvasElement,
  context: any,
  width: number,
  height: number,
  origin: [number, number],
  textCanvas: HTMLCanvasElement,
  textContext: CanvasRenderingContext2D,
) {
  var scale = typeof HTMLElement !== 'undefined'
    && canvas instanceof HTMLElement
    && canvas.parentNode != null;
  const ratio = scale ? window.devicePixelRatio : 1;

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  textCanvas.width = width * ratio;
  textCanvas.height = height * ratio;
  //@ts-ignore
  textContext.pixelRatio = ratio;
  textContext.setTransform(ratio, 0, 0, ratio, ratio * origin[0], ratio * origin[1]);

  if (ratio !== 1) {
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  context._lineWidth = ratio;
  context._viewport = {
    x: 0,
    y: 0,
    width: width,
    height: height,
    minDepth: 0,
    maxDepth: 1,
  };
  context._origin = origin;
  context._ratio = ratio;
  context._clip = [0, 0, canvas.width, canvas.height];
  
  return canvas;
}
