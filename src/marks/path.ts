import { Bounds } from 'vega-scenegraph';
import { Color } from '../util/color.js';
import { SceneItem, SceneGroup } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js';
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
let _vertextBufferManager: VertexBufferManager = null;
let _pipeline: GPURenderPipeline = null;
let isInitialized: boolean = false;

function initialize(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  if (_device != device) {
    _device = device;
    isInitialized = false;
  }

  if (!isInitialized) {
    _bufferManager = new BufferManager(device, drawName, (ctx as any)._uniforms.resolution, [vb.x1, vb.y1]);
    _shader = (ctx as any)._shaderCache["Path"] as GPUShaderModule;
    _vertextBufferManager = new VertexBufferManager(
      ['float32x3', 'float32x4'], // position, color
      ['float32x2']
    );
    _pipeline = Renderer.createRenderPipeline(drawName, device, _shader, scene._format, _vertextBufferManager.getBuffers());
    isInitialized = true;
  }
}

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  const items = scene.items as ScenePath[];
  if (!items?.length) {
    return;
  }

  initialize(device, ctx, scene, vb);
  _bufferManager.setResolution((ctx as any)._uniforms.resolution);
  _bufferManager.setOffset([vb.x1, vb.y1]);

  for (var itemStr in items) {
    const item = items[itemStr];
    // @ts-ignore
    ctx._tx += item.x || 0;
    // @ts-ignore
    ctx._ty += item.y || 0;

    const geometryData = createGeometryData(ctx, item);
    const uniformBuffer = _bufferManager.createUniformBuffer();
    const uniformBindGroup = Renderer.createUniformBindGroup(drawName, device, _pipeline, uniformBuffer);

    for (let i = 0; i < geometryData.length; i++) {
      const geometryCount = geometryData[i].length / _vertextBufferManager.getVertexLength();
      if (geometryCount == 0)
        continue;
      const geometryBuffer = _bufferManager.createGeometryBuffer(geometryData[i]);
      const instanceBuffer = _bufferManager.createInstanceBuffer(createPosition(item));

      Renderer.bundle2(device, _pipeline,  [geometryCount], [geometryBuffer, instanceBuffer], [uniformBindGroup]);
    }

    // @ts-ignore
    ctx._tx -= item.x || 0;
    // @ts-ignore
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
  context: GPUCanvasContext,
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