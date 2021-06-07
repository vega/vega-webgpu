[[block]] struct VertexUniforms {
    origin: vec2<f32>;
    scale: vec2<f32>;
    resolution: vec2<f32>;
};

[[block]] struct FragmentUniforms {
    fill: vec4<f32>;
    stroke: vec4<f32>;
    strokewidth: f32;
};

[[group(0), binding(0)]] var<uniform> v_uniforms : VertexUniforms; 
[[group(0), binding(1)]] var<uniform> f_uniforms : FragmentUniforms; 

struct VertexOutput {
    [[builtin(position)]] pos : vec4<f32>;
    [[location(0)]] uv : vec2<f32>;
};

[[stage(vertex)]]
fn main_vertex([[location(0)]] position : vec2<f32>) -> VertexOutput {
    var output: VertexOutput;
    var pos : vec2<f32> = position * v_uniforms.scale;
    pos = pos + v_uniforms.origin;
    pos = pos / v_uniforms.resolution;
    pos = vec2<f32>(pos * 2.0) - 1.0;
    output.pos = vec4<f32>(pos, 0.0, 1.0);
    output.uv = output.pos.xy;
    return output;
}

[[stage(fragment)]]
fn main_fragment([[location(0)]] uv : vec2<f32>) -> [[location(0)]] vec4<f32> {
    var col : vec4<f32> = f_uniforms.fill;
    var sw : vec2<f32> = vec2<f32>(f_uniforms.strokewidth, f_uniforms.strokewidth) * 2.0 / v_uniforms.resolution;
    if (uv.x < sw.x || uv.x > 1.0-sw.x) {
        col = f_uniforms.stroke;
    }
    if (uv.y < sw.y || uv.y > 1.0-sw.y) {
        col = f_uniforms.stroke;
    }
    return col;
}