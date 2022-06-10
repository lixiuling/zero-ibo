// 顶点位置

// 写死位置
// @stage(vertex)
// fn main(@builtin(vertex_index) VertexIndex : u32)
//      -> @builtin(position) vec4<f32> {
//   var pos = array<vec2<f32>, 3>(
//       vec2<f32>(0.0, 0.5),
//       vec2<f32>(-0.5, -0.5),
//       vec2<f32>(0.5, -0.5));

//   return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
// }

// 动态传入三角形顶点位置
// @location(0) 对应的便是js传递进来的顶点数据
@stage(vertex)
fn main(@location(0) position : vec3<f32>) -> @builtin(position) vec4<f32> {
  return vec4<f32>(position, 1.0);
}
