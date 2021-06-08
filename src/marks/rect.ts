import {color} from 'd3-color';
import {createBuffer} from '../util/arrays';
//@ts-ignore
import shaderSource from '../shaders/rect.wgsl';

function draw(ctx, item, tfx) {
  (async () => {
    //@ts-ignore;
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const swapChain = ctx.configureSwapChain({
      device,
      compositingAlphaMode: 'premultiplied',
      format: this._swapChainFormat
    });
    const shader = device.createShaderModule({code: shaderSource});

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
      primitives: {
        topology: 'triangle-list'
      }
    });
    const commandEncoder = device.createCommandEncoder();
    const textureView = swapChain.getCurrentTexture().createView();
    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          loadValue: {r: 1.0, g: 1.0, b: 1.0, a: 1.0},
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

    const itemCount = item.items.length;
    for (let i = 0; i < itemCount; i++) {
      const {x, y, width, height, fill, fillOpacity} = item.items[i];
      const col = color(fill);
      const uniforms = new Float32Array([
        ...this._uniforms.resolution,
        ...tfx,
        x || 0,
        y || 0,
        width || 0,
        height || 0
      ]);
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
  })();
}

export default {
  type: 'rect',
  draw: draw
};
