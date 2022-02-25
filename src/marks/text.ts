import {Bounds} from 'vega-scenegraph';
import Marks from '../marks/index';
import shaderSource from '../shaders/text.wgsl';

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: {items: Array<Text>; bounds: Bounds}, bounds: Bounds) {
  // Marks.text.draw(this._textContext, scene, bounds);
  const shader = device.createShaderModule({code: shaderSource, label: 'Text Shader'});
  const pipeline = device.createRenderPipeline({
    label: 'Text Render Pipeline',
    vertex: {
      module: shader,
      entryPoint: 'main_vertex',
      //@ts-ignore
      buffers: [
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 4,
          attributes: [
            // pos
            {
              shaderLocation: 0,
              offset: 0,
              format: 'float32x2',
            },
            // uv
            {
              shaderLocation: 1,
              offset: Float32Array.BYTES_PER_ELEMENT * 2,
              format: 'float32x2',
            },
          ],
        },
      ],
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
  const positions = new Float32Array([
    1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
    0.0,
  ]);
  const positionBuffer = device.createBuffer({
    label: 'Text position buffer',
    size: positions.byteLength,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  const positionData = new Float32Array(positionBuffer.getMappedRange());
  positionData.set(positions);
  positionBuffer.unmap();
  const sampler = device.createSampler({});
  const texture = device.createTexture({
    label: 'Text Texture',
    size: {width: this._textCanvas.width, height: this._textCanvas.height, depthOrArrayLayers: 1},
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture(
    {source: this._textCanvas},
    {texture},
    {width: this._textCanvas.width, height: this._textCanvas.height},
  );
  const bindGroup = device.createBindGroup({
    label: 'Text Bind Group',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: sampler,
      },
      {
        binding: 1,
        resource: texture.createView(),
      },
    ],
  });
  //@ts-ignore
  const textureView = ctx.getCurrentTexture().createView();
  const renderPassDescriptor = {
    label: 'Text Render Pass',
    colorAttachments: [
      {
        view: textureView,
        loadValue: 'load',
        storeOp: 'store',
      },
    ],
  };
  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.setVertexBuffer(0, positionBuffer);
  passEncoder.draw(6, 1, 0, 0);
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]);
}

export default {
  type: 'text',
  draw: draw,
};
