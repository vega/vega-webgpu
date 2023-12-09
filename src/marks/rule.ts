import { color } from 'd3-color';
import { Bounds } from 'vega-scenegraph';
import {
  SceneGroup,
  SceneLine
} from 'vega-typings';
import shaderSource from '../shaders/rule.wgsl';
import {
  createBuffer,
  quadVertex,
} from '../util/arrays';

interface RuleSceneItem {
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

interface WebGPUSceneGroup extends SceneGroup {
  _pipeline?: GPURenderPipeline;
  _geometryBuffer?: GPUBuffer; // geometry to be instanced
  _instanceBuffer?: GPUBuffer; // attributes for each instance
  _uniformsBuffer?: GPUBuffer;
  _frameBuffer?: GPUBuffer; // writebuffer to be used for each frame
  _uniformsBindGroup?: GPUBindGroup;
  _format: GPUTextureFormat;
}

function initRenderPipeline(device: GPUDevice, scene: WebGPUSceneGroup) {
  const shader = device.createShaderModule({ code: shaderSource, label: 'Rule Shader' });
  scene._pipeline = device.createRenderPipeline({
    label: 'Rule Render Pipeline',
    layout: "auto" as unknown as GPUPipelineLayout,
    vertex: {
      module: shader,
      entryPoint: 'main_vertex',
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
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 8,
          stepMode: 'instance',
          attributes: [
            // center
            {
              shaderLocation: 1,
              offset: 0,
              format: 'float32x2',
            },
            // scale
            {
              shaderLocation: 2,
              offset: Float32Array.BYTES_PER_ELEMENT * 2,
              format: 'float32x2',
            },
            // color
            {
              shaderLocation: 3,
              offset: Float32Array.BYTES_PER_ELEMENT * 4,
              format: 'float32x4',
            },
          ],
        },
      ] as Iterable<GPUVertexBufferLayout | null>,
    },
    fragment: {
      module: shader,
      entryPoint: 'main_fragment',
      targets: [
        {
          format: scene._format,
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
          } as GPUBlendState,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
    depthStencil: {
      format: 'depth24plus',
      depthCompare: 'less',
      depthWriteEnabled: true,
    },
  });

  scene._geometryBuffer = device.createBuffer({
    label: 'Rule Geometry Buffer',
    size: quadVertex.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  const geometryData = new Float32Array(scene._geometryBuffer.getMappedRange());
  geometryData.set(quadVertex);
  scene._geometryBuffer.unmap();

  scene._uniformsBuffer = device.createBuffer({
    label: 'Rule Uniform Buffer',
    size: Float32Array.BYTES_PER_ELEMENT * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  scene._uniformsBindGroup = device.createBindGroup({
    label: 'Rule Uniform Bind Group',
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
    // 8 for number of attributes
    label: 'Rule Instance Buffer',
    size: scene.items.length * 8 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  scene._instanceBuffer.unmap();

  scene._frameBuffer = device.createBuffer({
    label: 'Rule Frame Buffer',
    size: scene.items.length * 12 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE,
    mappedAtCreation: true,
  });
  scene._frameBuffer.unmap();
}

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: WebGPUSceneGroup, vb: Bounds) {
  if (!scene.items?.length) {
    return;
  }

  scene._format = this.prefferedFormat();

  if (!this._pipeline) {
    initRenderPipeline(device, scene);
    const resolution = [this._uniforms.resolution[0] + 0.5, this._uniforms.resolution[1] + 0.5];
    const uniforms = new Float32Array([...resolution, vb.x1 + 0.5, vb.y1 + 0.5]);
    scene._uniformsBuffer = createBuffer(device, uniforms, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
  }
  const ruleItems = scene.items as SceneLine[];
  const attributes = Float32Array.from(
    ruleItems.flatMap((item: SceneLine) => {
      let { x = 0, y = 0, x2, y2, stroke, strokeWidth = 1, opacity = 1 } = item;
      x2 ??= x;
      y2 ??= y;
      const ax = Math.abs(x2 - x);
      const ay = Math.abs(y2 - y);

      const col = color(stroke).rgb();
      return [
        Math.min(x, x2),
        Math.min(y, y2),
        ax ? ax : strokeWidth,
        ay ? ay : strokeWidth,
        col.r / 255,
        col.g / 255,
        col.b / 255,
        opacity,
      ];
    }),
  );
  const pipeline = scene._pipeline;
  const frameBuffer = scene._frameBuffer;
  const instanceBuffer = scene._instanceBuffer;
  const geometryBuffer = scene._geometryBuffer;
  const uniformsBuffer = scene._uniformsBuffer;

  scene._uniformsBindGroup = device.createBindGroup({
    label: 'Rule Uniform Bind Group',
    layout: scene._pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformsBuffer,
        },
      },
    ],
  });
  const uniformsBindGroup = scene._uniformsBindGroup;

  (async () => {
    await frameBuffer.mapAsync(GPUMapMode.WRITE).then(() => {
      const frameData = new Float32Array(frameBuffer.getMappedRange());
      frameData.set(attributes);

      const copyEncoder = device.createCommandEncoder();
      copyEncoder.copyBufferToBuffer(
        frameBuffer,
        frameData.byteOffset,
        instanceBuffer,
        attributes.byteOffset,
        attributes.byteLength,
      );

      const commandEncoder = device.createCommandEncoder();
      const depthTexture = this.depthTexture();
      const renderPassDescriptor: GPURenderPassDescriptor = {
        label: 'Rule Render Pass Descriptor',
        colorAttachments: [
          {
            view: undefined, // Assigned later
            clearValue: this.clearColor(),
            loadOp: 'load',
            storeOp: 'store',
          } as GPURenderPassColorAttachment,
        ],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
        },
      };
      renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();

      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(pipeline);
      passEncoder.setVertexBuffer(0, geometryBuffer);
      passEncoder.setVertexBuffer(1, instanceBuffer);
      passEncoder.setBindGroup(0, uniformsBindGroup);
      // 6 because we are drawing two triangles
      passEncoder.draw(6, ruleItems.length);
      passEncoder.end();
      frameBuffer.unmap();
      device.queue.submit([copyEncoder.finish(), commandEncoder.finish()]);
    })
  })();
}

export default {
  type: 'rule',
  draw: draw
};
