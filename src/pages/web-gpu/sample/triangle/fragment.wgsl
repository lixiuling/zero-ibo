// 颜色
// @fragment
// fn main() -> @location(0) vec4<f32> {
//   return vec4<f32>(1.0, 0.0, 0.0, 1.0);
// }

// 动态写入颜色
@group(0) @binding(0) var<uniform> color: vec4<f32>;
// @location(0) 对应的便是js传递进来的颜色数据
@fragment
fn main() -> @location(0) vec4<f32> {
  return color;
}
