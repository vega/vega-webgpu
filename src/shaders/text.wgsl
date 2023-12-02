@group(0) @binding(0) var s: sampler;
@group(0) @binding(1) var maintex: texture_2d<f32>;

struct VertexInput {
    @location(0) position: vec2<f32>,
    @location(1) uv: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
}


@vertex
fn main_vertex(in: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.pos = vec4<f32>(in.position, 0.0, 1.0);
    output.uv = in.uv;
    return output;
}

@fragment
fn main_fragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    return textureSample(maintex, s, uv);
}
