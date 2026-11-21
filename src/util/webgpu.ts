/** Factory helpers for the WebGPU objects shared by all mark renderers. */
import { warnOnce } from './warn.js';

/**
 * By default rendering goes through a 4x multisampled attachment (guaranteed
 * to be supported by WebGPU) that is resolved into the canvas, so geometric
 * edges of triangulated marks get antialiased without per-shader work.
 * `wgOptions.sampleCount = 1` renders directly into the canvas instead.
 */
export const defaultSampleCount = 4;

/** WebGPU render attachments only support 1 or 4 samples portably. */
export function normalizeSampleCount(value: number): number {
  if (value === 1 || value === 4) {
    return value;
  }
  warnOnce(
    'sampleCount',
    `[vega-webgpu] Unsupported sampleCount ${value}; only 1 or 4 are supported. Using ${defaultSampleCount}.`,
  );
  return defaultSampleCount;
}

export function preferredColorFormat(): GPUTextureFormat {
  return typeof navigator !== 'undefined' && navigator.gpu ? navigator.gpu.getPreferredCanvasFormat() : 'bgra8unorm';
}

/**
 * The bind groups a shader can declare. `uniforms` is the block every mark
 * shader has at group 0, the others are what a shader adds at group 1, and
 * `composite` is the blend composite's pair of textures, its only group.
 */
export type GroupName = 'uniforms' | 'gradient' | 'texture' | 'mask' | 'composite';

/** The groups of each pipeline layout, in group order. */
const PIPELINE_GROUPS = {
  mark: ['uniforms'],
  gradient: ['uniforms', 'gradient'],
  texture: ['uniforms', 'texture'],
  mask: ['uniforms', 'mask'],
  composite: ['composite'],
} as const satisfies Record<string, readonly GroupName[]>;

/** Which pipeline layout a shader is built with, by the groups it declares. */
export type BindingShape = keyof typeof PIPELINE_GROUPS;

function groupEntries(name: GroupName): GPUBindGroupLayoutEntry[] {
  // read lazily, since a browser without WebGPU has no GPUShaderStage
  const visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
  const uniform = (binding: number): GPUBindGroupLayoutEntry => ({ binding, visibility, buffer: { type: 'uniform' } });
  // a texture read with textureLoad takes any float format, one that is sampled needs a filterable one
  const loaded = (binding: number): GPUBindGroupLayoutEntry => ({
    binding,
    visibility,
    texture: { sampleType: 'unfilterable-float' },
  });
  const sampled = (binding: number): GPUBindGroupLayoutEntry => ({
    binding,
    visibility,
    texture: { sampleType: 'float' },
  });
  const sampler: GPUBindGroupLayoutEntry = { binding: 0, visibility, sampler: { type: 'filtering' } };
  switch (name) {
    case 'uniforms':
      return [uniform(0), loaded(1)];
    case 'gradient':
      return [sampler, sampled(1), uniform(2)];
    case 'texture':
      return [sampler, sampled(1)];
    case 'mask':
      return [loaded(0), uniform(1)];
    case 'composite':
      return [loaded(0), loaded(1)];
  }
}

interface SharedLayouts {
  groups: Map<GroupName, GPUBindGroupLayout>;
  pipelines: Map<BindingShape, GPUPipelineLayout>;
}

const sharedLayouts = new WeakMap<GPUDevice, SharedLayouts>();

function layoutsOf(device: GPUDevice): SharedLayouts {
  let held = sharedLayouts.get(device);
  if (!held) {
    held = { groups: new Map(), pipelines: new Map() };
    sharedLayouts.set(device, held);
  }
  return held;
}

/**
 * One bind group layout per group and device, which every bind group for that
 * group is made from.
 *
 * A pipeline built with `layout: 'auto'` owns the layouts it derives, so a bind
 * group made for one pipeline was rejected on another built from the same
 * shader with another blend. WebGPU then throws away the whole command buffer,
 * and the frame came out empty, not just the mark. Explicit layouts with the
 * same entries are interchangeable, so a bind group fits every pipeline that
 * declares its group.
 */
export function groupLayout(device: GPUDevice, name: GroupName): GPUBindGroupLayout {
  const held = layoutsOf(device);
  let layout = held.groups.get(name);
  if (!layout) {
    layout = device.createBindGroupLayout({ label: `${name} Bind Group Layout`, entries: groupEntries(name) });
    held.groups.set(name, layout);
  }
  return layout;
}

