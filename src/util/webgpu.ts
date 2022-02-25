import text from '../marks/text';

export default async function (w, h) {
  if (!('gpu' in navigator)) {
    throw new Error('WebGPU is unsupported in your browser.');
  }
  const canvas = this._canvas;
  const ctx = canvas.getContext('webgpu');
  this._textContext.pixelRatio = window.devicePixelRatio || 1;

  ctx.configure({
    device: this._device,
    format: 'bgra8unorm',
    compositingAlphaMode: 'premultiplied',
  });

  this._ctx = ctx;

  this._redraw = true;
}
