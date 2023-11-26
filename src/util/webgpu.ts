import text from '../marks/text';

export default async function (w, h) {
  if (!('gpu' in navigator)) {
    throw new Error('WebGPU is unsupported in your browser.');
  }
  const canvas = this._canvas;
  const ctx = canvas.getContext('webgpu');
  if (!ctx) {
    throw new Error('Failed to obtain WebGPU context.');
  }
  this._textContext.pixelRatio = window.devicePixelRatio || 1;

  ctx.configure({
    device: this._device,
    format: 'bgra8unorm',
    compositingAlphaMode: 'premultiplied',
  });

  this._ctx = ctx;

  this._redraw = true;
}

export function createDefaultPipelineLayout(device: GPUDevice): GPUPipelineLayout {
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {},
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {},
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {},
      },
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });
  return pipelineLayout;
}
