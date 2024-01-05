import { Color } from '../util/color';
import { Bounds } from 'vega-scenegraph';
import { SceneSymbol, SceneItem } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js'
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

function initialize(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  if (_device != device) {
    _device = device;
    isInitialized = false;
  }

  if (!isInitialized) {
    _bufferManager = new BufferManager(device, drawName, (ctx as any)._uniforms.resolution, [vb.x1, vb.y1]);
    _shader = (ctx as any)._shaderCache["Symbol"] as GPUShaderModule;
    _vertextBufferManager = new VertexBufferManager(
      ['float32x2'], // position
      ['float32x2', 'float32', 'float32x4', 'float32x4', 'float32'] // center, radius, color, stroke color, stroke width
    );
    _pipeline = Renderer.createRenderPipeline(drawName, device, _shader, scene._format, _vertextBufferManager.getBuffers());
    _geometryBuffer = _bufferManager.createGeometryBuffer(createGeometry());
    isInitialized = true;
  }
}

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  const items = scene.items;
  if (!items?.length) {
    return;
  }

  initialize(device, ctx, scene, vb);
  _bufferManager.setResolution((ctx as any)._uniforms.resolution);
  _bufferManager.setOffset([vb.x1, vb.y1]);

  const uniformBuffer = _bufferManager.createUniformBuffer();
  const uniformBindGroup = Renderer.createUniformBindGroup(drawName, device, _pipeline, uniformBuffer);

  const attributes = createAttributes(items);
  const instanceBuffer = _bufferManager.createInstanceBuffer(attributes);

  const renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, this.clearColor(), this.depthTexture().createView());
  renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();

  Renderer.queue2(device, _pipeline, renderPassDescriptor, [segments * 3, items.length], [_geometryBuffer, instanceBuffer], [uniformBindGroup]);
}

function createAttributes(items: SceneItem[]): Float32Array {
  const result = new Float32Array(items.length * 12);

  for (let i = 0; i < items.length; i++) {
    const { x = 0, y = 0, size, fill, stroke, strokeWidth, opacity = 1, fillOpacity = 1, strokeOpacity = 1 } = items[i] as SceneSymbol;
    const col = Color.from(fill, opacity, fillOpacity);
    const scol = Color.from(stroke, opacity, strokeOpacity);
    const swidth = stroke ? strokeWidth ?? 1 : 0;
    const rad = Math.sqrt(size) / 2;

    const startIndex = i * 12;
    result[startIndex] = x;
    result[startIndex + 1] = y
    result[startIndex + 2] = rad;
    result[startIndex + 3] = col.r;
    result[startIndex + 4] = col.g;
    result[startIndex + 5] = col.b;
    result[startIndex + 6] = col.a;
    result[startIndex + 7] = scol.r;
    result[startIndex + 8] = scol.g;
    result[startIndex + 9] = scol.b;
    result[startIndex + 10] = scol.a;
    result[startIndex + 11] = swidth;
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