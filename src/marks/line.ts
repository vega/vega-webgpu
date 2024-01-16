import { Color } from '../util/color';
import { Bounds } from 'vega-scenegraph';
import { SceneLine, SceneItem } from 'vega-typings';
import { GPUVegaScene, GPUVegaCanvasContext } from '../types/gpuVegaTypes.js'
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';
import { VertexBufferManager } from '../util/vertexManager';


const drawName = 'Line';
export default {
  type: 'line',
  draw: draw,
  pick: () => null,
};

let _device: GPUDevice = null;
let _bufferManager: BufferManager = null;
let _vertextBufferManager: VertexBufferManager = null;
let _shader: GPUShaderModule = null;
let _shader2: GPUShaderModule = null;
let _pipeline: GPURenderPipeline = null;
let _pipeline2: GPURenderPipeline = null;
let _renderPassDescriptor: GPURenderPassDescriptor = null;
let isInitialized: boolean = false;

function initialize(device: GPUDevice, ctx: GPUVegaCanvasContext, vb: Bounds) {
  if (_device != device) {
    _device = device;
    isInitialized = false;
  }

  if (!isInitialized) {
    _bufferManager = new BufferManager(device, drawName, ctx._uniforms.resolution, [vb.x1, vb.y1]);
    _vertextBufferManager = new VertexBufferManager(
      [],
      ['float32x2', 'float32x2', 'float32x4', 'float32'] // start, end, color, width
    );
    _shader = ctx._shaderCache["Line"] as GPUShaderModule;
    _shader2 = ctx._shaderCache["SLine"] as GPUShaderModule;
    _pipeline = Renderer.createRenderPipeline(drawName, device, _shader, Renderer.colorFormat, []);
    _pipeline2 = Renderer.createRenderPipeline("S" + drawName, device, _shader2, Renderer.colorFormat, _vertextBufferManager.getBuffers());
    _renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, ctx.background, ctx.depthTexture.createView());
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


  if (ctx._renderer.wgOptions.simpleLine === true) {
    const uniformBindGroup = Renderer.createUniformBindGroup("S" + drawName, device, _pipeline2, _bufferManager.createUniformBuffer())
    const attributes = createAttributes(items);
    const instanceBuffer = _bufferManager.createInstanceBuffer(attributes);

    Renderer.queue2(device, _pipeline2, _renderPassDescriptor, [6, items.length - 1], [instanceBuffer], [uniformBindGroup]);
  } else {
    const uniformBindGroup = Renderer.createUniformBindGroup(drawName, device, _pipeline, _bufferManager.createUniformBuffer())
    const pointDatas = createPointDatas(items);
    const pointPositionBuffer = _bufferManager.createBuffer(drawName + ' Point Position Buffer', pointDatas.pos, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    const pointColorBuffer = _bufferManager.createBuffer(drawName + ' Point Color Buffer', pointDatas.colors, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    const pointWidthBuffer = _bufferManager.createBuffer(drawName + ' Point Width Buffer', pointDatas.widths, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    const pointBindGroup = Renderer.createBindGroup(drawName, device, _pipeline, [pointPositionBuffer, pointColorBuffer, pointWidthBuffer], null, 1);

    Renderer.queue2(device, _pipeline, _renderPassDescriptor, [6, items.length - 1], [], [uniformBindGroup, pointBindGroup]);
  }

}

function createAttributes(items: SceneItem[]) {
  const lines = items as SceneLine[];
  const result = new Float32Array((items.length - 1) * 9);
  for (let i = 0; i < lines.length - 1; i++) {
    // @ts-ignore
    const { x = 0, y = 0, stroke, strokeOpacity = 1, strokeWidth = 1, opacity = 1 } = lines[i]
    const x2 = lines[i + 1].x;
    const y2 = lines[i + 1].y;
    const col = Color.from2(stroke, opacity, strokeOpacity);

    const index = i * 9;
    result[index] = x;
    result[index + 1] = y;
    result[index + 2] = x2;
    result[index + 3] = y2;
    result[index + 4] = col[0];
    result[index + 5] = col[1];
    result[index + 6] = col[2];
    result[index + 7] = col[3];
    result[index + 8] = strokeWidth;
  }

  return result;
}

function createPointDatas(items: SceneItem[]): { pos: Float32Array, colors: Float32Array, widths: Float32Array } {
  const lines = items as SceneLine[];
  const numLines = lines.length;
  const pos = new Float32Array(numLines * 2);
  const colors = new Float32Array(numLines * 4);
  const widths = new Float32Array(numLines);
  for (let i = 0; i < lines.length; i++) {
    // @ts-ignore
    const { x = 0, y = 0, stroke, strokeOpacity = 1, strokeWidth = 1, opacity = 1 } = lines[i]
    const col = Color.from2(stroke, opacity, strokeOpacity);

    const posIndex = i * 2;
    const colorsIndex = i * 4;

    pos[posIndex] = x;
    pos[posIndex + 1] = y;

    colors[colorsIndex] = col[0];
    colors[colorsIndex + 1] = col[1];
    colors[colorsIndex + 2] = col[2];
    colors[colorsIndex + 3] = col[3];

    widths[i] = strokeWidth;
  }

  return { pos, colors, widths };
}