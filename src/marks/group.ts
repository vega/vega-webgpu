import { visit } from '../util/visit';
import { Color } from '../util/color';
import { Bounds } from 'vega-scenegraph';
import { SceneItem, SceneRect } from 'vega-typings';
import { GPUScene, GPUSceneGroup } from '../types/gpuscene.js'
import { quadVertex } from '../util/arrays';
import { VertexBufferManager } from '../util/vertexManager.js';
import { BufferManager } from '../util/bufferManager.js';
import { Renderer } from '../util/renderer.js';


const drawName = 'Group';
export default {
  type: 'group',
  draw: draw,
};


interface GroupGPUCanvasContext extends GPUCanvasContext {
  _tx: number,
  _ty: number,
  _origin: [number, number],
  _clip: unknown,
  _textContext: CanvasRenderingContext2D,
}

function draw(device: GPUDevice, ctx: GroupGPUCanvasContext, scene: GPUScene, vb: Bounds) {
  const items = scene.items;
  if (!items?.length) {
    return;
  }

  const bufferManager = new BufferManager(device, drawName, this._uniforms.resolution, [vb.x1, vb.y1]);
  const shader = (ctx as any)._shaderCache["Rect"] as GPUShaderModule;
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

  const renderPassDescriptor = Renderer.createRenderPassDescriptor(drawName, this.clearColor(), this.depthTexture().createView())
  renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();

  Renderer.bundle2(device, pipeline,  [6, items.length], [geometryBuffer, instanceBuffer], [uniformBindGroup]);

  visit(scene, (group: GPUSceneGroup) => {
    var gx = group.x || 0,
      gy = group.y || 0,
      w = group.width || 0,
      h = group.height || 0,
      offset, oldClip;

    // setup graphics context
    ctx._tx += gx;
    ctx._ty += gy;
    ctx._textContext.save();
    ctx._textContext.translate(gx, gy);

    if (group.mark.clip) {
      oldClip = ctx._clip;
      ctx._clip = [
        ctx._origin[0] + ctx._tx,
        ctx._origin[1] + ctx._ty,
        ctx._origin[0] + ctx._tx + w,
        ctx._origin[1] + ctx._ty + h
      ];
    }
    if (vb) vb.translate(-gx, -gy);

    visit(group, (item: SceneItem) => {
      this.draw(device, ctx, item, vb);
    });

    if (vb) vb.translate(gx, gy);
    //@ts-ignore
    if (group.clip || group.bounds.clip) {
      ctx._clip = oldClip;
    }
    ctx._tx -= gx;
    ctx._ty -= gy;
    ctx._textContext.restore();
  });
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