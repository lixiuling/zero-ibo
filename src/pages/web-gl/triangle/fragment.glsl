// 片段着色器没有默认精度，所以我们需要设置一个精度
// “medium precision”（中等精度）
precision mediump float;

varying highp vec3 vColor;

void main(){
  gl_FragColor = vec4(vColor, 1.0);
} 