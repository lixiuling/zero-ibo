import { makeSample, TSampleInit } from '../../../common/layout'
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
import { commomClearValue } from '../../common/index'

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
    alphaMode: 'opaque',
  })

  // 顶点buffer
  const verticesBuffer = device.createBuffer({
    size: cubeVertexArray.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  })
  new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray)
  verticesBuffer.unmap()

  // 立方体 创建uniform buffer
  const uniformBufferSize = 4 * 16 // matrix 4 x 4
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })

  // 绑定组layout
  const uniformBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {}
      }
    ]
  })
  // 创建uniform bind group
  const uniformBindGroup = device.createBindGroup({
    // layout: pipeline.getBindGroupLayout(0),  // 创建隐式管线布局, 不建议
    layout: uniformBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        }
      }
    ]
  })

  // 渲染管线
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [uniformBindGroupLayout]
    }),
    // layout: 'auto', // 创建隐式管线布局, 不建议
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

  // 创建depth texture
  const depthTexture = device.createTexture({
    size: {
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight,
    },
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  })
  const depth_view = depthTexture.createView()


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
      0.85,
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
    // 立方体数据写入 uniformBuffer
    device.queue.writeBuffer(
      uniformBuffer,
      0,
      transformationMatrix.buffer,
      transformationMatrix.byteOffset,
      transformationMatrix.byteLength
    )
  
    const commandEncoder = device.createCommandEncoder()
    const textureView = context.getCurrentTexture().createView()

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: commomClearValue,
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
    passEncoder.setVertexBuffer(0, verticesBuffer)
    passEncoder.setBindGroup(0, uniformBindGroup)
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