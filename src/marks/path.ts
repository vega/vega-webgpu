import { Bounds } from 'vega-scenegraph';
import { Color } from '../util/color.js';
import { SceneItem, SceneGroup } from 'vega-typings';
import { GPUVegaScene, GPUVegaCanvasContext } from '../types/gpuVegaTypes.js';
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';

import geometryForItem from '../path/geometryForItem';
import geometryForPath from '../path/geometryForPath';

type ScenePath = SceneItem & SceneGroup & {
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
}

const drawName = 'Path';
export default {
  type: 'path',
  draw: draw
};

let _device: GPUDevice = null;
let _bufferManager: BufferManager = null;
let _shader: GPUShaderModule = null;
let _vertexBufferManager: VertexBufferManager = null;
let _pipeline: GPURenderPipeline = null;
let _renderPassDescriptor: GPURenderPassDescriptor = null;
let isInitialized: boolean = false;

function initialize(device: GPUDevice, ctx: GPUVegaCanvasContext, vb: Bounds) {
  if (_device != device) {
    _device = device;
    isInitialized = false;
  }

  if (!isInitialized) {
    _bufferManager = new BufferManager(device, drawName, ctx._uniforms.resolution, [vb.x1, vb.y1]);
    _shader = ctx._shaderCache["Path"] as GPUShaderModule;
    _vertexBufferManager = new VertexBufferManager(
      ['float32x3', 'float32x4'], // position, color
    );
    _pipeline = Renderer.createRenderPipeline(drawName, device, _shader, Renderer.colorFormat, _vertexBufferManager.getBuffers());
    _renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, ctx.background, ctx.depthTexture.createView());
    isInitialized = true;
  }
  _renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
}

function draw(device: GPUDevice, ctx: GPUVegaCanvasContext, scene: GPUVegaScene, vb: Bounds) {
  const items = scene.items as ScenePath[];
  if (!items?.length) {
    return;
  }

  initialize(device, ctx, vb);
  _bufferManager.setResolution(ctx._uniforms.resolution);
  _bufferManager.setOffset([vb.x1, vb.y1]);
  const uniformBuffer = _bufferManager.createUniformBuffer();
  const uniformBindGroup = Renderer.createUniformBindGroup(drawName, device, _pipeline, uniformBuffer);

  for (var itemStr in items) {
    const item = items[itemStr];
    ctx._tx += item.x || 0;
    ctx._ty += item.y || 0;

    const geometryData = createGeometryData(ctx, item);

    for (let i = 0; i < geometryData.length; i++) {
      const geometryCount = geometryData[i].length / _vertexBufferManager.getVertexLength();
      if (geometryCount == 0)
        continue;
      const geometryBuffer = _bufferManager.createGeometryBuffer(geometryData[i]);

      Renderer.queue2(device, _pipeline, _renderPassDescriptor, [geometryCount], [geometryBuffer], [uniformBindGroup], ctx._clip);
    }

    ctx._tx -= item.x || 0;
    ctx._ty -= item.y || 0;
  }
}

function createPosition(item: SceneItem): Float32Array {
  const {
    x = 0,
    y = 0
  } = item;
  return Float32Array.from([x, y]);

}

function createGeometryData(
  context: GPUVegaCanvasContext,
  item: ScenePath
): [geometryData: Float32Array, strokeGeometryData: Float32Array] {
  // @ts-ignore
  const path = item.path;
  const shapeGeom = geometryForPath(context, path);
  const geometry = geometryForItem(context, item, shapeGeom);

  const geometryData = new Float32Array(geometry.fillCount * 7);
  const strokeGeometryData = new Float32Array(geometry.strokeCount * 7);
  const fill = Color.from2(item.fill, item.opacity, item.fillOpacity);
  const stroke = Color.from2(item.stroke, item.opacity, item.strokeOpacity);
  for (var i = 0; i < geometry.fillCount; i++) {
    geometryData[i * 7] = geometry.fillTriangles[i * 3];
    geometryData[i * 7 + 1] = geometry.fillTriangles[i * 3 + 1];
    geometryData[i * 7 + 2] = geometry.fillTriangles[i * 3 + 2] * -1;
    geometryData[i * 7 + 3] = fill[0];
    geometryData[i * 7 + 4] = fill[1];
    geometryData[i * 7 + 5] = fill[2];
    geometryData[i * 7 + 6] = fill[3];
  }
  for (var i = 0; i < geometry.strokeCount; i++) {
    strokeGeometryData[i * 7] = geometry.strokeTriangles[i * 3];
    strokeGeometryData[i * 7 + 1] = geometry.strokeTriangles[i * 3 + 1];
    strokeGeometryData[i * 7 + 2] = geometry.strokeTriangles[i * 3 + 2] * -1;
    strokeGeometryData[i * 7 + 3] = stroke[0];
    strokeGeometryData[i * 7 + 4] = stroke[1];
    strokeGeometryData[i * 7 + 5] = stroke[2];
    strokeGeometryData[i * 7 + 6] = stroke[3];
  }
  return [geometryData, strokeGeometryData];
}