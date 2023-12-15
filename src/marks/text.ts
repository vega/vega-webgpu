import { Bounds, Marks as marks } from 'vega-scenegraph';

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: { items: Array<Text>; bounds: Bounds }, bounds: Bounds) {
  marks.text.draw(this._textContext, scene, bounds);
}

export default {
  type: 'text',
  draw: draw,
};
