import { makeSample, TSampleInit } from "../../common/layout-gpu"
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

const init: TSampleInit = async ({ canvasRef }) => {
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter.requestDevice()

  if (canvasRef.current === null) return

  const context = canvasRef.current.getContext('webgpu')

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()

  context.configure({
    device,
    format: presentationFormat,
    compositingAlphaMode: 'opaque'
  })

  // vertex buffer
  const verticesBuffer = device.createBuffer({
    size: cubeVertexArray.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  })
  new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray)
  verticesBuffer.unmap()

  // 创建uniform buffer 暂不写入数据
  const matrixSize = 4 * 16 // 4 * 4 matrix
  const offset = 256 // uniformBindGroup offset must be 256-byte aligned
  const uniformBufferSize = offset + matrixSize
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })

  const uniformBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {}
      }
    ]
  })
  // 立方体1
  const uniformBindGroup1 = device.createBindGroup({
    layout: uniformBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 0,
          size: matrixSize
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
          size: matrixSize
        }
      }
    ]
  })

  // 渲染管线
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [uniformBindGroupLayout]
    }),
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
              format: 'float32x4',
              offset: cubePositionOffset,
              shaderLocation: 0
            },
            {
              // uv
              format: 'float32x2',
              offset: cubeUvOffset,
              shaderLocation: 1
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

  // const devicePixelRatio = window.devicePixelRatio || 1
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
  mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -7))

  const tmpMat41 = mat4.create()
  const tmpMat42 = mat4.create()

  function updateTransformationMatrix () {
    const now = Date.now() / 1000

    mat4.rotate(
      tmpMat41,
      modelMatrix1,
      1,
      vec3.fromValues(Math.sin(now), Math.cos(now), 0)
    )
    mat4.rotate(
      tmpMat42,
      modelMatrix2,
      1,
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