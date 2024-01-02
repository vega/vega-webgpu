import { Color } from '../util/color';
import { Bounds } from 'vega-scenegraph';
import { SceneSymbol, SceneItem } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js'
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';

import shaderSource from '../shaders/symbol.wgsl';

const segments = 32;

const drawName = 'Symbol';
export default {
  type: 'symbol',
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
    ['float32x2'], // position
    ['float32x2', 'float32', 'float32x4', 'float32x4', 'float32'] // center, radius, color, stroke color, stroke width
  );
  const pipeline = Renderer.createRenderPipeline(drawName, device, shader, scene._format, vertextBufferManager.getBuffers());

  const geometryBuffer = bufferManager.createGeometryBuffer(createGeometry());
  const uniformBuffer = bufferManager.createUniformBuffer();
  const uniformBindGroup = Renderer.createUniformBindGroup(drawName, device, pipeline, uniformBuffer);
  const attributes = createAttributes(items);
  const instanceBuffer = bufferManager.createInstanceBuffer(attributes);

  const renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, this.clearColor(), this.depthTexture().createView());
  renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();

  Renderer.render2(device, pipeline, renderPassDescriptor, [segments * 3, items.length], [geometryBuffer, instanceBuffer], [uniformBindGroup]);
}

function createAttributes(items: SceneItem[]): Float32Array {
  return Float32Array.from(
    (items as unknown as SceneSymbol[]).flatMap((item: SceneSymbol) => {
      const { x = 0, y = 0, size, fill, stroke, strokeWidth, opacity = 1, fillOpacity = 1, strokeOpacity = 1 } = item;
      const col = Color.from(fill, opacity, fillOpacity);
      const scol = Color.from(stroke, opacity, strokeOpacity);
      const swidth = stroke ? strokeWidth ?? 1 : 0;
      const rad = Math.sqrt(size) / 2;
      return [x, y, rad, ...col.rgba, ...scol.rgba, swidth];
    }),
  );
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