/** The pipeline layout for a shape, shared by every pipeline built with it. */
export function pipelineLayout(device: GPUDevice, shape: BindingShape): GPUPipelineLayout {
  const held = layoutsOf(device);
  let layout = held.pipelines.get(shape);
  if (!layout) {
    layout = device.createPipelineLayout({
      label: `${shape} Pipeline Layout`,
      bindGroupLayouts: PIPELINE_GROUPS[shape].map(name => groupLayout(device, name)),
    });
    held.pipelines.set(shape, layout);
  }
  return layout;
}

export function createRenderPipeline(
  name: string,
  device: GPUDevice,
  shader: GPUShaderModule,
  shape: BindingShape,
  format: GPUTextureFormat,
  sampleCount: number,
  buffers: GPUVertexBufferLayout[],
  blend: GPUBlendState,
  fragmentEntryPoint = 'main_fragment',
): GPURenderPipeline {
  return device.createRenderPipeline({
    label: `${name} Render Pipeline`,
    layout: pipelineLayout(device, shape),
    vertex: {
      module: shader,
      entryPoint: 'main_vertex',
      buffers,
    },
    fragment: {
      module: shader,
      entryPoint: fragmentEntryPoint,
      targets: [{ format, blend }],
    },
    primitive: {
      topology: 'triangle-list',
    },
    multisample: {
      count: sampleCount,
    },
  });
}

const views = new WeakMap<GPUTexture, GPUTextureView>();

/** A texture's default view, made once rather than for every pass or bind group. */
export function viewOf(texture: GPUTexture): GPUTextureView {
  let view = views.get(texture);
  if (!view) {
    view = texture.createView();
    views.set(texture, view);
  }
  return view;
}

/**
 * The group 0 bind group every mark pipeline takes: the shared uniform block
 * and the clip path's coverage.
 *
 * The mask is not optional. Every shader built on `uniformBlock` declares it
 * and every fragment entry reads it, so a call that left it out would build a
 * bind group short of an entry the layout has, and WebGPU throws out the whole
 * command buffer for that: the frame comes out blank and the reason goes to
 * `onuncapturederror` rather than failing anything. `clipMaskView` hands back
 * a placeholder where there is no clip, so there is always one to pass.
 */
export function createUniformBindGroup(
  name: string,
  device: GPUDevice,
  uniforms: GPUBuffer,
  clipMask: GPUTextureView,
): GPUBindGroup {
  return device.createBindGroup({
    label: `${name} Uniform Bind Group`,
    layout: groupLayout(device, 'uniforms'),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniforms,
        },
      },
      { binding: 1, resource: clipMask },
    ],
  });
}

const linearSamplers = new WeakMap<GPUDevice, GPUSampler>();

/** The bilinear, edge-clamped sampler text and gradient ramps read through. */
export function linearSampler(device: GPUDevice): GPUSampler {
  let sampler = linearSamplers.get(device);
  if (!sampler) {
    sampler = device.createSampler({
      label: 'Linear Sampler',
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });
    linearSamplers.set(device, sampler);
  }
  return sampler;
}

/** The group 1 bind group of a textured pipeline: its sampler and its texture. */
export function textureBindGroup(
  device: GPUDevice,
  label: string,
  sampler: GPUSampler,
  view: GPUTextureView,
): GPUBindGroup {
  return device.createBindGroup({
    label,
    layout: groupLayout(device, 'texture'),
    entries: [
      { binding: 0, resource: sampler },
      { binding: 1, resource: view },
    ],
  });
}

/** A texture an image or a rasterized label is copied into. */
export function imageTexture(
  device: GPUDevice,
  label: string,
  width: number,
  height: number,
  mipLevelCount = 1,
): GPUTexture {
  return device.createTexture({
    label,
    size: [width, height, 1],
    mipLevelCount,
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });
}

/**
 * Copies a region of a canvas or bitmap into a texture, kept premultiplied.
 * Straight alpha turns a fully transparent texel black, and filtering then
 * drags the colour next to it toward that, darkening the edge. The shaders
 * divide the alpha back out after sampling.
 */
export function uploadImage(
  device: GPUDevice,
  source: HTMLCanvasElement | ImageBitmap,
  texture: GPUTexture,
  width: number,
  height: number,
  origin: [x: number, y: number] = [0, 0],
  mipLevel = 0,
): void {
  device.queue.copyExternalImageToTexture({ source, origin }, { texture, origin, mipLevel, premultipliedAlpha: true }, [
    width,
    height,
  ]);
}
