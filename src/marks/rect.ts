import { color } from 'd3-color';
import { Bounds } from 'vega-scenegraph';
import {
  SceneGroup,
  SceneRect,
} from 'vega-typings';

//@ts-ignore
import shaderSource from '../shaders/rect.wgsl';
import { quadVertex } from '../util/arrays';

interface WebGPUSceneGroup extends SceneGroup {
  _pipeline?: GPURenderPipeline;
  _geometryBuffer?: GPUBuffer; // geometry to be instanced
  _instanceBuffer?: GPUBuffer; // attributes for each instance
  _uniformsBuffer?: GPUBuffer;
  _frameBuffer?: GPUBuffer; // writebuffer to be used for each frame
  _uniformsBindGroup?: GPUBindGroup;
}

function initRenderPipeline(device: GPUDevice, scene: WebGPUSceneGroup) {
  const shader = device.createShaderModule({ code: shaderSource, label: 'Rect Shader' });
  scene._pipeline = device.createRenderPipeline({
    label: 'Rect Render Pipeline',
    //@ts-ignore
    layout: "auto",
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
              format: 'float32x2',
            },
          ],
        },
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 13,
          stepMode: 'instance',
          attributes: [
            // center
            {
              shaderLocation: 1,
              offset: 0,
              format: 'float32x2',
            },
            // dimensions
            {
              shaderLocation: 2,
              offset: Float32Array.BYTES_PER_ELEMENT * 2,
              format: 'float32x2',
            },
            // fill color
            {
              shaderLocation: 3,
              offset: Float32Array.BYTES_PER_ELEMENT * 4,
              format: 'float32x4',
            },
            // stroke color
            {
              shaderLocation: 4,
              offset: Float32Array.BYTES_PER_ELEMENT * 8,
              format: 'float32x4',
            },
            // stroke width
            {
              shaderLocation: 5,
              offset: Float32Array.BYTES_PER_ELEMENT * 12,
              format: 'float32',
            },
          ],
        },
      ],
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
              operation: 'add',
            },
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
          },
        },
      ],
    },
    primitives: {
      topology: 'triangle-list',
    },
  });

  scene._geometryBuffer = device.createBuffer({
    label: 'Rect Geometry Buffer',
    size: quadVertex.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  const geometryData = new Float32Array(scene._geometryBuffer.getMappedRange());
  geometryData.set(quadVertex);
  scene._geometryBuffer.unmap();

  scene._uniformsBuffer = device.createBuffer({
    label: 'Rect Uniform Buffer',
    size: Float32Array.BYTES_PER_ELEMENT * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  scene._uniformsBindGroup = device.createBindGroup({
    label: 'Rect Uniform Bind Group',
    layout: scene._pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: scene._uniformsBuffer,
        },
      },
    ],
  });

  scene._instanceBuffer = device.createBuffer({
    // 13 for number of attributes
    label: 'Rect Instance Buffer',
    size: scene.items.length * 13 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  scene._instanceBuffer.unmap();

  scene._frameBuffer = device.createBuffer({
    label: 'Rect Frame Buffer',
    size: scene.items.length * 13 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE,
    mappedAtCreation: true,
  });
  scene._frameBuffer.unmap();
}

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: WebGPUSceneGroup, vb: Bounds) {
  if (!scene.items?.length) {
    return;
  }

  if (!this._pipeline) {
    initRenderPipeline(device, scene);
    const uniformsData = new Float32Array(scene._uniformsBuffer.getMappedRange());
    const uniforms = Float32Array.from([...this._uniforms.resolution, vb.x1, vb.y1]);
    uniformsData.set(uniforms);
    scene._uniformsBuffer.unmap();
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
        strokeWidth = 1,
      } = item;
      const fillCol = color(fill).rgb();
      const strokeCol = color(stroke)?.rgb();
      const stropacity = strokeCol ? strokeOpacity : 0;
      const strcol = strokeCol ? strokeCol : { r: 0, g: 0, b: 0 };
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
        strokeWidth,
      ];
    }),
  );

  scene._frameBuffer.mapAsync(GPUMapMode.WRITE).then(() => {
    const frameData = new Float32Array(scene._frameBuffer.getMappedRange());
    frameData.set(attributes);

    const copyEncoder = device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(
      scene._frameBuffer,
      frameData.byteOffset,
      scene._instanceBuffer,
      attributes.byteOffset,
      attributes.byteLength,
    );

    const commandEncoder = device.createCommandEncoder();
    //@ts-ignore
    const textureView = ctx.getCurrentTexture().createView();
    const renderPassDescriptor = {
      label: 'Rect Render Pass Descriptor',
      colorAttachments: [
        {
          view: textureView,
          loadOp: 'load',
          storeOp: 'store',
        },
      ],
    };

    //@ts-ignore
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(scene._pipeline);
    passEncoder.setVertexBuffer(0, scene._geometryBuffer);
    passEncoder.setVertexBuffer(1, scene._instanceBuffer);
    passEncoder.setBindGroup(0, scene._uniformsBindGroup);
    // 6 because we are drawing two triangles
    passEncoder.draw(6, scene.items.length);
    passEncoder.end();
    scene._frameBuffer.unmap();
    device.queue.submit([copyEncoder.finish(), commandEncoder.finish()]);
  });
}

export default {
  type: 'rect',
  draw: draw,
};
