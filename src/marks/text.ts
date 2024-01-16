import { Bounds, Marks as marks } from 'vega-scenegraph';
import { GPUVegaCanvasContext } from '../types/gpuVegaTypes.js';

function draw(device: GPUDevice, ctx: GPUVegaCanvasContext, scene: { items: Array<Text>; bounds: Bounds }, bounds: Bounds) {
  marks.text.draw(this._textContext, scene, bounds);
}

export default {
  type: 'text',
  draw: draw,
};
