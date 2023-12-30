import color from '../util/color';
import { Bounds } from 'vega-scenegraph';
import {
  SceneItem, SceneLine
} from 'vega-typings';
import shaderSource from '../shaders/rule.wgsl';
import { quadVertex } from '../util/arrays';
import { GPUScene } from '../types/gpuscene.js';
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { createRenderPipeline, createUniformBindGroup, createRenderPassDescriptor } from '../util/render.js';


const drawName = 'Rule';
export default {
  type: 'rule',
  draw: draw
};


function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  const items = scene.items;
  if (!items?.length) {
    return;
  }

  const resolution: [width: number, height: number] = [this._uniforms.resolution[0], this._uniforms.resolution[1]];
  const bufferManager = new BufferManager(device, drawName, resolution, [vb.x1, vb.y1]);
  const shader = device.createShaderModule({ code: shaderSource, label: drawName + ' Shader' });
  const vertextBufferManager = new VertexBufferManager(
    ['float32x2'], // position
    // center, scale, color
    ['float32x2', 'float32x2', 'float32x4']
  );
  const pipeline = createRenderPipeline(drawName, device, shader, scene._format, vertextBufferManager.getBuffers());

  const geometryBuffer = bufferManager.createGeometryBuffer(quadVertex);
  const uniformBuffer = bufferManager.createUniformBuffer();
  const uniformBindGroup = createUniformBindGroup(drawName, device, pipeline, uniformBuffer);
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
      // 6 because we are drawing two triangles
      passEncoder.draw(6, items.length);
      passEncoder.end();
      frameBuffer.unmap();
      device.queue.submit([copyEncoder.finish(), commandEncoder.finish()]);
    });
  })();
}

function createAttributes(items: SceneItem[]): Float32Array {
  return Float32Array.from(
    items.flatMap((item: SceneLine) => {
      let { x = 0, y = 0, x2, y2, stroke, strokeWidth = 1, opacity = 1 } = item;
      x2 ??= x;
      y2 ??= y;
      const ax = Math.abs(x2 - x);
      const ay = Math.abs(y2 - y);

      const col = color(stroke);
      return [
        Math.min(x, x2),
        Math.min(y, y2),
        ax ? ax : strokeWidth,
        ay ? ay : strokeWidth,
        col.r,
        col.g,
        col.b,
        opacity,
      ];
    }),
  );
}