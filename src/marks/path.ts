import { color } from 'd3-color';
import { Bounds } from 'vega-scenegraph';
import { SceneItem } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js';
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';

import geometryForItem from '../path/geometryForItem';
import geometryForPath from '../path/geometryForPath';

import shaderSource from '../shaders/triangles.wgsl';

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
      []
    );
    _pipeline = Renderer.createRenderPipeline(drawName, device, _shader, scene._format, _vertextBufferManager.getBuffers());
    isInitialized = true;
  }
}

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  const items = scene.items;
  if (!items?.length) {
    return;
  }

  initialize(device, ctx, scene, vb);
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

      const renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, this.clearColor(), this.depthTexture().createView())
      renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();

      Renderer.queue2(device, _pipeline, renderPassDescriptor, [geometryCount], [geometryBuffer], [uniformBindGroup]);
    }

    // @ts-ignore
    ctx._tx -= item.x || 0;
    // @ts-ignore
    ctx._ty -= item.y || 0;
  }
}


interface ColoredGeometry {
  triangles: Float32Array,
  strokeTriangles: Float32Array,
  colors: Float32Array,
  strokeColors: Float32Array,
  numTriangles: number
  numStrokeTriangles: number
}

function createGeometryData(
  context: GPUCanvasContext,
  item: SceneItem
): [geometryData: Float32Array, strokeGeometryData: Float32Array] {
  // @ts-ignore
  const path = item.path;
  const shapeGeom = geometryForPath(context, path);
  const geometry = geometryForItem(context, item, shapeGeom) as ColoredGeometry;
  const geometryData = new Float32Array(geometry.numTriangles * 7);
  const strokeGeometryData = new Float32Array(geometry.numStrokeTriangles * 7);
  for (var i = 0; i < geometry.numTriangles; i++) {

    geometryData[i * 7] = geometry.triangles[i * 3];
    geometryData[i * 7 + 1] = geometry.triangles[i * 3 + 1];
    geometryData[i * 7 + 2] = geometry.triangles[i * 3 + 2] * -1;
    geometryData[i * 7 + 3] = geometry.colors[i * 4];
    geometryData[i * 7 + 4] = geometry.colors[i * 4 + 1];
    geometryData[i * 7 + 5] = geometry.colors[i * 4 + 2];
    geometryData[i * 7 + 6] = geometry.colors[i * 4 + 3];
  }
  for (var i = 0; i < geometry.numStrokeTriangles; i++) {
    strokeGeometryData[i * 7] = geometry.strokeTriangles[i * 3];
    strokeGeometryData[i * 7 + 1] = geometry.strokeTriangles[i * 3 + 1];
    strokeGeometryData[i * 7 + 2] = geometry.strokeTriangles[i * 3 + 2] * -1;
    strokeGeometryData[i * 7 + 3] = geometry.strokeColors[i * 4];
    strokeGeometryData[i * 7 + 4] = geometry.strokeColors[i * 4 + 1];
    strokeGeometryData[i * 7 + 5] = geometry.strokeColors[i * 4 + 2];
    strokeGeometryData[i * 7 + 6] = geometry.strokeColors[i * 4 + 3];
  }
  return [geometryData, strokeGeometryData];
}