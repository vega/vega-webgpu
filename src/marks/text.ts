import {lineHeight, Bounds} from 'vega-scenegraph';
import {font, textLines, offset, textValue, textMetrics} from '../util/text';
import {HalfPi, DegToRad} from '../util/constants';
import {blend, fill, stroke} from '../util/canvas';
import {createBuffer} from '../util/arrays';
import shaderSource from '../shaders/text.wgsl';

interface Text {
  x: number;
  y: number;
  bounds: Bounds;
  dx: number;
  dy: number;
  baseline: 'top' | 'middle' | 'bottom' | 'line-top' | 'line-bottom';
  angle: number;
  radius: number;
  theta: number;
  align: 'left' | 'right' | 'center' | 'start' | 'end';
  opacity: number;
  fillOpacity: number;
  blend: string;
  fill: string;
  stroke: string;
  fontSize: number;
  text: string;
}

const tempBounds = new Bounds();

function anchorPoint(item: Text) {
  var x = item.x || 0,
    y = item.y || 0,
    r = item.radius || 0,
    t: number;

  if (r) {
    t = (item.theta || 0) - HalfPi;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  tempBounds.x1 = x;
  tempBounds.y1 = y;
  return tempBounds;
}

function bound(bounds: Bounds, item: Text, mode: number) {
  const dpi = this._uniforms.dpi;
  var h = textMetrics.height(item),
    a = item.align,
    p = anchorPoint(item),
    x = p.x1,
    y = p.y1,
    dx = item.dx * dpi || 0,
    dy = ((item.dy || 0) + offset(item) - Math.round(0.8 * h)) * dpi, // use 4/5 offset
    tl = textLines(item),
    w;

  // get dimensions
  if (Array.isArray(tl)) {
    // multi-line text
    h += lineHeight(item) * (tl.length - 1);
    w = tl.reduce((w, t) => Math.max(w, textMetrics.width(item, t)), 0);
  } else {
    // single-line text
    w = textMetrics.width(item, tl);
  }

  // horizontal alignment
  if (a === 'center') {
    dx -= w / 2;
  } else if (a === 'right') {
    dx -= w;
  } else {
    // left by default, do nothing
  }

  bounds.set((dx += x), (dy += y), dx + w, dy + h);

  if (item.angle && !mode) {
    bounds.rotate(item.angle * DegToRad, x, y);
  } else if (mode === 2) {
    return bounds.rotatedPoints(item.angle * DegToRad, x, y);
  }
  return bounds;
}

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: {items: Array<Text>; bounds: Bounds}, vb: Bounds) {
  const dpi = this._uniforms.dpi;
  const [w, h] = this._uniforms.resolution;
  const canvas = document.createElement('canvas');
  canvas.width = w * dpi;
  canvas.height = h * dpi;
  const context = canvas.getContext('2d');
  const {items} = scene;
  if (!items?.length) {
    return;
  }
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    var opacity = item.opacity == null ? 1 : item.opacity,
      p: Bounds,
      x: number,
      y: number,
      i: number,
      lh: number,
      tl: number | Array<number>,
      str: string;

    context.font = font(item);
    context.textAlign = item.align || 'left';

    p = anchorPoint(item);
    x = (p.x1 - vb.x1) * dpi;
    y = (p.y1 - vb.y1) * dpi;

    if (item.angle) {
      context.save();
      context.translate(x, y);
      context.rotate(item.angle * DegToRad);
      x = y = 0; // reset x, y
    }
    x += item.dx * dpi || 0;
    y += ((item.dy || 0) + offset(item)) * dpi;

    tl = textLines(item);
    blend(context, item);
    if (Array.isArray(tl)) {
      lh = lineHeight(item);
      for (i = 0; i < tl.length; ++i) {
        str = textValue(item, tl[i]);
        if (item.fill && fill(context, item, opacity)) {
          context.fillText(str, x, y);
        }
        if (item.stroke && stroke(context, item, opacity)) {
          context.strokeText(str, x, y);
        }
        y += lh * dpi;
      }
    } else {
      str = textValue(item, tl);
      if (item.fill && fill(context, item, opacity)) {
        context.fillText(str, x, y);
      }
      if (item.stroke && stroke(context, item, opacity)) {
        context.strokeText(str, x, y);
      }
    }

    if (item.angle) context.restore();
  }

  const shader = device.createShaderModule({code: shaderSource});
  const pipeline = device.createRenderPipeline({
    vertex: {
      module: shader,
      entryPoint: 'main_vertex',
      buffers: [
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 4,
          attributes: [
            // pos
            {
              shaderLocation: 0,
              offset: 0,
              format: 'float32x2'
            },
            // uv
            {
              shaderLocation: 1,
              offset: Float32Array.BYTES_PER_ELEMENT * 2,
              format: 'float32x2'
            }
          ]
        }
      ]
    },
    fragment: {
      module: shader,
      entryPoint: 'main_fragment',
      targets: [
        {
          format: this._swapChainFormat,
          blend: {
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add'
            },
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add'
            }
          }
        }
      ]
    },
    primitives: {
      topology: 'triangle-list'
    }
  });

  const positions = new Float32Array([
    1.0, 1.0, 1.0, 0.0,

    1.0, 0.0, 1.0, 1.0,

    0.0, 0.0, 0.0, 1.0,

    1.0, 1.0, 1.0, 0.0,

    0.0, 0.0, 0.0, 1.0,

    0.0, 1.0, 0.0, 0.0
  ]);

  const positionBuffer = createBuffer(device, positions, GPUBufferUsage.VERTEX);

  const sampler = device.createSampler({});

  (async () => {
    const bitmap = await createImageBitmap(canvas);
    const texture = device.createTexture({
      size: {width: w * dpi, height: h * dpi, depthOrArrayLayers: 1},
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    device.queue.copyExternalImageToTexture({source: bitmap}, {texture}, {width: w * dpi, height: h * dpi});

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: sampler
        },
        {
          binding: 1,
          resource: texture.createView()
        }
      ]
    });

    //@ts-ignore
    const textureView = ctx.getCurrentTexture().createView();
    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          loadValue: 'load',
          storeOp: 'store'
        }
      ]
    };
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.setVertexBuffer(0, positionBuffer);
    passEncoder.draw(6, 1, 0, 0);
    passEncoder.endPass();
    device.queue.submit([commandEncoder.finish()]);
  })();
}

export default {
  type: 'text',
  draw: draw,
  pick: () => null
};
