import WebGPURenderer from './WebGPURenderer';

export default function initRenderer(device: GPUDevice) {
  return {
    renderer: WebGPURenderer,
    handler: null,
  };
}
