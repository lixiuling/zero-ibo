import { makeSample, TSampleInit } from '../../../common/layout'
import {
  cubeVertexArray,
  cubeVertexSize,
  cubePositionOffset,
  cubeUvOffset,
  cubeVertexCount
} from '../cubes/data'
import multiCubesVertexWGSL from './multi.vert.wgsl?raw'
import multiCubesFragmentWGSL from './multi.frag.wgsl?raw'
import { mat4, vec3 } from 'gl-matrix'
import { commomClearValue } from '../../common/index'

const init: TSampleInit = async ({ canvasRef }) => {
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter.requestDevice()

  if (!canvasRef.current) return

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
  new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray)
  verticesBuffer.unmap()

  // bindGroupLayout
  const uniformBindGroupLayout = device.createBindGroupLayout({
    label: 'uniform bind group layout',
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        sampler: {}
      },
      {
        binding: 2,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        texture: {}
      }
    ]
  })

  // 渲染 pipeline
  const pipeline = device.createRenderPipeline({
    label: 'pipeline',
    layout: device.createPipelineLayout({
      bindGroupLayouts: [uniformBindGroupLayout]
    }),
    vertex: { // 顶点着色
      module: device.createShaderModule({
        code: multiCubesVertexWGSL
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
              shaderLocation: 1,
              offset: cubeUvOffset,
              format: 'float32x2'
            }
          ]
        }
      ]
    },
    fragment: { // 片元着色
      module: device.createShaderModule({
        code: multiCubesFragmentWGSL
      }),
      entryPoint: 'main',
      targets: [
        {
          format: presentationFormat
        }
      ]
    },
    primitive: { // 图元拼装
      topology: 'triangle-list',
      cullMode: 'back'
    },
    depthStencil: { // 深度模板测试信息
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus'
    },
    // multisample: {}, // 管线的多重采样信息
  })

  // depth texture
  const depthTexture = device.createTexture({
    label: 'depth texture',
    size: [canvasRef.current.clientWidth, canvasRef.current.clientHeight, 1],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  })

  const xCount = 4
  const yCount = 4
  const numInstances = xCount * yCount
  const martixFloatCount = 16 // matrix 4x4
  const martixSzie = 4 * martixFloatCount // BYTES_PER_ELEMENT(4) * matrix length(4 * 4 = 16)
  const uniformBufferSize = numInstances * martixSzie

  // uniform buffer
  const uniformBuffer = device.createBuffer({
    label: 'uniform buffer',
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })

  // image sampled-texture
  const img = document.createElement('img')
  img.src = new URL('../../../../images/rose.png', import.meta.url).href
  await img.decode()
  const imageBitmap = await createImageBitmap(img)
  const imageTexture = device.createTexture({
    label: 'image sampled texture',
    size: [imageBitmap.width, imageBitmap.height, 1], // size序列或者对象
    // size: {
    //   width: imageBitmap.width,
    //   height: imageBitmap.height,
    //   depthOrArrayLayers: 1
    // },
    format: 'rgba8unorm',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
  })
  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: imageTexture },
    [imageBitmap.width, imageBitmap.height]
  )

  // image sampler
  const sampler = device.createSampler({
    label: 'image sampler',
    magFilter: 'linear',
    minFilter: 'linear',
  })

  // bindGroup
  const uniformBindGroup = device.createBindGroup({
    label: 'uniform bind group',
    layout: uniformBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: imageTexture.createView()
      }
    ]
  })

  const aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight
  // projection矩阵
  const projectionMatrix = mat4.create()
  mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0)

  const modelMattices = new Array(numInstances)
  // mvpMatricesData 用来依次存放所有立方体的实例的mvp矩阵数据
  const mvpMatricesData = new Float32Array(martixFloatCount * numInstances)

  // modelMattices 数据，上下左右平移
  const step = 4.0
  let m = 0
  for (let x = 0; x < xCount; x++) {
    for (let y = 0; y < yCount; y++) {
      modelMattices[m] = mat4.create()
      mat4.translate(modelMattices[m], modelMattices[m], vec3.fromValues(step * (x - xCount / 2 + 0.5), step * (y- yCount / 2 + 0.5), 0))
      m++
    }
  }

  // view矩阵
  const viewMatrix = mat4.create()
  mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -12))

  const tmpMat4 = mat4.create()

  function updateTransformationMatrix () {
    const now = Date.now() / 1000
    let i = 0, m = 0
    for (let x = 0; x < xCount; x++) {
      for (let y = 0; y < yCount; y++) {
        mat4.rotate(
          tmpMat4,
          modelMattices[i],
          1,
          vec3.fromValues(Math.sin((x + 0.5) * now), Math.cos((y + 0.5) * now), 0)
        )
        mat4.multiply(tmpMat4, viewMatrix, tmpMat4)
        mat4.multiply(tmpMat4, projectionMatrix, tmpMat4)
        mvpMatricesData.set(tmpMat4, m)
        i++
        m += martixFloatCount
      }
    }
  }

  function frame () {
    if (!canvasRef.current) return

    updateTransformationMatrix()
    device.queue.writeBuffer(
      uniformBuffer,
      0,
      mvpMatricesData.buffer,
      mvpMatricesData.byteOffset,
      mvpMatricesData.byteLength
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
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
      }
    }

    const commandEncoder = device.createCommandEncoder()
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    passEncoder.setPipeline(pipeline)
    passEncoder.setVertexBuffer(0, verticesBuffer)
    passEncoder.setBindGroup(0, uniformBindGroup)
    passEncoder.draw(cubeVertexCount, numInstances, 0, 0)
    passEncoder.end()
    device.queue.submit([commandEncoder.finish()])
    
    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}

const MultiCubes: () => JSX.Element = () => makeSample({
  name: 'Multi Cubes',
  description: 'Show multiple cubes',
  init: init,
})
export default MultiCubes