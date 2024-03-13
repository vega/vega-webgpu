struct Uniforms {
  resolution: vec2<f32>,
  offset: vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexInput {
  @location(0) position: vec2<f32>,
}

struct InstanceInput {
  @location(1) center: vec2<f32>,
  @location(2) scale: vec2<f32>,
  @location(3) fill_color: vec4<f32>,
  @location(4) stroke_color: vec4<f32>,
  @location(5) strokewidth: f32,
  @location(6) corner_radii: vec4<f32>,
}

struct VertexOutput {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) fill: vec4<f32>,
  @location(2) stroke: vec4<f32>,
  @location(3) strokewidth: f32,
  @location(4) corner_radii: vec4<f32>,
  @location(5) scale: vec2<f32>,
}

@vertex
fn main_vertex(
    model: VertexInput,
    instance: InstanceInput
) -> VertexOutput {
    var output: VertexOutput;
    var u = uniforms.resolution;
    var scale = instance.scale + vec2<f32>(instance.strokewidth, instance.strokewidth);
    var pos = model.position * scale + instance.center - uniforms.offset - vec2<f32>(instance.strokewidth, instance.strokewidth) / 2.0;
    pos = pos / u;
    pos.y = 1.0 - pos.y;
    pos = pos * 2.0 - 1.0;
    output.pos = vec4<f32>(pos, 0.0, 1.0);
    output.uv = vec2<f32>(model.position.x, 1.0 - model.position.y);
    output.fill = instance.fill_color;
    output.stroke = instance.stroke_color;
    output.strokewidth = instance.strokewidth;
    output.corner_radii = instance.corner_radii;
    output.scale = instance.scale;
    return output;
}

@fragment
fn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {
    var col: vec4<f32> = in.fill;
    let sw: vec2<f32> = vec2<f32>(in.strokewidth, in.strokewidth) / in.scale;
    if in.uv.x < sw.x || in.uv.x > 1.0 - sw.x {
        col = in.stroke;
    }
    if in.uv.y < sw.y || in.uv.y > 1.0 - sw.y {
        col = in.stroke;
    }
    return col;
}

fn roundedBox(center: vec2<f32>, size: vec2<f32>, radius: vec4<f32>) -> f32 {
    var rad = radius;
    if center.x > 0.0 {
        rad.x = radius.x;
        rad.y = radius.y;
    } else {
        rad.x = radius.z;
        rad.y = radius.w;
    }
    if center.y > 0.0 {
        rad.x = rad.y;
    }
    var q = abs(center) - size + rad.x;
    return min(max(q.x, q.y), 0.0) + length(max(q, vec2<f32>(0.0))) - rad.x;
}
