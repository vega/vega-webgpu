import {color} from 'd3-color';
import {createBuffer, quadVertex} from '../util/arrays';
//import { pick } from '../util/pick';
//@ts-ignore
import shaderSource from '../shaders/rule.wgsl';

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

function draw(ctx: GPUCanvasContext, scene: {items: Array<Rule>}, tfx: [number, number]) {
  const {items} = scene;
  if (!items?.length) {
    return;
  }
  const itemCount = items.length;

  const device = this._device;
  const shader = device.createShaderModule({code: shaderSource});

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: shader,
      entryPoint: 'main_vertex',
      buffers: [
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
          attributes: [
            // position
            {
              shaderLocation: 0,
              offset: 0,
              format: 'float32x2'
            }
          ]
        },
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 8,
          stepMode: 'instance',
          attributes: [
            // center
            {
              shaderLocation: 1,
              offset: 0,
              format: 'float32x2'
            },
            // scale
            {
              shaderLocation: 2,
              offset: Float32Array.BYTES_PER_ELEMENT * 2,
              format: 'float32x2'
            },
            // color
            {
              shaderLocation: 3,
              offset: Float32Array.BYTES_PER_ELEMENT * 4,
              format: 'float32x4'
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

  const positionBuffer = createBuffer(device, quadVertex, GPUBufferUsage.VERTEX);
  const attributes = [];

  for (let i = 0; i < itemCount; i++) {
    const {x = 0, y = 0, x2, y2, stroke, strokeWidth = 1, strokeOpacity = 1} = items[i];
    const dx = x2 != null ? x2 : x;
    const dy = y2 != null ? y2 : y;
    const ax = Math.abs(dx - x);
    const ay = Math.abs(dy - y);

    const col = color(stroke).rgb();
    attributes.push(
      Math.min(x, dx),
      Math.min(y, dy),
      ax ? ax : strokeWidth,
      ay ? ay : strokeWidth,
      col.r / 255,
      col.g / 255,
      col.b / 255,
      strokeOpacity
    );
  }

  const attributesBuffer = createBuffer(device, Float32Array.from(attributes), GPUBufferUsage.VERTEX);

  const uniforms = new Float32Array([...this._uniforms.resolution, ...tfx]);
  const uniformBuffer = createBuffer(device, uniforms, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      }
    ]
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

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(pipeline);
  passEncoder.setVertexBuffer(0, positionBuffer);
  passEncoder.setVertexBuffer(1, attributesBuffer);
  passEncoder.setBindGroup(0, uniformBindGroup);
  // 6 because rectangles are a quad -- two triangles
  passEncoder.draw(6, itemCount);
  passEncoder.endPass();
  device.queue.submit([commandEncoder.finish()]);
}

export default {
  type: 'rule',
  draw: draw,
  pick: () => null
};
