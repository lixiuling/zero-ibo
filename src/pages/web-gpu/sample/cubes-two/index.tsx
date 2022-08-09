import { makeSample, TSampleInit } from "../../../common/layout"
import {
  cubeVertexArray,
  cubeVertexSize,
  cubePositionOffset,
  cubeUvOffset,
  cubeVertexCount
} from '../cubes/data'
import cubeVerticesWGSL from '../cubes/vert.wgsl?raw'
import cubeFragmentWGSL from '../cubes/fragment.wgsl?raw'
import { mat4, vec3 } from 'gl-matrix'
import { commomClearValue } from '../../common/index'

const init: TSampleInit = async ({ canvasRef }) => {
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter.requestDevice()

  if (canvasRef.current === null) return

  const context = canvasRef.current.getContext('webgpu')

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()

  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'opaque',
  })

  // vertex buffer
  const verticesBuffer = device.createBuffer({
    label: 'vertex buffer',
    size: cubeVertexArray.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  })
  // 实例化一个新的 Float32Array，并获取 GPUBuffer 的映射范围，传入上面的数据，这样 ArrayBuffer 就有值了
  new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray)
  // 一定要解除映射，GPU 才能读写
  verticesBuffer.unmap()

  // 创建uniform buffer 暂不写入数据
  const matrixSize = 4 * 16 // 4 * 4 matrix
  const offset = 256 // uniformBindGroup offset must be 256-byte aligned
  const uniformBufferSize = offset + matrixSize
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })

  // 一种资源（GPUBuffer、纹理、采样器等）在着色器中通过三个特性共同定位：
  // (1) 着色器的阶段（顶点、片元或计算，阶段来指定资源在哪个阶段的可见性）
  // (2) 绑定组id（即 setBindGroup 方法的参数，着色器中特性名是 group）
  // (3) 绑定id（即 entry 的 binding 属性，着色器中特性名是 bind）
  // 三者共同构成一种资源在着色器中的地址，这个地址又可以称作管线的 绑定空间（binding space）

  // 创建绑定组layout
  // 联系与它配套的绑定组和对应阶段的着色器，告诉管线在什么着色阶段传入的数据长什么样子，是何种类
  const uniformBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0, // 指定该 entry（也即资源）绑定号，绑定号在一个绑定组布局对象的 entries 数组所有元素中是唯一的，且必须和绑定组中的 entry 有对应，以便于在 WGSL 代码中访问对应资源
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, // 需从 GPUShaderStage 中访问枚举值，表示该 entry 在什么着色阶段可见
        buffer: {},
      }
    ]
  })
  // 创建资源绑定组
  // 通过 GPUBindGroup，明确地把一堆资源挨个（每个 entry）合并打包在一个组里，并且是按顺序（参数 binding）组织在一起
  // 立方体1
  const uniformBindGroup1 = device.createBindGroup({
    layout: uniformBindGroupLayout,
    entries: [
      {
        binding: 0, // 资源在着色器代码中的 location，即告诉着色器代码要从几号坑位取数据，一对一的
        resource: {
          buffer: uniformBuffer,
          offset: 0, // 要从 GPUBuffer 的第几个字节开始
          size: matrixSize // 要从 GPUBuffer 的 offset 处向后取多少个字节
        }
      }
    ]
  })
  // 立方体2
  const uniformBindGroup2 = device.createBindGroup({
    layout: uniformBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: offset,
          size: matrixSize,
        }
      }
    ]
  })

  // 渲染管线
  // 管线的布局告诉管线着色器里头有多少类和分别有多少个资源坑位要进来
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ // 管线布局定义了一种在指令编码时通过 setBindGroup 方法来设置具体的某个绑定组与某种通道编码器（GPURenderPassEncoder 或 GPUComputePassEncoder）通过 setPipeline 方法设置的管线中的着色器之间的映射关系
      bindGroupLayouts: [uniformBindGroupLayout]
    }),
    vertex: {
      module: device.createShaderModule({ // 着色器模块
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
              format: 'float32x4',
            },
            {
              // uv
              shaderLocation: 1,
              offset: cubeUvOffset,
              format: 'float32x2',
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
      targets: [
        {
          format: presentationFormat
        }
      ]
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back'
    },
    depthStencil: {
      depthWriteEnabled: true,
      format: 'depth24plus',
      depthCompare: 'less'
    }
  })

  // 创建depth texture 
  const depthTexture = device.createTexture({
    size: {
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight
    },
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  })
  const depth_view = depthTexture.createView()

  const aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight
  const projectionMatrix = mat4.create()
  mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.00)

  const modelMatrix1 = mat4.create()
  mat4.translate(modelMatrix1, modelMatrix1, vec3.fromValues(-2, 0, 0))
  const modelMatrix2 = mat4.create()
  mat4.translate(modelMatrix2, modelMatrix2, vec3.fromValues(2, 0, 0))
 
  const modelViewProjectionMatrix1 = mat4.create() as Float32Array
  const modelViewProjectionMatrix2 = mat4.create() as Float32Array

  const viewMatrix = mat4.create()
  mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -6))

  const tmpMat41 = mat4.create()
  const tmpMat42 = mat4.create()

  function updateTransformationMatrix () {
    const now = Date.now() / 1000

    mat4.rotate(
      tmpMat41,
      modelMatrix1,
      1.7,
      vec3.fromValues(Math.sin(now), Math.cos(now), 0)
    )
    mat4.rotate(
      tmpMat42,
      modelMatrix2,
      0.85,
      vec3.fromValues(Math.cos(now), Math.sin(now), 0)
    )

    mat4.multiply(modelViewProjectionMatrix1, viewMatrix, tmpMat41)
    mat4.multiply(
      modelViewProjectionMatrix1,
      projectionMatrix,
      modelViewProjectionMatrix1
    )
    
    mat4.multiply(modelViewProjectionMatrix2, viewMatrix, tmpMat42)
    mat4.multiply(
      modelViewProjectionMatrix2,
      projectionMatrix,
      modelViewProjectionMatrix2
    )
  }

  function frame () {
    if (!canvasRef.current) return

    updateTransformationMatrix()

    // 将两个立方体的运动数据写入uniformBuffer
    device.queue.writeBuffer(
      uniformBuffer,
      0,
      modelViewProjectionMatrix1.buffer,
      modelViewProjectionMatrix1.byteOffset,
      modelViewProjectionMatrix1.byteLength
    )
    
    device.queue.writeBuffer(
      uniformBuffer,
      offset,
      modelViewProjectionMatrix2.buffer,
      modelViewProjectionMatrix2.byteOffset,
      modelViewProjectionMatrix2.byteLength
    )

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
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

    const commandEncoder = device.createCommandEncoder()
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    passEncoder.setPipeline(pipeline)
    passEncoder.setVertexBuffer(0, verticesBuffer)

    // Bind the bind group (with the transformation matrix) for each cube, and draw.
    passEncoder.setBindGroup(0, uniformBindGroup1) 
    passEncoder.draw(cubeVertexCount, 1, 0, 0)

    passEncoder.setBindGroup(0, uniformBindGroup2)
    passEncoder.draw(cubeVertexCount, 1, 0, 0)

    passEncoder.end()
    device.queue.submit([commandEncoder.finish()])

    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
} 

const TwoCubes: () => JSX.Element = () => makeSample({
  name: 'Two Cubes',
  description: 'Show two cubes',
  init: init
})
export default TwoCubes