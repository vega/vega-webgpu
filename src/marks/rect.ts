import { Color } from '../util/color';
import { Bounds } from 'vega-scenegraph';
import { SceneItem, SceneRect } from 'vega-typings';
import { GPUVegaScene, GPUVegaCanvasContext } from '../types/gpuVegaTypes.js'
import { quadVertex } from '../util/arrays';
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';

import shaderSource from '../shaders/rect.wgsl';

const drawName = 'Rect';
export default {
  type: 'rect',
  draw: draw,
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
      // center, dimensions, fill color, stroke color, stroke width, corner radii
      ['float32x2', 'float32x2', 'float32x4', 'float32x4', 'float32', 'float32x4']
    );
    _pipeline = Renderer.createRenderPipeline(drawName, device, _shader, Renderer.colorFormat, _vertexBufferManager.getBuffers());
    _renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, ctx.background, ctx.depthTexture.createView());
    _geometryBuffer = _bufferManager.createGeometryBuffer(quadVertex);
    isInitialized = true;
  }
  _renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
}

function draw(device: GPUDevice, ctx: GPUVegaCanvasContext, scene: GPUVegaScene, vb: Bounds): [] {
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
    (items).flatMap((item: SceneRect) => {
      const {
        x = 0,
        y = 0,
        width = 0,
        height = 0,
        opacity = 1,
        fill,
        fillOpacity = 1,
        stroke = null,
        strokeOpacity = 1,
        strokeWidth = null,
        cornerRadius = 0,
        // @ts-ignore
        cornerRadiusBottomLeft = null,
        // @ts-ignore
        cornerRadiusBottomRight = null,
        // @ts-ignore
        cornerRadiusTopRight = null,
        // @ts-ignore
        cornerRadiusTopLeft = null,
      } = item;
      const col = Color.from(fill, opacity, fillOpacity);
      const scol = Color.from(stroke, opacity, strokeOpacity);
      const swidth = stroke ? strokeWidth ?? 1 : strokeWidth ?? 0;
      const cornerRadii = [
        cornerRadiusTopRight ?? cornerRadius,
        cornerRadiusBottomRight ?? cornerRadius,
        cornerRadiusBottomLeft ?? cornerRadius,
        cornerRadiusTopLeft ?? cornerRadius,
      ]
      return [
        x,
        y,
        width,
        height,
        ...col.rgba,
        ...scol.rgba,
        swidth,
        ...cornerRadii,
      ];
    }),
  );
}