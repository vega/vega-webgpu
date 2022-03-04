@block struct Uniforms {
    resolution: vec2<f32>;
    origin: vec2<f32>;
    scale: vec2<f32>;
};

@block struct ColorUniforms {
    fill: vec4<f32>;
    stroke: vec4<f32>;
    strokewidth: f32;
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms; 
@group(0) @binding(1) var<uniform> colors : ColorUniforms; 

struct VertexInput {
    @location(0) position: vec2<f32>;
    @location(1) uv: vec2<f32>;
};


struct VertexOutput {
    @builtin(position) pos : vec4<f32>;
    @location(0) uv : vec2<f32>;
};

@stage(vertex)
fn main_vertex(in: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    var pos : vec2<f32> = in.position * uniforms.scale + uniforms.origin;
    pos = pos / uniforms.resolution;
    pos.y = 1.0 - pos.y;
    pos = vec2<f32>(pos * 2.0) - 1.0;
    output.pos = vec4<f32>(pos, 0.0, 1.0);
    output.uv = in.uv;
    return output;
}

@stage(fragment)
fn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {
    var col : vec4<f32> = colors.fill;
    let sw : vec2<f32> = vec2<f32>(colors.strokewidth, colors.strokewidth) * 2.0 / uniforms.resolution;
    if (in.uv.x < sw.x || in.uv.x > 1.0 - sw.x) {
        col = colors.stroke;
    }
    if (in.uv.y < sw.y || in.uv.y > 1.0 - sw.y) {
        col = colors.stroke;
    }
    return col;
}
