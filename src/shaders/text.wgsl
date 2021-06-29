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

[[stage(vertex)]]
fn main_vertex([[location(0)]] pos: vec2<f32>, [[location(1)]] uv: vec2<f32>) -> VertexOutput {
    var output: VertexOutput;
    output.pos = vec4<f32>(pos, 0.0, 1.0);
    output.pos.y = 1.0 - output.pos.y;
    output.pos.x = output.pos.x* 2.0 - 1.0;
    output.pos.y = output.pos.y * 2.0 - 1.0;
    output.uv = uv;
    return output;
}

[[stage(fragment)]]
fn main_fragment([[location(0)]] uv: vec2<f32>) -> [[location(0)]] vec4<f32> {
    return textureSample(maintex, s, uv);
}
