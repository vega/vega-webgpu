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
}

struct VertexOutput {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) fill: vec4<f32>,
  @location(2) stroke: vec4<f32>,
  @location(3) strokewidth: f32,
}

@vertex
fn main_vertex(
    model: VertexInput,
    instance: InstanceInput
) -> VertexOutput {
    var output: VertexOutput;
    var u = uniforms.resolution;
    var pos = model.position * instance.scale + instance.center - uniforms.offset;
    pos = pos / u;
    pos.y = 1.0 - pos.y;
    pos = pos * 2.0 - 1.0;
    output.pos = vec4<f32 >(pos, 0.0, 1.0);
    output.uv = vec2<f32 >(model.position.x, 1.0 - model.position.y);
    output.fill = instance.fill_color;
    output.stroke = instance.stroke_color;
    output.strokewidth = instance.strokewidth / min(u.x, u.y);
    return output;
}

@fragment
fn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {
   // ToDo: Return stroke color if at edge with strokewidth
    return in.fill;
}
