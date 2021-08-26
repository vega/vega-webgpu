[[block]] struct Uniforms {
    resolution: vec2<f32>;
    offset: vec2<f32>;
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;

struct VertexInput {
    [[location(0)]] position: vec2<f32>;
    [[location(1)]] center: vec2<f32>;
    [[location(2)]] scale: vec2<f32>;
    [[location(3)]] fill_color: vec4<f32>;
    [[location(4)]] stroke_color: vec4<f32>;
    [[location(5)]] strokewidth: f32;
};

struct VertexOutput {
    [[builtin(position)]] pos: vec4<f32>;
    [[location(0)]] uv: vec2<f32>;
    [[location(1)]] fill: vec4<f32>;
    [[location(2)]] stroke: vec4<f32>;
    [[location(3)]] strokewidth: f32;
};

[[stage(vertex)]]
fn main_vertex(in: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    var u = uniforms.resolution;
    var pos = in.position * in.scale  + in.center - uniforms.offset;
    pos = pos / uniforms.resolution;
    pos.y = 1.0 - pos.y;
    pos = pos * 2.0 - 1.0;
    output.pos = vec4<f32>(pos, 0.0, 1.0);
    output.uv = vec2<f32>(in.position.x, 1.0 - in.position.y);
    output.fill = in.fill_color;
    output.stroke = in.stroke_color;
    output.strokewidth = in.strokewidth;
    return output;
}

[[stage(fragment)]]
fn main_fragment(in: VertexOutput) -> [[location(0)]] vec4<f32> {
    return in.fill;
}
