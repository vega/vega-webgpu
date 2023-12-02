import { Bounds, Marks as marks } from 'vega-scenegraph';
import shaderSource from '../shaders/text.wgsl';


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

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: { items: Array<Text>; bounds: Bounds }, bounds: Bounds) {
  // @ts-ignore
  marks.text.draw(this._textContext, scene, bounds);
}

export default {
  type: 'text',
  draw: draw,
};
