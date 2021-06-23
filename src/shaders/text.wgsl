[[block]] struct Uniforms {
    origin: vec2<f32>;
    offset: vec2<f32>;
    dpi: f32;
};

struct VertexOutput {
    [[builtin(position)]] pos: vec4<f32>;
    [[location(0)]] uv: vec2<f32>;
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;
[[group(0), binding(1)]] var s: sampler;
[[group(0), binding(2)]] var maintex: texture_2d<f32>;

let positions : array<vec2<f32>, 6> = array<vec2<f32>, 6>(
      vec2<f32>( 1.0,  1.0),
      vec2<f32>( 1.0, -1.0),
      vec2<f32>(-1.0, -1.0),
      vec2<f32>( 1.0,  1.0),
      vec2<f32>(-1.0, -1.0),
      vec2<f32>(-1.0,  1.0));

let uvs : array<vec2<f32>, 6> = array<vec2<f32>, 6>(
      vec2<f32>(1.0, 0.0),
      vec2<f32>(1.0, 1.0),
      vec2<f32>(0.0, 1.0),
      vec2<f32>(1.0, 0.0),
      vec2<f32>(0.0, 1.0),
      vec2<f32>(0.0, 0.0));

[[stage(vertex)]]
fn main_vertex([[builtin(vertex_index)]] idx: u32) -> VertexOutput {
    var output: VertexOutput;
    output.pos = vec4<f32>(positions[idx], 0.0, 1.0);
    output.uv = uvs[idx];
    return output;
}

[[stage(fragment)]]
fn main_fragment([[location(0)]] uv: vec2<f32>) -> [[location(0)]] vec4<f32> {
    return textureSample(maintex, s, uv);
}
