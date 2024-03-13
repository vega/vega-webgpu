import { Color } from '../util/color';
import { Bounds } from 'vega-scenegraph';
import { SceneSymbol, SceneItem } from 'vega-typings';
import { GPUVegaScene, GPUVegaCanvasContext } from '../types/gpuVegaTypes.js'
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';


const segments = 32;

const drawName = 'Symbol';
export default {
  type: 'symbol',
  draw: draw,
  pick: () => null,
};

let _device: GPUDevice = null;
let _bufferManager: BufferManager = null;
let _shader: GPUShaderModule = null;
let _vertextBufferManager: VertexBufferManager = null;
let _pipeline: GPURenderPipeline = null;
let _geometryBuffer: GPUBuffer = null;
let isInitialized: boolean = false;

function initialize(device: GPUDevice, ctx: GPUVegaCanvasContext, vb: Bounds) {
  if (_device != device) {
    _device = device;
    isInitialized = false;
  }

  if (!isInitialized) {
    _bufferManager = new BufferManager(device, drawName, ctx._uniforms.resolution, [vb.x1, vb.y1]);
    _shader = ctx._shaderCache["Symbol"] as GPUShaderModule;
    _vertextBufferManager = new VertexBufferManager(
      ['float32x2'], // position
      ['float32x2', 'float32', 'float32x4', 'float32x4', 'float32'] // center, radius, color, stroke color, stroke width
    );
    _pipeline = Renderer.createRenderPipeline(drawName, device, _shader, Renderer.colorFormat, _vertextBufferManager.getBuffers());
    _geometryBuffer = _bufferManager.createGeometryBuffer(createGeometry());
    isInitialized = true;
  }
}

function draw(device: GPUDevice, ctx: GPUVegaCanvasContext, scene: GPUVegaScene, vb: Bounds) {
  const items = scene.items;
  if (!items?.length) {
    return;
  }

  initialize(device, ctx, vb);
  _bufferManager.setResolution(ctx._uniforms.resolution);
  _bufferManager.setOffset([vb.x1, vb.y1]);

  const uniformBuffer = _bufferManager.createUniformBuffer();
  const uniformBindGroup = Renderer.createUniformBindGroup(drawName, device, _pipeline, uniformBuffer);

  const attributes = createAttributes(items);
  const instanceBuffer = _bufferManager.createInstanceBuffer(attributes);
  
  let oldClip = ctx._clip;
  if (scene.clip && scene.bounds.y2 !== 0) {
    ctx._clip = [
      (vb.x1 * -1) * ctx._uniforms.dpi,
      (vb.y1 * -1) * ctx._uniforms.dpi,
      (scene.bounds.x2  || ctx._uniforms.resolution[0] - vb.x1 * -1) * ctx._uniforms.dpi,
      (scene.bounds.y2) * ctx._uniforms.dpi
    ];
  }
  Renderer.queue2(device, _pipeline, null, [segments * 3, items.length], [_geometryBuffer, instanceBuffer], [uniformBindGroup], ctx._clip);

  if (scene.clip) {
    ctx._clip = oldClip;
  }
}

function createAttributes(items: SceneItem[]): Float32Array {
  const result = new Float32Array(items.length * 12);
  let index = -1;
  for (let i = 0, len = items.length; i < len; i++) {
    const { x = 0, y = 0, size, fill, stroke, strokeWidth = 1, opacity = 1, fillOpacity = 1, strokeOpacity = 1 } = items[i] as SceneSymbol;
    const col = Color.from2(fill, opacity, fillOpacity);
    const scol = Color.from2(stroke, opacity, strokeOpacity);
    const rad = Math.sqrt(size) / 2;

    result[++index] = x;
    result[++index] = y;
    result[++index] = rad;
    result[++index] = col[0];
    result[++index] = col[1];
    result[++index] = col[2];
    result[++index] = col[3];
    result[++index] = scol[0];
    result[++index] = scol[1];
    result[++index] = scol[2];
    result[++index] = scol[3];
    result[++index] = stroke ? strokeWidth : 0;
  }
  return result;
}


function createGeometry(): Float32Array {
  return new Float32Array(
    Array.from({ length: segments }, (_, i) => {
      const j = (i + 1) % segments;
      const ang1 = !i ? 0 : ((Math.PI * 2.0) / segments) * i;
      const ang2 = !j ? 0 : ((Math.PI * 2.0) / segments) * j;
      const x1 = Math.cos(ang1);
      const y1 = Math.sin(ang1);
      const x2 = Math.cos(ang2);
      const y2 = Math.sin(ang2);
      return [x1, y1, 0, 0, x2, y2];
    }).flat(),
  );
}