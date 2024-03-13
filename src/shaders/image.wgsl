@group(0) @binding(0) var s: sampler;
@group(0) @binding(1) var tex: texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex 
fn main_vertex(
    @builtin(vertex_index) vertexIndex: u32
) -> VertexOutput {
    var pos = array(
        // 1st triangle
        vec2f(-1.0, -1.0),  // bottom left
        vec2f(1.0, -1.0),   // bottom right
        vec2f(-1.0, 1.0),   // top left

        // 2nd triangle
        vec2f(-1.0, 1.0),   // top left
        vec2f(1.0, -1.0),   // bottom right
        vec2f(1.0, 1.0),    // top right
    );

    var out: VertexOutput;
    let xy = pos[vertexIndex];
    out.position = vec4f(xy, 0.0, 1.0);
    out.uv = (xy + 1.0) * 0.5;  // Normalize the UV coordinates to [0, 1]
    return out;
}

@fragment
fn main_fragment(input: VertexOutput) -> @location(0) vec4f {
    var color: vec4<f32> = textureSample(tex, s, input.uv);

    // Adjust alpha based on incoming alpha
    color.a *= input.uv.x; // Assuming you want to use the x-coordinate as alpha

    // Premultiply alpha
    color.r = color.r * color.a;
    color.g = color.g * color.a;
    color.b = color.b * color.a;

    return color;
}