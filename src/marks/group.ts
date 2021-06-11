import {visit} from '../util/visit';
import {color} from 'd3-color';
import {createBuffer} from '../util/arrays';
//@ts-ignore
import shaderSource from '../shaders/group.wgsl';

function draw(ctx, scene, tfx) {
  visit(scene, group => {
    const {fill, stroke, width, height} = group;
    const gx = group.x || 0,
      gy = group.y || 0,
      fore = group.strokeForeground,
      opacity = group.opacity == null ? 1 : group.opacity;

    const [tx, ty] = [tfx[0] + gx, tfx[1] + gy];
    const strokeWidth = 1;

    let fillColor = [0, 0, 0, 0];
    if (fill && fill !== 'transparent') {
      const col = color(fill);
      // TODO: account for HSB
      //@ts-ignore
      fillColor = [col.r / 255.0, col.b / 255.0, col.g / 255.0, 1.0 * opacity];
    }
    let strokeColor = [0, 0, 0, 0];
    if (stroke && stroke !== 'transparent') {
      const col = color(stroke);
      // TODO: account for HSB
      //@ts-ignore
      strokeColor = [col.r / 255.0, col.b / 255.0, col.g / 255.0, 1.0 * opacity];
    }
    const w = width || 0,
      h = height || 0;

    const device = this._device;

    const shader = device.createShaderModule({
      code: shaderSource
    });

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
    const positionsBuffer = createBuffer(device, positions, GPUBufferUsage.VERTEX);
    const uniforms = new Float32Array([...this._uniforms.resolution, tx, ty, w, h]);
    const uniformBuffer = createBuffer(device, uniforms, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

    const colorBuffer = createBuffer(
      device,
      new Float32Array([...fillColor, ...strokeColor, strokeWidth]),
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    );

    const vertexBindGroup = device.createBindGroup({
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
            buffer: colorBuffer
          }
        }
      ]
    });

    //@ts-ignore
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, vertexBindGroup);
    passEncoder.setVertexBuffer(0, positionsBuffer);
    passEncoder.draw(6, 1, 0, 0);
    passEncoder.endPass();
    device.queue.submit([commandEncoder.finish()]);

    visit(group, item => {
      this.draw(ctx, item, [tx, ty]);
    });
  });
}

export default {
  type: 'group',
  draw: draw
};
