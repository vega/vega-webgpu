import { Bounds } from 'vega-scenegraph';
import { Color } from '../util/color.js';
import { SceneItem, SceneGroup } from 'vega-typings';
import { GPUVegaScene, GPUVegaCanvasContext } from '../types/gpuVegaTypes.js';
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';

import { arc } from '../path/shapes';
import geometryForItem from '../path/geometryForItem';

type SceneArc = SceneItem & SceneGroup & {
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
}


const drawName = 'Arc';
export default {
  type: 'arc',
  draw: draw
};

let _device: GPUDevice = null;
let _bufferManager: BufferManager = null;
let _shader: GPUShaderModule = null;
let _vertextBufferManager: VertexBufferManager = null;
let _pipeline: GPURenderPipeline = null;
let _renderPassDescriptor: GPURenderPassDescriptor = null;
let isInitialized: boolean = false;

function initialize(device: GPUDevice, ctx: GPUVegaCanvasContext, vb: Bounds) {
  if (_device != device) {
    _device = device;
    isInitialized = false;
  }
  if (!isInitialized || true) {
    _bufferManager = new BufferManager(device, drawName, ctx._uniforms.resolution, [vb.x1, vb.y1]);
    _shader = ctx._shaderCache["Arc"] as GPUShaderModule;
    _vertextBufferManager = new VertexBufferManager(
      ['float32x3', 'float32x4'], // position, color
      ['float32x2'] // center
    );
    _pipeline = Renderer.createRenderPipeline(drawName, device, _shader, Renderer.colorFormat, _vertextBufferManager.getBuffers());
    _renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, ctx.background, ctx.depthTexture.createView());
    isInitialized = true;
  }
  _renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
}

function draw(device: GPUDevice, ctx: GPUVegaCanvasContext, scene: GPUVegaScene, vb: Bounds) {
  const items = scene.items as SceneArc[];
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
    const geometryData = createGeometryData(ctx, item);

    for (let i = 0; i < geometryData.length; i++) {
      const geometryCount = geometryData[i].length / _vertextBufferManager.getVertexLength();
      if (geometryCount == 0)
        continue;
      const geometryBuffer = _bufferManager.createGeometryBuffer(geometryData[i]);
      const instanceBuffer = _bufferManager.createInstanceBuffer(createPosition(item));

      Renderer.queue2(device, _pipeline, _renderPassDescriptor, [geometryCount], [geometryBuffer, instanceBuffer], [uniformBindGroup]);
    }
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
  item: SceneArc
): [geometryData: Float32Array, strokeGeometryData: Float32Array] {
  // @ts-ignore
  const shapeGeom = arc(context, item);
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
  return [geometryData, strokeGeometryData];
}