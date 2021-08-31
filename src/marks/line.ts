import {color} from 'd3-color';
import {createBuffer} from '../util/arrays';
import {Bounds} from 'vega-scenegraph';

//@ts-ignore
import shaderSource from '../shaders/line.wgsl';

interface Line {
  x: number;
  y: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
}

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: {items: Array<Line>}, vb: Bounds) {
  const {items} = scene;
  if (!items?.length) {
    return;
  }
  const itemCount = items.length;

  const shader = device.createShaderModule({code: shaderSource});

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: shader,
      entryPoint: 'main_vertex',
      buffers: [
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 9,
          attributes: [
            // position
            {
              shaderLocation: 0,
              offset: 0,
              format: 'float32x2'
            },
            // normal
            {
              shaderLocation: 1,
              offset: Float32Array.BYTES_PER_ELEMENT * 2,
              format: 'float32x2'
            },
            // color
            {
              shaderLocation: 2,
              offset: Float32Array.BYTES_PER_ELEMENT * 4,
              format: 'float32x4'
            },
            // strokewidth
            {
              shaderLocation: 3,
              offset: Float32Array.BYTES_PER_ELEMENT * 8,
              format: 'float32'
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

  const positions = [];

  for (let i = 0; i < itemCount; i++) {
    const {x = 0, y = 0, stroke, strokeWidth = 1, strokeOpacity = 1} = items[i];
    const {x: x2, y: y2} = items[Math.min(itemCount - 1, i + 1)];
    const [dx, dy] = [x2 - x, y2 - y];
    let [nx, ny] = [-dy, dx];
    const vlen = Math.sqrt(nx ** 2 + ny ** 2);
    nx /= vlen || 1;
    ny /= vlen || 1;

    const col = color(stroke).rgb();
    const r = col.r / 255;
    const g = col.g / 255;
    const b = col.b / 255;

    positions.push(
      x,
      y,
      nx,
      ny,
      r,
      g,
      b,
      strokeOpacity,
      strokeWidth,

      x,
      y,
      -nx,
      -ny,
      r,
      g,
      b,
      strokeOpacity,
      strokeWidth,

      x2,
      y2,
      -nx,
      -ny,
      r,
      g,
      b,
      strokeOpacity,
      strokeWidth,

      x2,
      y2,
      -nx,
      -ny,
      r,
      g,
      b,
      strokeOpacity,
      strokeWidth,

      x2,
      y2,
      nx,
      ny,
      r,
      g,
      b,
      strokeOpacity,
      strokeWidth,

      x,
      y,
      nx,
      ny,
      r,
      g,
      b,
      strokeOpacity,
      strokeWidth
    );
  }

  const positionBuffer = createBuffer(device, Float32Array.from(positions), GPUBufferUsage.VERTEX);

  const uniforms = Float32Array.from([...this._uniforms.resolution, vb.x1, vb.y1]);
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
  passEncoder.setBindGroup(0, uniformBindGroup);
  passEncoder.setVertexBuffer(0, positionBuffer);
  // 6 because our lines are made of quads
  passEncoder.draw(itemCount * 6, 1);
  passEncoder.endPass();
  device.queue.submit([commandEncoder.finish()]);
}

function pick(context, scene, x, y, gx, gy) {
  return null;
}

export default {
  type: 'rule',
  draw: draw,
  pick: pick
};
