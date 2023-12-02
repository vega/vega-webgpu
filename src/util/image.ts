import { multiply } from './matrix';

export default async function drawCanvas(device: GPUDevice, context: GPUCanvasContext, canvas: HTMLCanvasElement) {
  const texture = device.createTexture({
    size: [canvas.width, canvas.height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING
      | GPUTextureUsage.COPY_DST
      | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture(
    { source: canvas },
    { texture: texture },
    [canvas.width, canvas.height]
  )

  const max = Math.max(canvas.width, canvas.height);
  const [w, h] = [canvas.width / max, canvas.height / max];

  // triangle-strip square: 4-(x,y, u, v); top-left: (u,v)=(0,0)
  const square = new Float32Array([
    -w, -h, 0, 1,
    -w, +h, 0, 0,
    +w, -h, 1, 1,
    +w, +h, 1, 0,
  ]);

  const vertexBuffer = device.createBuffer({ size: square.byteLength, usage: GPUBufferUsage.VERTEX, mappedAtCreation: true });
  new Float32Array(vertexBuffer.getMappedRange()).set(square);
  vertexBuffer.unmap();
  const stride = {
    arrayStride: 4 * square.BYTES_PER_ELEMENT,
    attributes: [
      {
        shaderLocation: 0,
        offset: 0,
        format: "float32x2"
      },
      {
        shaderLocation: 1,
        offset: 2 * square.BYTES_PER_ELEMENT,
        format: "float32x2"
      },
    ]
  };

  // WGSL shaders: https://www.w3.org/TR/WGSL/
  const vertexWgsl = `
struct Out {
  @builtin(position)
  pos: vec4<f32>,
  @location(0)
  uv: vec2<f32>,
};
@vertex
fn main(@location(0) xy: vec2<f32>, @location(1) uv: vec2<f32>) -> Out {
  return Out(vec4<f32>(xy, 0.0, 1.0), uv);
}
`;
  const vertexShader = device.createShaderModule({ code: vertexWgsl });
  const fragmentWgsl = `
@group(0) @binding(0) 
var samp: sampler;
@group(0) @binding(1) 
var tex: texture_2d<f32>;
@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSample(tex, samp, uv);
}
`;
  const fragmentShader = device.createShaderModule({ code: fragmentWgsl });
  const samp = device.createSampler({ minFilter: "linear", magFilter: "linear" });

  const pipeline = device.createRenderPipeline({
    label: 'Image Render Pipeline',
    //@ts-ignore
    layout: "auto",
    primitive: { topology: "triangle-strip" },
    // @ts-ignore
    vertex: { module: vertexShader, entryPoint: "main", buffers: [stride] },
    // @ts-ignore
    fragment: { module: fragmentShader, entryPoint: "main", targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }] },
  });

  // bind group
  const bindGroupLayout = pipeline.getBindGroupLayout(0);
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: samp },
      { binding: 1, resource: texture.createView() },
    ]
  });


  const view = context.getCurrentTexture().createView();
  const renderPass = {
    colorAttachments: [{
      view,
      loadOp: "clear",
      clearValue: { r: 0, g: 0, b: 0, a: 0 },
      storeOp: "store"
    }]
  };
  const commandEncoder = device.createCommandEncoder();
  // @ts-ignore
  const passEncoder = commandEncoder.beginRenderPass(renderPass);
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.setVertexBuffer(0, vertexBuffer);
  passEncoder.draw(4, 1);
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]);
}
