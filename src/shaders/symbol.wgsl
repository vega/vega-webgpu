struct Uniforms {
  resolution: vec2<f32>,
  offset: vec2<f32>,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexInput {
  @location(0) position: vec2<f32>,
}

struct InstanceInput {
  @location(1) center: vec2<f32>,
  @location(2) radius: f32,
  @location(3) fill_color: vec4<f32>,
  @location(4) stroke_color: vec4<f32>,
  @location(5) stroke_width: f32,
}

struct VertexOutput {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) fill: vec4<f32>,
  @location(2) stroke_color: vec4<f32>,
  @location(3) stroke_width_percent: f32,
}

const smooth_width = 0.05;

@vertex
fn main_vertex(
    model: VertexInput,
    instance: InstanceInput
) -> VertexOutput {
    var output: VertexOutput;
    var stroke_width = instance.stroke_width / 2.0;
    var radius_with_stroke = instance.radius + stroke_width;
    var smooth_adjusted_radius = radius_with_stroke * 2.0 / (2.0 - smooth_width);
    var pos = vec2<f32>(model.position * smooth_adjusted_radius) + instance.center - uniforms.offset;
    pos = pos / uniforms.resolution;
    pos.y = 1.0 - pos.y;
    pos = pos * 2.0 - 1.0;
    output.pos = vec4<f32>(pos, 0.0, 1.0);
    output.uv = model.position / 2.0 + vec2<f32>(0.5, 0.5);
    output.fill = instance.fill_color;
    output.stroke_color = instance.stroke_color;
    output.stroke_width_percent = stroke_width / radius_with_stroke;
    return output;
}

@fragment
fn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {
    let distance = distance(vec2<f32>(0.5, 0.5), in.uv);
    let smoothOuter: f32 = smoothstep(0.0, smooth_width, 0.5 - distance);
    let smoothInner: f32 = 1.0 - smoothstep(in.stroke_width_percent - smooth_width / 2.0, in.stroke_width_percent + smooth_width / 2.0, 0.5 - distance);
    return mix(vec4<f32>(in.fill.rgb, in.fill.a * smoothOuter), vec4<f32>(in.stroke_color.rgb, in.stroke_color.a * smoothOuter), smoothInner);
}

fn binaryIndicator(value: f32, edge0: f32, edge1: f32) -> f32 {
    if edge0 == edge1 {
        return 0.0;
    }
    let t = saturate((value - edge0) / (edge1 - edge0));
    return ceil(t);
}