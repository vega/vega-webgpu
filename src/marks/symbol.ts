import {createBuffer} from '../util/arrays';
import {color} from 'd3-color';
import {Bounds} from 'vega-scenegraph';
//@ts-ignore
import shaderSource from '../shaders/symbol.wgsl';
import {SceneGroup, SceneSymbol} from 'vega-typings';

interface WebGPUSceneGroup extends SceneGroup {
  _pipeline?: GPURenderPipeline;
  _geometryBuffer?: GPUBuffer;
  _instanceBuffer?: GPUBuffer;
  _uniformsBuffer?: GPUBuffer;
  _uniformsBindGroup?: GPUBindGroup;
}

const segments = 32;

function initRenderPipeline(device: GPUDevice, scene: WebGPUSceneGroup, vb: Bounds, resolution: [number, number]) {
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
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 7,
          stepMode: 'instance',
          attributes: [
            // center
            {
              shaderLocation: 1,
              offset: 0,
              format: 'float32x2'
            },
            // color
            {
              shaderLocation: 2,
              offset: Float32Array.BYTES_PER_ELEMENT * 2,
              format: 'float32x4'
            },
            // radius
            {
              shaderLocation: 3,
              offset: Float32Array.BYTES_PER_ELEMENT * 6,
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
    primitive: {
      topology: 'triangle-list'
    }
  });

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

  scene._geometryBuffer = createBuffer(device, positions, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
  const uniforms = Float32Array.from([...resolution, vb.x1, vb.y1]);
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

  scene._instanceBuffer = device.createBuffer({
    size: scene.items.length * 7,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
  scene._instanceBuffer.unmap();
}

function draw(ctx: GPUCanvasContext, scene: WebGPUSceneGroup, vb: Bounds) {
  if (!scene.items?.length) {
    return;
  }
  if (!this._pipeline) {
    initRenderPipeline(this._device, scene, vb, this._uniforms.resolution);
  }

  const attributes = Float32Array.from(
    scene.items.flatMap((item: SceneSymbol) => {
      //@ts-ignore
      const {x = 0, y = 0, size, fill, opacity = 0} = item;
      const col = color(fill).rgb();
      const rad = Math.sqrt(size) / 2;
      const r = col.r / 255;
      const g = col.g / 255;
      const b = col.b / 255;
      return [x, y, r, g, b, opacity, rad];
    })
  );

  const tempBuffer = this._device.createBuffer({
    usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
    size: scene.items.length * 7,
    mappedAtCreation: true
  });

  const stagingData = new Float32Array(tempBuffer.getMappedRange());
  stagingData.set(attributes);
  const copyEncoder = this._device.createCommandEncoder();
  copyEncoder.copyBufferToBuffer(tempBuffer, 0, scene._instanceBuffer, 0, scene.items.length);
  tempBuffer.unmap();
  const commandEncoder = this._device.createCommandEncoder();
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

  //@ts-ignore
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(scene._pipeline);
  passEncoder.setVertexBuffer(0, scene._geometryBuffer);
  passEncoder.setVertexBuffer(1, scene._instanceBuffer);
  passEncoder.setBindGroup(0, scene._uniformsBindGroup);
  passEncoder.draw(segments * 3, scene.items.length, 0, 0);
  passEncoder.endPass();
  this._device.queue.submit([commandEncoder.finish()]);
}

export default {
  type: 'symbol',
  draw: draw,
  pick: () => null
};
