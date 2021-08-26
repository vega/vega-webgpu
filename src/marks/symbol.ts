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
  _frameBuffer?: GPUBuffer;
  _uniformsBindGroup?: GPUBindGroup;
}

const segments = 32;

function initRenderPipeline(device: GPUDevice, scene: WebGPUSceneGroup) {
  const shader = device.createShaderModule({code: shaderSource});
  scene._pipeline = device.createRenderPipeline({
    vertex: {
      module: shader,
      entryPoint: 'main_vertex',
      //@ts-ignore
      buffers: [
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
          stepMode: 'vertex',
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
      //@ts-ignore
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

  scene._geometryBuffer = device.createBuffer({
    size: positions.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
  const geometryData = new Float32Array(scene._geometryBuffer.getMappedRange());
  geometryData.set(positions);
  scene._geometryBuffer.unmap();

  scene._uniformsBuffer = device.createBuffer({
    size: Float32Array.BYTES_PER_ELEMENT * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

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
    size: scene.items.length * 7 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
  scene._instanceBuffer.unmap();

  scene._frameBuffer = device.createBuffer({
    size: scene.items.length * 7 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE,
    mappedAtCreation: true
  });
  scene._frameBuffer.unmap();
}

function draw(ctx: GPUCanvasContext, scene: WebGPUSceneGroup, vb: Bounds) {
  if (!scene.items?.length) {
    return;
  }
  if (!this._pipeline) {
    initRenderPipeline(this._device, scene);
    const uniformsData = new Float32Array(scene._uniformsBuffer.getMappedRange());
    const uniforms = Float32Array.from([...this._uniforms.resolution, vb.x1, vb.y1]);
    uniformsData.set(uniforms);
    scene._uniformsBuffer.unmap();
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

  scene._frameBuffer.mapAsync(GPUMapMode.WRITE).then(() => {
    const frameData = new Float32Array(scene._frameBuffer.getMappedRange());
    const copyEncoder = this._device.createCommandEncoder();
    frameData.set(attributes);

    copyEncoder.copyBufferToBuffer(
      scene._frameBuffer,
      frameData.byteOffset,
      scene._instanceBuffer,
      attributes.byteOffset,
      attributes.byteLength
    );

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

    scene._frameBuffer.unmap();
    this._device.queue.submit([copyEncoder.finish(), commandEncoder.finish()]);
  });
}

export default {
  type: 'symbol',
  draw: draw,
  pick: () => null
};
