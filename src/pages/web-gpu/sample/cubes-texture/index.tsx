import { makeSample, TSampleInit } from '../../common/layout-gpu'
import {
  cubeVertexArray,
  cubeVertexSize,
  cubePositionOffset,
  cubeUvOffset,
  cubeVertexCount
} from '../cubes/data'
import { mat4, vec3 } from 'gl-matrix'
import CubeVertexWGSL from '../cubes/vert.wgsl?raw'
import TextureFragmentWGSL from './texture.fragment.wgsl?raw'

const init: TSampleInit = async ({ canvasRef }) => {
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter.requestDevice()

  if (!canvasRef.current) return

  const context = canvasRef.current.getContext('webgpu')

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()

  context.configure({
    device,
    format: presentationFormat,
    compositingAlphaMode: 'opaque'
  })

  // 顶点 buffer
  const verticesBuffer = device.createBuffer({
    size: cubeVertexArray.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  })
  new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray)
  verticesBuffer.unmap()

  // uniform buffer
  const matrixSize = 4 * 16
  const uniformBuffer = device.createBuffer({
    size: matrixSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })

  // image texture
  let imageTexture: GPUTexture
  {
    const img = document.createElement('img')
    // const imageUrl = new URL('../../../../assets/images/flower.jpg', import.meta.url).href
    // img.src = imageUrl
    img.src = require('../../../../assets/images/flower.jpg')
    console.log('-----', img)
    await img.decode()
    const imageBitmap = await createImageBitmap(img)
    imageTexture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    })
    device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture: imageTexture },
      [imageBitmap.width, imageBitmap.height]
    )
    // const image_view = imageTexture.createView()
  }
  
  // sampler
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear'
  })

  // uniform bindGroupLayout
  const uniformBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {}
      }
    ]
  })

  // uniform bindGroup
  const uniformBindGroup = device.createBindGroup({
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
        resource: sampler
      },
      {
        binding: 2,
        resource: imageTexture.createView()
      }
    ]
  })

  // pipeline
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [uniformBindGroupLayout]
    }),
    vertex: {
      module: device.createShaderModule({
        code: CubeVertexWGSL
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
        code: TextureFragmentWGSL
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
      depthCompare: 'less',
      format: 'depth24plus'
    }
  })

  const depthTexture = device.createTexture({
    size: [canvasRef.current.clientWidth, canvasRef.current.clientHeight, 1],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  })

  const aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight
  const projectionMatrix = mat4.create()
  mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0)

  function getTransformationMatrix () {
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
    mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix)
    return modelViewProjectionMatrix as Float32Array
  }

  function frame() {
    if (!canvasRef.current) return
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
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
      }
    }

    const transformationMatrix = getTransformationMatrix()
    device.queue.writeBuffer(
      uniformBuffer,
      0,
      transformationMatrix.buffer,
      transformationMatrix.byteOffset,
      transformationMatrix.byteLength
    )

    const commandEncoder = device.createCommandEncoder()
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

const TextureCube: () => JSX.Element = () => makeSample({
  name: 'Cubes with Texture',
  description: 'Show cubes with texture',
  init: init
})
export default TextureCube