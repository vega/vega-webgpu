import { Color } from '../util/color';
import { Bounds } from 'vega-scenegraph';
import { SceneLine, SceneItem } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js'
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';


const drawName = 'Line';
export default {
  type: 'line',
  draw: draw,
  pick: () => null,
};

let _device: GPUDevice = null;
let _bufferManager: BufferManager = null;
let _shader: GPUShaderModule = null;
let _pipeline: GPURenderPipeline = null;
let isInitialized: boolean = false;

function initialize(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  if (_device != device) {
    _device = device;
    isInitialized = false;
  }

  if (!isInitialized) {
    _bufferManager = new BufferManager(device, drawName, (ctx as any)._uniforms.resolution, [vb.x1, vb.y1]);
    _shader = (ctx as any)._shaderCache["Line"] as GPUShaderModule;
    _pipeline = Renderer.createRenderPipeline(drawName, device, _shader, scene._format, []);
    isInitialized = true;
  }
}

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  const items = scene.items;
  if (!items?.length) {
    return;
  }
  const startTime = performance.now();
  initialize(device, ctx, scene, vb);
  _bufferManager.setResolution((ctx as any)._uniforms.resolution);
  _bufferManager.setOffset([vb.x1, vb.y1]);

  const uniformBindGroup = Renderer.createUniformBindGroup(drawName, device, _pipeline, _bufferManager.createUniformBuffer());
  const pointDatas = createPointDatas(items);
  const pointPositionBuffer = _bufferManager.createBuffer(drawName + ' Point Position Buffer', pointDatas.pos, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
  const pointColorBuffer = _bufferManager.createBuffer(drawName + ' Point Color Buffer', pointDatas.colors, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
  const pointWidthBuffer = _bufferManager.createBuffer(drawName + ' Point Width Buffer', pointDatas.widths, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
  const pointBindGroup = Renderer.createBindGroup(drawName, device, _pipeline, [pointPositionBuffer, pointColorBuffer, pointWidthBuffer], null, 1);
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  (ctx as any)._lineTime += totalTime;

  const renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, this.clearColor(), this.depthTexture().createView())
  renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();

  Renderer.queue2(device, _pipeline, renderPassDescriptor, [6, items.length - 1], [], [uniformBindGroup, pointBindGroup]);
}

function createPointDatas(items: SceneItem[]): { pos: Float32Array, colors: Float32Array, widths: Float32Array } {
  const lines = items as SceneLine[];
  const numLines = lines.length;
  const pos = new Float32Array(numLines * 2);
  const colors = new Float32Array(numLines * 4);
  const widths = new Float32Array(numLines);
  for (let i = 0; i < lines.length; i++) {
    const { x = 0, y = 0, stroke, strokeOpacity = 1, strokeWidth = 1, opacity = 1 } = lines[i]
    const col = Color.from(stroke, opacity, strokeOpacity);

    const posIndex = i * 2;
    const colorsIndex = i * 4;

    pos[posIndex] = x;
    pos[posIndex + 1] = y;

    colors[colorsIndex] = col.r;
    colors[colorsIndex + 1] = col.g;
    colors[colorsIndex + 2] = col.b;
    colors[colorsIndex + 3] = col.a;

    widths[i] = strokeWidth;
  }

  return { pos, colors, widths };
}