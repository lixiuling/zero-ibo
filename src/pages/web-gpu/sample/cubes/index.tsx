import { makeSample, TSampleInit } from '../../common/layout-gpu'
import { 
  cubeVertexArray,
  cubeVertexSize,
  cubePositionOffset,
  cubeUvOffset,
  cubeVertexCount
} from './data'
import cubeVerticesWGSL from './vert.wgsl?raw'
import cubeFragmentWGSL from './fragment.wgsl?raw'
import { mat4, vec3 } from 'gl-matrix'

const init: TSampleInit = async ({ canvasRef }) => {
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter.requestDevice()

  if (canvasRef.current === null) {
    console.log('----canvasRef---', canvasRef)
    return
  }

  const context = canvasRef.current.getContext('webgpu')

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()

  context.configure({
    device,
    format: presentationFormat,
    compositingAlphaMode: 'opaque',
  })

  // 顶点buffer
  const verticesBuffer = device.createBuffer({
    size: cubeVertexArray.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  })
  new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray)
  verticesBuffer.unmap()

  // 渲染管线
  const pipeline = device.createRenderPipeline({
    // layout: device.createPipelineLayout({
    //   bindGroupLayouts: []
    // }),
    layout: 'auto', // 创建隐式管线布局
    vertex: {
      module: device.createShaderModule({
        code: cubeVerticesWGSL
      }),
      entryPoint: 'main',
      buffers: [
        {
          arrayStride: cubeVertexSize,
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: cubePositionOffset,
              format: 'float32x4'
            },
            {
              // uv
              shaderLocation: 1,
              offset: cubeUvOffset,
              format: 'float32x2'
            }
          ]
        }
      ]
    },
    fragment: {
      module: device.createShaderModule({
        code: cubeFragmentWGSL
      }),
      entryPoint: 'main',
      targets: [{
        format: presentationFormat
      }]
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus'
    }
  })

  // 纹理
  const depthTexture = device.createTexture({
    size: {
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight,
    },
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  })
  const depth_view = depthTexture.createView()

  // 绑定组
  const uniformBufferSize = 4 * 16 // matrix 4 x 4
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        }
      }
    ]
  })

  const aspect = canvasRef.current.width / canvasRef.current.height
  const progectionMatrix = mat4.create()
  mat4.perspective(progectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0)
  
  function getTransformationMatrix() {
    const viewMatrix = mat4.create()
    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -4))
    const now = Date.now() / 1000
    mat4.rotate(
      viewMatrix,
      viewMatrix,
      1,
      vec3.fromValues(Math.sin(now), Math.cos(now), 0)
    )

    const modelViewProjectionMatrix = mat4.create()
    mat4.multiply(modelViewProjectionMatrix, progectionMatrix, viewMatrix)

    return modelViewProjectionMatrix as Float32Array
  }
  

  function frame() {
    // Sample is no longer the active page.
    if (!canvasRef.current) return

    const transformationMatrix = getTransformationMatrix()
    device.queue.writeBuffer(
      uniformBuffer,
      0,
      transformationMatrix.buffer,
      transformationMatrix.byteOffset,
      transformationMatrix.byteLength
    )
  
    const commandEncoder = device.createCommandEncoder()
    const textureView = context.getCurrentTexture().createView()
    // 渲染通道
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.847, g: 0.749, b: 0.847, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store'
        }
      ],
      depthStencilAttachment: {
        view: depth_view,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
      }
    }
    // 通道编码
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, uniformBindGroup)
    passEncoder.setVertexBuffer(0, verticesBuffer)
    passEncoder.draw(cubeVertexCount, 1, 0, 0)
    passEncoder.end()
    device.queue.submit([commandEncoder.finish()])
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

const HelloCube: () => JSX.Element = () => makeSample({
  name: 'Hello Cube',
  description: 'Show Cube',
  init: init
})
export default HelloCube