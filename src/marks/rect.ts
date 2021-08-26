import {color} from 'd3-color';
import {createBuffer, quadVertex} from '../util/arrays';
import {Bounds} from 'vega-scenegraph';
//@ts-ignore
import shaderSource from '../shaders/rect.wgsl';
import {SceneGroup, SceneRect} from 'vega-typings';

interface WebGPUSceneGroup extends SceneGroup {
  _pipeline?: GPURenderPipeline;
  _geometryBuffer?: GPUBuffer;
  _instanceBuffer?: GPUBuffer;
  _uniformsBuffer?: GPUBuffer;
  _uniformsBindGroup?: GPUBindGroup;
}

function initRenderPipeline(device: GPUDevice, scene: WebGPUSceneGroup) {
  const shader = device.createShaderModule({code: shaderSource});
  scene._pipeline = device.createRenderPipeline({
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
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 13,
          stepMode: 'instance',
          attributes: [
            // center
            {
              shaderLocation: 1,
              offset: 0,
              format: 'float32x2'
            },
            // dimensions
            {
              shaderLocation: 2,
              offset: Float32Array.BYTES_PER_ELEMENT * 2,
              format: 'float32x2'
            },
            // fill color
            {
              shaderLocation: 3,
              offset: Float32Array.BYTES_PER_ELEMENT * 4,
              format: 'float32x4'
            },
            // stroke color
            {
              shaderLocation: 4,
              offset: Float32Array.BYTES_PER_ELEMENT * 8,
              format: 'float32x4'
            },
            // stroke width
            {
              shaderLocation: 5,
              offset: Float32Array.BYTES_PER_ELEMENT * 12,
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
          format: 'bgra8unorm',
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
  scene._geometryBuffer = createBuffer(device, quadVertex, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
  const uniforms = Float32Array.from([0, 0, 0, 0]);
  scene._uniformsBuffer = createBuffer(device, uniforms, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
  scene._uniformsBindGroup = device.createBindGroup({
    layout: scene._pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: scene._uniformsBuffer
        }
      }
    ]
  });

  scene._instanceBuffer = createBuffer(
    device,
    // 13 for number of attributes
    Float32Array.from({length: scene.items.length * 13}).fill(0),
    GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  );
}

function draw(ctx: GPUCanvasContext, scene: WebGPUSceneGroup, vb: Bounds) {
  if (!scene.items?.length) {
    return;
  }

  const device = this._device;

  if (!this._pipeline) {
    initRenderPipeline(device, scene);
    const uniforms = Float32Array.from([...this._uniforms.resolution, vb.x1, vb.y1]);
    device.queue.writeBuffer(scene._uniformsBuffer, 0, uniforms.buffer, uniforms.byteOffset, uniforms.byteLength);
  }

  const attributes = Float32Array.from(
    scene.items.flatMap((item: SceneRect) => {
      const {
        x = 0,
        y = 0,
        width = 0,
        height = 0,
        fill,
        //@ts-ignore
        fillOpacity = 1,
        //@ts-ignore
        stroke,
        //@ts-ignore
        strokeOpacity = 1,
        //@ts-ignore
        strokeWidth = 1
      } = item;
      const fillCol = color(fill).rgb();
      const strokeCol = color(stroke)?.rgb();
      const stropacity = strokeCol ? strokeOpacity : 0;
      const strcol = strokeCol ? strokeCol : {r: 0, g: 0, b: 0};
      return [
        x,
        y,
        width,
        height,
        fillCol.r / 255,
        fillCol.g / 255,
        fillCol.b / 255,
        fillOpacity,
        strcol.r / 255,
        strcol.g / 255,
        strcol.b / 255,
        stropacity,
        strokeWidth
      ];
    })
  );

  device.queue.writeBuffer(scene._instanceBuffer, 0, attributes.buffer, attributes.byteOffset, attributes.byteLength);

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
  passEncoder.setPipeline(scene._pipeline);
  passEncoder.setVertexBuffer(0, scene._geometryBuffer);
  passEncoder.setVertexBuffer(1, scene._instanceBuffer);
  passEncoder.setBindGroup(0, scene._uniformsBindGroup);
  // 6 because we are drawing two triangles
  passEncoder.draw(6, scene.items.length);
  passEncoder.endPass();
  device.queue.submit([commandEncoder.finish()]);
}

export default {
  type: 'rect',
  draw: draw,
  pick: () => null
};
