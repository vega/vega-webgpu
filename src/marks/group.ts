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
      fillColor = [col.r / 255.0, col.b / 255.0, col.g / 255.0, 1.0];
    }
    let strokeColor = [0, 0, 0, 0];
    if (stroke && stroke !== 'transparent') {
      const col = color(stroke);
      // TODO: account for HSB
      //@ts-ignore
      strokeColor = [col.r / 255.0, col.b / 255.0, col.g / 255.0, 1.0];
    }
    const w = width || 0,
      h = height || 0;

    // //@ts-ignore;
    // const device = this._device;

    // const shader = device.createShaderModule({
    //   code: shaderSource
    // });

    // const pipeline = device.createRenderPipeline({
    //   vertex: {
    //     module: shader,
    //     entryPoint: 'main_vertex',
    //     buffers: [
    //       {
    //         arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
    //         attributes: [
    //           {
    //             shaderLocation: 0,
    //             offset: 0,
    //             format: 'float32x2'
    //           }
    //         ]
    //       }
    //     ]
    //   },
    //   fragment: {
    //     module: shader,
    //     entryPoint: 'main_fragment',
    //     targets: [{format: this._swapChainFormat}]
    //   },
    //   primitives: {
    //     topology: 'triangle-list'
    //   }
    // });

    // const commandEncoder = device.createCommandEncoder();
    // const textureView = this._swapChain.getCurrentTexture().createView();
    // const renderPassDescriptor = {
    //   colorAttachments: [
    //     {
    //       view: textureView,
    //       loadValue: {r: 1.0, g: 1.0, b: 1.0, a: 1.0},
    //       storeOp: 'store'
    //     }
    //   ]
    // };
    // const positions = new Float32Array([1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0]);
    // //@ts-ignore
    // const positionsBuffer = createBuffer(device, positions, GPUBufferUsage.VERTEX);
    // const uniformVertexBuffer = createBuffer(
    //   device,
    //   new Float32Array([tx, ty, w, h, ...this._uniforms.resolution]),
    //   //@ts-ignore
    //   GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    // );

    // const uniformFragmentBuffer = createBuffer(
    //   device,
    //   new Float32Array([...fillColor, ...strokeColor, strokeWidth]),

    //   //@ts-ignore
    //   GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    // );

    // const vertexBindGroup = device.createBindGroup({
    //   layout: pipeline.getBindGroupLayout(0),
    //   entries: [
    //     {
    //       binding: 0,
    //       resource: {
    //         buffer: uniformVertexBuffer
    //       }
    //     },
    //     {
    //       binding: 1,
    //       resource: {
    //         buffer: uniformFragmentBuffer
    //       }
    //     }
    //   ]
    // });

    // const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    // passEncoder.setPipeline(pipeline);
    // passEncoder.setBindGroup(0, vertexBindGroup);
    // passEncoder.setVertexBuffer(0, positionsBuffer);
    // passEncoder.draw(6, 1, 0, 0);
    // passEncoder.endPass();
    // device.queue.submit([commandEncoder.finish()]);

    visit(group, item => {
      this.draw(ctx, item, [tx, ty]);
    });
  });
}

export default {
  type: 'group',
  draw: draw
};
