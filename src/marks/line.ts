import { Color } from '../util/color';
import { quadVertex } from '../util/arrays';
import { Bounds } from 'vega-scenegraph';
import { SceneLine, SceneItem } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js'
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';

import shaderSource from '../shaders/line.wgsl';


const drawName = 'Line';
export default {
  type: 'line',
  draw: draw,
  pick: () => null,
};

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  const items = scene.items;
  if (!items?.length) {
    return;
  }
  const bufferManager = new BufferManager(device, drawName, this._uniforms.resolution, [vb.x1, vb.y1]);

  const shader = device.createShaderModule({ code: shaderSource, label: drawName + ' Shader' });
  const vertextBufferManager = new VertexBufferManager(
    [],
    [],);

  const pipeline = Renderer.createRenderPipeline(drawName, device, shader, scene._format, vertextBufferManager.getBuffers());

  const uniformBindGroup = Renderer.createUniformBindGroup(drawName, device, pipeline, bufferManager.createUniformBuffer());
  const pointDatas = createPointDatas(items);
  const pointPositionBuffer = bufferManager.createBuffer(drawName + ' Point Position Buffer', pointDatas.pos, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
  const pointColorBuffer = bufferManager.createBuffer(drawName + ' Point Color Buffer', pointDatas.colors, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
  const pointWidthBuffer = bufferManager.createBuffer(drawName + ' Point Width Buffer', pointDatas.widths, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
  const pointBindGroup = Renderer.createBindGroup(drawName, device, pipeline, [pointPositionBuffer, pointColorBuffer, pointWidthBuffer], null, 1);

  const renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, this.clearColor(), this.depthTexture().createView())
  renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();

  Renderer.render2(device, pipeline, renderPassDescriptor, [6, items.length - 1], [], [uniformBindGroup, pointBindGroup]);
  
}

function createPointDatas(items: SceneItem[]): { pos: Float32Array, colors: Float32Array, widths: Float32Array } {
  const lines = items as SceneLine[];
  const pos = [];
  const colors = [];
  const widths = [];
  for (let i = 0; i < lines.length; i++) {
    const { x = 0, y = 0, stroke, strokeOpacity = 1, strokeWidth = 1, opacity = 1 } = lines[i]
    const col = Color.from(stroke, opacity, strokeOpacity);
    pos.push(...[x, y]);
    colors.push(...col.rgba);
    widths.push(...[strokeWidth]);
  }
  return { pos: Float32Array.from(pos), colors: Float32Array.from(colors), widths: Float32Array.from(widths), }
}