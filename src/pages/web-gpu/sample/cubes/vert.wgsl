struct Uniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
}

@binding(0) @group(0) var<uniform>uniforms: Uniforms;

struct VertexOutPut {
  @builtin(position) Position: vec4<f32>,
  @location(0) fragUV: vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
}

// 定点着色器，负责塑性
@stage(vertex)
fn main(
  @location(0) position: vec4<f32>,
  @location(1) uv: vec2<f32>
) -> VertexOutPut {
  var output: VertexOutPut;
  output.Position = uniforms.modelViewProjectionMatrix * position;
  output.fragUV = uv;
  output.fragPosition = 0.5 * (position + vec4<f32>(1.0, 1.0, 1.0, 1.0));
  return output;
}