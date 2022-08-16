// 参考文档：
// https://alain.xyz/blog/raw-webgl
// https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-fundamentals.html
import { TSampleInit, makeSample } from '../../common/layout'
import TriangleVertexShaderCode from './vert.glsl?raw'
import TriangleFragmentShaderCode from './fragment.glsl?raw'

const init: TSampleInit = async ({ canvasRef }) => {
  if (!canvasRef.current) {
    return
  }
  const gl = canvasRef.current.getContext('webgl') 
  console.log(gl, '----------')
  
  // 清空画布
  gl.clearColor(0.847, 0.749, 0.847, 1.0)
  // Write to all channels during a clear
  gl.colorMask(true, true, true, true)
  // Test if when something is drawn, it's in front of what was drawn previously
  gl.enable(gl.DEPTH_TEST)
  // <= Use this function to test depth values
  gl.depthFunc(gl.LEQUAL)
  // Hide triangles who's normals don't face the camera
  gl.cullFace(gl.BACK)
  // Properly blend images with alpha channels
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  // Vertex position data & Vertex Color & Index Data
  const vertex = new Float32Array([
    0.0, 0.5, 0.0, // 顶点1
    -0.5, -0.5, 0.0, // 顶点2
    0.5, -0.5, 0.0, // 顶点3
  ])
  const color = new Float32Array([
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0,
  ])
  const indices = new Uint16Array([0, 1, 2])

  // buffer
  type arrType = Float32Array | Uint16Array | Uint32Array
  const createBuffer = (arr: arrType) => {
    // Create Buffer
    const buffer = gl.createBuffer()
    let bufferType = arr instanceof Uint16Array || arr instanceof Uint32Array ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER
    // Bind Buffer to WebGLState
    gl.bindBuffer(bufferType, buffer)
    // Push data to VBO
    gl.bufferData(bufferType, arr, gl.STATIC_DRAW)
    return buffer
  }
  const vertexBuffer = createBuffer(vertex)
  const colorBuffer = createBuffer(color)
  const indicesBuffer = createBuffer(indices)

  // 创建着色器
  // source: 数据源， stage: 着色器类型
  const createShader = (source: string, stage: number) => {
    // 创建着色器对象
    const shader = gl.createShader(stage)
    // 提供数据源
    gl.shaderSource(shader, source)
    // 编译 -> 生成着色器
    gl.compileShader(shader)
    // Check if shader compiled correctly
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shader: ' + gl.getShaderInfoLog(shader));
    }
    return shader
  }
  const vertexShader = createShader(TriangleVertexShaderCode, gl.VERTEX_SHADER)
  const fragmentShader = createShader(TriangleFragmentShaderCode, gl.FRAGMENT_SHADER)

  // Program 将两个着色器 link 到一个 program(着色程序)
  const createProgram = (stages: WebGLShader[]) => {
    const program = gl.createProgram()
    for (let stage of stages) {
      gl.attachShader(program, stage)
    }
    gl.linkProgram(program)
    return program
  }
  const trianglProgram = createProgram([vertexShader, fragmentShader])

  // render
  function render () {
    // 清空画布
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    // 运行着色程序
    gl.useProgram(trianglProgram)
    gl.viewport(0, 0, canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    gl.scissor(0, 0, canvasRef.current.clientWidth, canvasRef.current.clientHeight)

    const setVertexBuffer = (buffer: WebGLBuffer, name: string) => {
      // 将绑定点绑定到缓冲数据
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      // 寻找属性值位置
      const loc = gl.getAttribLocation(trianglProgram, name)
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 4 * 3, 0)
      // 启用对应属性
      gl.enableVertexAttribArray(loc)
    }

    setVertexBuffer(vertexBuffer, 'inPosition')
    setVertexBuffer(colorBuffer, 'inColor')

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)

    gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0)

    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
}

const GLTriangle : () => JSX.Element = () => makeSample({
  name: 'WebGL Triangle',
  description: 'Show WebGL Triangle',
  init: init
})


export default GLTriangle
