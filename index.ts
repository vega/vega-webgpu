import { color } from 'd3-color';
import { Renderer, CanvasHandler, renderModule } from 'vega-scenegraph';
import { default as WebGPURenderer } from './src/WebGPURenderer';

// Patch CanvasHandler
CanvasHandler.prototype.context = function () {
  return this._canvas.getContext('2d') || this._canvas._textCanvas.getContext('2d');
};

renderModule('webgpu', { handler: CanvasHandler, renderer: WebGPURenderer });

export { WebGPURenderer };