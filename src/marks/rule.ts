import { Color } from '../util/color';
import { Bounds } from 'vega-scenegraph';
import {
  SceneItem, SceneLine
} from 'vega-typings';
import shaderSource from '../shaders/rule.wgsl';
import { quadVertex } from '../util/arrays';
import { GPUVegaScene, GPUVegaCanvasContext } from '../types/gpuVegaTypes.js';
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';


const drawName = 'Rule';
export default {
  type: 'rule',
  draw: draw
};

let _device: GPUDevice = null;
let _bufferManager: BufferManager = null;
let _shader: GPUShaderModule = null;
let _vertexBufferManager: VertexBufferManager = null;
let _pipeline: GPURenderPipeline = null;
let _renderPassDescriptor: GPURenderPassDescriptor = null;
let _geometryBuffer: GPUBuffer = null;
let isInitialized: boolean = false;

function initialize(device: GPUDevice, ctx: GPUVegaCanvasContext, vb: Bounds) {
  if (_device != device) {
    _device = device;
    isInitialized = false;
  }

  if (!isInitialized) {
    _bufferManager = new BufferManager(device, drawName, ctx._uniforms.resolution, [vb.x1, vb.y1]);
    _shader = ctx._shaderCache[drawName] as GPUShaderModule;
    _vertexBufferManager = new VertexBufferManager(
      ['float32x2'], // position
      // center, scale, color
      ['float32x2', 'float32x2', 'float32x4']
    );
    _pipeline = Renderer.createRenderPipeline(drawName, device, _shader, Renderer.colorFormat, _vertexBufferManager.getBuffers());
    _renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, ctx.background, ctx.depthTexture.createView());
    _geometryBuffer = _bufferManager.createGeometryBuffer(quadVertex);
    isInitialized = true;
  }
  _renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
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

  Renderer.queue2(device, _pipeline, _renderPassDescriptor, [6, items.length], [_geometryBuffer, instanceBuffer], [uniformBindGroup], ctx._clip);

}

function createAttributes(items: SceneItem[]): Float32Array {
  return Float32Array.from(
    items.flatMap((item: SceneLine) => {
      // @ts-ignore
      let { x = 0, y = 0, x2, y2, stroke, strokeWidth = 1, opacity = 1, strokeOpacity = 1 } = item;
      x2 ??= x;
      y2 ??= y;
      const ax = Math.abs(x2 - x);
      const ay = Math.abs(y2 - y);
      const col = Color.from(stroke, opacity, strokeOpacity);
      return [
        Math.min(x, x2),
        Math.min(y, y2),
        ax ? ax : strokeWidth,
        ay ? ay : strokeWidth,
        ...col.rgba
      ];
    }),
  );
}