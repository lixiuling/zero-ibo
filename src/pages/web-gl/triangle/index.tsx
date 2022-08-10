import { TSampleInit, makeSample } from '../../common/layout'
import TriangleVertexShaderCode from './vert.glsl?raw'
import TriangleFragmentShaderCode from './fragment.glsl?raw'

const init: TSampleInit = async ({ canvasRef }) => {
  if (!canvasRef.current) {
    return
  }
  const gl = canvasRef.current.getContext('webgl') 
  console.log(gl, '----------')
  
  // Set the default clear color when calling 
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
    const buffer = gl.createBuffer()
    let bufferType = arr instanceof Uint16Array || arr instanceof Uint32Array ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER
    gl.bindBuffer(bufferType, buffer)
    gl.bufferData(bufferType, arr, gl.STATIC_DRAW)
    return buffer
  }
  const vertexBuffer = createBuffer(vertex)
  const colorBuffer = createBuffer(color)
  const indicesBuffer = createBuffer(indices)

  // Shader Module
  const createShader = (source: string, stage: number) => {
    const shader = gl.createShader(stage)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    // Check if shader compiled correctly
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shader: ' + gl.getShaderInfoLog(shader));
    }
    return shader
  }
  const vertexModule = createShader(TriangleVertexShaderCode, gl.VERTEX_SHADER)
  const fragmentModule = createShader(TriangleFragmentShaderCode, gl.FRAGMENT_SHADER)

  // Program
  const createProgram = (stages: WebGLShader[]) => {
    const program = gl.createProgram()
    for (let stage of stages) {
      gl.attachShader(program, stage)
    }
    gl.linkProgram(program)
    return program
  }
  const trianglProgram = createProgram([vertexModule, fragmentModule])

  // render
  function render () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(trianglProgram)
    gl.viewport(0, 0, canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    gl.scissor(0, 0, canvasRef.current.clientWidth, canvasRef.current.clientHeight)

    const setVertexBuffer = (buffer: WebGLBuffer, name: string) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      const loc = gl.getAttribLocation(trianglProgram, name)
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 4 * 3, 0)
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