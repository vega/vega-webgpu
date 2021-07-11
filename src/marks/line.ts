import { color } from 'd3-color';
import { createBuffer } from '../util/arrays';
//@ts-ignore
import shaderSource from '../shaders/line.wgsl';

interface Line {
  x: number;
  y: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
}

function draw(ctx: GPUCanvasContext, scene: { items: Array<Line> }, tfx: [number, number]) {
  const device = this._device;
  const shader = device.createShaderModule({ code: shaderSource });

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

  const bundleEncoder = device.createRenderBundleEncoder({
    colorFormats: [this._swapChainFormat]
  });
  bundleEncoder.setPipeline(pipeline);

  const itemCount = scene.items.length;
  for (let i = 0; i < itemCount; i++) {
    const { x, y, stroke, strokeWidth, strokeOpacity } = scene.items[i];
    const { x: x2, y: y2 } = scene.items[Math.min(itemCount - 1, i + 1)];
    const [dx, dy] = [x2 - x, y2 - y];
    let [nx, ny] = [-dy, dx];
    const vlen = Math.sqrt(nx ** 2 + ny ** 2);
    nx /= vlen || 1;
    ny /= vlen || 1;
    const col = color(stroke);

    // buffer layout:
    // posx, posy, normalx, normaly
    const positions = new Float32Array([
      x,
      y,
      nx,
      ny,
      x,
      y,
      -nx,
      -ny,
      x2,
      y2,
      -nx,
      -ny,
      x2,
      y2,
      -nx,
      -ny,
      x2,
      y2,
      nx,
      ny,
      x,
      y,
      nx,
      ny
    ]);

    const positionBuffer = createBuffer(device, positions, GPUBufferUsage.VERTEX);
    bundleEncoder.setVertexBuffer(0, positionBuffer);

    const sw = strokeWidth || 1;

    const uniforms = new Float32Array([...this._uniforms.resolution, ...tfx, sw, sw]);
    //@ts-ignore
    const strokeColor = new Float32Array([col.r / 255, col.g / 255, col.b / 255, strokeOpacity || 1.0]);
    const uniformBuffer = createBuffer(device, uniforms, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    const strokeBuffer = createBuffer(device, strokeColor, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
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
            buffer: strokeBuffer
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
  draw: draw
};
