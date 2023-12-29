struct Uniforms {
    resolution: vec2<f32>,
    offset: vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
    @location(0) position: vec2<f32>,
    @location(1) start: vec2<f32>,
    @location(2) end: vec2<f32>,
    @location(3) color: vec4<f32>,
    @location(4) strokewidth: f32,
};

struct VertexOutput {
    @builtin(position) pos: vec4<f32>,
    @location(0) fill: vec4<f32>,
};

@vertex
fn main_vertex(in: VertexInput, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    // Calculate the direction vector of the line
    let direction = normalize(in.end - in.start);

    // Calculate the normal vector
    let normal = normalize(vec2<f32>(-direction.y, direction.x));

    // Calculate the offset for width
    let offset = normal * (in.strokewidth * 0.5);

    // Calculate the four points of the line
    var p1 = in.start - offset;
    var p2 = in.start + offset;
    var p3 = in.end - offset;
    var p4 = in.end + offset;

    var vertices = array(p1, p2, p3, p4, p2, p3);
    var pos = vertices[vertexIndex];
    pos = (pos - uniforms.offset) / uniforms.resolution;
    pos.y = 1.0 - pos.y;
    pos = pos * 2.0 - 1.0;

    var out: VertexOutput;
    out.pos = vec4<f32 >(pos, 0.0, 1.0);
    out.fill = in.color;
    return out;
}

@fragment
fn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {
    return in.fill;
}
