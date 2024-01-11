import { Color } from '../util/color';
import { Bounds } from 'vega-scenegraph';
import { SceneLine, SceneItem } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js'
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
let isInitialized: boolean = false;

function initialize(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  if (_device != device) {
    _device = device;
    isInitialized = false;
  }

  if (!isInitialized) {
    _bufferManager = new BufferManager(device, drawName, (ctx as any)._uniforms.resolution, [vb.x1, vb.y1]);
    _vertextBufferManager = new VertexBufferManager(
      [], 
      ['float32x2', 'float32x2', 'float32x4', 'float32'] // start, end, color, width
    );
    _shader = (ctx as any)._shaderCache["Line"] as GPUShaderModule;
    _shader2 = (ctx as any)._shaderCache["SLine"] as GPUShaderModule;
    _pipeline = Renderer.createRenderPipeline(drawName, device, _shader, scene._format, []);
    _pipeline2 = Renderer.createRenderPipeline("S" + drawName, device, _shader2, scene._format, _vertextBufferManager.getBuffers());
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


  if((ctx as any)?._simpleLine === true) {
    const renderPassDescriptor = Renderer.createRenderPassDescriptor("S" + drawName, this.clearColor(), this.depthTexture().createView())
    renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    const uniformBindGroup = Renderer.createUniformBindGroup("S" + drawName, device, _pipeline2, _bufferManager.createUniformBuffer())
    const attributes = createAttributes(items);
    const instanceBuffer = _bufferManager.createInstanceBuffer(attributes);

    Renderer.queue2(device, _pipeline2, renderPassDescriptor, [6, items.length - 1], [instanceBuffer], [uniformBindGroup]);  
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    (ctx as any)._lineTime += totalTime;  
  } else {
    const renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, this.clearColor(), this.depthTexture().createView())
    renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();
    const uniformBindGroup = Renderer.createUniformBindGroup(drawName, device, _pipeline, _bufferManager.createUniformBuffer())
    const pointDatas = createPointDatas(items);
    const pointPositionBuffer = _bufferManager.createBuffer(drawName + ' Point Position Buffer', pointDatas.pos, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    const pointColorBuffer = _bufferManager.createBuffer(drawName + ' Point Color Buffer', pointDatas.colors, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    const pointWidthBuffer = _bufferManager.createBuffer(drawName + ' Point Width Buffer', pointDatas.widths, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    const pointBindGroup = Renderer.createBindGroup(drawName, device, _pipeline, [pointPositionBuffer, pointColorBuffer, pointWidthBuffer], null, 1);

    Renderer.queue2(device, _pipeline, renderPassDescriptor, [6, items.length - 1], [], [uniformBindGroup, pointBindGroup]);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    (ctx as any)._lineTime += totalTime;
  }

}
// Mapping performance
// Papers: Multiple Views
// Vega svg time vs Webgpu time
// Reasoning/Motivation: SVG Crashes
function createAttributes(items: SceneItem[]) {
  const lines = items as SceneLine[];
  const result = new Float32Array((items.length - 1) * 9);
  for (let i = 0; i < lines.length - 1; i++) {
    // @ts-ignore
    const { x = 0, y = 0, stroke, strokeOpacity = 1, strokeWidth = 1, opacity = 1 } = lines[i]
    const x2 = lines[i + 1].x;
    const y2 = lines[i + 1].y;
    const col = Color.from(stroke, opacity, strokeOpacity);

    const index = i * 9;
    result[index] = x;
    result[index + 1] = y;
    result[index + 2] = x2;
    result[index + 3] = y2;
    result[index+ 4] = col.r;
    result[index + 5] = col.g;
    result[index + 6] = col.b;
    result[index + 7] = col.a;
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