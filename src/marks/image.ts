import { Bounds } from 'vega-scenegraph';
import { Color } from '../util/color.js';
import { SceneItem, SceneGroup } from 'vega-typings';
import { GPUVegaScene, GPUVegaCanvasContext } from '../types/gpuVegaTypes.js';
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';

import { arc } from '../path/shapes.js';
import geometryForItem from '../path/geometryForItem.js';

type SceneImage = SceneItem & SceneGroup & {
  url: string,
  width: number,
  height: number,
}


const drawName = 'Image';
export default {
  type: 'image',
  draw: draw
};


function draw(device: GPUDevice, ctx: GPUVegaCanvasContext, scene: GPUVegaScene, vb: Bounds) {
  const items = scene.items as SceneImage[];
  if (!items?.length) {
    return;
  }
  console.warn(drawName + " not yet supported!");
}
