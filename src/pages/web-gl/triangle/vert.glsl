attribute vec3 inPosition;
attribute vec3 inColor;

varying vec3 vColor;

void main(){
  vColor = inColor;
  gl_Position = vec4(inPosition, 1.0);
}