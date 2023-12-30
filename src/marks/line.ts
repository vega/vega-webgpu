import color from '../util/color';
import { quadVertex } from '../util/arrays';
import { Bounds } from 'vega-scenegraph';
import { SceneLine, SceneItem } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js'
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { createRenderPipeline, createDefaultBindGroup, createRenderPassDescriptor } from '../util/render.js';

import shaderSource from '../shaders/line.wgsl';


const drawName = 'Line';
export default {
  type: 'line',
  draw: draw,
  pick: () => null,
};


interface Line {
  x: number;
  y: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
}

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  const items = scene.items;
  if (!items?.length) {
    return;
  }
  const bufferManager = new BufferManager(device, drawName, this._uniforms.resolution, [vb.x1, vb.y1]);

  const shader = device.createShaderModule({ code: shaderSource, label: drawName + ' Shader' });
  const vertextBufferManager = new VertexBufferManager(
    [],
    ['float32x2', 'float32x2', 'float32x4', 'float32'] // start, end, color, strokewidth
  );
  let buffers = vertextBufferManager.getBuffers();
  const pipeline = createRenderPipeline(drawName, device, shader, scene._format, buffers);

  const geometryBuffer = bufferManager.createGeometryBuffer(quadVertex);
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
      passEncoder.setVertexBuffer(0, instanceBuffer);
      passEncoder.setBindGroup(0, uniformBindGroup);
      // 6 because we are drawing two triangles
      passEncoder.draw(6, items.length);
      passEncoder.end();
      frameBuffer.unmap();
      device.queue.submit([copyEncoder.finish(), commandEncoder.finish()]);
    });
  })();
}

function createAttributes(items: SceneItem[]): Float32Array {
  let attributes = [];
  for (let i = 0; i < items.length - 1; i++) {
    // @ts-ignore
    const { x = 0, y = 0, stroke, strokeWidth = 1, strokeOpacity = 1 } = items[i]
    const x2 = items[i + 1].x | 0;
    const y2 = items[i + 1].y | 0;
    const col = color(stroke);
    let [r, g, b] = [col.r, col.g, col.b];
    attributes.push(...[
      x, y,
      x2, y2,
      r, g, b, strokeOpacity,
      strokeWidth
    ]);
  }
  let lastItem = items[items.length - 1];
  const lastCol = color((lastItem as SceneLine).stroke);
  let [r, g, b] = [lastCol.r, lastCol.g, lastCol.b];
  attributes.push(...[
    lastItem.x, lastItem.y,
    lastItem.x, lastItem.y,
    r, g, b, 1.0,
    (lastItem as SceneLine).strokeWidth
  ]);
  return Float32Array.from(attributes);
}