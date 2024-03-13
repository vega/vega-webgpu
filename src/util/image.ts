import { multiply } from './matrix';
import shaderSource from '../shaders/image.wgsl';
import { GPUVegaCanvasContext } from '../types/gpuVegaTypes.js';


export async function drawCanvas(device: GPUDevice, context: GPUVegaCanvasContext, canvas: HTMLCanvasElement, format: GPUTextureFormat) {
  const shader = device.createShaderModule({ code: shaderSource, label: 'Image Shader' });
  const pipeline = device.createRenderPipeline({
    label: 'Image Render Pipeline',
    layout: 'auto',
    vertex: {
      module: shader,
      entryPoint: 'main_vertex',
    },
    fragment: {
      module: shader,
      entryPoint: 'main_fragment',
      targets: [
        {
          format: format,
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

  const texture = device.createTexture({
    size: [canvas.width, canvas.height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING
      | GPUTextureUsage.COPY_DST
      | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  const bitmap = await createImageBitmapFromCanvas(canvas);
  device.queue.copyExternalImageToTexture(
    { source: bitmap, flipY: true },
    { texture: texture },
    [canvas.width, canvas.height]
  );

  const sampler = device.createSampler({
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    magFilter: 'linear',
  });

  // @ts-ignore
  const depthTexture = context._renderer.depthTexture();

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: sampler },
      { binding: 1, resource: texture.createView() },
    ],
  });
  const renderPassDescriptor = {
    label: 'Image Render Pass Descriptor',
    colorAttachments: [
      {
        view: undefined, // Assigned later
        loadOp: 'load',
        storeOp: 'store',
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    },
  } as GPURenderPassDescriptor;

  renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
  const commandEncoder = device.createCommandEncoder({ label: 'Image Encoder' });
  const pass = commandEncoder.beginRenderPass(renderPassDescriptor);
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.draw(6);
  pass.end();
  device.queue.submit([commandEncoder.finish()]);
}

function createImageBitmapFromCanvas(canvas): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create Blob from canvas'));
        return;
      }

      createImageBitmap(blob, { colorSpaceConversion: 'none' })
        .then((imageBitmap) => resolve(imageBitmap))
        .catch((error) => reject(error));
    });
  });
}