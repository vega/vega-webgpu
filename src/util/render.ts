

export function createRenderPipeline(
  name: string,
  device: GPUDevice,
  shader: GPUShaderModule,
  format: GPUTextureFormat,
  buffers: Iterable<GPUVertexBufferLayout | null>,
  bindGroupLayout?: GPUPipelineLayout
): GPURenderPipeline {
  return device.createRenderPipeline({
    label: name + ' Render Pipeline',
    layout: bindGroupLayout ?? 'auto',
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
      depthCompare: 'less-equal',
      depthWriteEnabled: true,
    },
  });
}

export function createPipelineLayout(name: string, device: GPUDevice, bindGroupLayouts: GPUBindGroupLayout[]) {
  return device.createPipelineLayout({
    label: name + ' Pipeline Layout',
    bindGroupLayouts
  });
}

export function createUniformBindGroupLayout(name: string, device: GPUDevice) {
  return device.createBindGroupLayout({
    label: name + ' Uniform Bind Group Layout',
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
      buffer: {
        type: "uniform",
      },
    }] as Iterable<GPUBindGroupLayoutEntry>
  });
}

export function createUniformBindGroup(name: string, device: GPUDevice, pipeline: GPURenderPipeline, uniform: GPUBuffer, binding: number = 0) {
  return device.createBindGroup({
    label: name + ' Uniform Bind Group',
    layout: pipeline.getBindGroupLayout(binding),
    entries: [
      {
        binding,
        resource: {
          buffer: uniform,
        },
      },
    ],
  });
}

export function createBindGroup(
  name: string,
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  buffers: GPUBuffer[],
  bindGroupLayout?: GPUBindGroupLayout,
  groupId: number = 0,
) {
  var entries = [];
  for (let i = 0; i < buffers.length; i++) {
    entries.push({
      binding: i,
      resource: {
        buffer: buffers[i],
      }
    });
  }
  return device.createBindGroup({
    label: name + ' Custom Bind Group',
    layout: bindGroupLayout ?? pipeline.getBindGroupLayout(groupId),
    entries
  });
}

export interface BindGroupLayoutEntry {
  visibility: GPUShaderStageFlags,
  buffer: GPUBufferBindingLayout,
}

export function createBindGroupLayout(
  name: string,
  device: GPUDevice,
  bindGroupLayoutEntries: BindGroupLayoutEntry[],
) {
  let entries: GPUBindGroupLayoutEntry[] = [];
  for (let i = 0; i < bindGroupLayoutEntries.length; i++) {
    entries.push({
      binding: i,
      visibility: bindGroupLayoutEntries[i].visibility,
      buffer: bindGroupLayoutEntries[i].buffer,
    })
  }
  return device.createBindGroupLayout({
    label: name + ' Custom Bind Group Layout',
    entries,
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