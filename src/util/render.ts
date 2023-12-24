

export function createRenderPipeline(name: string, device: GPUDevice, shader: GPUShaderModule, format: GPUTextureFormat, buffers: Iterable<GPUVertexBufferLayout | null>): GPURenderPipeline {
  return device.createRenderPipeline({
    label: name + ' Render Pipeline',
    layout: 'auto',
    vertex: {
      module: shader,
      entryPoint: 'main_vertex',
      buffers
    },
    fragment: {
      module: shader,
      entryPoint: 'main_fragment',
      targets: [
        {
          format,
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
}

export function createDefaultBindGroup(name: string, device: GPUDevice, pipeline: GPURenderPipeline, uniform: GPUBuffer) {
  return device.createBindGroup({
    label: name + ' Uniform Bind Group',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniform,
        },
      },
    ],
  });
}

export function createRenderPassDescriptor(name: string, clearColor: GPUColor, depthTextureView: GPUTextureView) {
  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: name + ' Render Pass Descriptor',
    colorAttachments: [
      {
        view: undefined, // Assigned later
        clearValue: clearColor,
        loadOp: 'load',
        storeOp: 'store',
      } as GPURenderPassColorAttachment,
    ],
    depthStencilAttachment: {
      view: depthTextureView,
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    },
  };
  return renderPassDescriptor;
}