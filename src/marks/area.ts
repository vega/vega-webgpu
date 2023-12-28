import { color } from 'd3-color';
import { Bounds } from 'vega-scenegraph';
import { SceneItem } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js';
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { createRenderPipeline, createDefaultBindGroup, createRenderPassDescriptor } from '../util/render.js';

import { area } from '../path/shapes';
import geometryForItem from '../path/geometryForItem';

import shaderSource from '../shaders/triangles.wgsl';

const drawName = 'Area';
export default {
  type: 'area',
  draw: draw
};

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: GPUScene, vb: Bounds) {
  const items = scene.items;
  if (!items?.length) {
    return;
  }
  for (var itemStr in items) {
    const item = items[itemStr];
    // @ts-ignore
    item.stroke = '#fff';
    const bufferManager = new BufferManager(device, drawName, this._uniforms.resolution, [vb.x1, vb.y1]);

    const shader = device.createShaderModule({ code: shaderSource, label: drawName + ' Shader' });
    const vertextBufferManager = new VertexBufferManager(
      ['float32x3', 'float32x4'], // position, color
      ['float32x2'] // center
    );
    const pipeline = createRenderPipeline(drawName, device, shader, scene._format, vertextBufferManager.getBuffers());

    const geometryData = createGeometryData(ctx, item, items);
    const geometryCount = geometryData.length / vertextBufferManager.getVertexLength();
    const geometryBuffer = bufferManager.createGeometryBuffer(geometryData);
    const uniformBuffer = bufferManager.createUniformBuffer();
    const uniformBindGroup = createDefaultBindGroup(drawName, device, pipeline, uniformBuffer);
    const attributes = Float32Array.from([0.0, 0.0]);
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
        passEncoder.draw(geometryCount, 1, 0, 0);
        passEncoder.end();
        frameBuffer.unmap();
        device.queue.submit([copyEncoder.finish(), commandEncoder.finish()]);
      });
    })();
  }
}

interface ColoredGeometry {
  triangles: Float32Array,
  colors: Float32Array,
  numTriangles: number
}
function createGeometryData(
  context: GPUCanvasContext,
  item: SceneItem,
  items: SceneItem[]
): Float32Array {
  const shapeGeom = area(context, items);
  const geometry = geometryForItem(context, item, shapeGeom) as ColoredGeometry;
  const geometryData = [];
  for (var i = 0; i < geometry.numTriangles; i++) {
    geometryData.push(
      geometry.triangles[i * 3],
      geometry.triangles[i * 3 + 1],
      geometry.triangles[i * 3 + 2]
    );
    geometryData.push(
      geometry.colors[i * 4],
      geometry.colors[i * 4 + 1],
      geometry.colors[i * 4 + 2],
      geometry.colors[i * 4 + 3]
    );
  }
  return Float32Array.from(geometryData);
}