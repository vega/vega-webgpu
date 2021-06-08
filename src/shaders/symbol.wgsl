[[block]] struct Uniforms {
    resolution: vec2<f32>;
    origin: vec2<f32>;
    center: vec2<f32>;
    scale: vec2<f32>;
};

[[block]] struct ColorUniforms {
    fill: vec4<f32>;
};

[[group(0), binding(0)]] var<uniform> uniforms : Uniforms;
[[group(0), binding(1)]] var<uniform> colors : ColorUniforms;

struct VertexOutput {
    [[builtin(position)]] pos: vec4<f32>;
    [[location(0)]] uv : vec2<f32>;
};

[[stage(vertex)]]
fn main_vertex([[location(0)]] position : vec2<f32>) -> VertexOutput {
    var output : VertexOutput;
    var pos: vec2<f32> = vec2<f32>(position * uniforms.scale) + uniforms.center + uniforms.origin;
    pos = pos / uniforms.resolution;
    pos.y = 1.0-pos.y;
    pos = pos * 2.0 - 1.0;
    output.pos = vec4<f32>(pos, 0.0, 1.0);
    output.uv = pos;
    return output;
}

[[stage(fragment)]]
fn main_fragment([[location(0)]] uv : vec2<f32>) -> [[location(0)]] vec4<f32> {
    return colors.fill;
}