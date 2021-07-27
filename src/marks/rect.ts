import { color } from 'd3-color';
import { createBuffer } from '../util/arrays';
//@ts-ignore
import shaderSource from '../shaders/rect.wgsl';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeOpacity: number;
}

function draw(ctx: GPUCanvasContext, scene: { items: Array<Rect> }, tfx: [number, number]) {
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
    const { x = 0, y = 0, width = 0, height = 0, fill, fillOpacity } = scene.items[i];
    const col = color(fill);
    const uniforms = new Float32Array([...this._uniforms.resolution, ...tfx, x, y, width, height]);
    //@ts-ignore
    const fillColor = new Float32Array([col.r / 255, col.g / 255, col.b / 255, fillOpacity || 1.0]);
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
  type: 'rect',
  draw: draw
};
