import {font, lineHeight, textLines, offset, textValue} from '../util/text';
import {HalfPi, DegToRad} from '../util/constants';
import {blend, fill, stroke} from '../util/canvas';
import {createBuffer} from '../util/arrays';
import {pick} from '../util/pick';
import shaderSource from '../shaders/text.wgsl';

interface Text {
  x: number;
  y: number;
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
}

function anchorPoint(item: Text): {x1: number; y1: number} {
  let x = item.x || 0,
    y = item.y || 0,
    r = item.radius || 0,
    t: number;
  if (r) {
    t = (item.theta || 0) - HalfPi;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }
  return {x1: x, y1: y};
}

function draw(ctx: GPUCanvasContext, scene: {items: Array<Text>}, tfx: [number, number]) {
  const [offsetx, offsety] = tfx;
  const dpi = this._uniforms.dpi;
  const [w, h] = this._uniforms.resolution;
  const canvas = new OffscreenCanvas(w * dpi, h * dpi);
  const octx = canvas.getContext('2d');
  for (let i = 0; i < scene.items.length; i++) {
    const item = scene.items[i];
    let opacity = item.opacity == null ? 1 : item.opacity,
      p: {x1: number; y1: number},
      x: number,
      y: number,
      j: number,
      lh: number,
      tl: unknown,
      str: string;
    octx.font = font(item);
    octx.textAlign = item.align || 'left';

    p = anchorPoint(item);
    x = (p.x1 + offsetx) * dpi;
    y = (p.y1 + offsety) * dpi;

    if (item.angle) {
      octx.save();
      octx.translate(x, y);
      octx.rotate(item.angle * DegToRad);
      x = y = 0; // reset x, y
    }
    x += item.dx * dpi || 0;
    y += (item.dy * dpi || 0) + offset(item);
    tl = textLines(item);
    blend(octx, item);
    if (Array.isArray(tl)) {
      lh = lineHeight(item);
      for (j = 0; j < tl.length; ++j) {
        str = textValue(item, tl[j]);
        if (item.fill && fill(octx, item, opacity)) {
          octx.fillText(str, x, y);
        }
        if (item.stroke && stroke(octx, item, opacity)) {
          octx.strokeText(str, x, y);
        }
        y += lh;
      }
    } else {
      str = textValue(item, tl);
      if (item.fill && fill(octx, item, opacity)) {
        octx.fillText(str, x, y);
      }
      if (item.stroke && stroke(octx, item, opacity)) {
        octx.strokeText(str, x, y);
      }
    }

    if (item.angle) octx.restore();
  }

  const device = this._device;
  const shader = device.createShaderModule({code: shaderSource});
  const pipeline = device.createRenderPipeline({
    vertex: {
      module: shader,
      entryPoint: 'main_vertex',
      buffers: [
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 4,
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: 'float32x2'
            },
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

  const uniforms = new Float32Array([w, h, ...tfx, dpi]);
  const uniformBuffer = createBuffer(device, uniforms, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear'
  });

  createImageBitmap(canvas).then(bitmap => {
    const texture = device.createTexture({
      size: [w * dpi, h * dpi, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    device.queue.copyExternalImageToTexture({source: bitmap}, {texture}, [w * dpi, h * dpi, 1]);

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer
          }
        },
        {
          binding: 1,
          resource: sampler
        },
        {
          binding: 2,
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
  });
}

function hit(context, item, x, y, gx, gy) {
  if (item.fontSize <= 0) return false;
  if (!item.angle) return true; // bounds sufficient if no rotation

  // project point into space of unrotated bounds
  var p = anchorPoint(item),
    ax = p.x1,
    ay = p.y1,
    b = bound(tempBounds, item, 1),
    a = -item.angle * DegToRad,
    cos = Math.cos(a),
    sin = Math.sin(a),
    px = cos * gx - sin * gy + (ax - cos * ax + sin * ay),
    py = sin * gx + cos * gy + (ay - sin * ax - cos * ay);

  return false; //b.contains(px, py);
}

export default {
  type: 'text',
  draw: draw,
  pick: pick(hit)
};
