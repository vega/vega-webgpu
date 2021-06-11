import {createBuffer} from '../util/arrays';
import {color} from 'd3-color';
//@ts-ignore
import shaderSource from '../shaders/symbol.wgsl';

function draw(ctx, item, tfx) {
  //@ts-ignore
  const device = this._device;
  const shader = device.createShaderModule({
    code: shaderSource
  });
  const pipeline = device.createRenderPipeline({
    vertex: {
      module: shader,
      entryPoint: 'main_vertex',
      //@ts-ignore
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
      //@ts-ignore
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
    primitive: {
      topology: 'triangle-list'
    }
  });
  const commandEncoder = device.createCommandEncoder();
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

  const segments = 32;
  const positions = new Float32Array(
    Array.from({length: segments}, (_, i) => {
      const j = (i + 1) % segments;
      const ang1 = !i ? 0 : ((Math.PI * 2.0) / segments) * i;
      const ang2 = !j ? 0 : ((Math.PI * 2.0) / segments) * j;
      const x1 = Math.cos(ang1);
      const y1 = Math.sin(ang1);
      const x2 = Math.cos(ang2);
      const y2 = Math.sin(ang2);
      return [x1, y1, 0, 0, x2, y2];
    }).flat()
  );

  const positionBuffer = createBuffer(device, positions, GPUBufferUsage.VERTEX);

  const bundleEncoder = device.createRenderBundleEncoder({
    colorFormats: [this._swapChainFormat]
  });
  bundleEncoder.setPipeline(pipeline);
  bundleEncoder.setVertexBuffer(0, positionBuffer);

  const itemCount = item.items.length;
  for (let i = 0; i < itemCount; i++) {
    const {x, y, size, fill, opacity} = item.items[i];
    const col = color(fill);
    const r = Math.sqrt(size) / 2;
    const uniforms = new Float32Array([...this._uniforms.resolution, ...tfx, x, y, r, r]);
    //@ts-ignore
    const fillColor = new Float32Array([col.r / 255, col.g / 255, col.b / 255, opacity || 1.0]);
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
    bundleEncoder.draw(segments * 3, 1, 0, 0);
  }

  const renderBundle = bundleEncoder.finish();
  //@ts-ignore
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.executeBundles([renderBundle]);
  passEncoder.endPass();
  device.queue.submit([commandEncoder.finish()]);
}

export default {
  type: 'symbol',
  draw: draw
};
