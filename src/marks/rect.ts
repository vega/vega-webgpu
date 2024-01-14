import { Color } from '../util/color';
import { Bounds } from 'vega-scenegraph';
import { SceneItem, SceneRect } from 'vega-typings';
import { GPUScene } from '../types/gpuscene.js'
import { quadVertex } from '../util/arrays';
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';

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
  const pipeline = Renderer.createRenderPipeline(drawName, device, shader, scene._format, vertextBufferManager.getBuffers());

  const geometryBuffer = bufferManager.createGeometryBuffer(quadVertex);
  const uniformBuffer = bufferManager.createUniformBuffer();
  const uniformBindGroup = Renderer.createUniformBindGroup(drawName, device, pipeline, uniformBuffer);
  const attributes = createAttributes(items);
  const instanceBuffer = bufferManager.createInstanceBuffer(attributes);

  Renderer.bundle2(device, pipeline,  [6, items.length], [geometryBuffer, instanceBuffer], [uniformBindGroup]);
}

function createAttributes(items: SceneItem[]): Float32Array {
  return Float32Array.from(
    (items).flatMap((item: SceneRect) => {
      const {
        x = 0,
        y = 0,
        width = 0,
        height = 0,
        opacity = 1,
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
      const col = Color.from(fill, opacity, fillOpacity);
      const scol = Color.from(stroke, opacity, strokeOpacity);
      const swidth = stroke ? strokeWidth ?? 1 : strokeWidth ?? 0;
      const cornerRadii = [
        cornerRadiusTopRight ?? cornerRadius,
        cornerRadiusBottomRight ?? cornerRadius,
        cornerRadiusBottomLeft ?? cornerRadius,
        cornerRadiusTopLeft ?? cornerRadius,
      ]
      return [
        x,
        y,
        width,
        height,
        ...col.rgba,
        ...scol.rgba,
        swidth,
        ...cornerRadii,
      ];
    }),
  );
}