struct VertexOut {
  @builtin(position) Position: vec4<f32>,
  @location(0) color: vec3<f32>,
}
// @location(0), @location(1) 对应的便是js传递进来的顶点数据
@vertex
fn main(
  @location(0) inPos : vec3<f32>,
  @location(1) inColor: vec3<f32>
) -> VertexOut {
  var vertexOut: VertexOut;
  vertexOut.Position = vec4<f32>(inPos, 1.0);
  vertexOut.color = inColor;
  return vertexOut;
}
