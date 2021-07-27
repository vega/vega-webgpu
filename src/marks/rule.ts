import { color } from 'd3-color';
import { createBuffer } from '../util/arrays';
//import { pick } from '../util/pick';
//@ts-ignore
import shaderSource from '../shaders/rect.wgsl';

interface Rule {
  x: number;
  y: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  stroke: string;
  strokeWidth: string;
  strokeOpacity: number;
}

function draw(ctx: GPUCanvasContext, scene: { items: Array<Rule> }, tfx: [number, number]) {
  const device = this._device;
  const shader = device.createShaderModule({ code: shaderSource });

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: shader,
      entryPoint: 'main_vertex',
      buffers: [
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
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
  const commandEncoder = device.createCommandEncoder();
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

  const positions = new Float32Array([1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0]);
  const positionBuffer = createBuffer(device, positions, GPUBufferUsage.VERTEX);

  const bundleEncoder = device.createRenderBundleEncoder({
    colorFormats: [this._swapChainFormat]
  });
  bundleEncoder.setPipeline(pipeline);
  bundleEncoder.setVertexBuffer(0, positionBuffer);

  const itemCount = scene.items.length;
  for (let i = 0; i < itemCount; i++) {
    const { x = 0, y = 0, x2, y2, stroke, strokeWidth, strokeOpacity } = scene.items[i];
    const col = color(stroke);
    const dx = x2 != null ? x2 : x;
    const dy = y2 != null ? y2 : y;
    const ax = Math.abs(dx - x);
    const ay = Math.abs(dy - y);
    const sw = strokeWidth ? strokeWidth : 1;

    const uniforms = new Float32Array([
      ...this._uniforms.resolution,
      ...tfx,
      Math.min(x, dx),
      Math.min(y, dy),
      ax ? ax : sw,
      ay ? ay : sw
    ]);
    //@ts-ignore
    const fillColor = new Float32Array([col.r / 255, col.g / 255, col.b / 255, strokeOpacity || 1.0]);
    const uniformBuffer = createBuffer(device, uniforms, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    const fillBuffer = createBuffer(device, fillColor, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    const uniformBindGroup = device.createBindGroup({
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
          resource: {
            buffer: fillBuffer
          }
        }
      ]
    });
    bundleEncoder.setBindGroup(0, uniformBindGroup);
    bundleEncoder.draw(6, 1, 0, 0);
  }

  const renderBundle = bundleEncoder.finish();
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.executeBundles([renderBundle]);
  passEncoder.endPass();
  device.queue.submit([commandEncoder.finish()]);
}


export default {
  type: 'rule',
  draw: draw,
  pick: () => null
};
