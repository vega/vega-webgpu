import { color } from 'd3-color';
import { Bounds } from 'vega-scenegraph';
import { SceneSymbol, SceneItem } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js'
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { createRenderPipeline, createDefaultBindGroup, createRenderPassDescriptor } from '../util/render.js';

import shaderSource from '../shaders/path.wgsl';

const segments = 32;

const drawName = 'Path';
export default {
  type: 'path',
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
    ['float32x2', 'float32x4', 'float32'] // center, color, radius
  );
  const pipeline = createRenderPipeline(drawName, device, shader, scene._format, vertextBufferManager.getBuffers());

  const geometryBuffer = bufferManager.createGeometryBuffer(createGeometry());
  const uniformBuffer = bufferManager.createUniformBuffer();
  const uniformBindGroup = createDefaultBindGroup(drawName, device, pipeline, uniformBuffer);
  const attributes = createAttributes(items);
  const instanceBuffer = bufferManager.createInstanceBuffer(attributes);
  const frameBuffer = bufferManager.createFrameBuffer(attributes.byteLength);
  (async () => {
    await frameBuffer.mapAsync(GPUMapMode.WRITE).then(() => {
      const frameData = new Float32Array(frameBuffer.getMappedRange());
      frameData.set(attributes);

      const copyEncoder = device.createCommandEncoder();
      copyEncoder.copyBufferToBuffer(
        frameBuffer,
        frameData.byteOffset,
        instanceBuffer,
        attributes.byteOffset,
        attributes.byteLength,
      );
      const commandEncoder = device.createCommandEncoder();
      const renderPassDescriptor = createRenderPassDescriptor(drawName, this.clearColor(), this.depthTexture().createView())
      renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();

      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(pipeline);
      passEncoder.setVertexBuffer(0, geometryBuffer);
      passEncoder.setVertexBuffer(1, instanceBuffer);
      passEncoder.setBindGroup(0, uniformBindGroup);
      passEncoder.draw(segments * 3, items.length, 0, 0);
      passEncoder.end();
      frameBuffer.unmap();
      device.queue.submit([copyEncoder.finish(), commandEncoder.finish()]);
    });
  })();
}

function createAttributes(items: SceneItem[]): Float32Array {
  return Float32Array.from(
    (items as unknown as SceneSymbol[]).flatMap((item: SceneSymbol) => {
      const { x = 0, y = 0, size, fill, opacity = 0 } = item;
      const col = color(fill).rgb();
      const rad = Math.sqrt(size) / 2;
      const r = col.r / 255;
      const g = col.g / 255;
      const b = col.b / 255;
      return [x, y, r, g, b, opacity, rad];
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