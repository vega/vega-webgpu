export const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

export default function (
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  origin: [number, number],
  textCanvas: HTMLCanvasElement,
  textContext: CanvasRenderingContext2D,
) {
  const ratio = window.devicePixelRatio || 1;

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

  return canvas;
}
