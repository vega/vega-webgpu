struct Uniforms {
    resolution: vec2<f32>,
    offset: vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(1) @binding(0) var<storage, read> pos: array<vec2<f32>>;
@group(1) @binding(1) var<storage, read> colors: array<vec4<f32>>;
@group(1) @binding(2) var<storage, read> widths: array<f32>;

struct VertexInput {
    @location(0) index: u32,
};


struct VertexOutput {
    @builtin(position) pos: vec4<f32>,
    @location(0)  uv: vec2<f32>,
    @location(1) fill: vec4<f32>,
};

@vertex
fn main_vertex(@builtin(instance_index) index: u32, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let start = pos[index];
    let end = pos[index + 1];
    let stroke_width = widths[index];
    var color = colors[index];

    // Calculate the direction vector of the line
    let direction = normalize(end - start);
    let angle = atan2(direction.y, direction.x);

    // Calculate the normal vector
    let normal = normalize(vec2<f32>(-direction.y, direction.x));

    // Calculate the offset for width
    let offset = normal * ((stroke_width) * 0.5);

    // Calculate the four points of the line
    var p1 = start - offset;
    var p2 = start + offset;
    var p3 = end - offset;
    var p4 = end + offset;

    var vertices = array(p1, p2, p3, p4, p2, p3);
    var pos = vertices[vertexIndex];
    pos = (pos - uniforms.offset) / uniforms.resolution;
    pos.y = 1.0 - pos.y;
    pos = pos * 2.0 - 1.0;

    var out: VertexOutput;
    out.pos = vec4<f32>(pos, 0.0, 1.0);
    let rotatedUV = vertices[vertexIndex] + uniforms.offset;
    var len = length(pos.xy);
    out.uv = vec2<f32>(- pos.x / len, pos.y / len);
    out.fill = color;
    return out;
}

@fragment
fn main_fragment(in: VertexOutput) -> @location(0) vec4<f32> {
    return in.fill;
}

fn pos_length() -> u32 {
    return arrayLength(&pos);
}