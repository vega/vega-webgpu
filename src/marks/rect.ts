import color from '../util/color';
import { Bounds } from 'vega-scenegraph';
import { SceneItem, SceneRect } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js'
import { quadVertex } from '../util/arrays';
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { createRenderPipeline, createUniformBindGroup, createRenderPassDescriptor } from '../util/render.js';

import shaderSource from '../shaders/rect.wgsl';

const drawName = 'Rect';
export default {
  type: 'rect',
  draw: draw,
};

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds): [] {
  const items = scene.items;
  if (!items?.length) {
    return;
  }

  const bufferManager = new BufferManager(device, drawName, this._uniforms.resolution, [vb.x1, vb.y1]);
  const shader = device.createShaderModule({ code: shaderSource, label: drawName + ' Shader' });
  const vertextBufferManager = new VertexBufferManager(
    ['float32x2'], // position
    // center, dimensions, fill color, stroke color, stroke width, corner radii
    ['float32x2', 'float32x2', 'float32x4', 'float32x4', 'float32', 'float32x4']
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
    (items).flatMap((item: SceneRect) => {
      const {
        x = 0,
        y = 0,
        width = 0,
        height = 0,
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
      const fillCol = color(fill);
      const fillOpacity1 = fill === 'transparent' ? 0 : fillOpacity;
      const strokeCol = color(stroke) ?? { r: 0, g: 0, b: 0, a: 0 };
      const stropacity = stroke && strokeCol ? strokeOpacity : 0;
      const strokeWidth1 = strokeWidth != 0 && stroke ? (strokeWidth ?? 1) : (strokeWidth ?? 0);
      const cornerRadii = [
        cornerRadiusTopRight | cornerRadius,
        cornerRadiusBottomRight | cornerRadius,
        cornerRadiusBottomLeft | cornerRadius,
        cornerRadiusTopLeft | cornerRadius,
      ]
      return [
        x,
        y,
        width,
        height,
        fillCol.r,
        fillCol.g,
        fillCol.b,
        fillOpacity1,
        strokeCol.r,
        strokeCol.g,
        strokeCol.b,
        stropacity,
        strokeWidth1,
        ...cornerRadii,
      ];
    }),
  );
}