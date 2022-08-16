// 属性值，将会从缓冲中获取数据
attribute vec3 inPosition;
attribute vec3 inColor;

varying vec3 vColor;

// 所有着色器都有一个main方法
void main(){
  vColor = inColor;
  gl_Position = vec4(inPosition, 1.0);
}