// 动态写入颜色
// @location(0) 对应的便是js传递进来的颜色数据
@fragment
fn main(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(color, 1.0);
}
