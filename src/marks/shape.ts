import { Bounds } from 'vega-scenegraph';
import { Color } from '../util/color.js';
import { SceneItem, SceneGroup } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js';
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';

import { shape } from '../path/shapes.js';
import geometryForItem from '../path/geometryForItem.js';

type SceneShape = SceneItem & SceneGroup & {
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
}



const drawName = 'Shape';
export default {
  type: 'shape',
  draw: draw
};

let _device: GPUDevice = null;
let _bufferManager: BufferManager = null;
let _shader: GPUShaderModule = null;
let _vertextBufferManager: VertexBufferManager = null;
let _pipeline: GPURenderPipeline = null;
let isInitialized: boolean = false;
let _cache = {};

function initialize(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  if (_device != device) {
    _device = device;
    isInitialized = false;
  }

  if (!isInitialized) {
    _cache = {};
    _bufferManager = new BufferManager(device, drawName, (ctx as any)._uniforms.resolution, [vb.x1, vb.y1]);
    _shader = (ctx as any)._shaderCache["Shape"] as GPUShaderModule;
    _vertextBufferManager = new VertexBufferManager(
      ['float32x3', 'float32x4'], // position, color
      [] // center
    );
    _pipeline = Renderer.createRenderPipeline(drawName, device, _shader, scene._format, _vertextBufferManager.getBuffers());
    isInitialized = true;
  }
}

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  const items = scene.items as SceneShape[];
  if (!items?.length) {
    return;
  }

  initialize(device, ctx, scene, vb);
  _bufferManager.setResolution((ctx as any)._uniforms.resolution);
  _bufferManager.setOffset([vb.x1, vb.y1]);

  const uniformBuffer = _bufferManager.createUniformBuffer();
  const uniformBindGroup = Renderer.createUniformBindGroup(drawName, device, _pipeline, uniformBuffer);

  const renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, this.clearColor(), this.depthTexture().createView())
  renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
  for (var itemStr in items) {
    const item = items[itemStr];
    const geometryData = createGeometryData(ctx, item, (ctx as any)._cacheShapes ?? false);

    for (let i = 0; i < geometryData.length; i++) {
      const geometryCount = geometryData[i].length / _vertextBufferManager.getVertexLength();
      if (geometryCount == 0)
        continue;
      const geometryBuffer = _bufferManager.createGeometryBuffer(geometryData[i]);

      Renderer.queue2(device, _pipeline, renderPassDescriptor, [geometryCount], [geometryBuffer], [uniformBindGroup]);
    }
  }
}

function createGeometryData(
  context: GPUCanvasContext,
  item: SceneShape,
  useCache: boolean,
): [geometryData: Float32Array, strokeGeometryData: Float32Array] {
  // @ts-ignore
  const key = item.datum.id ?? item.id ?? item[Object.getOwnPropertySymbols(item)[0]];
  const cacheEntry = _cache[key];
  if (useCache && cacheEntry && item.strokeWidth == cacheEntry.strokeWidth
    && item.x == cacheEntry.x && item.y == cacheEntry.y
    && item.bounds == cacheEntry.bounds
  ) {
    const fill = Color.from(item.fill, item.opacity, item.fillOpacity);
    const stroke = Color.from(item.stroke, item.opacity, item.strokeOpacity);
    if (cacheEntry.fill == fill && cacheEntry.stroke == stroke)
      return cacheEntry.data;
    const data = [new Float32Array(cacheEntry.data[0].length), new Float32Array(cacheEntry.data[1].length)];
    console.log(fill);
    for (var i = 0; i < data[0].length; i += 7) {
      data[0][i] = cacheEntry.data[0][i];
      data[0][i + 1] = cacheEntry.data[0][i + 1];
      data[0][i + 2] = cacheEntry.data[0][i + 2];
      data[0][i + 3] = fill.r;
      data[0][i + 4] = fill.g;
      data[0][i + 5] = fill.b;
      data[0][i + 6] = fill.a;
    }
    for (var i = 0; i < data[1].length; i += 7) {
      data[1][i] = cacheEntry.data[1][i];
      data[1][i + 1] = cacheEntry.data[1][i + 1];
      data[1][i + 2] = cacheEntry.data[1][i + 2];
      data[1][i + 3] = stroke.r;
      data[1][i + 4] = stroke.g;
      data[1][i + 5] = stroke.b;
      data[1][i + 6] = stroke.a;
    }
    return data as [geometryData: Float32Array, strokeGeometryData: Float32Array];
  }

  const shapeGeom = shape(context, item);
  shapeGeom.key = key;
  const geometry = geometryForItem(context, item, shapeGeom);

  const geometryData = new Float32Array(geometry.fillCount * 7);
  const strokeGeometryData = new Float32Array(geometry.strokeCount * 7);
  const fill = Color.from(item.fill, item.opacity, item.fillOpacity);
  const stroke = Color.from(item.stroke, item.opacity, item.strokeOpacity);
  for (var i = 0; i < geometry.fillCount; i++) {
    geometryData[i * 7] = geometry.fillTriangles[i * 3];
    geometryData[i * 7 + 1] = geometry.fillTriangles[i * 3 + 1];
    geometryData[i * 7 + 2] = geometry.fillTriangles[i * 3 + 2] * -1;
    geometryData[i * 7 + 3] = fill.r;
    geometryData[i * 7 + 4] = fill.g;
    geometryData[i * 7 + 5] = fill.b;
    geometryData[i * 7 + 6] = fill.a;
  }
  for (var i = 0; i < geometry.strokeCount; i++) {
    strokeGeometryData[i * 7] = geometry.strokeTriangles[i * 3];
    strokeGeometryData[i * 7 + 1] = geometry.strokeTriangles[i * 3 + 1];
    strokeGeometryData[i * 7 + 2] = geometry.strokeTriangles[i * 3 + 2] * -1;
    strokeGeometryData[i * 7 + 3] = stroke.r;
    strokeGeometryData[i * 7 + 4] = stroke.g;
    strokeGeometryData[i * 7 + 5] = stroke.b;
    strokeGeometryData[i * 7 + 6] = stroke.a;
  }
  _cache[key] = { file: fill, stroke: stroke, x: item.x, y: item.y, bounds: item.bounds, strokeWidth: item.strokeWidth, data: [geometryData, strokeGeometryData] };
  return [geometryData, strokeGeometryData];
}